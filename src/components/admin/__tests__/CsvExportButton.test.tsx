/**
 * FB-R6-S2-v2 · CsvExportButton — fetches a CSV blob with auth, triggers
 * a browser download, handles disabled-while-in-flight, handles failure.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  exportCsv: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/lib/api/admin.api', () => ({
  exportActiveUsersCsv: (...args: unknown[]) => mocks.exportCsv(...args),
}))

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError, success: vi.fn() },
}))

import { CsvExportButton } from '@/components/admin/CsvExportButton'

describe('CsvExportButton — FB-R6-S2-v2 AC06 + AC14 + AC15', () => {
  beforeEach(() => {
    mocks.exportCsv.mockReset()
    mocks.toastError.mockReset()
  })

  it('AC06: clicking triggers a download (anchor click + URL.createObjectURL)', async () => {
    const blob = new Blob(['user_id,last_active\nstub-user-1,2026-05-21'], { type: 'text/csv' })
    mocks.exportCsv.mockResolvedValueOnce({ blob, filename: 'active-users-2026-05-21.csv' })

    // Capture the synthesized <a> click + revokeObjectURL flow
    const createObjectURL = vi.fn(() => 'blob:mock-csv')
    const revokeObjectURL = vi.fn()
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL

    try {
      render(<CsvExportButton />)
      fireEvent.click(screen.getByRole('button', { name: /export csv/i }))

      await waitFor(() => expect(mocks.exportCsv).toHaveBeenCalledTimes(1))
      await waitFor(() => expect(createObjectURL).toHaveBeenCalledWith(blob))
    } finally {
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
    }
  })

  it('AC15: disables while in-flight so double-click does not double-download', async () => {
    type Resolver = (v: { blob: Blob; filename: string }) => void
    let resolveFn: Resolver = () => {}
    mocks.exportCsv.mockReturnValueOnce(
      new Promise<{ blob: Blob; filename: string }>((res) => {
        resolveFn = res
      })
    )

    render(<CsvExportButton />)
    const btn = screen.getByRole('button', { name: /export csv/i }) as HTMLButtonElement
    fireEvent.click(btn)

    expect(btn.disabled).toBe(true)

    // Second click should be a no-op
    fireEvent.click(btn)
    expect(mocks.exportCsv).toHaveBeenCalledTimes(1)

    // Resolve the request — button re-enables
    resolveFn({
      blob: new Blob(['x'], { type: 'text/csv' }),
      filename: 'active-users-2026-05-21.csv',
    })
    await waitFor(() => expect(btn.disabled).toBe(false))
  })

  it('AC14: surfaces an error toast when the export fails; button re-enables', async () => {
    mocks.exportCsv.mockRejectedValueOnce(new Error('500 server error'))

    render(<CsvExportButton />)
    const btn = screen.getByRole('button', { name: /export csv/i }) as HTMLButtonElement
    fireEvent.click(btn)

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled())
    await waitFor(() => expect(btn.disabled).toBe(false))
  })
})
