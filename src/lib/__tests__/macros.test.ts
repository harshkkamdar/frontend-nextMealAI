import { describe, it, expect } from 'vitest'
import {
  formatMacroGrams,
  formatMacroKcal,
  roundMacroGramsNumber,
  roundMacroKcalNumber,
} from '@/lib/macros'

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
