import type { ChatMessage } from '@/types/chat.types'

/**
 * A history refetch replaces the thread, but must not drop a message that is still only on this phone:
 * one that failed to send (it keeps "Didn't send. Retry") or is still in flight. Such a message is kept
 * unless the server already has the same user text from that moment on.
 */
export function mergeHistory(history: ChatMessage[], local: ChatMessage[], unsentIds: ReadonlySet<string>): ChatMessage[] {
  const keep = local.filter((m) => {
    if (!m.id || !unsentIds.has(m.id as string)) return false
    const at = m.timestamp ? Date.parse(m.timestamp) : 0
    return !history.some((h) => h.role === 'user' && h.content === m.content && (!h.timestamp || Date.parse(h.timestamp) >= at))
  })
  return keep.length ? [...history, ...keep] : history
}
