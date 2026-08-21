/**
 * R7-04 — when consumed exceeds target the readout must show how much OVER
 * (e.g. "5 over"), not clamp to "0 remaining" / "0g left".
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MacroProgress } from '@/components/shared/macro-progress'

describe('MacroProgress — R7-04 over-target readout', () => {
  it('shows calories remaining when under target', () => {
    render(
      <MacroProgress
        calories={{ consumed: 1519, target: 2280 }}
        protein={{ consumed: 100, target: 190 }}
        carbs={{ consumed: 100, target: 240 }}
        fat={{ consumed: 30, target: 60 }}
      />,
    )
    expect(screen.getByTestId('calorie-remaining-readout').textContent).toMatch(/remaining/)
    expect(screen.getByTestId('calorie-remaining-readout').textContent).not.toMatch(/over/)
  })

  it('shows how much OVER for calories and macros when consumed exceeds target', () => {
    render(
      <MacroProgress
        calories={{ consumed: 1605, target: 1600 }}   // 5 over
        protein={{ consumed: 100, target: 190 }}       // under
        carbs={{ consumed: 134, target: 134 }}         // exactly on → 0 left, not over
        fat={{ consumed: 71, target: 60 }}             // 11 over
      />,
    )
    // Calories: "5 over", not "0 remaining"
    const cal = screen.getByTestId('calorie-remaining-readout').textContent || ''
    expect(cal).toMatch(/over/)
    expect(cal).not.toMatch(/remaining/)
    // Fat over-target shows "over"
    expect(screen.getByTestId('macro-fat-readout').textContent).toMatch(/over/)
    // Protein (under) still shows "left"
    expect(screen.getByTestId('macro-protein-readout').textContent).toMatch(/left/)
  })
})
