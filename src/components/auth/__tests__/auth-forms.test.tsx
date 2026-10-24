import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const mocks = vi.hoisted(() => ({ push: vi.fn(), login: vi.fn(), signup: vi.fn() }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/lib/api/auth.api', () => ({ login: mocks.login, signup: mocks.signup }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))

import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'

describe('LoginForm', () => {
  it('shows the API error inline above Sign in and stays on the page', async () => {
    mocks.login.mockRejectedValueOnce(new Error('Invalid login credentials'))
    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sam@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Invalid login credentials')).toHaveAttribute('role', 'alert')
    expect(mocks.push).not.toHaveBeenCalled()
  })
})

describe('SignupForm', () => {
  it('names the fix when the passwords differ and does not call the API', async () => {
    render(<SignupForm />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sam@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'longenough1' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'different1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText("The two passwords don't match")).toBeInTheDocument()
    expect(mocks.signup).not.toHaveBeenCalled()
  })
})
