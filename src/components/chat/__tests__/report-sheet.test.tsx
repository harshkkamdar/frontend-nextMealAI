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

describe('ReportSheet failure', () => {
  it('says a failed send inline, keeps the note, and offers Try again', async () => {
    vi.mocked(reportResponse).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ id: 'report-2' })
    render(<ReportSheet open onClose={() => {}} sessionId="s" messageId="m" />)
    fireEvent.click(screen.getByRole('button', { name: 'Wrong or misleading' }))
    fireEvent.change(screen.getByLabelText('What went wrong (optional)'), { target: { value: 'The kcal were off' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("That didn't send")
    expect(screen.getByLabelText('What went wrong (optional)')).toHaveValue('The kcal were off')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(reportResponse).toHaveBeenLastCalledWith({ session_id: 's', message_id: 'm', reason: 'wrong', note: 'The kcal were off' }))
  })
})
