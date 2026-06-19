/**
 * FB-05 rest-timer-bugs — pure helpers extracted from the workout session page
 * so the bug-prone logic can be unit tested without mounting the Next.js page.
 *
 * FB-R6-16+17 (2026-05-21) extends this module with deriveWorkoutEntryLabel —
 * a one-decision helper used by every Start Workout entry point.
 */

import type { SessionExercise, SetData, WorkoutSession } from '@/types/workout-session.types'
import type { WorkoutPlan } from '@/types/plans.types'

export const STALE_SESSION_THRESHOLD_SECONDS = 6 * 60 * 60 // 6 hours

/**
 * Given a session's `started_at` and the current time, compute the elapsed
 * seconds the UI should display. If the computed elapsed exceeds the stale
 * threshold, the caller should reset `started_at` server-side and show 0.
 *
 * Returns `{ elapsedSeconds, needsReset }`. The caller decides what to do
 * with `needsReset` (typically: PATCH the session and zero local state).
 */
export function resolveElapsedForSession(
  startedAtIso: string | null | undefined,
  nowMs: number
): { elapsedSeconds: number; needsReset: boolean } {
  if (!startedAtIso) return { elapsedSeconds: 0, needsReset: false }
  const startedAt = new Date(startedAtIso).getTime()
  if (!Number.isFinite(startedAt)) return { elapsedSeconds: 0, needsReset: false }
  const raw = Math.floor((nowMs - startedAt) / 1000)
  const elapsed = Math.max(0, raw)
  if (elapsed > STALE_SESSION_THRESHOLD_SECONDS) {
    return { elapsedSeconds: 0, needsReset: true }
  }
  return { elapsedSeconds: elapsed, needsReset: false }
}

export interface CompleteSetResult {
  exercises: SessionExercise[]
  rest: { show: boolean; seconds: number; bumpKey: boolean }
}

/**
 * Pure reducer for the "complete / uncomplete a set" flow on the workout
 * session page. Returns the new exercises array plus a rest-timer decision.
 *
 * Rules (FB-05 follow-up):
 *  - Unchecking a completed set leaves the rest timer alone (no show, no bump).
 *  - Completing a set marks it completed + stamps completed_at.
 *  - When all sets of an exercise are done, status flips to 'completed'.
 *  - Rest timer fires on every NEW completion EXCEPT:
 *      • when the exercise being completed is the final exercise AND all its
 *        sets are now done (workout is over)
 *      • when the exercise's rest_seconds is 0 or missing
 *  - Every new completion bumps a rest-reset counter so the timer restarts
 *    from full duration even if duration is unchanged.
 */
export function computeCompleteSetResult(
  exercises: SessionExercise[],
  exIndex: number,
  setIndex: number,
  nowIso: string
): CompleteSetResult {
  const updated = exercises.map((ex, i) => (i === exIndex ? { ...ex, sets: [...ex.sets] } : ex))
  const target = updated[exIndex]
  if (!target) {
    return { exercises, rest: { show: false, seconds: 0, bumpKey: false } }
  }

  const set = target.sets[setIndex]
  if (!set) {
    return { exercises, rest: { show: false, seconds: 0, bumpKey: false } }
  }

  // Uncheck — leaves rest timer alone (AC01.6)
  if (set.completed) {
    target.sets[setIndex] = { ...set, completed: false, completed_at: null } as SetData
    return { exercises: updated, rest: { show: false, seconds: 0, bumpKey: false } }
  }

  // Mark complete
  target.sets[setIndex] = {
    ...set,
    completed: true,
    completed_at: nowIso,
  } as SetData

  if (target.status === 'pending') {
    target.status = 'in_progress'
  }

  const allDone = target.sets.every((s) => s.completed)
  if (allDone) {
    target.status = 'completed'
  }

  const isFinalExercise = exIndex === updated.length - 1
  const workoutDone = allDone && isFinalExercise
  const restSeconds = target.rest_seconds || 0

  if (workoutDone || restSeconds <= 0) {
    return { exercises: updated, rest: { show: false, seconds: 0, bumpKey: false } }
  }

  return {
    exercises: updated,
    rest: { show: true, seconds: restSeconds, bumpKey: true },
  }
}

/**
 * FB-R6-15 — Compute which plan_day_index a calendar date should resolve to.
 *
 * The bug we're fixing: tapping different dates on the Activity calendar all
 * showed the same workout (today's plan_day_index) because the previous
 * implementation used `new Date()` as the anchor instead of the user's
 * tapped date.
 *
 * Direction confirmed by Ved 2026-05-21: cursor-aware date mapping. We
 * anchor on `plan.current_position` (the BE cursor — set by Geo's
 * `advance_to_workout` tool or auto-advanced when sessions complete) for
 * "today" and add the delta in days from today to the selected date. The
 * result wraps around `content.days.length` so multi-week cycles work.
 *
 * Returns -1 when the plan has no days.
 *
 * Pure helper for unit testability. Both args are local-date ISO strings
 * (YYYY-MM-DD) — typically from `todayLocalISO(tz)` and the CalendarStrip's
 * `selectedDate` state, both in the user's IANA timezone (FB-12 convention).
 */
export function computeSelectedPlanDayIndex(
  plan: Pick<WorkoutPlan, 'content' | 'current_position'> | null | undefined,
  selectedDateIso: string,
  todayIso: string
): number {
  const days = plan?.content?.days
  if (!days || days.length === 0) return -1
  const totalDays = days.length
  const cursorBase = plan?.current_position ?? 0
  const selectedMs = new Date(selectedDateIso).getTime()
  const todayMs = new Date(todayIso).getTime()
  if (!Number.isFinite(selectedMs) || !Number.isFinite(todayMs)) {
    // Bad input — fall back to cursor.
    return ((cursorBase % totalDays) + totalDays) % totalDays
  }
  const deltaDays = Math.round((selectedMs - todayMs) / 86400000)
  return ((cursorBase + deltaDays) % totalDays + totalDays) % totalDays
}

/**
 * QA-iter8 (BUG-007 "workouts still tied to days") — the next workout in the
 * program, DECOUPLED from the calendar.
 *
 * Returns the normalized cursor `plan.current_position mod days.length`: the
 * day the user should do NEXT, regardless of today's date. Workouts are a
 * sequence you progress through at your own pace — not a fixed weekly calendar.
 * The Activity "Next up" card uses THIS so the workout shown never changes as
 * the user scrolls the history calendar (the prior bug:
 * computeSelectedPlanDayIndex projected the sequence onto calendar dates, so
 * tomorrow appeared to have a different "scheduled" workout — exactly the
 * day-coupling testers flagged).
 *
 * Returns -1 when the plan has no days. Pure helper for unit testability.
 */
export function nextWorkoutDayIndex(
  plan: Pick<WorkoutPlan, 'content' | 'current_position'> | null | undefined
): number {
  const days = plan?.content?.days
  if (!days || days.length === 0) return -1
  const total = days.length
  const cursor = plan?.current_position ?? 0
  return ((cursor % total) + total) % total
}

/**
 * FB-R6-16+17 — Decide whether a Start Workout entry point should read
 * "Start Workout" or "Resume Workout".
 *
 * The BE-side fix (commit 0f5365a) made POST /v1/workout-sessions idempotent:
 * it returns the existing in-progress session for the same (user, plan,
 * plan_day_index) instead of creating a duplicate. This helper lets the FE
 * preview that behavior so the label matches what the action will actually do.
 *
 * "Resume" only fires when there is an in_progress session whose plan_day_index
 * matches the day the entry point is offering. Off-plan sessions
 * (plan_day_index === null) only match a null `todayPlanDayIndex`.
 *
 * Defaults conservatively to "Start Workout" — if the lookup fails or the
 * caller passes null/undefined, the user sees a Start label and the BE's
 * idempotency is the actual source of truth.
 */
export function deriveWorkoutEntryLabel(
  inProgressSession: WorkoutSession | null | undefined,
  todayPlanDayIndex: number | null
): 'Start Workout' | 'Resume Workout' {
  if (!inProgressSession) return 'Start Workout'
  if (inProgressSession.status !== 'in_progress') return 'Start Workout'
  if (inProgressSession.plan_day_index !== todayPlanDayIndex) return 'Start Workout'
  return 'Resume Workout'
}

/**
 * QA-iter-redesign — guided one-exercise-at-a-time navigation.
 *
 * True when an exercise has at least one set and EVERY set is marked complete.
 */
export function isExerciseComplete(ex: Pick<SessionExercise, 'sets'>): boolean {
  return ex.sets.length > 0 && ex.sets.every((s) => s.completed)
}

/**
 * Index of the next exercise (after `from`) that still has an incomplete set —
 * search forward, then wrap to the start. Returns -1 when every exercise is
 * complete (→ the guided view offers to finish). Drives auto-advance.
 */
export function nextIncompleteExerciseIndex(
  exercises: Pick<SessionExercise, 'sets'>[],
  from: number,
): number {
  const n = exercises.length
  if (n === 0) return -1
  for (let step = 1; step <= n; step++) {
    const i = ((from + step) % n + n) % n
    if (!isExerciseComplete(exercises[i])) return i
  }
  return -1
}

/** Where a (re)opened guided session should land: the first incomplete exercise, else 0. */
export function firstIncompleteExerciseIndex(exercises: Pick<SessionExercise, 'sets'>[]): number {
  const i = exercises.findIndex((e) => !isExerciseComplete(e))
  return i === -1 ? 0 : i
}
