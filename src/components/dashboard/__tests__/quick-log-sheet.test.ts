import { describe, expect, it } from 'vitest'
import { dayLabel } from '@/components/dashboard/quick-log-sheet'

describe('dayLabel', () => {
  it('names the last weigh-in by today, a weekday this week, or a date', () => {
    expect(dayLabel('2026-10-27', '2026-10-27')).toBe('today')
    expect(dayLabel('2026-10-25', '2026-10-27')).toBe('on Sun')
    expect(dayLabel('2026-10-19', '2026-10-27')).toBe('on 19 Oct')
  })
})
