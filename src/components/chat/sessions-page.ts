import { apiFetch } from '@/lib/api/client'
import type { ChatSession } from '@/types/chat.types'

export const SESSIONS_PAGE = 20

/**
 * One page of conversations, newest first. GET /v1/chat/sessions already takes limit and offset and returns
 * pagination.hasMore; without them only the 20 newest were ever reachable.
 * shortcut: local wrapper because chat.api's getChatSessions takes no params; move it there when that file is free.
 */
export async function getSessionsPage(offset = 0): Promise<{ sessions: ChatSession[]; hasMore: boolean }> {
  const res = await apiFetch<{ sessions?: ChatSession[]; pagination?: { hasMore?: boolean } } | ChatSession[]>(
    `/v1/chat/sessions?limit=${SESSIONS_PAGE}&offset=${offset}`,
  )
  if (Array.isArray(res)) return { sessions: res, hasMore: false }
  const sessions = res.sessions ?? []
  return { sessions, hasMore: res.pagination?.hasMore ?? sessions.length === SESSIONS_PAGE }
}

/** Appends a later page, skipping rows already shown (a new conversation shifts every offset by one). */
export function appendPage(shown: ChatSession[], page: ChatSession[]): ChatSession[] {
  const seen = new Set(shown.map((s) => s.session_id))
  return [...shown, ...page.filter((s) => !seen.has(s.session_id))]
}
