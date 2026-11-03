import { apiFetch } from './client'

/** One date of the shown week; nulls mean nothing was logged that day. */
export interface CheckInDay {
  date: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  sessions: string[]
  sleep_h: number | null
  weight_kg: number | null
}

export interface CheckInStatus {
  state: 'due' | 'mid_week' | 'insufficient'
  /** A check-in the user started before its day: it reads the last seven days. */
  early: boolean
  /** The week being checked in, or between check-ins the week in progress. */
  week: { start: string; end: string; label: string; number: number }
  /** Days of that week up to today (7 once it has ended). */
  days_elapsed: number
  days: CheckInDay[]
  last_check_in: { date: string; applied: boolean; calories: number | null } | null
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

/** `early`: review the last seven days now (Check in now), instead of waiting for the check-in day. */
export function getCheckInStatus(early = false): Promise<CheckInStatus> {
  return apiFetch<CheckInStatus>(`/v1/check-in/status${early ? '?early=1' : ''}`)
}

/** Records the check-in for the week ending `weekEnd`: Apply writes the new targets, Keep (apply false) keeps them. */
export function applyCheckIn(weekEnd: string, apply = true): Promise<unknown> {
  return apiFetch<unknown>('/v1/check-in', {
    method: 'POST',
    body: { apply, week_end: weekEnd },
  })
}
