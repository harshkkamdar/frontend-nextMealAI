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

// ─────────────────────────────────────────────────────────────────────────
// FB-06 — per-macro contribution aggregator for the drill-in breakdown sheet.
//
// Pure function: takes an array of Logs, filters to food logs, extracts
// per-macro contributions from `payload.est_macros`, rounds them with the
// same rules the render layer uses, excludes trace-amount rows that round
// to 0, and returns rows sorted by contribution descending with a percent
// share of the day's total.
// ─────────────────────────────────────────────────────────────────────────

export type MacroKey = 'calories' | 'protein' | 'carbs' | 'fat'

export interface MacroContribution {
  id: string
  name: string
  /** Rounded contribution — grams for protein/carbs/fat, kcal for calories */
  value: number
  /** Whole-number percent of the day's total for this macro */
  pct: number
}

interface LogLike {
  id: string
  type: string
  payload: unknown
}

function roundForMacro(raw: unknown, macro: MacroKey): number {
  if (macro === 'calories') return roundMacroKcalNumber(raw as number)
  return roundMacroGramsNumber(raw as number)
}

export function computeMacroContributions(
  logs: readonly LogLike[],
  macro: MacroKey,
): MacroContribution[] {
  // Two-pass: build rows, compute total, emit with percentages
  const rows: { id: string; name: string; value: number }[] = []
  for (const log of logs) {
    if (log.type !== 'food') continue
    const payload = (log.payload ?? {}) as {
      food_name?: unknown
      est_macros?: Record<string, unknown> | null
    }
    const rawMacros = payload.est_macros ?? {}
    const raw = (rawMacros as Record<string, unknown>)[macro]
    const value = roundForMacro(raw, macro)
    if (value <= 0) continue
    const name = typeof payload.food_name === 'string' && payload.food_name.trim().length > 0
      ? payload.food_name
      : 'Unnamed food'
    rows.push({ id: log.id, name, value })
  }

  const total = rows.reduce((s, r) => s + r.value, 0)
  const withPct: MacroContribution[] = rows.map((r) => ({
    ...r,
    pct: total > 0 ? Math.round((r.value / total) * 100) : 0,
  }))
  withPct.sort((a, b) => b.value - a.value)
  return withPct
}
