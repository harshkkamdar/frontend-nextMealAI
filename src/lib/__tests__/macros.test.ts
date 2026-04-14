import { describe, it, expect } from 'vitest'
import {
  formatMacroGrams,
  formatMacroKcal,
  roundMacroGramsNumber,
  roundMacroKcalNumber,
  computeMacroContributions,
} from '@/lib/macros'
import type { Log } from '@/types/logs.types'

function foodLog(id: string, name: string, est: Record<string, unknown>): Log {
  return {
    id,
    user_id: 'u1',
    type: 'food',
    payload: { food_name: name, est_macros: est },
    source: 'manual',
    created_at: '2026-04-14T12:00:00Z',
    updated_at: '2026-04-14T12:00:00Z',
  } as unknown as Log
}

describe('formatMacroGrams', () => {
  // AC01.1 — the exact client screenshot value
  it('rounds 85.30000000000001 to "85.3g"', () => {
    expect(formatMacroGrams(85.30000000000001)).toBe('85.3g')
  })

  // AC01.2 — one decimal place, no trailing zero for integers
  it('strips trailing zero for integer grams', () => {
    expect(formatMacroGrams(80)).toBe('80g')
    expect(formatMacroGrams(80.0)).toBe('80g')
    expect(formatMacroGrams(200)).toBe('200g')
  })

  it('keeps one decimal for non-integer grams', () => {
    expect(formatMacroGrams(85.3)).toBe('85.3g')
    expect(formatMacroGrams(133.5)).toBe('133.5g')
    expect(formatMacroGrams(14.7)).toBe('14.7g')
  })

  // AC01.5 — empty state
  it('renders 0 as "0g" (not "0.0g")', () => {
    expect(formatMacroGrams(0)).toBe('0g')
  })

  // AC01.9 — boundary values
  it('handles boundary values', () => {
    expect(formatMacroGrams(0.04)).toBe('0g') // rounds down
    expect(formatMacroGrams(0.05)).toBe('0.1g') // rounds up
    expect(formatMacroGrams(99.95)).toBe('100g') // crosses integer boundary, trailing zero stripped
    expect(formatMacroGrams(9999.6)).toBe('9999.6g')
  })

  // AC01.11 — invalid input coerces to "0g"
  it('coerces null, undefined, NaN, negative, string, Infinity to "0g"', () => {
    expect(formatMacroGrams(null)).toBe('0g')
    expect(formatMacroGrams(undefined)).toBe('0g')
    expect(formatMacroGrams(Number.NaN)).toBe('0g')
    expect(formatMacroGrams(Number.POSITIVE_INFINITY)).toBe('0g')
    expect(formatMacroGrams(Number.NEGATIVE_INFINITY)).toBe('0g')
    expect(formatMacroGrams(-3.2)).toBe('0g')
    expect(formatMacroGrams('85.3' as unknown as number)).toBe('0g')
  })
})

describe('formatMacroKcal', () => {
  // AC01.3 — integer only, no decimal point
  it('renders integer only', () => {
    expect(formatMacroKcal(1885)).toBe('1885')
    expect(formatMacroKcal(1885.0)).toBe('1885')
    expect(formatMacroKcal(1885.3)).toBe('1885')
    expect(formatMacroKcal(1885.7)).toBe('1886')
  })

  it('renders 0 as "0"', () => {
    expect(formatMacroKcal(0)).toBe('0')
  })

  // AC01.11 — invalid input
  it('coerces null, undefined, NaN, Infinity, negative, string to "0"', () => {
    expect(formatMacroKcal(null)).toBe('0')
    expect(formatMacroKcal(undefined)).toBe('0')
    expect(formatMacroKcal(Number.NaN)).toBe('0')
    expect(formatMacroKcal(Number.POSITIVE_INFINITY)).toBe('0')
    expect(formatMacroKcal(-100)).toBe('0')
    expect(formatMacroKcal('1885' as unknown as number)).toBe('0')
  })
})

describe('roundMacroGramsNumber (for callers that need the raw number, not a string)', () => {
  it('returns a rounded number', () => {
    expect(roundMacroGramsNumber(85.30000000000001)).toBe(85.3)
    expect(roundMacroGramsNumber(0)).toBe(0)
    expect(roundMacroGramsNumber(null)).toBe(0)
    expect(roundMacroGramsNumber(undefined)).toBe(0)
    expect(roundMacroGramsNumber(Number.NaN)).toBe(0)
    expect(roundMacroGramsNumber(-5)).toBe(0)
  })
})

describe('roundMacroKcalNumber', () => {
  it('returns a rounded integer', () => {
    expect(roundMacroKcalNumber(1885.7)).toBe(1886)
    expect(roundMacroKcalNumber(0)).toBe(0)
    expect(roundMacroKcalNumber(null)).toBe(0)
    expect(roundMacroKcalNumber(Number.NaN)).toBe(0)
    expect(roundMacroKcalNumber(-100)).toBe(0)
  })
})

// FB-06 — per-macro breakdown aggregator used by MacroBreakdownSheet
describe('computeMacroContributions', () => {
  const logs: Log[] = [
    foodLog('a', 'Chicken breast', { protein: 48, carbs: 0, fat: 5, calories: 240 }),
    foodLog('b', 'Rice', { protein: 4, carbs: 45, fat: 0.4, calories: 200 }),
    foodLog('c', 'Olive oil', { protein: 0, carbs: 0, fat: 14, calories: 120 }),
    foodLog('d', 'Apple', { protein: 0.3, carbs: 25, fat: 0.2, calories: 95 }),
  ]

  it('sorts contributions descending by the selected macro', () => {
    const rows = computeMacroContributions(logs, 'protein')
    // olive oil (0 protein) excluded; apple.protein 0.3 rounds to 0.3 so it stays
    expect(rows.map((r) => r.name)).toEqual(['Chicken breast', 'Rice', 'Apple'])
  })

  it('computes percent of total for the selected macro', () => {
    const rows = computeMacroContributions(logs, 'carbs')
    // total carbs = 0 + 45 + 0 + 25 = 70 → rice 64%, apple 36%
    expect(rows).toEqual([
      { id: 'b', name: 'Rice', value: 45, pct: 64 },
      { id: 'd', name: 'Apple', value: 25, pct: 36 },
    ])
  })

  it('excludes entries whose contribution rounds to 0g', () => {
    const trace = [
      foodLog('x', 'Trace', { protein: 0.04 }),
      foodLog('y', 'Real', { protein: 10 }),
    ]
    const rows = computeMacroContributions(trace, 'protein')
    expect(rows.map((r) => r.name)).toEqual(['Real'])
  })

  it('coerces malformed est_macros (null, NaN, negative, missing) to 0', () => {
    const bad = [
      foodLog('1', 'Null', { protein: null }),
      foodLog('2', 'NaN', { protein: Number.NaN }),
      foodLog('3', 'Neg', { protein: -5 }),
      foodLog('4', 'Missing', {}),
      foodLog('5', 'Good', { protein: 20 }),
    ]
    const rows = computeMacroContributions(bad, 'protein')
    expect(rows).toEqual([{ id: '5', name: 'Good', value: 20, pct: 100 }])
  })

  it('returns empty array for zero food logs', () => {
    expect(computeMacroContributions([], 'protein')).toEqual([])
  })

  it('ignores non-food logs', () => {
    const mixed: Log[] = [
      ...logs,
      {
        id: 'w',
        user_id: 'u1',
        type: 'workout',
        payload: { exercise: 'Squat' },
        source: 'manual',
        created_at: '',
        updated_at: '',
      } as unknown as Log,
    ]
    const rows = computeMacroContributions(mixed, 'protein')
    expect(rows.every((r) => r.name !== 'Squat')).toBe(true)
  })

  it('handles calories macro same as grams (integer rounding)', () => {
    const rows = computeMacroContributions(logs, 'calories')
    // total = 240 + 200 + 120 + 95 = 655 → 37, 31, 18, 15 (rounded)
    expect(rows[0]).toEqual({ id: 'a', name: 'Chicken breast', value: 240, pct: 37 })
    expect(rows.map((r) => r.name)).toEqual(['Chicken breast', 'Rice', 'Olive oil', 'Apple'])
  })
})
