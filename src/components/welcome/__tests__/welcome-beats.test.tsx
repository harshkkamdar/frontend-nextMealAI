import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('@/lib/page-transition', () => ({ leaveThen: (go: () => void) => go() }))

import { WelcomeCarousel } from '../welcome-carousel'

const slide = (name: string) => [...document.querySelectorAll('[aria-roledescription=slide]')].find((el) => el.getAttribute('aria-label')!.includes(name))!

describe('WelcomeCarousel', () => {
  beforeEach(() => push.mockClear())

  it('is one stage, not a scroll pager: slides stack and only the settled one is exposed', () => {
    render(<WelcomeCarousel />)
    const stage = screen.getByLabelText('What FIQR does')
    expect(stage.className).not.toMatch(/snap|overflow-x/)
    expect(slide('1 of 4: Food')).not.toHaveAttribute('aria-hidden')
    expect(slide('2 of 4: Train')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })

  it('Continue steps through the slides; the last one offers Get started, which opens sign-up', async () => {
    render(<WelcomeCarousel />)
    for (const title of ['Train', 'Geo', 'Check-in']) {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
      await waitFor(() => expect(slide(title)).not.toHaveAttribute('aria-hidden'), { timeout: 3000 })
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Get started' }))
    expect(push).toHaveBeenCalledWith('/signup')
  })

  it('arrow keys move the stage both ways', async () => {
    render(<WelcomeCarousel />)
    const stage = screen.getByLabelText('What FIQR does')
    fireEvent.keyDown(stage, { key: 'ArrowRight' })
    await waitFor(() => expect(slide('Train')).not.toHaveAttribute('aria-hidden'), { timeout: 3000 })
    fireEvent.keyDown(stage, { key: 'ArrowLeft' })
    await waitFor(() => expect(slide('Food')).not.toHaveAttribute('aria-hidden'), { timeout: 3000 })
  })

  it('I have an account opens sign-in', () => {
    render(<WelcomeCarousel />)
    fireEvent.click(screen.getByRole('button', { name: 'I have an account' }))
    expect(push).toHaveBeenCalledWith('/login')
  })
})
