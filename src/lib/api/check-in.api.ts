import { apiFetch } from './client'

export interface CheckInStatus {
  state: 'due' | 'mid_week' | 'insufficient'
  week: { start: string; end: string; label: string; number: number }
  days_logged: number
  days_needed: number
  next_check_in_date: string
  days_to_go: number
  weight: {
    current_kg: number | null
    delta_week_kg: number | null
    points: { week_end: string; kg: number }[]
  }
  week_so_far: {
    avg_calories: number | null
    avg_protein_g: number | null
    sessions_done: number
    sessions_planned: number
    sleep_avg_h: number | null
    sleep_nights: number
  }
  targets: { calories: number | null; protein_g: number | null }
  verdict: string | null
  proposal: null | {
    new_calories: number
    new_protein_g: number
    calorie_change_pct: number
    direction: 'up' | 'down' | 'hold'
  }
}

export function getCheckInStatus(): Promise<CheckInStatus> {
  return apiFetch<CheckInStatus>('/v1/check-in/status')
}

export function applyCheckIn(): Promise<unknown> {
  return apiFetch<unknown>('/v1/check-in', {
    method: 'POST',
    body: { apply: true },
  })
}
