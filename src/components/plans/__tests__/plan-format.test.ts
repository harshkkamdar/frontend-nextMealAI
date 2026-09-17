import { describe, expect, it } from 'vitest'
import { formatDateRange, formatDayDate, statusLabel } from '@/components/plans/plan-format'

describe('plan formatting', () => {
  it('formats compact date ranges and day pills', () => {
    expect(formatDateRange('2026-09-15', '2026-10-12')).toBe('15 Sep – 12 Oct')
    expect(formatDayDate('2026-09-15', 0)).toBe('Tue 15')
  })

  it('formats statuses for display', () => {
    expect(statusLabel('active')).toBe('Active')
    expect(statusLabel('superseded')).toBe('Superseded')
  })
})
