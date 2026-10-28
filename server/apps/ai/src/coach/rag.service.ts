import { Injectable } from '@nestjs/common'
import type { AssistantId, ChatCitation } from '@en/common/chat'
import { PrismaService } from '@libs/shared'

type ChunkRow = {
  id: string
  key: string
  examType: string
  sourceType: string
  title: string
  content: string
  keywords: string
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'for', 'is',
  'are', 'was', 'were', 'be', 'been', 'it', 'this', 'that', 'with', 'as', 'at',
  'by', 'from', 'you', 'your', 'i', 'we', 'they', 'he', 'she', 'do', 'does',
  'did', 'can', 'could', 'would', 'should', '怎么', '什么', '如何', '一下',
  '帮我', '可以', '这个', '那个', '一个', '还是', '就是', '以及', '的话',
])

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[`*_>#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tokenize = (value: string) => {
  const text = normalize(value)
  const tokens = new Set<string>()

  for (const word of text.match(/[a-z][a-z'-]{1,30}/g) ?? []) {
    if (word.length > 1 && !STOP_WORDS.has(word)) tokens.add(word)
  }

  const chineseRuns = text.match(/[\u4e00-\u9fa5]{2,}/g) ?? []
  for (const run of chineseRuns) {
    if (run.length <= 6) tokens.add(run)
    for (let index = 0; index < run.length - 1; index += 1) {
      const bigram = run.slice(index, index + 2)
      if (!STOP_WORDS.has(bigram)) tokens.add(bigram)
    }
    for (let index = 0; index < run.length - 2; index += 1) {
      const trigram = run.slice(index, index + 3)
      if (!STOP_WORDS.has(trigram)) tokens.add(trigram)
    }
  }

  return [...tokens].filter((token) => token.length > 1)
}

const countOccurrences = (text: string, token: string) => {
  let count = 0
  let from = 0
  while (count < 4) {
    const index = text.indexOf(token, from)
    if (index === -1) break
    count += 1
    from = index + token.length
  }
  return count
}

const cleanContent = (value: string) =>
  value
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const makeExcerpt = (value: string, max = 150) => {
  const text = cleanContent(value)
  return text.length > max ? `${text.slice(0, max)}…` : text
}

@Injectable()
export class RagService {
  constructor(private readonly prisma: PrismaService) {}

  private allowedExamTypes(assistantId: AssistantId) {
    if (assistantId === 'general') return ['general']
    if (assistantId === 'grammar') return ['grammar', 'general']
    return [assistantId, 'general']
  }

  private scoreChunk(query: string, tokens: string[], chunk: ChunkRow) {
    const title = normalize(chunk.title)
    const keywords = normalize(chunk.keywords)
    const content = normalize(chunk.content)
    const text = `${title}\n${keywords}\n${content}`
    const normalizedQuery = normalize(query)
    let score = 0

    if (normalizedQuery.length >= 4 && text.includes(normalizedQuery)) {
      score += 8
    }

    for (const token of tokens) {
      if (title.includes(token)) score += 4
      if (keywords.includes(token)) score += 2.5
      score += countOccurrences(content, token) * (token.length >= 3 ? 1.2 : 0.8)
    }

    return score
  }

  async search(query: string, assistantId: AssistantId, topK = 4) {
    const chunks = (await this.prisma.knowledgeChunk.findMany({
      where: { examType: { in: this.allowedExamTypes(assistantId) } },
    })) as ChunkRow[]

    const tokens = tokenize(query)
    if (!tokens.length) return [] as ChatCitation[]

    return chunks
      .map((chunk) => ({
        chunk,
        score:
          this.scoreChunk(query, tokens, chunk) +
          (chunk.examType === assistantId ? 1.5 : 0),
      }))
      .filter((item) => item.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ chunk }, index) => ({
        index: index + 1,
        chunkId: chunk.id,
        title: chunk.title,
        examType: chunk.examType,
        sourceType: chunk.sourceType,
        excerpt: makeExcerpt(chunk.content),
      })) satisfies ChatCitation[]
  }

  async getKnowledgeForPrompt(citations: ChatCitation[]) {
    if (!citations.length) return []
    const chunks = (await this.prisma.knowledgeChunk.findMany({
      where: { id: { in: citations.map((item) => item.chunkId) } },
    })) as ChunkRow[]
    const byId = new Map(chunks.map((chunk) => [chunk.id, chunk]))
    return citations
      .map((citation) => {
        const chunk = byId.get(citation.chunkId)
        return chunk
          ? {
              index: citation.index,
              title: chunk.title,
              sourceType: chunk.sourceType,
              content: chunk.content,
            }
          : null
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  }

  extractEnglishWord(message: string) {
    const explicit = message.match(
      /(?:查词|查一下|单词|是什么意思|什么意思)[：:\s]*([a-zA-Z][a-zA-Z'-]{1,30})/i,
    )
    if (explicit?.[1]) return explicit[1]

    const quoted = message.match(/[「"'“”]([a-zA-Z][a-zA-Z\s'-]{1,40})["'“”]/)
    if (quoted?.[1]) return quoted[1].trim()

    const bare = message.trim().match(/^([a-zA-Z][a-zA-Z'-]{1,30})$/)
    if (bare?.[1]) return bare[1]

    // “abandon 是什么意思 / abandon 怎么用”这类词在前的问法
    const candidates: string[] = message.match(/[a-zA-Z][a-zA-Z'-]{1,30}/g) ?? []
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been',
      'to', 'of', 'in', 'on', 'for', 'and', 'or', 'with', 'what', 'how',
      'why', 'when', 'where', 'which', 'who', 'this', 'that', 'it',
    ])
    const meaningful = candidates.filter((word) => !stopWords.has(word.toLowerCase()))
    return meaningful.length === 1 ? meaningful[0] : null
  }

  async getWordDetail(word: string) {
    const record = await this.prisma.wordBook.findFirst({
      where: { word: { equals: word, mode: 'insensitive' } },
    })
    if (!record) return null
    return `单词：${record.word}
音标：${record.phonetic || '暂无'}
词性：${record.pos || '暂无'}
释义：${record.translation || record.definition || '暂无'}
英文释义：${record.definition || '暂无'}
常见搭配/同义：${record.exchange || '暂无'}`
  }
}
