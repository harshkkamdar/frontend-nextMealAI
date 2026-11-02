'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import { PlanDetailFrame } from '@/components/plans/plan-detail-parts'
import { dayWeekday, nextTrainingDay } from '@/components/plans/plan-format'
import { Busy, CARD, SOFT_BUTTON, SectionHeading } from '@/components/plans/spatial-parts'
import { ChevronRightIcon, PlayFill } from '@/components/ui/fiqr/icons'
import { activatePlan } from '@/lib/api/plans.api'
import { startWorkoutSession } from '@/lib/api/workout-sessions.api'
import { reducedFade, spring } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import type { WorkoutExercise, WorkoutPlan } from '@/types/plans.types'

export function formatExerciseDetail(exercise: Omit<WorkoutExercise, 'reps'> & { reps?: number | string }): string {
  const parts: string[] = []
  const reps = typeof exercise.reps === 'string' ? exercise.reps.replace(/(?<=\d)-(?=\d)/g, '–') : exercise.reps
  if (exercise.sets && reps) parts.push(`${exercise.sets} × ${reps}`)
  else if (exercise.sets) parts.push(`${exercise.sets} sets`)
  else if (reps) parts.push(`${reps} reps`)
  if (exercise.weight != null) parts.push(`${exercise.weight} kg`)
  if (exercise.duration_seconds) parts.push(`${exercise.duration_seconds} s`)
  if (exercise.rest_seconds) parts.push(`${exercise.rest_seconds} s`)
  return parts.join(' · ')
}

/** V2 Training plan view: the plan's next day is marked and open on arrival, with its exercises and Start. */
export function WorkoutPlanDetail({ plan }: { plan: WorkoutPlan }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const days = plan.content.days ?? []
  const next = nextTrainingDay(days, plan.current_position)
  const [expanded, setExpanded] = useState<number | null>(next)
  const [startingIdx, setStartingIdx] = useState<number | null>(null)
  const [activating, setActivating] = useState(false)
  const training = days.filter((day) => !day.is_rest_day)
  const exerciseCount = training.reduce((sum, day) => sum + (day.exercises?.length ?? 0), 0)
  async function handleStartWorkout(dayIdx: number) { if (startingIdx !== null) return; setStartingIdx(dayIdx); try { const session = await startWorkoutSession({ plan_id: plan.id, plan_day_index: dayIdx }); router.push(`/train/session?id=${session.id}`) } catch { toast.error("Couldn't start the workout. Try again."); setStartingIdx(null) } }
  async function makeActive() { setActivating(true); try { await activatePlan(plan.id); toast.success('This is your plan now'); router.refresh() } catch { toast.error("Couldn't make it active. Try again.") } finally { setActivating(false) } }
  // Height never animates: the card and the rows below glide by transform (framer layout), the panel fades.
  const layout = reduce ? { duration: 0 } : spring.glide

  return (
    <PlanDetailFrame plan={plan} kind="Training plan" fallbackTitle="Workout Plan" activating={activating} onActivate={makeActive}>
      <div className={cn(CARD, 'grid grid-cols-3 overflow-hidden')}>
        <Stat value={days.length} label={days.length === 1 ? 'day' : 'days'} />
        <Stat value={training.length} label="training" divided />
        <Stat value={exerciseCount} label={exerciseCount === 1 ? 'exercise' : 'exercises'} divided />
      </div>
      <SectionHeading>Days</SectionHeading>
      {days.length ? (
        <motion.div layout transition={layout} className={cn(CARD, 'relative overflow-hidden')} style={{ borderRadius: 22 }}>
          {days.map((day, index) => {
            const isOpen = expanded === index
            const count = day.exercises?.length ?? 0
            const title = day.is_rest_day ? 'Rest' : day.name || `Day ${index + 1}`
            const tag = dayWeekday(day.date) ?? String(index + 1)
            return (
              <motion.div layout="position" transition={layout} key={`${day.name}-${index}`} className="border-b border-ink-06 last:border-b-0">
                <button
                  type="button"
                  aria-label={`${day.name || 'Rest'} day ${index + 1}`}
                  aria-expanded={day.is_rest_day ? undefined : isOpen}
                  disabled={day.is_rest_day}
                  onClick={() => { void haptic('selection'); setExpanded(isOpen ? null : index) }}
                  className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left enabled:active:bg-ink-04"
                >
                  <span className="w-9 shrink-0 text-caption font-semibold text-ink-65 tabular-nums">{tag}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-body font-bold leading-[22px] ${day.is_rest_day ? 'text-ink-65' : 'text-ink'}`}>{title}</span>
                    <span className="block text-caption leading-[18px] text-ink-65">{day.is_rest_day ? 'Recovery day' : `${count} ${count === 1 ? 'exercise' : 'exercises'}`}</span>
                  </span>
                  {index === next ? <span className="shrink-0 rounded-full bg-ink-06 px-2.5 py-1 text-label text-ink">Next</span> : null}
                  {day.is_rest_day ? null : <ChevronRightIcon aria-hidden="true" className={cn('size-4 shrink-0 text-ink-35 transition-transform duration-200 ease-out', isOpen && 'rotate-90')} />}
                </button>
                <AnimatePresence initial={false} mode="popLayout">
                  {isOpen && !day.is_rest_day ? (
                    <motion.div
                      key="panel"
                      initial={{ opacity: 0, y: reduce ? 0 : -6 }}
                      animate={{ opacity: 1, y: 0, transition: reduce ? reducedFade : { ...spring.glide, opacity: { duration: 0.2, delay: 0.12 } } }}
                      exit={{ opacity: 0, transition: { duration: reduce ? 0.15 : 0.1 } }}
                    >
                      {count ? (
                        <ol>
                          {day.exercises?.map((exercise, exerciseIndex) => (
                            <li key={`${exercise.name}-${exerciseIndex}`} className="flex min-h-14 items-center gap-3 border-t border-ink-09 px-4">
                              <span className="min-w-0 flex-1 text-body-sm text-ink">{exercise.name}</span>
                              {formatExerciseDetail(exercise) ? <span className="shrink-0 whitespace-nowrap text-caption text-ink-65 tabular-nums">{formatExerciseDetail(exercise)}</span> : null}
                            </li>
                          ))}
                        </ol>
                      ) : null}
                      <button type="button" onClick={() => handleStartWorkout(index)} disabled={startingIdx !== null} aria-busy={startingIdx === index || undefined} className={`${SOFT_BUTTON} mx-4 mb-4 mt-1 max-w-[calc(100%-2rem)]`}>
                        {startingIdx === index ? <Busy>Starting {title}</Busy> : <><PlayFill className="size-4" aria-hidden="true" />Start {title}</>}
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        <div className="flex min-h-11 w-full items-center justify-center text-[15px] font-semibold text-ink-65 active:opacity-60">
          <span><span className="block text-center">No workout days yet</span><span className="block text-center">Edit the plan to add some, or ask Geo</span></span>
        </div>
      )}
    </PlanDetailFrame>
  )
}

function Stat({ value, label, divided }: { value: number; label: string; divided?: boolean }) {
  return (
    <div className={cn('px-4 py-3', divided && 'border-l border-ink-06')}>
      <span className="block text-[20px] font-[750] leading-none tracking-[-0.015em] text-ink tabular-nums">{value}</span>
      <span className="mt-1 block text-label leading-4 text-ink-65">{label}</span>
    </div>
  )
}
