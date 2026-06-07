/**
 * FB-R6.7 Build C — Dashboard check-in endpoint.
 *
 * Build C reshape: per-meal-average narrative replaced with a 7-day daily
 * table + 1-line "Focus this week:" takeaway. Backend payload is v=2.
 *
 * Back-compat: `metrics` block + optional `narrative` field are kept for one
 * release so a stale BE cache or older deploy doesn't break the FE.
 */

import { apiFetch } from './client'

export interface DashboardCheckInMacroCell {
  actual: number
  target: number
}

export interface DashboardCheckInDay {
  /** YYYY-MM-DD in the user's local timezone, oldest → newest. */
  date: string
  /** 'Sun' | 'Mon' | … */
  day_of_week: string
  calories: DashboardCheckInMacroCell
  protein: DashboardCheckInMacroCell
  carbs: DashboardCheckInMacroCell
  fat: DashboardCheckInMacroCell
  /** True iff every macro target is positive AND actual is within ±10%. */
  hit: boolean
}

/** @deprecated kept one release for FE back-compat. Drop after Build C is live. */
export interface DashboardCheckInMetrics {
  macro_adherence_pct: number | null
  weight_delta_kg: number | null
  workout_count_7d: number | null
  data_days: number | null
}

export interface DashboardCheckIn {
  /** Build C structured table data. */
  days: DashboardCheckInDay[]
  /** Build C ≤25-word focus sentence. */
  takeaway: string
  /** Legacy block — present during cutover, drop after Build C is live. */
  metrics: DashboardCheckInMetrics
  generated_at: string
  /** @deprecated v1 cache rows still flowing through during cutover. */
  narrative?: string | null
  /** Cache schema version. Always 2 in Build C. */
  v?: number
}

export interface DashboardCheckInResponse {
  check_in: DashboardCheckIn | null
}

export async function getDashboardCheckIn(): Promise<DashboardCheckInResponse> {
  return apiFetch<DashboardCheckInResponse>('/v1/dashboard/check-in')
}
