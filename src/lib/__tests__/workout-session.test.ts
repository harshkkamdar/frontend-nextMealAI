import { describe, it, expect } from 'vitest'
import {
  resolveElapsedForSession,
  computeCompleteSetResult,
  computeSelectedPlanDayIndex,
  nextWorkoutDayIndex,
  deriveWorkoutEntryLabel,
  STALE_SESSION_THRESHOLD_SECONDS,
} from '../workout-session'
import type { SessionExercise, WorkoutSession } from '@/types/workout-session.types'
import type { WorkoutPlan } from '@/types/plans.types'

function makeSet(overrides: Partial<SessionExercise['sets'][number]> = {}) {
  return {
    set_number: 1,
    planned_reps: 8,
    planned_weight_kg: 50,
    actual_reps: null,
    actual_weight_kg: null,
    completed: false,
    completed_at: null,
    ...overrides,
  }
}

function makeExercise(overrides: Partial<SessionExercise> = {}): SessionExercise {
  return {
    name: 'Squat',
    muscle_group: 'Legs',
    planned_sets: 3,
    planned_reps: 8,
    rest_seconds: 90,
    status: 'pending',
    sets: [makeSet({ set_number: 1 }), makeSet({ set_number: 2 }), makeSet({ set_number: 3 })],
    ...overrides,
  }
}

describe('FB-05 resolveElapsedForSession (AC01.1, AC01.2)', () => {
  const NOW = new Date('2026-04-15T23:00:00.000Z').getTime()

  it('returns fresh elapsed when started_at is recent', () => {
    const started = new Date(NOW - 120 * 1000).toISOString()
    const result = resolveElapsedForSession(started, NOW)
    expect(result.needsReset).toBe(false)
    expect(result.elapsedSeconds).toBe(120)
  })

  it('returns needsReset when started_at is older than 6h', () => {
    const started = new Date(NOW - (STALE_SESSION_THRESHOLD_SECONDS + 100) * 1000).toISOString()
    const result = resolveElapsedForSession(started, NOW)
    expect(result.needsReset).toBe(true)
    expect(result.elapsedSeconds).toBe(0)
  })

  it('returns 0 elapsed when started_at is exactly at the threshold boundary', () => {
    // Exactly at the threshold — should NOT reset (needs to exceed)
    const started = new Date(NOW - STALE_SESSION_THRESHOLD_SECONDS * 1000).toISOString()
    const result = resolveElapsedForSession(started, NOW)
    expect(result.needsReset).toBe(false)
    expect(result.elapsedSeconds).toBe(STALE_SESSION_THRESHOLD_SECONDS)
  })

  it('handles missing started_at gracefully', () => {
    expect(resolveElapsedForSession(null, NOW)).toEqual({ elapsedSeconds: 0, needsReset: false })
    expect(resolveElapsedForSession(undefined, NOW)).toEqual({ elapsedSeconds: 0, needsReset: false })
  })

  it('handles invalid started_at gracefully', () => {
    expect(resolveElapsedForSession('not-a-date', NOW)).toEqual({ elapsedSeconds: 0, needsReset: false })
  })

  it('handles future started_at as 0 elapsed (clock skew)', () => {
    const started = new Date(NOW + 60_000).toISOString()
    const result = resolveElapsedForSession(started, NOW)
    expect(result.elapsedSeconds).toBe(0)
    expect(result.needsReset).toBe(false)
  })

  it('reproduces the live bug: 10051 minutes reads as needsReset', () => {
    // The bug screenshot showed 10051:10 which is ~7 days elapsed
    const started = new Date(NOW - 10051 * 60 * 1000 - 10 * 1000).toISOString()
    const result = resolveElapsedForSession(started, NOW)
    expect(result.needsReset).toBe(true)
    expect(result.elapsedSeconds).toBe(0)
  })
})

describe('FB-05 computeCompleteSetResult (AC01.4, AC01.6, AC01.7, AC01.8, AC01.9, AC01.14)', () => {
  const NOW_ISO = '2026-04-15T23:00:00.000Z'

  it('AC01.7 last set of NON-final exercise fires rest timer', () => {
    const exercises = [
      makeExercise({
        sets: [
          makeSet({ set_number: 1, completed: true, completed_at: NOW_ISO }),
          makeSet({ set_number: 2, completed: true, completed_at: NOW_ISO }),
          makeSet({ set_number: 3 }),
        ],
      }),
      makeExercise({ name: 'Bench Press', rest_seconds: 60 }),
    ]
    const result = computeCompleteSetResult(exercises, 0, 2, NOW_ISO)
    expect(result.rest.show).toBe(true)
    expect(result.rest.seconds).toBe(90) // exercise 0's rest_seconds
    expect(result.rest.bumpKey).toBe(true)
    expect(result.exercises[0].status).toBe('completed')
  })

  it('AC01.8 last set of FINAL exercise does NOT fire rest timer', () => {
    const exercises = [
      makeExercise({
        name: 'Bench',
        status: 'completed',
        sets: [
          makeSet({ set_number: 1, completed: true, completed_at: NOW_ISO }),
          makeSet({ set_number: 2, completed: true, completed_at: NOW_ISO }),
          makeSet({ set_number: 3, completed: true, completed_at: NOW_ISO }),
        ],
      }),
      makeExercise({
        name: 'Squat',
        sets: [
          makeSet({ set_number: 1, completed: true, completed_at: NOW_ISO }),
          makeSet({ set_number: 2, completed: true, completed_at: NOW_ISO }),
          makeSet({ set_number: 3 }),
        ],
      }),
    ]
    const result = computeCompleteSetResult(exercises, 1, 2, NOW_ISO)
    expect(result.rest.show).toBe(false)
    expect(result.exercises[1].status).toBe('completed')
  })

  it('AC01.9 single-set exercise (non-final) fires rest timer', () => {
    const exercises = [
      makeExercise({ sets: [makeSet({ set_number: 1 })] }),
      makeExercise(),
    ]
    const result = computeCompleteSetResult(exercises, 0, 0, NOW_ISO)
    expect(result.rest.show).toBe(true)
    expect(result.exercises[0].status).toBe('completed')
  })

  it('AC01.14 rest_seconds = 0 skips rest timer entirely', () => {
    const exercises = [
      makeExercise({ rest_seconds: 0 }),
      makeExercise(),
    ]
    const result = computeCompleteSetResult(exercises, 0, 0, NOW_ISO)
    expect(result.rest.show).toBe(false)
  })

  it('AC01.6 unchecking a completed set leaves rest timer alone', () => {
    const exercises = [
      makeExercise({
        sets: [makeSet({ set_number: 1, completed: true, completed_at: NOW_ISO }), makeSet({ set_number: 2 })],
      }),
      makeExercise(),
    ]
    const result = computeCompleteSetResult(exercises, 0, 0, NOW_ISO)
    expect(result.rest.show).toBe(false)
    expect(result.rest.bumpKey).toBe(false)
    expect(result.exercises[0].sets[0].completed).toBe(false)
  })

  it('AC01.4 every completion bumps bumpKey (tick-ahead loophole guardrail)', () => {
    const base = [
      makeExercise(),
      makeExercise(),
    ]
    const first = computeCompleteSetResult(base, 0, 0, NOW_ISO)
    expect(first.rest.show).toBe(true)
    expect(first.rest.bumpKey).toBe(true)

    const second = computeCompleteSetResult(first.exercises, 0, 1, NOW_ISO)
    expect(second.rest.show).toBe(true)
    expect(second.rest.bumpKey).toBe(true) // CRITICAL: bump even though duration is the same
    expect(second.rest.seconds).toBe(first.rest.seconds)
  })

  it('completing a set on a pending exercise transitions it to in_progress', () => {
    const exercises = [makeExercise(), makeExercise()]
    const result = computeCompleteSetResult(exercises, 0, 0, NOW_ISO)
    expect(result.exercises[0].status).toBe('in_progress')
  })

  it('handles out-of-bounds exIndex gracefully', () => {
    const exercises = [makeExercise()]
    const result = computeCompleteSetResult(exercises, 5, 0, NOW_ISO)
    expect(result.exercises).toBe(exercises) // unchanged reference
    expect(result.rest.show).toBe(false)
  })

  it('handles out-of-bounds setIndex gracefully', () => {
    const exercises = [makeExercise()]
    const result = computeCompleteSetResult(exercises, 0, 99, NOW_ISO)
    expect(result.rest.show).toBe(false)
  })
})

// FB-R6-16+17 · Resume label + state on Start Workout
//
// BE shipped 2026-05-21 (0f5365a): POST /v1/workout-sessions returns 200 with
// the existing session when an in_progress session for the same (user, plan,
// plan_day_index) already exists; 201 with a new session otherwise.
//
// FE side: when the user has an in-progress session for today's plan_day_index,
// the action label must read "Resume Workout" instead of "Start Workout".
// `deriveWorkoutEntryLabel` is a pure helper so each entry point (activity
// page, plan detail, dashboard quick-action) can reuse the same decision.
function makeInProgressSession(planDayIndex: number | null): WorkoutSession {
  return {
    id: 'session-1',
    user_id: 'user-1',
    plan_id: 'plan-1',
    plan_day_index: planDayIndex,
    day_name: 'Day 1',
    status: 'in_progress',
    started_at: new Date().toISOString(),
    completed_at: null,
    exercises: [],
    total_volume_kg: 0,
    duration_minutes: 0,
    notes: null,
    created_at: new Date().toISOString(),
  }
}

describe('FB-R6-16+17 · deriveWorkoutEntryLabel', () => {
  it('AC01: returns "Resume Workout" when in-progress session matches today plan_day_index', () => {
    const inProgress = makeInProgressSession(2)
    expect(deriveWorkoutEntryLabel(inProgress, 2)).toBe('Resume Workout')
  })

  it('AC03: returns "Start Workout" when there is no in-progress session', () => {
    expect(deriveWorkoutEntryLabel(null, 2)).toBe('Start Workout')
  })

  it('AC03b: returns "Start Workout" when in-progress session is for a different plan_day_index', () => {
    const inProgress = makeInProgressSession(1)
    expect(deriveWorkoutEntryLabel(inProgress, 2)).toBe('Start Workout')
  })

  it('AC09: returns "Start Workout" when today is unmapped (null plan_day_index) and no session exists', () => {
    expect(deriveWorkoutEntryLabel(null, null)).toBe('Start Workout')
  })

  it('handles in-progress session with null plan_day_index — only matches when today is also null (off-plan workout)', () => {
    const inProgress = makeInProgressSession(null)
    expect(deriveWorkoutEntryLabel(inProgress, 2)).toBe('Start Workout')
    expect(deriveWorkoutEntryLabel(inProgress, null)).toBe('Resume Workout')
  })

  it('ignores sessions that are not in_progress (already completed/abandoned)', () => {
    const completed: WorkoutSession = {
      ...makeInProgressSession(2),
      status: 'completed',
    }
    expect(deriveWorkoutEntryLabel(completed, 2)).toBe('Start Workout')
  })
})

// FB-R6-15 — Calendar date → plan_day_index mapping.
// Repro Ved confirmed 2026-05-21: tapping different dates on the Activity
// calendar all showed the same workout (today's Push 1). Root cause: previous
// implementation used `new Date()` as anchor instead of the user-tapped date.
// Direction confirmed Ved: cursor-aware (uses plan.current_position from
// migration 025 / FB-R6-12) + day-delta from today.
function makePlan(opts: {
  cursor?: number
  dayNames?: string[]
}): WorkoutPlan {
  const days = (opts.dayNames ?? ['Push 1', 'Pull 1', 'Legs 1', 'Push 2', 'Pull 2', 'Legs 2', 'Rest']).map(
    (name) => ({ date: '', name, is_rest_day: name === 'Rest' })
  )
  return {
    id: 'p1',
    user_id: 'u1',
    type: 'workout',
    status: 'active',
    current_position: opts.cursor ?? 0,
    content: { name: '6-day PPL', days },
    created_at: '2026-05-21T00:00:00Z',
    updated_at: '2026-05-21T00:00:00Z',
  }
}

describe('FB-R6-15 · computeSelectedPlanDayIndex', () => {
  const TODAY = '2026-05-21'

  it('returns cursor for today (delta = 0)', () => {
    const plan = makePlan({ cursor: 0 })
    expect(computeSelectedPlanDayIndex(plan, TODAY, TODAY)).toBe(0)
  })

  it('cursor=0: tomorrow → day 1', () => {
    const plan = makePlan({ cursor: 0 })
    expect(computeSelectedPlanDayIndex(plan, '2026-05-22', TODAY)).toBe(1)
  })

  it('cursor=0: 2 days from today → day 2', () => {
    const plan = makePlan({ cursor: 0 })
    expect(computeSelectedPlanDayIndex(plan, '2026-05-23', TODAY)).toBe(2)
  })

  it('Ved repro: 6-day PPL with cursor=0, Thu/Fri/Sat = Push 1 / Pull 1 / Legs 1', () => {
    const plan = makePlan({ cursor: 0 })
    const days = plan.content.days!
    expect(days[computeSelectedPlanDayIndex(plan, '2026-05-21', TODAY)].name).toBe('Push 1')
    expect(days[computeSelectedPlanDayIndex(plan, '2026-05-22', TODAY)].name).toBe('Pull 1')
    expect(days[computeSelectedPlanDayIndex(plan, '2026-05-23', TODAY)].name).toBe('Legs 1')
  })

  it('respects cursor=2 (FB-R6-12 already advanced): today shows Legs 1', () => {
    const plan = makePlan({ cursor: 2 })
    expect(plan.content.days![computeSelectedPlanDayIndex(plan, TODAY, TODAY)].name).toBe('Legs 1')
  })

  it('cursor=2: tomorrow → Push 2 (cursor + 1)', () => {
    const plan = makePlan({ cursor: 2 })
    expect(plan.content.days![computeSelectedPlanDayIndex(plan, '2026-05-22', TODAY)].name).toBe('Push 2')
  })

  it('wraps via positive modulo across the week boundary', () => {
    const plan = makePlan({ cursor: 0 }) // 7 days
    // 7 days out → wraps back to day 0
    expect(computeSelectedPlanDayIndex(plan, '2026-05-28', TODAY)).toBe(0)
    // 8 days out → day 1
    expect(computeSelectedPlanDayIndex(plan, '2026-05-29', TODAY)).toBe(1)
  })

  it('handles past dates (negative delta) via positive modulo', () => {
    const plan = makePlan({ cursor: 0 })
    // Yesterday → wraps to last day
    expect(computeSelectedPlanDayIndex(plan, '2026-05-20', TODAY)).toBe(6)
    expect(computeSelectedPlanDayIndex(plan, '2026-05-19', TODAY)).toBe(5)
  })

  it('returns -1 when the plan has no days', () => {
    const plan = { content: { days: [] }, current_position: 0 } as unknown as WorkoutPlan
    expect(computeSelectedPlanDayIndex(plan, TODAY, TODAY)).toBe(-1)
  })

  it('returns -1 when plan is null/undefined', () => {
    expect(computeSelectedPlanDayIndex(null, TODAY, TODAY)).toBe(-1)
    expect(computeSelectedPlanDayIndex(undefined, TODAY, TODAY)).toBe(-1)
  })

  it('falls back to cursor when current_position is missing (pre-migration-025 plans)', () => {
    const plan = makePlan({})
    delete plan.current_position
    // current_position undefined → defaults to 0
    expect(computeSelectedPlanDayIndex(plan, TODAY, TODAY)).toBe(0)
  })
})

// QA-iter8 (BUG-007) — the Next-up workout is the cursor, DECOUPLED from any
// calendar date. Unlike computeSelectedPlanDayIndex it takes no date at all:
// "what should I do next" never depends on what day it is.
describe('QA-iter8 · nextWorkoutDayIndex (BUG-007 decouple)', () => {
  it('returns the cursor regardless of date', () => {
    expect(nextWorkoutDayIndex(makePlan({ cursor: 0 }))).toBe(0)
    expect(nextWorkoutDayIndex(makePlan({ cursor: 2 }))).toBe(2)
    expect(nextWorkoutDayIndex(makePlan({ cursor: 5 }))).toBe(5)
  })

  it('wraps a cursor that exceeds days.length via positive modulo', () => {
    // 7-day plan, cursor 9 → 9 % 7 = 2
    expect(nextWorkoutDayIndex(makePlan({ cursor: 9 }))).toBe(2)
  })

  it('defaults to 0 when current_position is missing (pre-migration-025 plans)', () => {
    const plan = makePlan({})
    delete plan.current_position
    expect(nextWorkoutDayIndex(plan)).toBe(0)
  })

  it('returns -1 for a plan with no days, or null/undefined', () => {
    const empty = { content: { days: [] }, current_position: 0 } as unknown as WorkoutPlan
    expect(nextWorkoutDayIndex(empty)).toBe(-1)
    expect(nextWorkoutDayIndex(null)).toBe(-1)
    expect(nextWorkoutDayIndex(undefined)).toBe(-1)
  })
})
