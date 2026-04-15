/**
 * FB-05 rest-timer-bugs — pure helpers extracted from the workout session page
 * so the bug-prone logic can be unit tested without mounting the Next.js page.
 */

import type { SessionExercise, SetData } from '@/types/workout-session.types'

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
