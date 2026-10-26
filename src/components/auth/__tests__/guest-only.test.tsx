import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const replace = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))

import { GuestOnly } from '@/components/auth/guest-only'
import { useAuthStore } from '@/stores/auth.store'

describe('GuestOnly', () => {
  beforeEach(() => replace.mockClear())

  it('sends someone already signed in to the app', () => {
    useAuthStore.setState({ accessToken: 'token', hasHydrated: true })
    render(<GuestOnly><p>form</p></GuestOnly>)
    expect(screen.queryByText('form')).toBeNull()
    expect(replace).toHaveBeenCalledWith('/dashboard')
  })

  it('keeps the screen up when sign-in or sign-up succeeds on it, so the form can lead the way out', () => {
    useAuthStore.setState({ accessToken: null, hasHydrated: true })
    render(<GuestOnly><p>form</p></GuestOnly>)
    act(() => useAuthStore.setState({ accessToken: 'token' }))
    expect(screen.getByText('form')).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })
})
