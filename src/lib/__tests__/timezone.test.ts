import { describe, it, expect } from 'vitest'
import { todayLocalISO, detectIanaTimezone } from '../timezone'

describe('todayLocalISO', () => {
  it('returns the same date in UTC', () => {
    const fixed = new Date('2026-05-06T03:50:00Z')
    expect(todayLocalISO('UTC', fixed)).toBe('2026-05-06')
  })

  it('returns the next day in Australia/Sydney (UTC+10) when UTC is still on previous day', () => {
    // 2026-05-05T19:00:00Z = 2026-05-06T05:00 in Sydney
    const fixed = new Date('2026-05-05T19:00:00Z')
    expect(todayLocalISO('Australia/Sydney', fixed)).toBe('2026-05-06')
  })

  it('returns the previous day in America/Los_Angeles (UTC-7/8) when UTC just rolled over', () => {
    // 2026-05-06T03:00:00Z = 2026-05-05 20:00 in LA (PDT)
    const fixed = new Date('2026-05-06T03:00:00Z')
    expect(todayLocalISO('America/Los_Angeles', fixed)).toBe('2026-05-05')
  })

  it('falls back to UTC for invalid tz', () => {
    const fixed = new Date('2026-05-06T12:00:00Z')
    expect(todayLocalISO('Mars/Olympus', fixed)).toBe('2026-05-06')
  })

  it('falls back to UTC when tz is null/undefined/empty', () => {
    const fixed = new Date('2026-05-06T12:00:00Z')
    expect(todayLocalISO(null, fixed)).toBe('2026-05-06')
    expect(todayLocalISO(undefined, fixed)).toBe('2026-05-06')
    expect(todayLocalISO('', fixed)).toBe('2026-05-06')
  })

  it('handles half-offset timezones correctly (Asia/Kolkata UTC+5:30)', () => {
    // 2026-05-05T19:30:00Z = 2026-05-06 01:00 IST → next day
    const fixed = new Date('2026-05-05T19:30:00Z')
    expect(todayLocalISO('Asia/Kolkata', fixed)).toBe('2026-05-06')
  })
})

describe('detectIanaTimezone', () => {
  it('returns a non-empty string', () => {
    const tz = detectIanaTimezone()
    expect(typeof tz).toBe('string')
    expect(tz.length).toBeGreaterThan(0)
  })
})
