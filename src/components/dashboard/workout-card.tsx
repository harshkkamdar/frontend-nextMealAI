'use client'

import { PlayFill } from '@/components/ui/fiqr/icons'
import { computeSelectedPlanDayIndex } from '@/lib/workout-session'
import type { WorkoutPlan } from '@/types/plans.types'
import { plural } from '@/lib/utils'

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
    meta = `${plural(exerciseCount, 'exercise')} · ${duration} min`
    action = 'Start Workout'
    onClick = () => onStart(workoutPlan, dayIndex)
  }

  const starts = action === 'Start Workout'

  return (
    <section className="flex items-center gap-4 rounded-[24px] bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink-65">Next up</p>
        <p className="font-wide mt-1 line-clamp-2 text-[22px] font-bold leading-[1.15] tracking-[-0.3px] text-ink">{name}</p>
        <p className="mt-1 text-[14px] text-ink-65">{meta}</p>
      </div>
      {starts ? (
        <button
          type="button"
          aria-label={action}
          onClick={onClick}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-ink text-cream transition-transform active:scale-[.94]"
        >
          <PlayFill className="ml-0.5 size-6" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="h-11 shrink-0 rounded-full bg-ink-06 px-4 text-[14px] font-semibold text-ink transition-transform active:scale-[.97]"
        >
          {action}
        </button>
      )}
    </section>
  )
}
