'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, Play, Moon, MessageCircle, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { CalendarStrip } from '@/components/shared/calendar-strip'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useUIStore } from '@/stores/ui.store'
import { getPlans } from '@/lib/api/plans.api'
import { startWorkoutSession, getInProgressSession, getWorkoutHistory } from '@/lib/api/workout-sessions.api'
import { todayISO } from '@/lib/utils'
import type { WorkoutPlan } from '@/types/plans.types'
import type { WorkoutSession } from '@/types/workout-session.types'

export default function ActivityPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [inProgress, setInProgress] = useState<WorkoutSession | null>(null)
  const [history, setHistory] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useSetGeoScreen('activity', { selectedDate })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [plansRes, ipRes, histRes] = await Promise.all([
        getPlans({ type: 'workout', active_only: true }).catch(() => []),
        getInProgressSession().catch(() => null),
        getWorkoutHistory(10).catch(() => [])
      ])
      const wp = plansRes.find((p) => p.type === 'workout') as WorkoutPlan | undefined
      setWorkoutPlan(wp ?? null)
      setInProgress(ipRes)
      setHistory(histRes)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Figure out today's scheduled workout from plan
  const todayDayIndex = useMemo(() => {
    if (!workoutPlan?.content?.days) return -1
    const planStart = workoutPlan.start_date ? new Date(workoutPlan.start_date) : new Date(workoutPlan.created_at)
    const today = new Date()
    const daysDiff = Math.floor((today.getTime() - planStart.getTime()) / 86400000)
    const totalDays = workoutPlan.content.days.length
    if (totalDays === 0) return -1
    return daysDiff % totalDays
  }, [workoutPlan])

  const todayWorkout = workoutPlan?.content?.days?.[todayDayIndex] ?? null
  const isRestDay = todayWorkout?.is_rest_day === true

  // Calendar indicators from history
  const indicators = useMemo(() => {
    const map = new Map<string, { food?: boolean; workout?: boolean }>()
    for (const s of history) {
      if (s.completed_at) {
        const d = new Date(s.completed_at).toISOString().split('T')[0]
        const existing = map.get(d) || {}
        existing.workout = true
        map.set(d, existing)
      }
    }
    return map
  }, [history])

  const handleStartWorkout = async () => {
    if (starting) return
    setStarting(true)
    try {
      const session = await startWorkoutSession({
        plan_id: workoutPlan?.id,
        plan_day_index: todayDayIndex >= 0 ? todayDayIndex : undefined,
        day_name: todayWorkout?.name
      })
      router.push(`/activity/workout/${session.id}`)
    } catch {
      toast.error('Failed to start workout')
    } finally {
      setStarting(false)
    }
  }

  const handleResume = () => {
    if (inProgress) router.push(`/activity/workout/${inProgress.id}`)
  }

  // History for selected date
  const selectedDateHistory = useMemo(() => {
    return history.filter((s) => {
      if (!s.completed_at) return false
      return new Date(s.completed_at).toISOString().split('T')[0] === selectedDate
    })
  }, [history, selectedDate])

  return (
    <PageWrapper>
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary mb-4">
        Activity
      </h1>

      {/* Resume banner — hide on rest days to avoid confusion */}
      {inProgress && !isRestDay && (
        <button
          onClick={handleResume}
          className="w-full flex items-center justify-between bg-accent-light border border-accent/20 rounded-xl px-4 py-3 mb-4"
        >
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-accent fill-accent" />
            <div className="text-left">
              <p className="text-sm font-semibold text-text-primary">Resume Workout</p>
              <p className="text-[11px] text-text-secondary">{inProgress.day_name}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-accent" />
        </button>
      )}

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !workoutPlan ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <Dumbbell className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm font-medium text-text-primary mb-1">No workout plan active</p>
          <p className="text-xs text-text-secondary mb-4">Chat with Geo to create a workout plan</p>
          <Button
            onClick={() => useUIStore.getState().openSheet('geo-companion')}
            className="bg-accent hover:bg-accent-hover text-white"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Talk to Geo
          </Button>
          <button
            onClick={() => router.push('/logs/new/workout')}
            className="w-full text-center text-xs text-text-secondary hover:text-accent py-2 mt-2"
          >
            Or log a freestyle workout
          </button>
        </div>
      ) : (
        <>
          {/* Today's workout card */}
          <div className="bg-surface border border-border rounded-xl p-4 mb-4">
            {isRestDay ? (
              <div className="flex items-center gap-3 py-2">
                <Moon className="w-8 h-8 text-text-tertiary" />
                <div>
                  <p className="text-base font-semibold text-text-primary">Rest Day</p>
                  <p className="text-xs text-text-secondary">Recovery is part of the plan</p>
                </div>
              </div>
            ) : todayWorkout ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-base font-semibold text-text-primary">{todayWorkout.name || `Day ${todayDayIndex + 1}`}</p>
                    <p className="text-xs text-text-secondary">
                      {todayWorkout.exercises?.length ?? 0} exercises
                    </p>
                  </div>
                  {/* Muscle group chips */}
                  <div className="flex gap-1">
                    {[...new Set((todayWorkout.exercises || []).map((e: any) => e.muscle_group).filter(Boolean))].slice(0, 3).map((mg: string) => (
                      <span key={mg} className="text-[10px] bg-accent-light text-accent px-2 py-0.5 rounded-full">{mg}</span>
                    ))}
                  </div>
                </div>

                {/* Exercise preview */}
                <div className="space-y-1 mb-3">
                  {(todayWorkout.exercises || []).slice(0, 4).map((ex: any, i: number) => (
                    <p key={i} className="text-xs text-text-secondary">
                      {ex.name} — {ex.sets}×{ex.reps}
                    </p>
                  ))}
                  {(todayWorkout.exercises?.length ?? 0) > 4 && (
                    <p className="text-xs text-text-tertiary">+{todayWorkout.exercises!.length - 4} more</p>
                  )}
                </div>

                <button
                  onClick={() => router.push(`/plans/${workoutPlan.id}`)}
                  className="text-xs text-accent hover:underline mb-3"
                >
                  View full plan &rarr;
                </button>

                <Button
                  onClick={handleStartWorkout}
                  disabled={starting || !!inProgress}
                  className="w-full bg-accent hover:bg-accent-hover text-white"
                >
                  <Play className="w-4 h-4 mr-1 fill-white" />
                  {starting ? 'Starting...' : 'Start Workout'}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-text-tertiary text-center py-4">No workout data for today</p>
            )}
          </div>
          <button
            onClick={() => router.push('/logs/new/workout')}
            className="w-full text-center text-xs text-text-secondary hover:text-accent py-2"
          >
            Or log a freestyle workout
          </button>

          {/* Calendar */}
          <CalendarStrip
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            indicators={indicators}
          />

          {/* History for selected date */}
          <div className="mt-4">
            <h2 className="text-sm font-medium text-text-secondary mb-2">Workout History</h2>
            {selectedDateHistory.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-6">No workouts on this day</p>
            ) : (
              <div className="space-y-3">
                {selectedDateHistory.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => router.push(`/activity/workout/${session.id}`)}
                    className="w-full text-left bg-surface border border-border rounded-xl p-4 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-text-primary">{session.day_name}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-text-tertiary">
                          {session.duration_minutes}min
                        </span>
                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-text-secondary">
                      <span>{session.exercises.filter(e => e.status === 'completed').length}/{session.exercises.length} exercises</span>
                      {session.total_volume_kg && <span>{session.total_volume_kg.toLocaleString()} kg volume</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PageWrapper>
  )
}
