'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { PlanChangelog } from '@/components/plans/plan-changelog'
import { formatDateRange, statusLabel } from '@/components/plans/plan-format'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { activatePlan } from '@/lib/api/plans.api'
import { startWorkoutSession } from '@/lib/api/workout-sessions.api'
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
  const [expanded, setExpanded] = useState<number | null>(null)
  const [startingIdx, setStartingIdx] = useState<number | null>(null)
  const [activating, setActivating] = useState(false)
  const days = plan.content.days ?? []
  async function handleStartWorkout(dayIdx: number) { if (startingIdx !== null) return; setStartingIdx(dayIdx); try { const session = await startWorkoutSession({ plan_id: plan.id, plan_day_index: dayIdx }); router.push(`/train/session?id=${session.id}`) } catch { toast.error('Failed to start workout'); setStartingIdx(null) } }
  async function makeActive() { setActivating(true); try { await activatePlan(plan.id); toast.success('Plan activated'); router.refresh() } catch { toast.error('Failed to activate plan') } finally { setActivating(false) } }

  return <div className="space-y-7">
    <header><div className="flex items-center gap-2"><button type="button" onClick={() => router.back()} aria-label="Back" className="inline-flex h-9 w-9 items-center justify-center text-ink-60"><ChevronLeft className="h-6 w-6" /></button><h1 className="text-[22px] font-semibold text-ink">{plan.content.name || 'Workout Plan'}</h1></div><p className="ml-11 mt-1 text-[13.5px] text-ink-55">{statusLabel(plan.status)} · {formatDateRange(plan.start_date, plan.end_date)}</p></header>
    {plan.content.notes ? <section className="space-y-2.5"><SectionLabel>Notes</SectionLabel><div className="rounded-[16px] border border-ink-12 bg-card p-[14px] text-[15.5px] text-ink-80">{plan.content.notes}</div></section> : null}
    <section className="space-y-2.5"><SectionLabel>Days</SectionLabel>{days.length ? <div className="overflow-hidden rounded-[16px] border border-ink-12 bg-card divide-y divide-ink-09">{days.map((day, index) => {
      const isOpen = expanded === index
      const count = day.exercises?.length ?? 0
      return <div key={`${day.name}-${index}`}>
        <button type="button" aria-label={`${day.name || 'Rest'} day ${index + 1}`} onClick={() => setExpanded(isOpen ? null : index)} className="flex min-h-14 w-full items-center gap-3 px-[14px] py-3 text-left"><span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-08 text-[12px] font-semibold text-ink">{index + 1}</span><span className="min-w-0 flex-1"><span className="block text-[15.5px] font-semibold text-ink">{day.is_rest_day ? 'Rest' : day.name || `Day ${index + 1}`}</span><span className="block text-[13px] text-ink-55">{day.is_rest_day ? 'Recovery day' : `${count} ${count === 1 ? 'exercise' : 'exercises'}`}</span></span>{isOpen ? <ChevronDown className="h-5 w-5 text-ink-50" /> : <ChevronRight className="h-5 w-5 text-ink-50" />}</button>
        {isOpen && !day.is_rest_day ? <div className="border-t border-ink-09 px-[14px] py-3"><div className="divide-y divide-ink-09">{day.exercises?.map((exercise, exerciseIndex) => <div key={`${exercise.name}-${exerciseIndex}`} className="py-3 text-[13.5px] text-ink-62"><span className="font-semibold text-ink">{exercise.name}</span>{formatExerciseDetail(exercise) ? ` · ${formatExerciseDetail(exercise)}` : ''}</div>)}</div><SecondaryButton onNavy={false} className="mt-3" onClick={() => handleStartWorkout(index)} disabled={startingIdx !== null}>{startingIdx === index ? 'Starting…' : 'Start workout'}</SecondaryButton></div> : null}
      </div>
    })}</div> : <div className="rounded-[16px] border border-ink-12 bg-card p-[14px] text-[15.5px] text-ink-50">No workout days yet</div>}</section>
    <PlanChangelog planId={plan.id} />
    <div className="space-y-3"><SecondaryButton onNavy={false} onClick={() => router.push(`/plans/edit?id=${plan.id}`)}>Edit plan</SecondaryButton>{plan.status !== 'active' ? <PrimaryButton onClick={makeActive} disabled={activating}>{activating ? 'Activating…' : 'Make this my plan'}</PrimaryButton> : null}</div>
  </div>
}
