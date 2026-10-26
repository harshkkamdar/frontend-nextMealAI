import { describe, expect, it } from 'vitest'
import { dayLetter, dayWeekday, formatDateRange, formatDayDate, nextTrainingDay, statusLabel } from '@/components/plans/plan-format'

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

describe('next training day', () => {
  const days = [{}, {}, { is_rest_day: true }, {}]
  it('starts at the cursor, skips rest days and wraps', () => {
    expect(nextTrainingDay(days, 0)).toBe(0)
    expect(nextTrainingDay(days, 2)).toBe(3)
    expect(nextTrainingDay(days, 5)).toBe(1)
    expect(nextTrainingDay(days)).toBe(0)
  })
  it('is null without training days', () => {
    expect(nextTrainingDay([])).toBeNull()
    expect(nextTrainingDay([{ is_rest_day: true }])).toBeNull()
  })
  it('labels days by weekday initial when dated, else by number', () => {
    expect(dayLetter('2026-10-27', 0)).toBe('T')
    expect(dayLetter('', 3)).toBe('4')
    expect(dayWeekday('2026-10-27')).toBe('Tue')
    expect(dayWeekday(undefined)).toBeNull()
  })
})
