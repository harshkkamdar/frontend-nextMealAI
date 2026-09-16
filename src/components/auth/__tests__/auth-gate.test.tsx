import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  pathname: '/dashboard',
  getOnboardingStatus: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}))

vi.mock('@/lib/api/profile.api', () => ({
  getOnboardingStatus: () => mocks.getOnboardingStatus(),
}))

import { AuthGate } from '@/components/auth/auth-gate'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboardingStore } from '@/stores/onboarding.store'

describe('AuthGate', () => {
  beforeEach(() => {
    mocks.replace.mockReset()
    mocks.getOnboardingStatus.mockReset()
    mocks.pathname = '/dashboard'
    useAuthStore.setState({ accessToken: null, hasHydrated: true })
    useOnboardingStore.setState({ status: 'unknown' })
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

    render(<StrictMode><AuthGate mode="app">Private</AuthGate></StrictMode>)

    expect(await screen.findByText('Private')).toBeInTheDocument()
    expect(mocks.getOnboardingStatus).toHaveBeenCalledTimes(1)
  })
})
