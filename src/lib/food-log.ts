/**
 * food-log.ts — pure helpers for the dedicated "Log Food" page (BUG-009).
 *
 * The page lets the user search the food database and stage SEVERAL items
 * before committing them as one meal (createLogs). These pure helpers own the
 * draft→CreateLogInput mapping so the page component stays declarative and the
 * commit shape is unit-testable without rendering.
 */

import type { CreateLogInput, FoodMacros } from '@/types/logs.types'

/** A single in-progress food entry on the Log Food page. */
export interface FoodDraft {
  food_name: string
  quantity_g?: number
  est_macros: FoodMacros
  meal_type?: string
  user_food_id?: string
}

/** True when a draft carries a usable (non-blank) food name. */
export function isFoodDraftFilled(d: FoodDraft | null | undefined): boolean {
  return !!d && typeof d.food_name === 'string' && d.food_name.trim().length > 0
}

/** Drop blank (0/NaN/undefined) macro fields so we never persist noisy zeros. */
function cleanMacros(m: FoodMacros): FoodMacros {
  const out: FoodMacros = {}
  if (m.calories) out.calories = m.calories
  if (m.protein) out.protein = m.protein
  if (m.carbs) out.carbs = m.carbs
  if (m.fat) out.fat = m.fat
  return out
}

/**
 * Build the createLogs() item array for the multi-add flow. `pending` are the
 * staged items; `current` is the in-progress form draft, included only when it
 * has a name (so a half-typed row isn't silently logged). Names are trimmed and
 * blank macros/quantity dropped. Returns [] when nothing is loggable.
 */
export function buildFoodLogItems(
  pending: FoodDraft[],
  current: FoodDraft | null,
): CreateLogInput[] {
  const drafts = [...pending]
  if (isFoodDraftFilled(current)) drafts.push(current as FoodDraft)
  return drafts.filter(isFoodDraftFilled).map((d) => ({
    type: 'food' as const,
    payload: {
      food_name: d.food_name.trim(),
      quantity_g: d.quantity_g || undefined,
      est_macros: cleanMacros(d.est_macros),
      meal_type: d.meal_type || undefined,
      user_food_id: d.user_food_id || undefined,
    },
    source: 'manual' as const,
  }))
}
