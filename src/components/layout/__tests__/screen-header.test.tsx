import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LargeTitleHeader, PushedHeader } from '../screen-header'

describe('PushedHeader', () => {
  it('shows the centred bar title by default', () => {
    render(<PushedHeader title="Settings" onBack={vi.fn()} />)
    expect(screen.getByText('Settings')).not.toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('large: a left large title and subtitle; the bar title waits until it scrolls under', () => {
    render(<PushedHeader large title="Four-day upper lower" barTitle="Workout plan" subtitle="5 weeks left" onBack={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Four-day upper lower' })).toBeInTheDocument()
    expect(screen.getByText('5 weeks left')).toBeInTheDocument()
    expect(screen.getByText('Workout plan')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('LargeTitleHeader', () => {
  it('clamps the subtitle to one line', () => {
    render(<LargeTitleHeader title="Today" subtitle="A very long subtitle that would otherwise wrap under the header buttons" />)
    expect(screen.getByText(/A very long subtitle/)).toHaveClass('truncate')
  })
})
