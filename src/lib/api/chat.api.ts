import { apiFetch } from './client'
import type { ChatSession, ChatResponse, SendMessageInput } from '@/types/chat.types'

export async function sendMessage(input: SendMessageInput): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/v1/chat', { method: 'POST', body: input })
}

export async function getChatSessions(): Promise<ChatSession[]> {
  return apiFetch<ChatSession[]>('/v1/chat/sessions')
}

export async function getChatSession(sessionId: string): Promise<{ messages: import('@/types/chat.types').ChatMessage[] }> {
  return apiFetch(`/v1/chat/sessions/${sessionId}`)
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  return apiFetch<void>(`/v1/chat/sessions/${sessionId}`, { method: 'DELETE' })
}
