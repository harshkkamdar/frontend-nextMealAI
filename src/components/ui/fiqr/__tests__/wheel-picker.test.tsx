import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { WHEEL_ROW, WheelPicker } from '../wheel-picker'

vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))

const ITEMS = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))

describe('WheelPicker', () => {
  it('marks the current value and reports the row the wheel settles on', () => {
    const onChange = vi.fn()
    render(<WheelPicker label="Day" items={ITEMS} value={2} onChange={onChange} />)
    expect(screen.getByRole('option', { name: '2' })).toHaveAttribute('aria-selected', 'true')
    const wheel = screen.getByRole('listbox', { name: 'Day' })
    wheel.scrollTop = WHEEL_ROW * 3.4
    fireEvent.scroll(wheel)
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('does not report again while the wheel stays on the same row', () => {
    const onChange = vi.fn()
    render(<WheelPicker label="Day" items={ITEMS} value={2} onChange={onChange} />)
    const wheel = screen.getByRole('listbox', { name: 'Day' })
    wheel.scrollTop = WHEEL_ROW * 1.2
    fireEvent.scroll(wheel)
    expect(onChange).not.toHaveBeenCalled()
  })
})
