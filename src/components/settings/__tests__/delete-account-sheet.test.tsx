import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DeleteAccountSheet } from '@/components/settings/delete-account-sheet'
import { deleteAccount } from '@/lib/api/account.api'

vi.mock('@/lib/api/account.api', () => ({
  deleteAccount: vi.fn(),
}))

describe('DeleteAccountSheet', () => {
  beforeEach(() => {
    vi.mocked(deleteAccount).mockReset()
  })

  it('keeps the delete button disabled until DELETE is typed exactly', () => {
    render(<DeleteAccountSheet open onClose={() => {}} />)

    const input = screen.getByLabelText('Type DELETE to confirm')
    const button = screen.getByRole('button', { name: 'Delete account' })

    expect(button).toBeDisabled()
    fireEvent.change(input, { target: { value: 'delete' } })
    expect(button).toBeDisabled()
    fireEvent.change(input, { target: { value: 'DELETE' } })
    expect(button).toBeEnabled()
  })

  it('calls deleteAccount once when confirmed', async () => {
    vi.mocked(deleteAccount).mockImplementation(() => new Promise(() => {}))
    render(<DeleteAccountSheet open onClose={() => {}} />)

    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Delete account' }))

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledTimes(1))
  })
})
