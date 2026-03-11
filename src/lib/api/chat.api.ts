import { apiFetch } from './client'
import type { ChatSession, ChatResponse, SendMessageInput, ChatMessage } from '@/types/chat.types'

interface SessionsResponse {
  sessions: ChatSession[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
}

export async function sendMessage(input: SendMessageInput): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/v1/chat', { method: 'POST', body: input })
}

export async function getChatSessions(): Promise<ChatSession[]> {
  const result = await apiFetch<SessionsResponse>('/v1/chat/sessions')
  return result.sessions ?? []
}

export async function getChatSession(sessionId: string): Promise<{ messages: ChatMessage[] }> {
  return apiFetch(`/v1/chat/sessions/${sessionId}`)
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  return apiFetch<void>(`/v1/chat/sessions/${sessionId}`, { method: 'DELETE' })
}
