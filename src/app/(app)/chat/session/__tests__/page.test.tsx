/** The Geo conversation screen: the daily coaching limit, and the way back to the list. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ApiException } from '@/types/api.types'

const mocks = vi.hoisted(() => ({
  push: vi.fn(), back: vi.fn(), replace: vi.fn(), params: new URLSearchParams(),
  sendMessage: vi.fn(), getChatSession: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, back: mocks.back, replace: mocks.replace }),
  useSearchParams: () => mocks.params,
}))
vi.mock('@/lib/api/chat.api', () => ({
  sendMessage: mocks.sendMessage,
  getChatSession: mocks.getChatSession,
  getChatSessions: () => Promise.resolve({ sessions: [], hasMore: false }),
  extractSessionMemories: () => Promise.resolve(),
}))
vi.mock('@/lib/api/vision.api', () => ({ extractWorkoutProgram: vi.fn(), isLikelyWorkoutProgramPrompt: () => false }))
vi.mock('@/components/plans/workout-program-preview-card', () => ({ WorkoutProgramPreviewCard: () => null }))
vi.mock('@/components/chat/chat-input', () => ({ ChatInput: () => null }))
vi.mock('@/components/shared/offline-band', () => ({ OfflineBand: () => null }))
vi.mock('@/contexts/geo-screen-context', () => ({ useSetGeoScreen: () => {} }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('@/components/chat/report-sheet', () => ({ ReportSheet: () => null }))

import ActiveChatPage from '../page'

Element.prototype.scrollIntoView = vi.fn()

describe('Geo conversation screen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getChatSession.mockResolvedValue({ messages: [] })
  })

  it('at the daily coaching limit it shows the backend reason under the message, with no Retry', async () => {
    mocks.params = new URLSearchParams('id=s1&prefill=what should I eat&send=1')
    // client.ts turns llm-budget.middleware's 429 { error: true, code: 'BUDGET_EXCEEDED', message } into this.
    mocks.sendMessage.mockRejectedValue(new ApiException(429, 'Too Many Requests', 'BUDGET_EXCEEDED', "You've reached today's coaching limit. It resets at midnight UTC."))
    render(<ActiveChatPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent("You've reached today's coaching limit. It resets at midnight UTC.")
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
  })

  it('a dropped connection still offers Retry', async () => {
    mocks.params = new URLSearchParams('id=s1&prefill=what should I eat&send=1')
    mocks.sendMessage.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<ActiveChatPage />)
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('Back to conversations opens the list, not the page before', async () => {
    mocks.params = new URLSearchParams('id=s1')
    window.history.replaceState({ fiqrIndex: 3 }, '') // opened from inside the app (Home's + sheet, say)
    render(<ActiveChatPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Back to conversations' }))
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/chat'))
    expect(mocks.back).not.toHaveBeenCalled()
  })
})
