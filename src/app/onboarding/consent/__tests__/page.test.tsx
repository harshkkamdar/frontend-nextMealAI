import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  updateProfile: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/lib/api/profile.api', () => ({
  updateProfile: (data: unknown) => mocks.updateProfile(data),
}))

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError },
}))

import ConsentPage from '@/app/onboarding/consent/page'
import { useOnboardingStore } from '@/stores/onboarding.store'

describe('ConsentPage', () => {
  beforeEach(() => {
    mocks.push.mockReset()
    mocks.updateProfile.mockReset()
    mocks.toastError.mockReset()
    useOnboardingStore.setState({ consent: 'unknown' } as never)
  })

  it('keeps the continue button disabled until both acknowledgements are checked', () => {
    render(<ConsentPage />)

    const button = screen.getByRole('button', { name: 'I agree' })
    const boxes = screen.getAllByRole('checkbox')

    expect(button).toBeDisabled()
    fireEvent.click(boxes[0])
    expect(button).toBeDisabled()
    fireEvent.click(boxes[1])
    expect(button).toBeEnabled()
  })

  it('saves both acknowledgements and continues to plan generation', async () => {
    mocks.updateProfile.mockResolvedValue({})
    render(<ConsentPage />)

    screen.getAllByRole('checkbox').forEach((box) => fireEvent.click(box))
    fireEvent.click(screen.getByRole('button', { name: 'I agree' }))

    await waitFor(() => {
      expect(mocks.updateProfile).toHaveBeenCalledWith({
        ai_consent: true,
        health_disclaimer_ack: true,
      })
    })
    expect(useOnboardingStore.getState().consent).toBe('given')
    expect(mocks.push).toHaveBeenCalledWith('/onboarding/generating')
  })

  it('returns an existing user to the page they came from, never off-site', async () => {
    mocks.updateProfile.mockResolvedValue({})
    for (const [search, target] of [['?next=%2Fplans', '/plans'], ['?next=%2F%2Fevil.com', '/onboarding/generating']]) {
      mocks.push.mockReset()
      window.history.replaceState(null, '', `/onboarding/consent${search}`)
      const { unmount } = render(<ConsentPage />)
      screen.getAllByRole('checkbox').forEach((box) => fireEvent.click(box))
      fireEvent.click(screen.getByRole('button', { name: 'I agree' }))
      await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(target))
      unmount()
    }
    window.history.replaceState(null, '', '/')
  })
})
