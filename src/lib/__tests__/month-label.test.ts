import { describe, it, expect } from 'vitest'
import { formatWeekMonthLabel } from '../month-label'

// Helper: produce ISO date strings for a 7-day window centered on `center`
function weekAround(centerISO: string): string[] {
  const center = new Date(centerISO + 'T12:00:00Z')
  const out: string[] = []
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(center)
    d.setUTCDate(d.getUTCDate() + offset)
    out.push(d.toISOString().split('T')[0])
  }
  return out
}

describe('formatWeekMonthLabel', () => {
  it('AC01.1 — single-month week returns "March 2026"', () => {
    expect(formatWeekMonthLabel(weekAround('2026-03-15'))).toBe('March 2026')
  })

  it('AC01.2 — cross-month same-year week returns "March – April 2026"', () => {
    // 2026-04-02 → Mar 30 – Apr 5
    expect(formatWeekMonthLabel(weekAround('2026-04-02'))).toBe('March – April 2026')
  })

  it('AC01.3 — cross-year week returns "December 2025 – January 2026"', () => {
    // 2026-01-01 → Dec 29 – Jan 4
    expect(formatWeekMonthLabel(weekAround('2026-01-01'))).toBe('December 2025 – January 2026')
  })

  it('handles first day of month (no cross-month)', () => {
    // 2026-03-01 week = Feb 26 – Mar 4 → cross-month Feb–Mar
    expect(formatWeekMonthLabel(weekAround('2026-03-01'))).toBe('February – March 2026')
  })

  it('empty input returns empty string (defensive)', () => {
    expect(formatWeekMonthLabel([])).toBe('')
  })
})
