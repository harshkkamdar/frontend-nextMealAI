import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const haptic = vi.hoisted(() => vi.fn())
vi.mock('@/lib/platform/app', () => ({ haptic }))

import { Chips, Stepper } from '../log-ui'

describe('log-ui Stepper', () => {
  it('clamps to min and max, disables the end buttons and ticks a selection haptic only on change', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Stepper value={1} unit="glass" min={1} max={2} onChange={onChange} lessLabel="Less" moreLabel="More" />)
    expect(screen.getByLabelText('Less')).toBeDisabled()
    fireEvent.click(screen.getByLabelText('More'))
    expect(onChange).toHaveBeenLastCalledWith(2)
    expect(haptic).toHaveBeenCalledWith('selection')

    rerender(<Stepper value={2} unit="glasses" min={1} max={2} onChange={onChange} lessLabel="Less" moreLabel="More" />)
    expect(screen.getByLabelText('More')).toBeDisabled()
  })

  it('rounds fractional steps so 0.25 servings never drift', () => {
    const onChange = vi.fn()
    render(<Stepper value={0.75} unit="servings" step={0.25} min={0.25} onChange={onChange} lessLabel="Less" moreLabel="More" />)
    fireEvent.click(screen.getByLabelText('More'))
    expect(onChange).toHaveBeenLastCalledWith(1)
  })
})

describe('log-ui Chips', () => {
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }] as const

  it('marks the chosen chip pressed and clears it on a second tap only when clearable', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Chips options={options} value="a" onChange={onChange} label="Pick" />)
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }))
    expect(onChange).toHaveBeenLastCalledWith('a')

    rerender(<Chips options={options} value="a" onChange={onChange} label="Pick" clearable />)
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }))
    expect(onChange).toHaveBeenLastCalledWith('')
  })
})
