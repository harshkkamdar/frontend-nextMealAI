import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { RestTimer } from '../rest-timer'

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('FB-05 RestTimer resetToken behavior (AC01.4, AC01.5)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it('AC01.4 resets the countdown when resetToken changes even with same duration', () => {
    const onComplete = vi.fn()
    const onSkip = vi.fn()
    const { rerender } = render(
      <RestTimer
        isActive={true}
        duration={90}
        resetToken={1}
        onSkip={onSkip}
        onComplete={onComplete}
      />
    )

    // Initial render shows 1:30
    expect(screen.getByText(/1:30/)).toBeInTheDocument()

    // Advance 30s — should now read 1:00
    advance(30_000)
    expect(screen.getByText(/1:00/)).toBeInTheDocument()

    // Parent bumps resetToken (same duration) — countdown restarts from full
    rerender(
      <RestTimer
        isActive={true}
        duration={90}
        resetToken={2}
        onSkip={onSkip}
        onComplete={onComplete}
      />
    )
    expect(screen.getByText(/1:30/)).toBeInTheDocument()
  })

  it('AC01.5 switches duration when moving to an exercise with different rest_seconds', () => {
    const { rerender } = render(
      <RestTimer
        isActive={true}
        duration={90}
        resetToken={1}
        onSkip={vi.fn()}
        onComplete={vi.fn()}
      />
    )
    expect(screen.getByText(/1:30/)).toBeInTheDocument()

    advance(30_000)

    rerender(
      <RestTimer
        isActive={true}
        duration={60}
        resetToken={2}
        onSkip={vi.fn()}
        onComplete={vi.fn()}
      />
    )
    expect(screen.getByText(/1:00/)).toBeInTheDocument()
  })

  it('renders null when isActive=false', () => {
    const { container } = render(
      <RestTimer
        isActive={false}
        duration={60}
        onSkip={vi.fn()}
        onComplete={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('calls onComplete when countdown reaches 0', () => {
    const onComplete = vi.fn()
    render(
      <RestTimer
        isActive={true}
        duration={3}
        resetToken={1}
        onSkip={vi.fn()}
        onComplete={onComplete}
      />
    )
    advance(3_000)
    expect(onComplete).toHaveBeenCalled()
  })

  it('works without resetToken prop (backward compat)', () => {
    render(
      <RestTimer
        isActive={true}
        duration={60}
        onSkip={vi.fn()}
        onComplete={vi.fn()}
      />
    )
    expect(screen.getByText(/1:00/)).toBeInTheDocument()
  })
})
