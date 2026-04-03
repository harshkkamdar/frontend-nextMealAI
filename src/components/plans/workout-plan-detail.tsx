'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Moon, Play } from 'lucide-react'
import { toast } from 'sonner'
import type { WorkoutPlan, PlanStatus } from '@/types/plans.types'
import { formatDate } from '@/lib/utils'
import { PlanChangelog } from '@/components/plans/plan-changelog'
import { startWorkoutSession } from '@/lib/api/workout-sessions.api'

const STATUS_STYLES: Record<PlanStatus, string> = {
  active: 'bg-[#34C759]/10 text-[#34C759]',
  draft: 'bg-surface text-text-secondary',
  superseded: 'bg-surface text-text-tertiary',
  completed: 'bg-[#3B82F6]/10 text-[#3B82F6]',
}

function formatDayDate(dateStr: string | undefined, fallbackIndex?: number): string {
  if (!dateStr) return fallbackIndex !== undefined ? `Day ${fallbackIndex + 1}` : 'Day'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return fallbackIndex !== undefined ? `Day ${fallbackIndex + 1}` : 'Day'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return 'No dates set'
  const fmt = (d: string) => formatDate(new Date(d))
  if (start && end) return `${fmt(start)} - ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

function formatExerciseDetail(exercise: { sets?: number; reps?: number; weight?: number; duration_seconds?: number }): string {
  const parts: string[] = []
  if (exercise.sets != null && exercise.reps != null) {
    parts.push(`${exercise.sets}x${exercise.reps}`)
  } else if (exercise.sets != null) {
    parts.push(`${exercise.sets} sets`)
  } else if (exercise.reps != null) {
    parts.push(`${exercise.reps} reps`)
  }
  if (exercise.weight != null) {
    parts.push(`${exercise.weight} kg`)
  }
  if (exercise.duration_seconds != null) {
    const mins = Math.floor(exercise.duration_seconds / 60)
    const secs = exercise.duration_seconds % 60
    parts.push(mins > 0 ? `${mins}m${secs > 0 ? ` ${secs}s` : ''}` : `${secs}s`)
  }
  return parts.join(' / ')
}

export function WorkoutPlanDetail({ plan }: { plan: WorkoutPlan }) {
  const router = useRouter()
  const [startingIdx, setStartingIdx] = useState<number | null>(null)

  const handleStartWorkout = async (dayIdx: number) => {
    if (startingIdx !== null) return
    setStartingIdx(dayIdx)
    try {
      const session = await startWorkoutSession({ plan_id: plan.id, plan_day_index: dayIdx })
      router.push(`/activity/workout/${session.id}`)
    } catch {
      toast.error('Failed to start workout')
      setStartingIdx(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
          Workout Plan
        </h1>
      </div>

      {/* Status + date range */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[plan.status]}`}
        >
          {plan.status}
        </span>
        <span className="text-xs text-text-secondary">
          {formatDateRange(plan.start_date, plan.end_date)}
        </span>
      </div>

      {/* Notes */}
      {plan.content.notes && (
        <p className="text-xs text-text-secondary mb-6 italic">{plan.content.notes}</p>
      )}

      {/* Day-by-day */}
      {plan.content.days && plan.content.days.length > 0 ? (
        <div className="space-y-3">
          {plan.content.days.map((day, idx) => (
            <div key={idx} className="bg-surface border border-border rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-2">
                {formatDayDate(day.date, idx)}
              </h3>

              {day.is_rest_day ? (
                <div className="flex items-center gap-2 py-2">
                  <Moon className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm text-text-secondary">Rest Day</span>
                </div>
              ) : (
                <>
                  {day.name && <p className="text-base font-semibold text-text-primary mb-3">{day.name}</p>}
                  {day.exercises && day.exercises.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {day.exercises.map((exercise, eIdx) => {
                        const detail = formatExerciseDetail(exercise)
                        return (
                          <div key={eIdx} className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-text-primary">{exercise.name}</p>
                              {detail && (
                                <p className="text-xs text-text-secondary mt-0.5">{detail}</p>
                              )}
                            </div>
                            {exercise.notes && (
                              <p className="text-[10px] text-text-tertiary italic shrink-0 max-w-[120px] text-right">
                                {exercise.notes}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <button
                    onClick={() => handleStartWorkout(idx)}
                    disabled={startingIdx !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-accent to-accent-hover text-white disabled:opacity-50 transition-opacity"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    {startingIdx === idx ? 'Starting...' : 'Start Workout'}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-tertiary text-center py-8">
          No workout days configured yet
        </p>
      )}

      <PlanChangelog planId={plan.id} />
    </div>
  )
}
