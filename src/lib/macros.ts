/**
 * Macro number formatters. Defense-in-depth rounding at the render layer.
 * Paired with backend `roundMacros` helper — both must agree on the rules.
 *
 * Rules:
 * - grams: 1 decimal, trailing zero stripped, clamped ≥ 0, invalid → "0g"
 * - kcal: integer, clamped ≥ 0, invalid → "0"
 *
 * FB-04 (Client Feedback Round 03). Never let `85.30000000000001g` reach the user again.
 */

function toSafeNumber(value: unknown): number {
  if (typeof value !== 'number') return 0
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  return value
}

export function roundMacroGramsNumber(value: number | null | undefined): number {
  return Math.round(toSafeNumber(value) * 10) / 10
}

export function roundMacroKcalNumber(value: number | null | undefined): number {
  return Math.round(toSafeNumber(value))
}

export function formatMacroGrams(value: number | null | undefined): string {
  const rounded = roundMacroGramsNumber(value)
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return `${str}g`
}

export function formatMacroKcal(value: number | null | undefined): string {
  return String(roundMacroKcalNumber(value))
}
