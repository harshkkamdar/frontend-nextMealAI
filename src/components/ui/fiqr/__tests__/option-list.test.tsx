import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { OptionList } from '../option-list'

vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))

const OPTIONS = [
  { value: 'Dairy', label: 'Dairy' },
  { value: 'Nuts', label: 'Nuts' },
  { value: 'None', label: 'No allergies' },
]

describe('OptionList', () => {
  it('single select reports the picked value and marks it checked', () => {
    const onChange = vi.fn()
    render(<OptionList label="Sex" options={OPTIONS} value="Nuts" onChange={onChange} />)
    expect(screen.getByRole('radio', { name: 'Nuts' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: 'Dairy' }))
    expect(onChange).toHaveBeenCalledWith('Dairy')
  })

  it('multi select: the exclusive option clears the others, and another pick clears it', () => {
    const onChange = vi.fn()
    const { rerender } = render(<OptionList multi exclusive="None" label="Allergies" options={OPTIONS} value={['Dairy', 'Nuts']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'No allergies' }))
    expect(onChange).toHaveBeenLastCalledWith(['None'])

    rerender(<OptionList multi exclusive="None" label="Allergies" options={OPTIONS} value={['None']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Dairy' }))
    expect(onChange).toHaveBeenLastCalledWith(['Dairy'])
  })

  it('multi select toggles a picked option off', () => {
    const onChange = vi.fn()
    render(<OptionList multi label="Allergies" options={OPTIONS} value={['Dairy', 'Nuts']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Dairy' }))
    expect(onChange).toHaveBeenLastCalledWith(['Nuts'])
  })
})
