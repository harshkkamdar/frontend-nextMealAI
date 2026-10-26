import { describe, expect, it } from 'vitest'
import { dayAndDate, formatClock, initials, nextWeekday, profileSummary, syncedLabel } from '../settings-format'

describe('settings format', () => {
  it('summarises only the profile parts that exist', () => {
    expect(profileSummary({ current_weight_kg: 78.2, daily_calorie_target: 2180, primary_goal: 'fat_loss' })).toBe('78.2 kg, 2,180 kcal a day, fat loss')
    expect(profileSummary({ current_weight_kg: 80, daily_calorie_target: null, primary_goal: undefined })).toBe('80.0 kg')
    expect(profileSummary({ current_weight_kg: undefined, daily_calorie_target: null, primary_goal: undefined })).toBe('')
  })

  it('makes initials from the first two words', () => {
    expect(initials('Sam Rivera')).toBe('SR')
    expect(initials('Alexandria-Catherine Montgomery-Wellington')).toBe('AC')
    expect(initials('  sam ')).toBe('S')
  })

  it('formats a stored reminder time as a 12 hour clock', () => {
    expect(formatClock('08:00')).toBe('8:00 am')
    expect(formatClock('00:15:00')).toBe('12:15 am')
    expect(formatClock('12:00')).toBe('12:00 pm')
    expect(formatClock('18:30')).toBe('6:30 pm')
  })

  it('finds the next check-in day, today included', () => {
    const monday = new Date(2026, 9, 26, 15, 0)
    expect(dayAndDate(nextWeekday(0, monday))).toBe('Sunday 1 Nov')
    expect(nextWeekday(1, monday).getDate()).toBe(26)
    expect(nextWeekday(2, monday).getDate()).toBe(27)
  })
  it('labels the last health sync as today or by date', () => {
    const now = new Date(2026, 9, 26, 15, 0)
    expect(syncedLabel(new Date(2026, 9, 26, 7, 42), now)).toBe('Today, 7:42 am')
    expect(syncedLabel(new Date(2026, 9, 24, 19, 5), now)).toBe('24 Oct, 7:05 pm')
  })
})
