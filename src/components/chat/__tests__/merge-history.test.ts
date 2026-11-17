import { describe, expect, it } from 'vitest'
import { mergeHistory } from '@/components/chat/merge-history'
import type { ChatMessage } from '@/types/chat.types'

/** A conversations row as GET /v1/chat/sessions/:id sends it (select * plus attachments; timestamp equals created_at). */
const row = (id: string, role: 'user' | 'assistant', content: string, at = '2026-10-27T01:00:00Z'): ChatMessage => ({
  id, user_id: 'u', session_id: 's', role, content, tool_calls: null, tool_call_id: null, metadata: {}, tokens_used: null, model: null,
  created_at: at, timestamp: at, attachments: [],
} as unknown as ChatMessage)
/** A message the chat screen made on send (chat/session/page.tsx handleSend). */
const local = (id: string, content: string, timestamp: string): ChatMessage => ({ id, role: 'user', content, timestamp })

describe('mergeHistory', () => {
  const history = [row('m1', 'user', 'hi'), row('m2', 'assistant', 'Hello')]

  it('keeps a local message that did not send after the history refetch', () => {
    const failed = local('temp-1', 'log a banana', '2026-10-27T01:01:00Z')
    expect(mergeHistory(history, [...history, failed], new Set(['temp-1']))).toEqual([...history, failed])
  })

  it('drops local messages the server already has or that were sent', () => {
    const sent = local('temp-2', 'log a banana', '2026-10-27T01:01:00Z')
    const server = [...history, row('m3', 'user', 'log a banana', '2026-10-27T01:01:02Z')]
    // Still pending locally, but the server saved it: no duplicate.
    expect(mergeHistory(server, [...history, sent], new Set(['temp-2']))).toEqual(server)
    // Not pending (it went through): the server copy replaces it.
    expect(mergeHistory(history, [...history, sent], new Set())).toEqual(history)
  })

  it('keeps a failed repeat of text the user sent earlier', () => {
    const again = local('temp-3', 'hi', '2026-10-27T01:05:00Z')
    expect(mergeHistory(history, [...history, again], new Set(['temp-3']))).toEqual([...history, again])
  })

  it('a row without a timestamp is not taken for the failed repeat (it keeps Retry)', () => {
    const { timestamp: _dropped, ...untimed } = row('m1', 'user', 'hi')
    const older = [untimed as ChatMessage, row('m2', 'assistant', 'Hello')]
    const again = local('temp-4', 'hi', '2026-10-27T01:05:00Z')
    expect(mergeHistory(older, [...older, again], new Set(['temp-4']))).toEqual([...older, again])
  })
})
