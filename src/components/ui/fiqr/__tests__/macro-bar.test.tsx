import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MacroBar } from '@/components/ui/fiqr/macro-bar'

describe('MacroBar', () => {
  it('caps the fill width at 100% when current exceeds target', () => {
    const { container } = render(<MacroBar name="Protein" current={120} target={100} unit="g" />)

    expect(container.querySelector('[data-slot="macro-bar-fill"]')).toHaveStyle({ width: '100%' })
  })

  it('shows the calories left readout while under target', () => {
    render(<MacroBar name="Calories" current={800} target={2000} />)

    expect(screen.getByText(/1200 left/)).toBeInTheDocument()
  })

  it('shows an over-target readout', () => {
    render(<MacroBar name="Fat" current={75} target={60} unit="g" />)

    expect(screen.getByText(/15g over/)).toBeInTheDocument()
  })
})
