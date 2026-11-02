import { describe, expect, it } from 'vitest'
import { getDashboardGeoLine, quietDayGeoLine } from '@/components/dashboard/dashboard-helpers'

describe("Geo's line on a quiet day", () => {
  it('names the workout and the protein left, as in the client mock', () => {
    expect(quietDayGeoLine({ workout: 'Pull', restDay: false, protein: 180, calories: 2600 })).toBe('Pull today, then 180 g protein to hit.')
  })
  it('on a rest day keeps protein in view', () => {
    expect(quietDayGeoLine({ workout: null, restDay: true, protein: 120.4, calories: 2000 })).toBe('Rest day. 120 g protein still counts.')
  })
  it('without a program names calories and protein', () => {
    expect(quietDayGeoLine({ workout: null, restDay: false, protein: 150, calories: 2200 })).toBe('2,200 kcal and 150 g protein to hit today.')
  })
  it('falls back to the first-meal line when there is no target', () => {
    expect(quietDayGeoLine({ workout: 'Pull', restDay: false, protein: 0, calories: 0 })).toMatch(/first meal/)
  })
  it("never overrides Geo's own takeaway or a nudge", () => {
    expect(getDashboardGeoLine('You trained four times.', [], 'Pull today')).toBe('You trained four times.')
    expect(getDashboardGeoLine(null, [{ message: '83g more protein' }], 'Pull today')).toBe('83g more protein')
    expect(getDashboardGeoLine(null, [], 'Pull today')).toBe('Pull today')
  })
})
