/**
 * FB-R6.7 Build F - Activity page date integrity (unit-level).
 *
 * These tests pin down the two helper-level invariants the Activity page
 * relies on:
 *
 * 1. Calendar indicator / history bucketing uses the user's LOCAL date,
 *    not a UTC slice. A workout completed at 19:16 UTC by an IST user
 *    must show up on Jun 6, not Jun 5.
 *
 * 2. "Today" comparison for the Start Workout guard uses the same
 *    local-date helper, so the day boundary is consistent.
 *
 * A full RTL render of the Activity page would require mocking 6+ API
 * clients; the helpers are the actual bug surface, and they're pure.
 */

import { describe, it, expect } from 'vitest'
import { todayLocalISO } from '@/lib/timezone'

describe('FB-R6.7 Build F - calendar indicator bucketing', () => {
  it('19:16 UTC June 5 is June 6 in Asia/Kolkata (UTC+5:30)', () => {
    const utc = new Date(Date.UTC(2026, 5, 5, 19, 16, 0))
    expect(todayLocalISO('Asia/Kolkata', utc)).toBe('2026-06-06')
  })

  it('19:16 UTC June 5 is June 5 in UTC (regression for the old slice)', () => {
    const utc = new Date(Date.UTC(2026, 5, 5, 19, 16, 0))
    expect(todayLocalISO('UTC', utc)).toBe('2026-06-05')
  })

  it('23:30 UTC June 5 is still June 5 in America/Los_Angeles (UTC-7 in summer)', () => {
    const utc = new Date(Date.UTC(2026, 5, 5, 23, 30, 0))
    expect(todayLocalISO('America/Los_Angeles', utc)).toBe('2026-06-05')
  })

  it('05:00 UTC June 6 is June 5 (previous day) in America/Los_Angeles', () => {
    const utc = new Date(Date.UTC(2026, 5, 6, 5, 0, 0))
    expect(todayLocalISO('America/Los_Angeles', utc)).toBe('2026-06-05')
  })
})

describe('FB-R6.7 Build F - "today" comparison for Start guard', () => {
  it('selectedDate equals today when both are formatted from the same instant + tz', () => {
    const now = new Date(Date.UTC(2026, 5, 5, 19, 16, 0))
    const today = todayLocalISO('Asia/Kolkata', now)
    expect(today).toBe('2026-06-06')
    expect(today === '2026-06-06').toBe(true)
  })

  it("selectedDate '2026-06-05' is NOT today when local 'now' is 2026-06-06", () => {
    const now = new Date(Date.UTC(2026, 5, 5, 19, 16, 0))
    const today = todayLocalISO('Asia/Kolkata', now)
    expect('2026-06-05' === today).toBe(false)
  })

  it("selectedDate '2026-06-07' (future) is NOT today", () => {
    const now = new Date(Date.UTC(2026, 5, 5, 19, 16, 0))
    const today = todayLocalISO('Asia/Kolkata', now)
    expect('2026-06-07' === today).toBe(false)
  })
})
