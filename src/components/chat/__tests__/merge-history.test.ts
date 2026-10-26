import { describe, expect, it } from 'vitest'
import { mergeHistory } from '@/components/chat/merge-history'
import type { ChatMessage } from '@/types/chat.types'

const msg = (id: string, role: 'user' | 'assistant', content: string, timestamp = '2026-10-27T01:00:00Z'): ChatMessage => ({ id, role, content, timestamp })

describe('mergeHistory', () => {
  const history = [msg('m1', 'user', 'hi'), msg('m2', 'assistant', 'Hello')]

  it('keeps a local message that did not send after the history refetch', () => {
    const failed = msg('temp-1', 'user', 'log a banana', '2026-10-27T01:01:00Z')
    expect(mergeHistory(history, [...history, failed], new Set(['temp-1']))).toEqual([...history, failed])
  })

  it('drops local messages the server already has or that were sent', () => {
    const sent = msg('temp-2', 'user', 'log a banana', '2026-10-27T01:01:00Z')
    const server = [...history, msg('m3', 'user', 'log a banana', '2026-10-27T01:01:02Z')]
    // Still pending locally, but the server saved it: no duplicate.
    expect(mergeHistory(server, [...history, sent], new Set(['temp-2']))).toEqual(server)
    // Not pending (it went through): the server copy replaces it.
    expect(mergeHistory(history, [...history, sent], new Set())).toEqual(history)
  })

  it('keeps a failed repeat of text the user sent earlier', () => {
    const again = msg('temp-3', 'user', 'hi', '2026-10-27T01:05:00Z')
    expect(mergeHistory(history, [...history, again], new Set(['temp-3']))).toEqual([...history, again])
  })
})
