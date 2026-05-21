/**
 * FB-R6-10 — Dashboard check-in endpoint.
 *
 * BE composes a daily check-in narrative + structured metrics (macro
 * adherence, weight delta, workout count, data days) gated on ≥7 days of
 * activity across ≥2 of (food, weight, workout). Below the gate the BE
 * returns `{ check_in: null }` and the FE falls back to existing
 * onboarding/empty-state cards.
 *
 * See backend-nextMealAI/docs/feedback/2026-05-20-round-06-plan.md § FB-R6-10.
 */

import { apiFetch } from './client'

export interface DashboardCheckInMetrics {
  macro_adherence_pct: number | null
  weight_delta_kg: number | null
  workout_count_7d: number | null
  data_days: number | null
}

export interface DashboardCheckIn {
  narrative: string
  metrics: DashboardCheckInMetrics
  generated_at: string
}

export interface DashboardCheckInResponse {
  check_in: DashboardCheckIn | null
}

export async function getDashboardCheckIn(): Promise<DashboardCheckInResponse> {
  return apiFetch<DashboardCheckInResponse>('/v1/dashboard/check-in')
}
