'use client'

import { Moon, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import type { WorkoutPlan } from '@/types/plans.types'
import { computeSelectedPlanDayIndex } from '@/lib/workout-session'

/**
 * FB-R6.7 — render exercise's per-set detail safely. Plank-style exercises
 * store duration_seconds and may carry a sentinel `reps: -1` (legacy data
 * from when BE allowed negative reps; tightened in 2026-06 but old plans
 * still float around). Defensive: treat reps <= 0 as missing and prefer
 * duration_seconds when present.
 */
function formatSetsRepsOrDuration(exercise: {
  sets?: number
  reps?: number
  duration_seconds?: number
}): string | null {
  const validReps = typeof exercise.reps === 'number' && exercise.reps > 0
  const validDuration =
    typeof exercise.duration_seconds === 'number' && exercise.duration_seconds > 0
  const validSets = typeof exercise.sets === 'number' && exercise.sets > 0

  if (validSets && validReps) {
    return `${exercise.sets} × ${exercise.reps}`
  }
  if (validDuration) {
    const total = exercise.duration_seconds!
    const mins = Math.floor(total / 60)
    const secs = total % 60
    const dur = mins > 0 ? `${mins}m${secs > 0 ? ` ${secs}s` : ''}` : `${secs}s`
    return validSets ? `${exercise.sets} × ${dur}` : dur
  }
  if (validSets) return `${exercise.sets} sets`
  if (validReps) return `${exercise.reps} reps`
  return null
}

export function WorkoutCard({ workoutPlan, today }: { workoutPlan: WorkoutPlan | null; today: string }) {
  // FB-R6.7 — cursor-aware day index. Previously the card used a calendar-
  // modulo computation from plan.start_date which ignored plan.current_position
  // (the BE cursor Geo's advance_to_workout moves). After any Geo "skip to
  // tomorrow's day" the dashboard fell out of sync with Activity. Use the
  // shared helper so both surfaces resolve "today" identically.
  const todayWorkout = (() => {
    if (!workoutPlan?.content?.days?.length) return undefined
    // FB-R6.7 follow-up: the previous "exact calendar-date match" fallback
    // matched stale `day.date` values when the cursor had moved (Geo's
    // advance_to_workout). Cursor is the single source of truth — mirrors
    // Activity exactly so both surfaces always agree on today's workout.
    const idx = computeSelectedPlanDayIndex(workoutPlan, today, today)
    if (idx < 0) return undefined
    return workoutPlan.content.days[idx]
  })()

  if (!workoutPlan) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-2">
          Today&apos;s Workout
        </span>
        <div className="flex items-center gap-2 text-text-tertiary">
          <Dumbbell className="w-5 h-5" />
          <p className="text-sm text-text-secondary">No workout plan yet</p>
        </div>
        <Link
          href="/chat"
          className="inline-flex items-center mt-3 text-xs font-medium text-accent"
        >
          Ask Geo to create one
        </Link>
      </div>
    )
  }

  if (!todayWorkout) {
    // Plan exists but nothing scheduled for today (could be a rest day or off-plan day)
    return (
      <div className="bg-surface border border-border rounded-2xl p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-2">
          Today&apos;s Workout
        </span>
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-purple" />
          <p className="text-sm text-text-secondary">No workout scheduled today</p>
        </div>
      </div>
    )
  }

  if (todayWorkout.is_rest_day) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-2">
          Today&apos;s Workout
        </span>
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-purple" />
          <p className="text-base font-semibold text-text-primary">Rest day</p>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Recovery is part of the plan. Take it easy today.
        </p>
      </div>
    )
  }

  return (
    <Link
      href="/activity"
      className="block active:scale-[0.98] transition-transform"
      aria-label={`Open today's workout: ${todayWorkout.name}`}
    >
      <div className="bg-surface border border-border rounded-2xl p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-2">
          Today&apos;s Workout
        </span>
        <p className="text-base font-semibold text-text-primary mb-3">{todayWorkout.name}</p>
        {todayWorkout.exercises && todayWorkout.exercises.length > 0 && (
          <ul className="space-y-2">
            {todayWorkout.exercises.map((exercise, i) => {
              const detail = formatSetsRepsOrDuration(exercise as any)
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-text-tertiary shrink-0" aria-hidden="true" />
                  <span className="text-sm text-text-primary">{exercise.name}</span>
                  {detail && (
                    <span className="text-xs text-text-secondary tabular-nums ml-auto">
                      {detail}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Link>
  )
}
