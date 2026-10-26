import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('@/components/onboarding/depth-nav', async (real) => ({ ...(await real<object>()), depthTo: (go: () => void) => go() }))

import { WelcomeBeats } from '../welcome-beats'

const beat = (name: string) => screen.getAllByRole('group', { hidden: true }).find((el) => el.getAttribute('aria-label')?.includes(name))!

describe('WelcomeBeats', () => {
  beforeEach(() => push.mockClear())

  it('stacks the beats in one place, not a sideways pager: only the settled beat is exposed', () => {
    render(<WelcomeBeats />)
    const region = screen.getByLabelText('What FIQR does')
    expect(region.className).not.toMatch(/snap|overflow-x/)
    expect(beat('1 of 4: Food')).not.toHaveAttribute('aria-hidden')
    expect(beat('2 of 4: Train')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })

  it('Continue steps through the beats; the last one offers Get started, which opens sign-up', async () => {
    render(<WelcomeBeats />)
    for (const title of ['Train', 'Geo', 'Check-in']) {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
      await waitFor(() => expect(beat(title)).not.toHaveAttribute('aria-hidden'), { timeout: 3000 })
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Get started' }))
    expect(push).toHaveBeenCalledWith('/signup')
  })

  it('arrow keys and Back move through the beats', async () => {
    render(<WelcomeBeats />)
    const region = screen.getByLabelText('What FIQR does')
    fireEvent.keyDown(region, { key: 'ArrowRight' })
    await waitFor(() => expect(beat('Train')).not.toHaveAttribute('aria-hidden'), { timeout: 3000 })
    fireEvent.keyDown(region, { key: 'ArrowLeft' })
    await waitFor(() => expect(beat('Food')).not.toHaveAttribute('aria-hidden'), { timeout: 3000 })
    fireEvent.keyDown(region, { key: 'ArrowRight' })
    await waitFor(() => expect(beat('Train')).not.toHaveAttribute('aria-hidden'), { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(beat('Food')).not.toHaveAttribute('aria-hidden'), { timeout: 3000 })
  })

  it('I have an account opens sign-in', () => {
    render(<WelcomeBeats />)
    fireEvent.click(screen.getByRole('button', { name: 'I have an account' }))
    expect(push).toHaveBeenCalledWith('/login')
  })
})
