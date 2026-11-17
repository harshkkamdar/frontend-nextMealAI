import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({ push: vi.fn(), login: vi.fn(), signup: vi.fn(), updatePassword: vi.fn(), params: new URLSearchParams() }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }), useSearchParams: () => mocks.params }))
vi.mock('@/lib/api/auth.api', () => ({ login: mocks.login, signup: mocks.signup, updatePassword: mocks.updatePassword }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))

import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'
import ResetPasswordPage from '@/app/(auth)/reset-password/page'

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
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Longenough1!' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Different1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText("The two passwords don't match")).toBeInTheDocument()
    expect(mocks.signup).not.toHaveBeenCalled()
  })
})

// auth.validators.ts passwordSchema: 8+ characters, an uppercase and a lowercase letter, a number and a symbol.
describe('password rules match the backend', () => {
  it('sign-up ticks each rule and sends nothing the backend would refuse', async () => {
    render(<SignupForm />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sam@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'longenough' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'longenough' } })
    const rules = screen.getByRole('list', { name: 'Password needs' })
    expect(rules).toHaveTextContent('At least 8 characters, done')
    expect(rules).toHaveTextContent('An uppercase letter')
    expect(rules).not.toHaveTextContent('An uppercase letter, done')
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Meet every rule below')).toBeInTheDocument()
    expect(mocks.signup).not.toHaveBeenCalled()

    mocks.signup.mockResolvedValueOnce({})
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Longenough1!' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Longenough1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(mocks.signup).toHaveBeenCalledWith('sam@example.com', 'Longenough1!'))
  })

  it('reset password shows the same rules and holds the update until they are met', async () => {
    window.location.hash = '#access_token=token-1&type=recovery'
    render(<ResetPasswordPage />)
    fireEvent.change(await screen.findByLabelText('New password'), { target: { value: 'longenough' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'longenough' } })
    expect(screen.getByRole('list', { name: 'Password needs' })).toHaveTextContent('A symbol, like ! or #')
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }))
    expect(await screen.findByText('Meet every rule below')).toBeInTheDocument()
    expect(mocks.updatePassword).not.toHaveBeenCalled()
    window.location.hash = ''
  })
})
