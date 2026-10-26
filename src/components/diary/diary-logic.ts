import type { FoodMacros, FoodPayload } from '@/types/logs.types'

export type DayKind = 'today' | 'past' | 'future'

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

export const dayKind = (date: string, today: string): DayKind => (date === today ? 'today' : date < today ? 'past' : 'future')

/** YYYY-MM-DD plus `n` days, at local noon so a DST change never skips a day. */
export function shiftISO(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA')
}

export interface SummaryCopy {
  /** The number in the ring centre. */
  value: number
  /** Under the number: "kcal left", "kcal over", "kcal eaten", "kcal planned". */
  unit: string
  /** The line under the card. `strong` is the bold lead, `rest` follows it. */
  strong: string | null
  rest: string
}

/**
 * The day summary's words (mock journey-food A1 Ring): today leads with what is left, other days never show a "left"
 * figure (past = eaten against target, future = planned), and no target shows the eaten total only.
 */
export function summaryCopy({ eaten, target, kind, logged, dayLabel }: { eaten: number; target: number; kind: DayKind; logged: boolean; dayLabel: string }): SummaryCopy {
  if (target <= 0) return { value: eaten, unit: 'kcal eaten', strong: null, rest: 'No daily target set' }
  if (kind === 'future') return { value: eaten, unit: 'kcal planned', strong: null, rest: `Planned so far, of your ${fmt(target)} target` }
  if (kind === 'past') {
    if (!logged) return { value: 0, unit: 'kcal eaten', strong: null, rest: `Nothing logged on ${dayLabel}` }
    const over = eaten > target
    return { value: eaten, unit: 'kcal eaten', strong: fmt(Math.abs(eaten - target)), rest: ` ${over ? 'over' : 'under'} your ${fmt(target)} target` }
  }
  const left = target - eaten
  return { value: Math.abs(left), unit: left >= 0 ? 'kcal left' : 'kcal over', strong: fmt(eaten), rest: ` eaten of ${fmt(target)}` }
}

/** Days a single item can be copied to (mock copy sheet): up to three, never the day it is on. The first is the default. */
export function copyDays(date: string, today: string): string[] {
  const days = [today, shiftISO(today, 1), shiftISO(today, 2)]
  if (date !== today) days.unshift(shiftISO(today, -1))
  return days.filter((d) => d !== date).slice(0, 3)
}

export type MacroHue = 'protein' | 'carbs' | 'fat'

/** The macro that carries most of the row's energy (4/4/9 kcal per g), or null for a 0 kcal row. */
export function dominantMacro(m: FoodMacros | undefined): MacroHue | null {
  const kcal = { protein: (m?.protein ?? 0) * 4, carbs: (m?.carbs ?? 0) * 4, fat: (m?.fat ?? 0) * 9 }
  const top = (Object.keys(kcal) as MacroHue[]).reduce((a, b) => (kcal[b] > kcal[a] ? b : a))
  return kcal[top] > 0 ? top : null
}

/**
 * The log's own photo, when its payload carries one. Food logs have no photo field today (no backend change in
 * this slice), so this is null for every current row and the row shows its meal glyph instead.
 */
export function logPhoto(payload: FoodPayload): string | null {
  const url = (payload as { photo_url?: unknown }).photo_url
  return typeof url === 'string' && /^https:\/\//.test(url) ? url : null
}

/** "Breakfast" for "breakfast" / "BREAKFAST"; anything unknown files under Snack (the diary's grouping rule). */
export function mealOf(payload: FoodPayload): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' {
  const t = payload.meal_type?.toLowerCase()
  return t === 'breakfast' ? 'Breakfast' : t === 'lunch' ? 'Lunch' : t === 'dinner' ? 'Dinner' : 'Snack'
}

/** "1 bowl", "2 slices", "150g", "5 items, from your photo". */
export function quantityLabel(payload: FoodPayload): string {
  if (payload.items?.length) return `${payload.items.length} item${payload.items.length === 1 ? '' : 's'}, from your photo`
  const servings = typeof payload.servings === 'number' ? payload.servings : undefined
  const label = typeof payload.serving_label === 'string' ? payload.serving_label.trim() : ''
  if (servings !== undefined && label) {
    const plural = servings === 1 || /s$/i.test(label) ? label : `${label}s`
    return `${servings} ${plural}`
  }
  if (servings !== undefined) return `${servings} serving${servings === 1 ? '' : 's'}`
  if (payload.quantity_g) return `${payload.quantity_g}g`
  return '1 serving'
}
