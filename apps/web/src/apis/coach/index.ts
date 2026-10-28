import { aiApi, refreshAiAccessToken, type Response } from '..'
import { useUserStore } from '@/stores/user'
import type {
  ChatSession,
  ChatSessionList,
  CoachDto,
  CoachMessage,
  CoachStreamEvent,
} from '@en/common/chat'

export const getChatSessions = () =>
  aiApi.get('/sessions') as Promise<Response<ChatSessionList>>

export const renameChatSession = (id: string, title: string) =>
  aiApi.patch(`/sessions/${id}`, { title }) as Promise<Response<ChatSession>>

export const removeChatSession = (id: string) =>
  aiApi.delete(`/sessions/${id}`) as Promise<Response<{ id: string }>>

export const getChatMessages = (id: string) =>
  aiApi.get(`/sessions/${id}/messages`) as Promise<Response<CoachMessage[]>>

const parseEventBlock = (block: string): CoachStreamEvent | null => {
  const data = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
  if (!data) return null
  try {
    return JSON.parse(data) as CoachStreamEvent
  } catch {
    return null
  }
}

export const streamCoach = async (
  payload: CoachDto,
  onEvent: (event: CoachStreamEvent) => void,
  signal?: AbortSignal,
) => {
  let accessToken = useUserStore().getAccessToken
  const request = () =>
    fetch('/ai/v1/coach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(payload),
      signal,
    })

  let response = await request()
  if (response.status === 401) {
    const freshToken = await refreshAiAccessToken()
    if (!freshToken) throw new Error('登录已过期，请重新登录')
    accessToken = freshToken
    response = await request()
  }

  if (!response.ok) {
    let message = 'AI 服务暂时不可用'
    try {
      const body = await response.json()
      message = body?.message || message
    } catch {
      // ignore non-json error
    }
    throw new Error(message)
  }

  if (!response.body) throw new Error('浏览器不支持流式响应')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''
    for (const block of blocks) {
      const event = parseEventBlock(block)
      if (event) onEvent(event)
    }
  }

  buffer += decoder.decode()
  if (buffer.trim()) {
    const event = parseEventBlock(buffer)
    if (event) onEvent(event)
  }
}
