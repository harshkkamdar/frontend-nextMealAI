import { describe, expect, it } from 'vitest'
import { per, renewalLine, renewsOn } from '../paywall-copy'

describe('paywall copy', () => {
  it('renews a yearly plan a year on, with the store price', () => {
    expect(renewalLine({ period: 'yearly', price: 'A$99.99' }, new Date(2026, 9, 26))).toBe('Renews 26 Oct 2027 at A$99.99 unless you cancel at least 24 hours before.')
    expect(per({ period: 'yearly' })).toBe('a year')
  })

  it('renews a monthly plan a month on and clamps a month-end start', () => {
    expect(renewsOn({ period: 'monthly' }, new Date(2026, 9, 26)).toDateString()).toBe(new Date(2026, 10, 26).toDateString())
    expect(renewsOn({ period: 'monthly' }, new Date(2027, 0, 31)).toDateString()).toBe(new Date(2027, 1, 28).toDateString())
    expect(per({ period: 'monthly' })).toBe('a month')
  })
})
