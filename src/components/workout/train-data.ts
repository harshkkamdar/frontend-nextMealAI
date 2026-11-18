import { todayLocalISO } from '@/lib/timezone'
import { repsToRecord } from '@/lib/workout-session'
import { addDays } from '@/components/ui/fiqr/week-strip'
import type { WorkoutExercise, WorkoutPlanDay } from '@/types/plans.types'
import type { SessionExercise, SetData, WorkoutSession } from '@/types/workout-session.types'

/** "3 × 10 · 60 kg · 90s rest" for a plan exercise; empty when it has neither sets nor reps. */
export function formatExDetail(ex: Partial<WorkoutExercise> | null | undefined): string {
  const reps = ex?.reps as unknown
  const validReps = (typeof reps === 'number' && reps > 0) || (typeof reps === 'string' && reps.trim().length > 0)
  const repsStr = typeof reps === 'number' ? String(reps) : String(reps ?? '').trim()
  const validSets = typeof ex?.sets === 'number' && ex.sets > 0
  const rs = typeof ex?.rest_seconds === 'number' && ex.rest_seconds > 0 ? ex.rest_seconds : 0
  const kg = ex?.weight ?? ex?.weight_kg
  const rest = `${kg != null ? ` · ${formatKg(kg)} kg` : ''}${rs ? ` · ${rs < 60 ? `${rs}s` : `${Math.floor(rs / 60)}m${rs % 60 ? ` ${rs % 60}s` : ''}`} rest` : ''}`
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

/** "12 Nov": the day an unfinished workout was started. */
export function startedOnText(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

/** The toast when a workout start is queued offline: there is no session to open until it syncs. */
export const OFFLINE_START = "Workout saved on your phone. It starts when you're back online"

/**
 * The training day planned on each date, walking the cycle one plan day per calendar day from the next workout.
 * The next workout lands today unless today is already done, then tomorrow. Rest days get no date.
 */
export function plannedDays(days: WorkoutPlanDay[], nextIdx: number, today: string, doneToday: boolean, ahead = 13): Map<string, WorkoutPlanDay> {
  const out = new Map<string, WorkoutPlanDay>()
  if (!days.length || nextIdx < 0) return out
  for (let k = doneToday ? 1 : 0; k <= ahead; k += 1) {
    const day = days[(nextIdx + k - (doneToday ? 1 : 0)) % days.length]
    if (!day.is_rest_day) out.set(addDays(today, k), day)
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

/** A stored set number as a number: old rows hold a rep range ("10-12") in actual_reps, which counts as 10. */
const num = (value: unknown) => {
  const n = parseFloat(String(value))
  return Number.isFinite(n) ? n : 0
}

/** Live volume: weight × reps over completed sets. */
export function sessionVolumeKg(exercises: SessionExercise[]): number {
  return exercises.reduce((sum, exercise) => sum + exercise.sets.reduce((setSum, set) => (
    set.completed ? setSum + num(set.actual_weight_kg) * num(set.actual_reps) : setSum
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

/** "72.5" or "70": kilograms with at most two decimals. */
export function formatKg(kg: number): string {
  return String(Math.round(kg * 100) / 100)
}

/** What a set shows and logs: the typed value, else the planned one. */
export function setWeight(set: SetData): number | null {
  return set.actual_weight_kg ?? set.planned_weight_kg ?? null
}
export function setReps(set: SetData): number {
  return repsToRecord(set)
}
/** A timed set's seconds: the typed value, else the plan's duration. */
export function setSeconds(set: SetData, exercise: Pick<SessionExercise, 'duration_seconds'>): number {
  return set.actual_seconds ?? exercise.duration_seconds ?? 0
}

/** "kg × reps" for a set with no weight reads "BW × 8". */
const kgTimesReps = (kg: number | null, reps: number) => `${kg == null ? 'BW' : formatKg(kg)} × ${reps}`

/** The "Last time" column: kilograms first, then reps ("72.5 × 8"); a dash when there is no last time. */
export function formatLast(set: Pick<SetData, 'previous_reps' | 'previous_weight_kg'>): string {
  return set.previous_reps != null ? kgTimesReps(set.previous_weight_kg ?? null, set.previous_reps) : '—'
}

/** One stepper press: weight moves 2.5 kg (never below 0), reps move 1 (0 to 200). */
export function stepWeight(kg: number | null, dir: 1 | -1): number {
  return Math.max(0, Math.round(((kg ?? 0) + dir * 2.5) * 100) / 100)
}
export function stepReps(reps: number, dir: 1 | -1): number {
  return Math.min(200, Math.max(0, reps + dir))
}
/** A timed set moves 5 s a press (0 to an hour). */
export function stepSeconds(seconds: number, dir: 1 | -1): number {
  return Math.min(3600, Math.max(0, seconds + dir * 5))
}

/** The first set still to do: on this exercise, else on the next unfinished one. Null when every set is done. */
export function nextOpenSet(exercises: SessionExercise[], current: number): { exercise: number; set: number } | null {
  const order = [...exercises.keys()].slice(current).concat([...exercises.keys()].slice(0, current))
  for (const exercise of order) {
    const set = exercises[exercise].sets.findIndex((s) => !s.completed)
    if (set >= 0) return { exercise, set }
  }
  return null
}

/** The rest screen's "Up next" line: "set 4 · 70 kg × 8", naming the exercise when it is another one or a first set. */
export function upNextText(exercises: SessionExercise[], current: number): string {
  const next = nextOpenSet(exercises, current)
  if (!next) return 'Last set done. Finish when ready.'
  const exercise = exercises[next.exercise]
  const set = exercise.sets[next.set]
  const weight = setWeight(set)
  const timed = exercise.duration_seconds ? `${setSeconds(set, exercise)} s` : null
  const line = `set ${next.set + 1} · ${weight == null ? timed ?? `${setReps(set)} reps` : `${formatKg(weight)} kg × ${timed ?? setReps(set)}`}`
  return next.exercise === current && next.set > 0 ? line : `${exercises[next.exercise].name}, ${line}`
}

export interface ExerciseCompare {
  name: string
  /** A timed exercise: `reps` below hold seconds, and there is no last time (the backend carries reps forward only). */
  timed: boolean
  setsDone: number
  best: { kg: number | null; reps: number } | null
  last: { kg: number | null; reps: number } | null
  volume: number
  lastVolume: number
}

const better = (a: { kg: number | null; reps: number } | null, b: { kg: number | null; reps: number }) => (
  !a || (b.kg ?? 0) > (a.kg ?? 0) || ((b.kg ?? 0) === (a.kg ?? 0) && b.reps > a.reps) ? b : a
)

/** Today's best set and volume against the last time's, from the per-set "previous" numbers the session carries. */
export function compareExercise(exercise: SessionExercise): ExerciseCompare {
  let best: ExerciseCompare['best'] = null
  let last: ExerciseCompare['last'] = null
  let volume = 0
  let lastVolume = 0
  const timed = !!exercise.duration_seconds
  for (const set of exercise.sets) {
    if (set.completed) {
      const kg = set.actual_weight_kg ?? null
      const reps = timed ? setSeconds(set, exercise) : num(set.actual_reps)
      best = better(best, { kg, reps })
      if (!timed) volume += num(kg) * reps
    }
    if (set.previous_reps != null && !timed) {
      // Carried forward from last time's actual_reps, so an old row's range string lands here too.
      const reps = num(set.previous_reps)
      last = better(last, { kg: set.previous_weight_kg ?? null, reps })
      lastVolume += num(set.previous_weight_kg) * reps
    }
  }
  return { name: exercise.name, timed, setsDone: exercise.sets.filter((set) => set.completed).length, best, last, volume, lastVolume }
}

/** "Best 75 kg × 8 · 4 sets" under each exercise on the receipt. */
export function bestText(c: ExerciseCompare): string {
  if (!c.best) return 'Not done'
  const sets = `${c.setsDone} ${c.setsDone === 1 ? 'set' : 'sets'}`
  const amount = c.timed ? `${c.best.reps} s` : null
  return c.best.kg == null ? `Best ${amount ?? `${c.best.reps} reps`} · ${sets}` : `Best ${formatKg(c.best.kg)} kg × ${amount ?? c.best.reps} · ${sets}`
}

/** The receipt's right-hand column: weight change first, then reps, else "Same as last". Up is true when it went up. */
export function deltaText(c: ExerciseCompare): { text: string; up: boolean } {
  if (!c.best) return { text: 'Skipped', up: false }
  if (!c.last) return { text: c.timed ? '—' : 'First time', up: false }
  const dKg = Math.round(((c.best.kg ?? 0) - (c.last.kg ?? 0)) * 100) / 100
  if (dKg !== 0) return { text: `${dKg > 0 ? '+' : '−'}${formatKg(Math.abs(dKg))} kg`, up: dKg > 0 }
  const dReps = c.best.reps - c.last.reps
  if (dReps !== 0) return { text: `${dReps > 0 ? '+' : '−'}${Math.abs(dReps)} ${Math.abs(dReps) === 1 ? 'rep' : 'reps'}`, up: dReps > 0 }
  return { text: 'Same as last', up: false }
}

/** Geo's one line on the receipt: the biggest weight jump, else a plain account of the session. */
export function receiptLine(compares: ExerciseCompare[]): string {
  const jumps = compares
    .filter((c) => c.best && c.last)
    .map((c) => ({ c, d: Math.round(((c.best!.kg ?? 0) - (c.last!.kg ?? 0)) * 100) / 100 }))
    .sort((a, b) => b.d - a.d)
  const up = jumps.filter((j) => j.d > 0)
  if (up.length) return `${up[0].c.name} moved up ${formatKg(up[0].d)} kg on last time.${up.length > 1 ? ` ${up.length - 1} more ${up.length === 2 ? 'lift' : 'lifts'} went up too.` : ''}`
  if (jumps.length) return 'Every lift held its weight from last time. Add a rep or 2.5 kg next time.'
  return 'First time logging these lifts. Next time shows how they move.'
}
