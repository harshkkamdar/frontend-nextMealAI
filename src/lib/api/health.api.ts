import { apiFetch } from './client'

export interface HealthDay {
  local_date: string
  steps?: number
  active_kcal?: number
  weight_kg?: number
  sleep_hours?: number
}

export interface HealthWorkout {
  external_id: string
  local_date: string
  started_at: string
  ended_at: string
  duration_min: number
  activity: string
  calories?: number
  source?: string
}

export function postHealthSync(body: {
  days: HealthDay[]
  workouts: HealthWorkout[]
}): Promise<{ upserted: number }> {
  return apiFetch('/v1/health/sync', { method: 'POST', body })
}
