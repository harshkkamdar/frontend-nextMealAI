import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import DeleteAccountPage from '@/app/(public)/delete-account/page'
import { API_BASE } from '@/lib/api/client'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DeleteAccountPage', () => {
  it('replaces the form with confirmation copy after an accepted request', async () => {
    fetchMock.mockResolvedValue({ status: 202 })
    render(<DeleteAccountPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'person@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Note (optional)'), {
      target: { value: 'Please remove my account.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Request deletion' }))

    expect(
      await screen.findByText("Request received. We'll confirm by email within two business days."),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request deletion' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/v1/account/deletion-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'person@example.com',
        note: 'Please remove my account.',
      }),
    })
  })

  it('shows the support fallback after a rejected request', async () => {
    fetchMock.mockResolvedValue({ status: 500 })
    render(<DeleteAccountPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'person@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Request deletion' }))

    await waitFor(() => {
      expect(
        screen.getByText('Something went wrong. Email support@fiqr.app instead.'),
      ).toBeInTheDocument()
    })
  })
})
