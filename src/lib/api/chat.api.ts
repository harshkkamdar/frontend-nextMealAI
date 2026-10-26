import { apiFetch } from './client'
import type { ChatResponse, ChatSession, ChatMessage, SendMessageInput } from '@/types/chat.types'

export async function sendMessage(input: SendMessageInput): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/v1/chat', { method: 'POST', body: input })
}

// FB-R6-02 — step one of the two-step chat image flow. The composer calls
// this the moment a file is selected; the resulting storage_path is then
// passed to sendMessage as `image_paths: [storage_path]` when the user
// submits the message.
export async function uploadChatAttachment(file: File): Promise<{
  storage_path: string
  expires_in_seconds: number
}> {
  const form = new FormData()
  form.append('image', file)
  return apiFetch('/v1/chat/attachments/upload', { method: 'POST', body: form })
}

export const SESSIONS_PAGE = 20

/** One page of conversations, newest first. Without limit and offset only the 20 newest were ever reachable. */
export async function getChatSessions(limit = SESSIONS_PAGE, offset = 0): Promise<{ sessions: ChatSession[]; hasMore: boolean }> {
  const res = await apiFetch<{ sessions?: ChatSession[]; pagination?: { hasMore?: boolean } } | ChatSession[]>(
    `/v1/chat/sessions?limit=${limit}&offset=${offset}`,
  )
  if (Array.isArray(res)) return { sessions: res, hasMore: false }
  const sessions = res.sessions ?? []
  return { sessions, hasMore: res.pagination?.hasMore ?? sessions.length === limit }
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

export async function renameChatSession(sessionId: string, title: string): Promise<void> {
  await apiFetch(`/v1/chat/sessions/${sessionId}`, { method: 'PATCH', body: { title } })
}

export async function startCompanionSession(screen: string, screenContext: Record<string, unknown> = {}): Promise<{ session_id: string; context_loaded: boolean }> {
  return apiFetch('/v1/chat/companion', {
    method: 'POST',
    body: { screen, screen_context: screenContext }
  })
}

export async function extractSessionMemories(sessionId: string): Promise<void> {
  await apiFetch(`/v1/chat/sessions/${sessionId}/extract-memories`, { method: 'POST' })
}
