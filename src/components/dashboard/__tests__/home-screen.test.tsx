import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getDashboardFirstName, getDashboardGeoLine } from '@/components/dashboard/dashboard-helpers'
import { MacroBar } from '@/components/ui/fiqr/macro-bar'

describe('FIQR home screen', () => {
  it('uses the first word of the profile name for the greeting', () => {
    expect(getDashboardFirstName('George Michael Smith', 'fallback@example.com')).toBe('George')
  })

  it('falls back to the default Geo line when no check-in or nudge has copy', () => {
    expect(getDashboardGeoLine('  ', [{ message: '' }])).toBe(
      "Log your first meal today and I'll take it from there.",
    )
  })

  it('renders calories over target and caps the MacroBar fill', () => {
    const { container } = render(<MacroBar name="Calories" current={2250} target={2200} />)

    expect(screen.getByText('50 over')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="macro-bar-fill"]')).toHaveStyle({ width: '100%' })
  })
})
