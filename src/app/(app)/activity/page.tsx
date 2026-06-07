'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
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
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { getPlans } from '@/lib/api/plans.api'
import { startWorkoutSession, getInProgressSession, getWorkoutHistory } from '@/lib/api/workout-sessions.api'
import { deriveWorkoutEntryLabel, computeSelectedPlanDayIndex } from '@/lib/workout-session'
import { todayLocalISO } from '@/lib/timezone'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import type { WorkoutPlan } from '@/types/plans.types'
import type { WorkoutSession } from '@/types/workout-session.types'

export default function ActivityPage() {
  const router = useRouter()
  const tz = useUserTimezone()
  const [selectedDate, setSelectedDate] = useState(() => todayLocalISO(tz))
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [inProgress, setInProgress] = useState<WorkoutSession | null>(null)
  const [history, setHistory] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  // FB-R5-02: snap selectedDate forward when tz upgrades from device→profile,
  // BUT only if the user is still sitting on what was "today" at mount.
  // Reading selectedDate from closure (stale) is intentional — that's the
  // pre-effect value we compare against todayAtMount. Don't add it to deps.
  const todayAtMountRef = useRef<string | null>(null)
  if (todayAtMountRef.current === null) {
    todayAtMountRef.current = todayLocalISO(tz)
  }
  useEffect(() => {
    const newToday = todayLocalISO(tz)
    if (selectedDate === todayAtMountRef.current && newToday !== todayAtMountRef.current) {
      setSelectedDate(newToday)
      todayAtMountRef.current = newToday
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stale read of selectedDate; see comment above
  }, [tz])

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

  // FB-R6-08 — refetch when Geo deactivates the active plan via chat. The
  // chat consumers dispatch this event after they see the tool in tools_used.
  // Legacy DOM-event listener kept ONE release while syncBus rolls out.
  useEffect(() => {
    const handler = () => { fetchData() }
    window.addEventListener('workout:plan-deactivated', handler)
    window.addEventListener('workout:session-updated', handler)
    return () => {
      window.removeEventListener('workout:plan-deactivated', handler)
      window.removeEventListener('workout:session-updated', handler)
    }
  }, [fetchData])

  // FB-R6.7 Build B — chat→UI sync. Covers plan create/update/deactivate AND
  // the workout-specific cursor advance + today's-session update events.
  useSyncRefetch(['plans:*', 'workout:advanced', 'workout:session-updated'], fetchData)

  // FB-R6-15 — cursor-aware mapping. Today's view honors plan.current_position
  // (the BE cursor that Geo's advance_to_workout tool moves); other dates add
  // the day-delta from today to the cursor base and wrap around days.length.
  const selectedDayIndex = useMemo(
    () => computeSelectedPlanDayIndex(workoutPlan, selectedDate, todayLocalISO(tz)),
    [workoutPlan, selectedDate, tz]
  )

  const todayWorkout = workoutPlan?.content?.days?.[selectedDayIndex] ?? null
  const isRestDay = todayWorkout?.is_rest_day === true

  // FB-R6-16+17: derive "Resume" vs "Start" label so the Start button and the
  // resume banner agree on whether today's in-progress session is THE one to
  // resume. Off-day in-progress sessions (e.g. yesterday's incomplete) stay
  // reachable via the History list — not as a banner that would mis-imply
  // "this is today's workout."
  const entryLabel = deriveWorkoutEntryLabel(
    inProgress,
    selectedDayIndex >= 0 ? selectedDayIndex : null
  )
  const isResume = entryLabel === 'Resume Workout'

  // FB-R6.7 Build F - guard Start Workout to today only. Past/future-date
  // Start was creating in-progress sessions with `started_at = now` even
  // when the user had scrolled the calendar to a different day, which led
  // to confusing rollup ("I tapped Jun 3, why did it land on Jun 5?").
  // Resume Workout is unaffected - in-progress sessions are independent of
  // the calendar selection.
  const isToday = selectedDate === todayLocalISO(tz)
  const canStart = isToday || isResume
  const showPastDateCaption = !canStart && !isRestDay && !!todayWorkout

  // Calendar indicators from history.
  // FB-R6.7 Build F - bucket completed sessions by the user's LOCAL date,
  // not UTC. Previously `new Date(s.completed_at).toISOString().split('T')[0]`
  // put a workout completed at 19:16 UTC under Jun 5 even when the user was
  // in Asia/Kolkata where it was 00:46 Jun 6.
  const indicators = useMemo(() => {
    const map = new Map<string, { food?: boolean; workout?: boolean }>()
    for (const s of history) {
      if (s.completed_at) {
        const d = todayLocalISO(tz, new Date(s.completed_at))
        const existing = map.get(d) || {}
        existing.workout = true
        map.set(d, existing)
      }
    }
    return map
  }, [history, tz])

  const handleStartWorkout = async () => {
    if (starting) return
    setStarting(true)
    try {
      const session = await startWorkoutSession({
        plan_id: workoutPlan?.id,
        plan_day_index: selectedDayIndex >= 0 ? selectedDayIndex : undefined,
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

  // History for selected date.
  // FB-R6.7 Build F - match by LOCAL date so the history list and the
  // calendar dots agree. The old UTC slice could hide a session from the
  // list it was indicating on (e.g. 19:16 UTC completion in IST).
  const selectedDateHistory = useMemo(() => {
    return history.filter((s) => {
      if (!s.completed_at) return false
      return todayLocalISO(tz, new Date(s.completed_at)) === selectedDate
    })
  }, [history, selectedDate, tz])

  return (
    <PageWrapper>
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary mb-4">
        Activity
      </h1>

      {/* FB-R6-16+17: Resume banner only when the in-progress session matches
          today's plan_day_index. Hide on rest days to avoid confusion. */}
      {isResume && !isRestDay && (
        <button
          onClick={handleResume}
          className="w-full flex items-center justify-between bg-accent-light border border-accent/20 rounded-xl px-4 py-3 mb-4"
        >
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-accent fill-accent" />
            <div className="text-left">
              <p className="text-sm font-semibold text-text-primary">Resume Workout</p>
              <p className="text-[11px] text-text-secondary">{inProgress?.day_name}</p>
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
                    <p className="text-base font-semibold text-text-primary">{todayWorkout.name || `Day ${selectedDayIndex + 1}`}</p>
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
                  onClick={isResume ? handleResume : handleStartWorkout}
                  disabled={starting || !canStart}
                  className="w-full bg-accent hover:bg-accent-hover text-white"
                  data-testid="activity-start-workout-button"
                >
                  <Play className="w-4 h-4 mr-1 fill-white" />
                  {starting ? 'Starting...' : entryLabel}
                </Button>
                {showPastDateCaption && (
                  <p
                    className="text-xs text-text-tertiary text-center mt-2"
                    data-testid="activity-past-date-caption"
                  >
                    Workouts can only be started for today. Use &ldquo;Log freestyle workout&rdquo; below to record a past session.
                  </p>
                )}
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
            tz={tz}
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
