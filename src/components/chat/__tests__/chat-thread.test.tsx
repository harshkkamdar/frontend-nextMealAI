import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('@/components/chat/report-sheet', () => ({ ReportSheet: () => null }))

import { ChatThread } from '@/components/chat/chat-thread'
import { formatSessionDate } from '@/components/chat/session-list'
import type { ChatMessage } from '@/types/chat.types'

Element.prototype.scrollIntoView = vi.fn()

const geo = (content: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({ id: content, role: 'assistant', content, ...extra })

describe('ChatThread', () => {
  it('shows option chips for the last Geo message only, and a tap sends that text', () => {
    const onReply = vi.fn()
    render(<ChatThread onReply={onReply} messages={[geo('Old', { suggestedReplies: ['Stale'] }), { role: 'user', content: 'hi' }, geo('Which salmon?', { metadata: { suggested_replies: ['Smoked', 'Grilled'] } })]} />)
    expect(screen.queryByRole('button', { name: 'Stale' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Grilled' }))
    expect(onReply).toHaveBeenCalledWith('Grilled')
  })

  it('hides chips while Geo is writing', () => {
    render(<ChatThread onReply={() => {}} isTyping messages={[geo('Which?', { suggestedReplies: ['A'] })]} />)
    expect(screen.queryByRole('button', { name: 'A' })).toBeNull()
    expect(screen.getByRole('status', { name: 'Geo is writing' })).toBeInTheDocument()
  })

  it('renders foods Geo logged as rows with their numbers', () => {
    render(<ChatThread messages={[geo('Logged rice 1 cup to lunch · 205 cal · 4g P · 45g C · 0g F\nNice.')]} />)
    const rows = screen.getByRole('list', { name: 'Logged' })
    expect(rows).toHaveTextContent('Rice 1 cup')
    expect(rows).toHaveTextContent('205 kcal')
    expect(rows).toHaveTextContent('45 g C')
    expect(screen.getByText('Nice.')).toBeInTheDocument()
  })

  it('says a shared meal once under the card, and keeps mixed meals on their rows', () => {
    const { unmount } = render(<ChatThread messages={[geo('Logged rice 1 cup to lunch · 205 cal · 4g P · 45g C · 0g F\nLogged salmon to lunch · 310 cal · 34g P · 0g C · 19g F')]} />)
    expect(screen.getByText('Logged to lunch')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Logged' })).not.toHaveTextContent(/lunch/i)
    unmount()
    render(<ChatThread messages={[geo('Logged rice to lunch · 205 cal · 4g P · 45g C · 0g F\nLogged apple to snack · 95 cal · 0g P · 25g C · 0g F')]} />)
    expect(screen.queryByText(/^Logged to/)).toBeNull()
    expect(screen.getByRole('list', { name: 'Logged' })).toHaveTextContent(/lunch/i)
  })

  it('anchors a run of Geo turns once and times it once, on its last turn', () => {
    const at = '2026-10-26T01:00:00Z'
    render(<ChatThread messages={[{ role: 'user', content: 'hi', timestamp: at }, geo('One', { timestamp: at }), geo('Two', { timestamp: at }), { role: 'user', content: 'ok', timestamp: at }, geo('Three', { timestamp: at })]} />)
    expect(screen.getAllByRole('img', { name: 'Geo' })).toHaveLength(2)
    const options = screen.getAllByRole('button', { name: 'Message options' })
    expect(options.map((button) => button.textContent !== '')).toEqual([false, true, true])
  })
})

describe('formatSessionDate', () => {
  const now = new Date(2026, 9, 26, 18, 0)
  it('reads as time today, Yesterday, weekday this week, then a date', () => {
    expect(formatSessionDate(new Date(2026, 9, 26, 9, 5).toISOString(), now)).toMatch(/9:05/)
    expect(formatSessionDate(new Date(2026, 9, 25, 9).toISOString(), now)).toBe('Yesterday')
    expect(formatSessionDate(new Date(2026, 9, 22, 9).toISOString(), now)).toBe('Thu')
    expect(formatSessionDate(new Date(2026, 9, 2, 9).toISOString(), now)).toBe('2 Oct')
    expect(formatSessionDate(undefined, now)).toBe('')
  })
})
