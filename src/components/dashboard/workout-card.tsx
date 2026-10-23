'use client'

import { FeatureCard } from '@/components/ui/fiqr/feature-card'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { computeSelectedPlanDayIndex } from '@/lib/workout-session'
import type { WorkoutPlan } from '@/types/plans.types'

interface WorkoutCardProps {
  workoutPlan: WorkoutPlan | null
  today: string
  onStart: (plan: WorkoutPlan, dayIndex: number) => void
  onSeeProgram: () => void
  onAskGeo: () => void
}

export function WorkoutCard({
  workoutPlan,
  today,
  onStart,
  onSeeProgram,
  onAskGeo,
}: WorkoutCardProps) {
  const dayIndex = workoutPlan
    ? computeSelectedPlanDayIndex(workoutPlan, today, today)
    : -1
  const day = dayIndex >= 0 ? workoutPlan?.content.days?.[dayIndex] : undefined

  let name = 'No program yet'
  let meta = 'Geo can build one from your goals'
  let action = 'Ask Geo'
  let onClick = onAskGeo

  if (workoutPlan && day?.is_rest_day) {
    name = 'Rest day'
    meta = 'Recovery · no session'
    action = 'See program'
    onClick = onSeeProgram
  } else if (workoutPlan && day) {
    const exerciseCount = day.exercises?.length ?? 0
    const duration = Math.max(15, Math.round(exerciseCount * 7.5 / 5) * 5)
    name = day.name || `Day ${dayIndex + 1}`
    meta = `${exerciseCount} exercises · ${duration} min`
    action = 'Start Workout'
    onClick = () => onStart(workoutPlan, dayIndex)
  }

  return (
    <FeatureCard>
      <div className="text-[11.5px] font-semibold uppercase tracking-[1.8px] text-cream-55">Next up</div>
      <div className="mt-[3px] line-clamp-2 text-[28px] font-bold tracking-[-0.6px] leading-[1.1]">{name}</div>
      <div className="mt-[3px] text-[14px] text-cream-60">{meta}</div>
      <SecondaryButton type="button" onNavy arrow className="mt-[18px]" onClick={onClick}>
        {action}
      </SecondaryButton>
    </FeatureCard>
  )
}
