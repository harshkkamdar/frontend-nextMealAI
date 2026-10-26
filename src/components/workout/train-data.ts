import { todayLocalISO } from '@/lib/timezone'
import { addDays } from '@/components/ui/fiqr/week-strip'
import type { WorkoutExercise, WorkoutPlanDay } from '@/types/plans.types'
import type { SessionExercise, WorkoutSession } from '@/types/workout-session.types'

/** "3 × 10 · 90s rest" for a plan exercise; empty when it has neither sets nor reps. */
export function formatExDetail(ex: Partial<WorkoutExercise> | null | undefined): string {
  const reps = ex?.reps as unknown
  const validReps = (typeof reps === 'number' && reps > 0) || (typeof reps === 'string' && reps.trim().length > 0)
  const repsStr = typeof reps === 'number' ? String(reps) : String(reps ?? '').trim()
  const validSets = typeof ex?.sets === 'number' && ex.sets > 0
  const rs = typeof ex?.rest_seconds === 'number' && ex.rest_seconds > 0 ? ex.rest_seconds : 0
  const rest = rs ? ` · ${rs < 60 ? `${rs}s` : `${Math.floor(rs / 60)}m${rs % 60 ? ` ${rs % 60}s` : ''}`} rest` : ''
  if (validSets && validReps) return `${ex!.sets} × ${repsStr}${rest}`
  if (validSets) return `${ex!.sets} sets${rest}`
  if (validReps) return `${repsStr} reps${rest}`
  return ''
}

/** Completed sessions, newest first. */
export function completedSessions(history: WorkoutSession[]): WorkoutSession[] {
  return history
    .filter((session) => session.status === 'completed' && session.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
}

/**
 * Future dates with a training day on them, walking the cycle one plan day per calendar day from the next workout.
 * The next workout lands today unless today is already done, then tomorrow. Rest days get no date.
 */
export function plannedDates(days: WorkoutPlanDay[], nextIdx: number, today: string, doneToday: boolean, ahead = 13): Set<string> {
  const out = new Set<string>()
  if (!days.length || nextIdx < 0) return out
  for (let k = 1; k <= ahead; k += 1) {
    const day = days[(nextIdx + k - (doneToday ? 1 : 0)) % days.length]
    if (!day.is_rest_day) out.add(addDays(today, k))
  }
  return out
}

/** Kilograms lifted per day, Monday to Sunday, from completed sessions in the given week. */
export function weekVolume(sessions: WorkoutSession[], days: string[], tz: string): number[] {
  const totals = days.map(() => 0)
  for (const session of sessions) {
    const index = days.indexOf(todayLocalISO(tz, new Date(session.completed_at!)))
    if (index >= 0) totals[index] += session.total_volume_kg ?? 0
  }
  return totals
}

/** Live volume: weight × reps over completed sets. */
export function sessionVolumeKg(exercises: SessionExercise[]): number {
  return exercises.reduce((sum, exercise) => sum + exercise.sets.reduce((setSum, set) => (
    set.completed ? setSum + (set.actual_weight_kg ?? 0) * (set.actual_reps ?? 0) : setSum
  ), 0), 0)
}

/** "00:08:52" for the elapsed digit tiles; hours cap at 99. */
export function clockHMS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.min(99, Math.floor(s / 3600)))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

export function formatHistoryDate(value: string, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }).formatToParts(new Date(value))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('weekday')} ${get('day')} ${get('month')}`
}
