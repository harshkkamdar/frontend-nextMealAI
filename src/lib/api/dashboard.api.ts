/**
 * FB-R6.7 Build C — Dashboard check-in endpoint.
 *
 * Build C reshape: per-meal-average narrative replaced with a 7-day daily
 * table + 1-line "Focus this week:" takeaway. Backend payload is v=2.
 *
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

export interface DashboardCheckIn {
  /** Build C structured table data. */
  days: DashboardCheckInDay[]
  /** Build C ≤25-word focus sentence. */
  takeaway: string
  generated_at: string
  /** Cache schema version. Always 2 in Build C. */
  v?: number
}

export interface DashboardCheckInResponse {
  check_in: DashboardCheckIn | null
}

export async function getDashboardCheckIn(): Promise<DashboardCheckInResponse> {
  return apiFetch<DashboardCheckInResponse>('/v1/dashboard/check-in')
}
