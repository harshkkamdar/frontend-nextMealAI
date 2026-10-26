'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import { CARD } from '@/components/plans/plan-overview-card'
import { PlanDetailFrame, SectionTitle } from '@/components/plans/plan-detail-parts'
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

export function WorkoutPlanDetail({ plan }: { plan: WorkoutPlan }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [expanded, setExpanded] = useState<number | null>(null)
  const [startingIdx, setStartingIdx] = useState<number | null>(null)
  const [activating, setActivating] = useState(false)
  const days = plan.content.days ?? []
  const training = days.filter((day) => !day.is_rest_day)
  const exerciseCount = training.reduce((sum, day) => sum + (day.exercises?.length ?? 0), 0)
  async function handleStartWorkout(dayIdx: number) { if (startingIdx !== null) return; setStartingIdx(dayIdx); try { const session = await startWorkoutSession({ plan_id: plan.id, plan_day_index: dayIdx }); router.push(`/train/session?id=${session.id}`) } catch { toast.error("Couldn't start the workout. Try again."); setStartingIdx(null) } }
  async function makeActive() { setActivating(true); try { await activatePlan(plan.id); toast.success('This is your plan now'); router.refresh() } catch { toast.error("Couldn't make it active. Try again.") } finally { setActivating(false) } }
  // Height never animates: the card and the rows below glide by transform (framer layout), the panel fades.
  const layout = reduce ? { duration: 0 } : spring.glide

  return (
    <PlanDetailFrame plan={plan} kind="Training plan" fallbackTitle="Workout Plan" activating={activating} onActivate={makeActive}>
      <div className="grid grid-cols-3 gap-[10px]">
        <Stat value={days.length} label={days.length === 1 ? 'day' : 'days'} />
        <Stat value={training.length} label="training" />
        <Stat value={exerciseCount} label={exerciseCount === 1 ? 'exercise' : 'exercises'} />
      </div>
      <SectionTitle>Days</SectionTitle>
      {days.length ? (
          <motion.div layout transition={layout} className={cn(CARD, 'relative overflow-hidden')} style={{ borderRadius: 24 }}>
            {days.map((day, index) => {
              const isOpen = expanded === index
              const count = day.exercises?.length ?? 0
              const title = day.is_rest_day ? 'Rest' : day.name || `Day ${index + 1}`
              return (
                <motion.div layout="position" transition={layout} key={`${day.name}-${index}`} className="border-b border-ink-06 last:border-b-0">
                  <button
                    type="button"
                    aria-label={`${day.name || 'Rest'} day ${index + 1}`}
                    aria-expanded={day.is_rest_day ? undefined : isOpen}
                    disabled={day.is_rest_day}
                    onClick={() => { void haptic('selection'); setExpanded(isOpen ? null : index) }}
                    className="flex min-h-16 w-full items-center gap-3 px-5 py-3 text-left enabled:active:bg-ink-04"
                  >
                    <span className={cn('grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-bold tabular-nums', day.is_rest_day ? 'bg-ink-04 text-ink-65' : 'bg-ink text-cream')}>{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15.5px] font-semibold text-ink">{title}</span>
                      <span className="block text-[13px] text-ink-65">{day.is_rest_day ? 'Recovery day' : `${count} ${count === 1 ? 'exercise' : 'exercises'}`}</span>
                    </span>
                    {day.is_rest_day ? null : <ChevronRightIcon aria-hidden="true" className={cn('size-4 shrink-0 text-ink-35 transition-transform duration-200 ease-out', isOpen && 'rotate-90')} />}
                  </button>
                  <AnimatePresence initial={false} mode="popLayout">
                    {isOpen && !day.is_rest_day ? (
                      <motion.div
                        key="panel"
                        initial={{ opacity: 0, y: reduce ? 0 : -6 }}
                        animate={{ opacity: 1, y: 0, transition: reduce ? reducedFade : { ...spring.glide, opacity: { duration: 0.2, delay: 0.12 } } }}
                        exit={{ opacity: 0, transition: { duration: reduce ? 0.15 : 0.1 } }}
                        className="px-5 pb-4"
                      >
                        <ol className="rounded-[16px] bg-ink-04">
                          {day.exercises?.map((exercise, exerciseIndex) => (
                            <li key={`${exercise.name}-${exerciseIndex}`} className="flex min-h-12 items-center gap-3 border-b border-ink-06 px-4 py-2.5 last:border-b-0">
                              <span className="min-w-0 flex-1 text-[15px] font-semibold text-ink">{exercise.name}</span>
                              {formatExerciseDetail(exercise) ? <span className="shrink-0 text-[13.5px] text-ink-65 tabular-nums">{formatExerciseDetail(exercise)}</span> : null}
                            </li>
                          ))}
                        </ol>
                        <button
                          type="button"
                          onClick={() => handleStartWorkout(index)}
                          disabled={startingIdx !== null}
                          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[16px] font-semibold text-cream transition-transform active:scale-[.97] disabled:opacity-60"
                        >
                          <PlayFill className="size-4" aria-hidden="true" />
                          {startingIdx === index ? 'Starting…' : 'Start workout'}
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </motion.div>
      ) : (
        <div className="flex min-h-16 items-center rounded-[24px] border-[1.5px] border-dashed border-ink-20 px-5 text-[15px] font-semibold text-ink-65">No workout days yet</div>
      )}
    </PlanDetailFrame>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[22px] bg-card px-4 py-3.5 shadow-[var(--shadow-card)]">
      <span className="font-wide block text-[26px] font-bold leading-none tracking-[-0.5px] text-ink tabular-nums">{value}</span>
      <span className="mt-1 block text-[13px] font-semibold text-ink-65">{label}</span>
    </div>
  )
}
