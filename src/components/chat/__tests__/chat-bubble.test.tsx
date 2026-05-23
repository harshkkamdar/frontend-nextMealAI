import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ChatBubble } from '@/components/chat/chat-bubble'
import type { ChatMessage } from '@/types/chat.types'

// FB-R6-UAT-A — multi-image optimistic bubble must render every attachment,
// not just the first one. The bubble logic in ChatBubble already prefers
// `attachments[]` over the legacy singular `image` field; these tests lock
// that rendering contract so a future edit can't silently regress it.

function userMessage(extra: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'temp-1',
    role: 'user',
    content: 'whats this bro',
    timestamp: '2026-05-22T00:14:00Z',
    ...extra,
  }
}

describe('ChatBubble — FB-R6-UAT-A multi-image rendering', () => {
  it('AC01: renders BOTH images when attachments has two entries', () => {
    render(
      <ChatBubble
        message={userMessage({
          attachments: [
            { id: 'a1', signed_url: 'blob:fake-1', mime_type: 'image/jpeg', width: null, height: null },
            { id: 'a2', signed_url: 'blob:fake-2', mime_type: 'image/jpeg', width: null, height: null },
          ],
        })}
      />,
    )
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(2)
    expect(imgs[0].getAttribute('src')).toBe('blob:fake-1')
    expect(imgs[1].getAttribute('src')).toBe('blob:fake-2')
  })

  it('AC02: renders exactly one image when attachments has one entry', () => {
    render(
      <ChatBubble
        message={userMessage({
          attachments: [
            { id: 'a1', signed_url: 'https://example.com/pic.jpg', mime_type: 'image/jpeg', width: null, height: null },
          ],
        })}
      />,
    )
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(1)
    expect(imgs[0].getAttribute('src')).toBe('https://example.com/pic.jpg')
  })

  it('AC03: legacy user message with only `image` (no attachments) still renders via fallback', () => {
    render(
      <ChatBubble
        message={userMessage({
          image: 'https://example.com/legacy.jpg',
        })}
      />,
    )
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(1)
    expect(imgs[0].getAttribute('src')).toBe('https://example.com/legacy.jpg')
  })

  it('AC04: attachment with a null signed_url is skipped (no broken <img> rendered)', () => {
    render(
      <ChatBubble
        message={userMessage({
          attachments: [
            { id: 'a1', signed_url: null, mime_type: 'image/jpeg', width: null, height: null },
            { id: 'a2', signed_url: 'blob:fake-2', mime_type: 'image/jpeg', width: null, height: null },
          ],
        })}
      />,
    )
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(1)
    expect(imgs[0].getAttribute('src')).toBe('blob:fake-2')
  })
})

// FB-R6-UAT-A — verifies the SHAPE the optimistic handleSend must produce.
// The chat page and the companion sheet both build a temp ChatMessage with
// `attachments[]` mapped from the AttachedImage[] argument. ChatBubble keys
// off `attachments`, so populating it correctly is what makes the multi-image
// bubble render before the BE refetch swaps in signed URLs.
describe('ChatBubble — FB-R6-UAT-A optimistic message shape', () => {
  it('renders every attachment from a temp-id user message (simulating handleSend output)', () => {
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: 'whats this bro',
      timestamp: new Date().toISOString(),
      attachments: [
        { id: 'temp-att-0', signed_url: 'blob:preview-0', mime_type: 'image/jpeg', width: null, height: null },
        { id: 'temp-att-1', signed_url: 'blob:preview-1', mime_type: 'image/jpeg', width: null, height: null },
        { id: 'temp-att-2', signed_url: 'blob:preview-2', mime_type: 'image/jpeg', width: null, height: null },
      ],
    }
    render(<ChatBubble message={optimistic} />)
    expect(screen.getAllByRole('img')).toHaveLength(3)
  })
})
