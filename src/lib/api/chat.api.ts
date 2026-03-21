import { apiFetch } from './client'
import type { ChatResponse, ChatSession, ChatMessage, SendMessageInput } from '@/types/chat.types'

export async function sendMessage(input: SendMessageInput): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/v1/chat', { method: 'POST', body: input })
}

export async function getChatSessions(): Promise<ChatSession[]> {
  return apiFetch<ChatSession[]>('/v1/chat/sessions')
}

export async function getChatSession(sessionId: string, params?: { limit?: number; offset?: number }): Promise<{ messages: ChatMessage[] }> {
  const query = new URLSearchParams()
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))
  const qs = query.toString()
  return apiFetch(`/v1/chat/sessions/${sessionId}${qs ? `?${qs}` : ''}`)
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await apiFetch(`/v1/chat/sessions/${sessionId}`, { method: 'DELETE' })
}
