/** The Geo companion sheet at the daily coaching limit (llm-budget.middleware.ts answers 429 on /v1/chat and /v1/chat/companion). */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ApiException } from '@/types/api.types'

const mocks = vi.hoisted(() => ({ startCompanionSession: vi.fn(), sendMessage: vi.fn(), error: vi.fn(), screen: () => ({ screen: 'dashboard', context: {} }) }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('sonner', () => ({ toast: { error: mocks.error, success: vi.fn() } }))
vi.mock('@/lib/api/chat.api', () => ({
  startCompanionSession: mocks.startCompanionSession,
  sendMessage: mocks.sendMessage,
  extractSessionMemories: () => Promise.resolve(),
  getChatSession: () => Promise.resolve({ messages: [] }),
}))
vi.mock('@/components/ui/resizable-sheet', () => ({
  ResizableSheet: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? <div role="dialog">{children}</div> : null),
}))
vi.mock('@/components/chat/chat-input', () => ({
  ChatInput: ({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) => <button type="button" disabled={disabled} onClick={() => onSend('what should I eat')}>Send</button>,
}))
vi.mock('@/components/chat/report-sheet', () => ({ ReportSheet: () => null }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('@/contexts/geo-screen-context', () => ({ useGeoScreenContext: () => mocks.screen }))

import { GeoCompanionSheet } from '../geo-companion-sheet'
import { useUIStore } from '@/stores/ui.store'

Element.prototype.scrollIntoView = vi.fn()
// What client.ts throws for 429 { error: true, code: 'BUDGET_EXCEEDED', message }.
const LIMIT = () => new ApiException(429, 'Too Many Requests', 'BUDGET_EXCEEDED', "You've reached today's coaching limit. It resets at midnight UTC.")

describe('GeoCompanionSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('opening at the limit says so, not "check your connection"', async () => {
    mocks.startCompanionSession.mockRejectedValue(LIMIT())
    render(<GeoCompanionSheet />)
    act(() => useUIStore.getState().openSheet('geo-companion'))
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("You've reached today's coaching limit. It resets at midnight UTC."))
  })

  it('a message refused at the limit shows the reason, with no Retry', async () => {
    mocks.startCompanionSession.mockResolvedValue({ session_id: 's1', context_loaded: true })
    mocks.sendMessage.mockRejectedValue(LIMIT())
    render(<GeoCompanionSheet />)
    act(() => useUIStore.getState().openSheet('geo-companion'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("You've reached today's coaching limit.")
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
  })
})
