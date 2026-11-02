'use client'

import { useState } from 'react'
import { FeatureCard } from '@/components/ui/fiqr/feature-card'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { computeSelectedPlanDayIndex } from '@/lib/workout-session'
import type { WorkoutPlan } from '@/types/plans.types'
import type { WorkoutSession } from '@/types/workout-session.types'
import { plural } from '@/lib/utils'

/** A session open longer than this is stale: it reads "Unfinished since" and offers to end it. */
const STALE_SESSION_HOURS = 12

interface WorkoutCardProps {
  workoutPlan: WorkoutPlan | null
  today: string
  /** The open session, if any: the card offers Resume instead of Start. */
  inProgress?: WorkoutSession | null
  onStart: (plan: WorkoutPlan, dayIndex: number) => void
  onResume?: (session: WorkoutSession) => void
  /** Ends a stale session (abandon) so the plan's next day comes back. */
  onDiscard?: (session: WorkoutSession) => void
  onSeeProgram: () => void
  onAskGeo: () => void
}

/** George's Next Up card (DESIGN.md component 4): navy, the workout name as the largest type, one cream button. */
export function WorkoutCard({ workoutPlan, today, inProgress, onStart, onResume, onDiscard, onSeeProgram, onAskGeo }: WorkoutCardProps) {
  const dayIndex = workoutPlan ? computeSelectedPlanDayIndex(workoutPlan, today, today) : -1
  const day = dayIndex >= 0 ? workoutPlan?.content.days?.[dayIndex] : undefined
  // Read the clock once per mount (render must stay pure).
  const [now] = useState(() => Date.now())
  const live = inProgress ?? null
  const stale = !!live && now - new Date(live.started_at).getTime() > STALE_SESSION_HOURS * 3_600_000

  let eyebrow = 'Next up'
  let name = 'No program yet'
  let meta = 'Geo can build one from your goals'
  let action = 'Ask Geo for a plan'
  let onClick = onAskGeo

  if (live) {
    const sets = live.exercises.flatMap((exercise) => exercise.sets)
    const started = new Date(live.started_at)
    eyebrow = stale ? `Unfinished since ${started.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}` : 'In progress'
    name = live.day_name || 'Workout'
    meta = `${sets.filter((set) => set.completed).length} of ${plural(sets.length, 'set')} done`
    action = 'Resume workout'
    onClick = () => onResume?.(live)
  } else if (workoutPlan && day?.is_rest_day) {
    name = 'Rest day'
    meta = 'Recovery today, no session'
    action = 'See program'
    onClick = onSeeProgram
  } else if (workoutPlan && day) {
    const exerciseCount = day.exercises?.length ?? 0
    const duration = Math.max(15, Math.round(exerciseCount * 7.5 / 5) * 5)
    name = day.name || `Day ${dayIndex + 1}`
    meta = `${plural(exerciseCount, 'exercise')} · ${duration} min`
    action = 'Start workout'
    onClick = () => onStart(workoutPlan, dayIndex)
  }

  return (
    <FeatureCard aria-label={eyebrow}>
      <p className="text-[11.5px] font-semibold uppercase tracking-[1.8px] text-cream-55">{eyebrow}</p>
      <p className="mt-[3px] line-clamp-2 text-[28px] font-bold leading-[1.1] tracking-[-0.6px] text-cream">{name}</p>
      <p className="mt-[3px] text-[14px] text-cream-60">{meta}</p>
      <SecondaryButton onNavy arrow type="button" onClick={onClick} className="mt-[18px]">{action}</SecondaryButton>
      {live && stale && onDiscard ? (
        <button type="button" onClick={() => onDiscard(live)} className="-mb-2 mt-2 flex min-h-11 w-full items-center justify-center text-[15px] font-semibold text-cream-60 active:opacity-60">
          End it and start fresh
        </button>
      ) : null}
    </FeatureCard>
  )
}
