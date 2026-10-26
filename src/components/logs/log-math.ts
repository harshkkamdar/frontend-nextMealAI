/**
 * Pure helpers for Log a meal (SPATIAL-BUILD slice L): the meal for the time of day, portion chip scaling, the photo
 * result's per-item steppers and the edits sent to log-from-estimate, and the /logs day groups.
 */
import type { FoodEstimate, FoodEstimateItem } from '@/lib/api/foods.api'
import type { FoodMacros } from '@/types/foods.types'
import type { Log } from '@/types/logs.types'

export const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const
export type Meal = (typeof MEALS)[number]

/** The meal a log most likely belongs to at this local time. */
export function mealForTime(date: Date): Meal {
  const minutes = date.getHours() * 60 + date.getMinutes()
  if (minutes < 10 * 60 + 30) return 'Breakfast'
  if (minutes < 14 * 60 + 30) return 'Lunch'
  if (minutes < 17 * 60) return 'Snack'
  return 'Dinner'
}

/** A meal name from a URL value ("dinner", "Dinner"), or null when it is not one of the four. */
export function parseMeal(value: string | null | undefined): Meal | null {
  if (!value) return null
  const meal = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  return (MEALS as readonly string[]).includes(meal) ? (meal as Meal) : null
}

/** Portion chips in the item sheet (B2): servings, then a grams field. */
export const PORTIONS = [0.5, 1, 1.5, 2] as const
export const portionLabel = (n: number) => ({ 0.5: '½', 1: '1', 1.5: '1½', 2: '2' } as Record<number, string>)[n] ?? String(n)

export interface Macros { calories: number; protein: number; carbs: number; fat: number }

const round1 = (n: number) => Math.round(n * 10) / 10

/** Macros of `grams` of a food whose `perServing` macros are for `servingG` grams. Calories whole, grams to 0.1. */
export function scaleMacros(perServing: FoodMacros, servingG: number, grams: number): Macros {
  const f = servingG > 0 ? grams / servingG : 0
  return {
    calories: Math.round((perServing.calories ?? 0) * f),
    protein: round1((perServing.protein ?? 0) * f),
    carbs: round1((perServing.carbs ?? 0) * f),
    fat: round1((perServing.fat ?? 0) * f),
  }
}

export const sumMacros = (list: Macros[]): Macros => list.reduce(
  (t, m) => ({ calories: t.calories + m.calories, protein: round1(t.protein + m.protein), carbs: round1(t.carbs + m.carbs), fat: round1(t.fat + m.fat) }),
  { calories: 0, protein: 0, carbs: 0, fat: 0 },
)

// ── Photo result (C2) ──

/** Below this the item gets "Not sure, check this"; below it overall the result gets the "not sure" note. */
export const UNSURE = 0.6

/** One row of the photo result: the backend's estimate for it, and the amount the user settled on. */
export interface PhotoItem {
  name: string
  /** Estimated grams; 0 when the backend gave no quantity, then `amount` is a portion multiplier. */
  baseG: number
  amount: number
  base: Macros
  confidence: number
  removed: boolean
}

export function photoItemsFrom(estimate: FoodEstimate): PhotoItem[] {
  return estimate.items.map((item) => {
    const g = typeof item.quantity_g === 'number' && item.quantity_g > 0 ? Math.round(item.quantity_g) : 0
    return {
      name: item.name,
      baseG: g,
      amount: g || 1,
      base: { calories: item.calories ?? 0, protein: item.protein ?? 0, carbs: item.carbs ?? 0, fat: item.fat ?? 0 },
      confidence: typeof item.confidence === 'number' ? item.confidence : estimate.confidence,
      removed: false,
    }
  })
}

/** The step a − / + moves an item by: finer for small amounts, a quarter portion when there are no grams. */
export function stepFor(item: PhotoItem): number {
  if (!item.baseG) return 0.25
  return item.amount < 50 ? 5 : item.amount < 300 ? 10 : 25
}

export const stepItem = (item: PhotoItem, direction: 1 | -1): PhotoItem => {
  const step = stepFor(item)
  const next = Math.round((item.amount + direction * step) / step) * step
  return { ...item, amount: Math.max(step, next) }
}

export function photoItemMacros(item: PhotoItem): Macros {
  const f = item.baseG ? item.amount / item.baseG : item.amount
  return { calories: Math.round(item.base.calories * f), protein: round1(item.base.protein * f), carbs: round1(item.base.carbs * f), fat: round1(item.base.fat * f) }
}

export const photoTotals = (items: PhotoItem[]) => sumMacros(items.filter((i) => !i.removed).map(photoItemMacros))

/**
 * The `edits` for log-from-estimate. Items carry the settled grams and their scaled macros. The backend then scales
 * `totals` by (logged grams / estimated grams) whenever those differ, so totals go out pre-divided by that ratio and
 * the logged macros come out as the sum the user saw (backend ticket: per-item edits are scaled twice otherwise).
 */
export function estimateEdits(estimate: FoodEstimate, items: PhotoItem[]): { items: FoodEstimateItem[]; totals: Macros } {
  const kept = items.filter((i) => !i.removed)
  const editItems: FoodEstimateItem[] = kept.map((i) => ({
    name: i.name,
    ...(i.baseG ? { quantity_g: i.amount } : {}),
    ...photoItemMacros(i),
    confidence: i.confidence,
  }))
  const wanted = photoTotals(kept)
  const originalG = estimate.items.reduce((s, i) => s + (typeof i.quantity_g === 'number' ? i.quantity_g : 0), 0)
  const enteredG = editItems.reduce((s, i) => s + (i.quantity_g ?? 0), 0)
  const loggedG = enteredG > 0 ? enteredG : originalG > 0 ? originalG : 100
  if (!(originalG > 0 && Math.abs(loggedG - originalG) > 0.5)) return { items: editItems, totals: wanted }
  const back = originalG / loggedG
  return {
    items: editItems,
    totals: { calories: wanted.calories * back, protein: wanted.protein * back, carbs: wanted.carbs * back, fat: wanted.fat * back },
  }
}

// ── /logs ──

const DAY_MS = 86400000
const isoLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Logs grouped by day, newest first: "Today", "Yesterday", then "Sat 24 Oct". */
export function groupLogsByDay(logs: Log[], now = new Date()): { label: string; logs: Log[] }[] {
  const today = isoLocal(now)
  const yesterday = isoLocal(new Date(now.getTime() - DAY_MS))
  const groups = new Map<string, Log[]>()
  const sorted = [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  for (const log of sorted) {
    const day = log.local_date || isoLocal(new Date(log.created_at))
    groups.set(day, [...(groups.get(day) ?? []), log])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([day, list]) => ({
      label: day === today ? 'Today' : day === yesterday ? 'Yesterday'
        : new Date(`${day}T12:00:00`).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', ''),
      logs: list,
    }))
}

/** 24-hour clock time of a log, "12:10". */
export const clockTime = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── Plate (D2) ──

/** One food waiting on the plate pill. */
export interface PlateItem {
  key: string
  name: string
  grams: number
  /** "1½ servings", "150 g". */
  portion: string
  macros: Macros
  user_food_id?: string
}

/** "1 serving", "1½ servings", or grams when the amount is not one of the portion chips. */
export function portionText(servings: number | null, grams: number): string {
  if (servings == null) return `${grams} g`
  return `${portionLabel(servings)} serving${servings <= 1 ? '' : 's'}`
}
