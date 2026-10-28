import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common'
import type { Response } from 'express'
import { createAgent } from 'langchain'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import type { AIMessageChunk } from 'langchain'
import type {
  AssistantId,
  ChatCitation,
  ChatSession,
  ChatToolCall,
  CoachDto,
  CoachMessage,
  CoachStreamEvent,
} from '@en/common/chat'
import { PrismaService, ResponseService } from '@libs/shared'
import {
  createBochaSearch,
  createCheckpoint,
  createDeepSeek,
  createDeepSeekReasoner,
} from '../llm/llm.config'
import { buildSystemPrompt } from './assistant.prompt'
import { RagService } from './rag.service'

const ASSISTANT_IDS: AssistantId[] = [
  'kaoyan',
  'cet4',
  'cet6',
  'grammar',
  'general',
]

const isAssistantId = (value: string): value is AssistantId =>
  ASSISTANT_IDS.includes(value as AssistantId)

const textOf = (content: unknown): string => {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text?: unknown }).text ?? '')
        }
        return ''
      })
      .join('')
  }
  return ''
}

const titleFromMessage = (message: string) => {
  const text = message.replace(/\s+/g, ' ').trim()
  return (text.length > 28 ? `${text.slice(0, 28)}…` : text) || '新对话'
}

@Injectable()
export class CoachService implements OnModuleInit {
  private checkpointer: PostgresSaver

  constructor(
    private readonly prisma: PrismaService,
    private readonly responseService: ResponseService,
    private readonly ragService: RagService,
  ) {}

  async onModuleInit() {
    this.checkpointer = await createCheckpoint()
  }

  private threadId(userId: string, sessionId: string) {
    return `${userId}:${sessionId}`
  }

  private async getOwnedSession(sessionId: string, userId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    })
    if (!session) throw new NotFoundException('会话不存在')
    return session
  }

  async list(userId: string) {
    const sessions = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      take: 50,
    })
    const list: ChatSession[] = sessions.map((session) => ({
      ...session,
      assistantId: session.assistantId as AssistantId,
      lastMessageAt: session.lastMessageAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }))
    return this.responseService.success(list)
  }

  async rename(sessionId: string, title: string, userId: string) {
    await this.getOwnedSession(sessionId, userId)
    const value = title.trim()
    if (!value) throw new BadRequestException('标题不能为空')
    const session = await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: value.slice(0, 40) },
    })
    return this.responseService.success(session)
  }

  async remove(sessionId: string, userId: string) {
    await this.getOwnedSession(sessionId, userId)
    await this.prisma.chatSession.delete({ where: { id: sessionId } })
    await this.checkpointer
      .deleteThread(this.threadId(userId, sessionId))
      .catch(() => undefined)
    return this.responseService.success({ id: sessionId })
  }

  async messages(sessionId: string, userId: string) {
    await this.getOwnedSession(sessionId, userId)
    const checkpoint = await this.checkpointer.get({
      configurable: { thread_id: this.threadId(userId, sessionId) },
    })
    const raw = (checkpoint?.channel_values?.messages ?? []) as unknown as {
      type: string
      content: unknown
      additional_kwargs?: Record<string, unknown>
    }[]
    const messages: CoachMessage[] = []
    for (const item of raw) {
      if (item.type !== 'human' && item.type !== 'ai') continue
      const content = textOf(item.content)
      const reasoning = item.additional_kwargs?.reasoning_content as
        | string
        | undefined
      if (!content && !reasoning) continue
      messages.push({
        role: item.type,
        content,
        reasoning,
      })
    }
    return this.responseService.success(messages)
  }

  async stream(dto: CoachDto, userId: string, res: Response) {
    if (!dto.content?.trim()) throw new BadRequestException('消息不能为空')
    if (dto.content.length > 4000) throw new BadRequestException('消息过长')
    if (!isAssistantId(dto.assistantId)) {
      throw new BadRequestException('助手不存在')
    }

    let session = dto.sessionId
      ? await this.getOwnedSession(dto.sessionId, userId)
      : null
    const assistantId = (session?.assistantId ?? dto.assistantId) as AssistantId
    if (!isAssistantId(assistantId)) {
      throw new BadRequestException('助手不存在')
    }

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: {
          userId,
          assistantId,
          title: titleFromMessage(dto.content),
        },
      })
    } else if (session.messageCount === 0 && session.title === '新对话') {
      session = await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { title: titleFromMessage(dto.content) },
      })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()

    const send = (event: CoachStreamEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }

    const toolId = `rag-${Date.now()}`
    let answer = ''
    try {
      send({
        type: 'meta',
        sessionId: session.id,
        title: session.title,
        assistantId,
      })

      const isGeneral = assistantId === 'general'
      const useDeepThink = isGeneral && dto.deepThink === true
      const useWebSearch = isGeneral && dto.webSearch === true
      let webContext: string | undefined

      if (useWebSearch) {
        const webTool: ChatToolCall = {
          id: `web-${Date.now()}`,
          name: 'webSearch',
          args: { query: dto.content },
          status: 'running',
        }
        send({ type: 'tool_call', tool: webTool })
        try {
          const context = await createBochaSearch(dto.content)
          webContext = context
          const count = (context.match(/标题：/g) ?? []).length
          send({
            type: 'tool_result',
            tool: {
              ...webTool,
              status: count ? 'done' : 'error',
              summary: count ? `搜索到 ${count} 个网页结果` : '没有找到相关网页',
            },
          })
        } catch {
          webContext = undefined
          send({
            type: 'tool_result',
            tool: {
              ...webTool,
              status: 'error',
              summary: '联网搜索暂时不可用，已改用模型知识回答',
            },
          })
        }
      }

      const knowledgeTool: ChatToolCall = {
        id: toolId,
        name: 'searchKnowledge',
        args: { query: dto.content, assistantId },
        status: 'running',
      }
      if (!isGeneral) send({ type: 'tool_call', tool: knowledgeTool })

      const citations = await this.ragService.search(dto.content, assistantId)
      if (!isGeneral || citations.length) {
        if (isGeneral) send({ type: 'tool_call', tool: knowledgeTool })
        send({
          type: 'tool_result',
          tool: {
            ...knowledgeTool,
            status: 'done',
            summary: citations.length
              ? `检索到 ${citations.length} 条学习笔记`
              : '没有检索到匹配的学习笔记',
          },
        })
        citations.forEach((citation) => send({ type: 'citation', citation }))
      }

      const word = this.ragService.extractEnglishWord(dto.content)
      let wordDetail: string | undefined
      if (word) {
        const wordTool: ChatToolCall = {
          id: `word-${Date.now()}`,
          name: 'getWordDetail',
          args: { word },
          status: 'running',
        }
        send({ type: 'tool_call', tool: wordTool })
        wordDetail = (await this.ragService.getWordDetail(word)) ?? undefined
        send({
          type: 'tool_result',
          tool: {
            ...wordTool,
            status: 'done',
            summary: wordDetail ? `查到 ${word} 的词条` : `词库里没有 ${word}`,
          },
        })
      }

      const knowledge = await this.ragService.getKnowledgeForPrompt(citations)
      const agent = createAgent({
        model: useDeepThink ? createDeepSeekReasoner() : createDeepSeek(0.45),
        systemPrompt: buildSystemPrompt(assistantId, knowledge, wordDetail, {
          webContext,
          deepThink: useDeepThink,
        }),
        checkpointer: this.checkpointer,
      })

      const stream = await agent.stream(
        { messages: [{ role: 'human', content: dto.content }] },
        {
          configurable: { thread_id: this.threadId(userId, session.id) },
          streamMode: 'messages',
        },
      )

      for await (const chunk of stream) {
        const [message] = chunk as unknown as [AIMessageChunk]
        const reasoning = String(
          message.additional_kwargs?.reasoning_content ?? '',
        )
        if (reasoning) send({ type: 'reasoning', content: reasoning })

        const content = textOf(message.content)
        if (content) {
          answer += content
          send({ type: 'content', content })
        }
      }

      const lastMessage = answer.replace(/\s+/g, ' ').trim().slice(0, 120)
      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: {
          lastMessage,
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
        },
      })

      send({ type: 'done', sessionId: session.id, title: session.title })
      res.end()
    } catch (error) {
      send({
        type: 'error',
        message: error instanceof Error ? error.message : 'AI 服务暂时不可用',
      })
      res.end()
    }
  }
}
