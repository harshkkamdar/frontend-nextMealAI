import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReportSheet } from '@/components/chat/report-sheet'
import { reportResponse } from '@/lib/api/feedback.api'

vi.mock('@/components/ui/bottom-sheet', () => ({
  BottomSheet: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
}))

vi.mock('@/lib/api/feedback.api', () => ({
  reportResponse: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}))

describe('ReportSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(reportResponse).mockResolvedValue({ id: 'report-1' })
  })

  it('keeps send disabled until a reason is picked and reports the chosen reason', async () => {
    render(
      <ReportSheet
        open
        onClose={() => {}}
        sessionId="session-1"
        messageId="message-1"
      />,
    )

    const send = screen.getByRole('button', { name: 'Send report' })
    expect(send).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Unsafe advice' }))
    expect(send).toBeEnabled()
    fireEvent.click(send)

    await waitFor(() => {
      expect(reportResponse).toHaveBeenCalledWith({
        session_id: 'session-1',
        message_id: 'message-1',
        reason: 'unsafe',
      })
    })
  })
})
