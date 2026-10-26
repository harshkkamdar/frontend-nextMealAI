import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { WeekStrip, addDays, weekDays } from '../week-strip'

describe('week dates', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })

  it('returns the Sunday-start week containing the date', () => {
    // 26 Oct 2026 is a Monday.
    expect(weekDays('2026-10-26')).toEqual(['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'])
    expect(weekDays('2026-10-25')[0]).toBe('2026-10-25')
  })

  it('supports Monday-start weeks', () => {
    expect(weekDays('2026-10-25', 1)[0]).toBe('2026-10-19')
    expect(weekDays('2026-10-26', 1)[6]).toBe('2026-11-01')
  })
})

describe('WeekStrip', () => {
  it('marks today, the selected day and logged days for screen readers', () => {
    render(<WeekStrip selected="2026-10-25" today="2026-10-26" onSelect={() => {}} marked={new Set(['2026-10-25'])} markLabel="food logged" />)
    expect(screen.getByRole('button', { name: /monday 26 october, today/i })).toHaveAttribute('aria-current', 'date')
    const selected = screen.getByRole('button', { name: /sunday 25 october, food logged/i })
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('button')).toHaveLength(7)
  })

  it('selects a tapped day', () => {
    const onSelect = vi.fn()
    render(<WeekStrip selected="2026-10-26" today="2026-10-26" onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /wednesday 28 october/i }))
    expect(onSelect).toHaveBeenCalledWith('2026-10-28')
  })
})
