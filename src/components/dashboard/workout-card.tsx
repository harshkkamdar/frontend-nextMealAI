'use client'

import { useState } from 'react'
import { FeatureCard } from '@/components/ui/fiqr/feature-card'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { computeSelectedPlanDayIndex } from '@/lib/workout-session'
import type { WorkoutPlan } from '@/types/plans.types'
import type { WorkoutSession } from '@/types/workout-session.types'
import { plural } from '@/lib/utils'

/** A session left open longer than this is stale on Home (Train still offers to resume or end it). */
const LIVE_SESSION_HOURS = 12

interface WorkoutCardProps {
  workoutPlan: WorkoutPlan | null
  today: string
  /** The open session, if any: the card offers Resume instead of Start. */
  inProgress?: WorkoutSession | null
  onStart: (plan: WorkoutPlan, dayIndex: number) => void
  onResume?: (session: WorkoutSession) => void
  onSeeProgram: () => void
  onAskGeo: () => void
}

/** George's Next Up card (DESIGN.md component 4): navy, the workout name as the largest type, one cream button. */
export function WorkoutCard({ workoutPlan, today, inProgress, onStart, onResume, onSeeProgram, onAskGeo }: WorkoutCardProps) {
  const dayIndex = workoutPlan ? computeSelectedPlanDayIndex(workoutPlan, today, today) : -1
  const day = dayIndex >= 0 ? workoutPlan?.content.days?.[dayIndex] : undefined
  // Read the clock once per mount (render must stay pure).
  const [now] = useState(() => Date.now())
  const live = inProgress && now - new Date(inProgress.started_at).getTime() < LIVE_SESSION_HOURS * 3_600_000 ? inProgress : null

  let eyebrow = 'Next up'
  let name = 'No program yet'
  let meta = 'Geo can build one from your goals'
  let action = 'Ask Geo for a plan'
  let onClick = onAskGeo

  if (live) {
    const started = new Date(live.started_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
    eyebrow = 'In progress'
    name = live.day_name || 'Workout'
    meta = `${plural(live.exercises.length, 'exercise')} · started ${started}`
    action = 'Resume'
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
    action = 'Start Workout'
    onClick = () => onStart(workoutPlan, dayIndex)
  }

  return (
    <FeatureCard aria-label={eyebrow}>
      <p className="text-[11.5px] font-semibold uppercase tracking-[1.8px] text-cream-55">{eyebrow}</p>
      <p className="mt-[3px] line-clamp-2 text-[28px] font-bold leading-[1.1] tracking-[-0.6px] text-cream">{name}</p>
      <p className="mt-[3px] text-[14px] text-cream-60">{meta}</p>
      <SecondaryButton onNavy arrow type="button" onClick={onClick} className="mt-[18px]">{action}</SecondaryButton>
    </FeatureCard>
  )
}
