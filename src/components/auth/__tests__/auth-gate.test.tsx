import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  pathname: '/dashboard',
  getOnboardingStatus: vi.fn(),
  getProfile: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}))

vi.mock('@/lib/api/profile.api', () => ({
  getOnboardingStatus: () => mocks.getOnboardingStatus(),
  getProfile: () => mocks.getProfile(),
}))

import { AuthGate } from '@/components/auth/auth-gate'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboardingStore } from '@/stores/onboarding.store'

describe('AuthGate', () => {
  beforeEach(() => {
    mocks.replace.mockReset()
    mocks.getOnboardingStatus.mockReset()
    mocks.getProfile.mockReset()
    mocks.pathname = '/dashboard'
    useAuthStore.setState({ accessToken: null, hasHydrated: true })
    useOnboardingStore.setState({ status: 'unknown', consent: 'unknown' } as never)
  })

  it("redirects guests to '/login'", async () => {
    render(<AuthGate mode="app">Private</AuthGate>)

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'))
    expect(screen.queryByText('Private')).not.toBeInTheDocument()
  })

  it("redirects incomplete users to '/onboarding/personal'", async () => {
    useAuthStore.setState({ accessToken: 'token' })
    mocks.getOnboardingStatus.mockResolvedValue({
      personal: { complete: true, completed_at: null },
      fitness: { complete: false, completed_at: null },
      nutrition: { complete: true, completed_at: null },
    })

    render(<AuthGate mode="app">Private</AuthGate>)

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/onboarding/personal'))
    expect(screen.queryByText('Private')).not.toBeInTheDocument()
  })

  it('renders children for a fully onboarded user', async () => {
    useAuthStore.setState({ accessToken: 'token' })
    mocks.getOnboardingStatus.mockResolvedValue({
      personal: { complete: true, completed_at: null },
      fitness: { complete: true, completed_at: null },
      nutrition: { complete: true, completed_at: null },
    })
    mocks.getProfile.mockResolvedValue({
      ai_consent_at: '2026-09-17T00:00:00.000Z',
      health_disclaimer_ack_at: '2026-09-17T00:00:00.000Z',
    })

    render(<AuthGate mode="app">Private</AuthGate>)

    expect(await screen.findByText('Private')).toBeInTheDocument()
  })

  it('requests onboarding status only once in Strict Mode', async () => {
    useAuthStore.setState({ accessToken: 'token' })
    mocks.getOnboardingStatus.mockResolvedValue({
      personal: { complete: true, completed_at: null },
      fitness: { complete: true, completed_at: null },
      nutrition: { complete: true, completed_at: null },
    })
    mocks.getProfile.mockResolvedValue({
      ai_consent_at: '2026-09-17T00:00:00.000Z',
      health_disclaimer_ack_at: '2026-09-17T00:00:00.000Z',
    })

    render(<StrictMode><AuthGate mode="app">Private</AuthGate></StrictMode>)

    expect(await screen.findByText('Private')).toBeInTheDocument()
    expect(mocks.getOnboardingStatus).toHaveBeenCalledTimes(1)
    expect(mocks.getProfile).toHaveBeenCalledTimes(1)
  })

  it("redirects fully onboarded users with missing consent to '/onboarding/consent'", async () => {
    useAuthStore.setState({ accessToken: 'token' })
    useOnboardingStore.setState({ status: 'complete', consent: 'missing' } as never)

    render(<AuthGate mode="app">Private</AuthGate>)

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/onboarding/consent?next=%2Fdashboard'))
    expect(screen.queryByText('Private')).not.toBeInTheDocument()
  })

  it('renders children for a fully onboarded user who has given consent', () => {
    useAuthStore.setState({ accessToken: 'token' })
    useOnboardingStore.setState({ status: 'complete', consent: 'given' } as never)

    render(<AuthGate mode="app">Private</AuthGate>)

    expect(screen.getByText('Private')).toBeInTheDocument()
  })
})
