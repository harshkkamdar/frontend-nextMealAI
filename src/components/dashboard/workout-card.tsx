'use client'

import { Moon, Circle, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import type { WorkoutPlan } from '@/types/plans.types'

export function WorkoutCard({ workoutPlan, today }: { workoutPlan: WorkoutPlan | null; today: string }) {
  // Cyclic day matching: use days-since-plan-start modulo total days
  const todayWorkout = (() => {
    if (!workoutPlan?.content?.days?.length) return undefined
    const days = workoutPlan.content.days
    // Try exact date match first
    const exact = days.find((d) => d.date === today || d.date?.startsWith?.(today))
    if (exact) return exact
    // Fall back to cyclic index based on plan start date
    const planStart = workoutPlan.start_date
      ? new Date(workoutPlan.start_date)
      : new Date(workoutPlan.created_at)
    const daysDiff = Math.floor((new Date(today).getTime() - planStart.getTime()) / 86400000)
    const idx = ((daysDiff % days.length) + days.length) % days.length
    return days[idx]
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
    <div className="bg-surface border border-border rounded-2xl p-4">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-2">
        Today&apos;s Workout
      </span>
      <p className="text-base font-semibold text-text-primary mb-3">{todayWorkout.name}</p>
      {todayWorkout.exercises && todayWorkout.exercises.length > 0 && (
        <ul className="space-y-2">
          {todayWorkout.exercises.map((exercise, i) => (
            <li key={i} className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-text-tertiary shrink-0" />
              <span className="text-sm text-text-primary">{exercise.name}</span>
              {exercise.sets != null && exercise.reps != null && (
                <span className="text-xs text-text-secondary tabular-nums ml-auto">
                  {exercise.sets} &times; {exercise.reps}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
