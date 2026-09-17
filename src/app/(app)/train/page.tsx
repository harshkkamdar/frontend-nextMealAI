'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { CalendarStrip } from '@/components/shared/calendar-strip'
import { OfflineBand } from '@/components/shared/offline-band'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { FeatureCard } from '@/components/ui/fiqr/feature-card'
import { MetricTile } from '@/components/ui/fiqr/metric-tile'
import { PrimaryButton as FreestyleButton } from '@/components/ui/fiqr/primary-button'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { getPlans } from '@/lib/api/plans.api'
import { getInProgressSession, getWorkoutHistory, startWorkoutSession } from '@/lib/api/workout-sessions.api'
import { todayLocalISO } from '@/lib/timezone'
import { deriveWorkoutEntryLabel, nextWorkoutDayIndex } from '@/lib/workout-session'
import { useUIStore } from '@/stores/ui.store'
import type { WorkoutPlan } from '@/types/plans.types'
import type { WorkoutSession } from '@/types/workout-session.types'

interface TrainData {
  workoutPlan: WorkoutPlan | null
  inProgress: WorkoutSession | null
  history: WorkoutSession[]
}

const EMPTY_HISTORY: WorkoutSession[] = []

function formatExDetail(ex: any): string {
  const reps = ex?.reps
  const validReps = (typeof reps === 'number' && reps > 0) || (typeof reps === 'string' && reps.trim().length > 0)
  const repsStr = typeof reps === 'number' ? String(reps) : String(reps ?? '').trim()
  const validSets = typeof ex?.sets === 'number' && ex.sets > 0
  const rs = typeof ex?.rest_seconds === 'number' && ex.rest_seconds > 0 ? ex.rest_seconds : 0
  const rest = rs ? ` · ${rs < 60 ? `${rs}s` : `${Math.floor(rs / 60)}m${rs % 60 ? ` ${rs % 60}s` : ''}`} rest` : ''
  if (validSets && validReps) return `${ex.sets} × ${repsStr}${rest}`
  if (validSets) return `${ex.sets} sets${rest}`
  if (validReps) return `${repsStr} reps${rest}`
  return ''
}

function addDays(iso: string, amount: number): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + amount, 12)).toISOString().slice(0, 10)
}

function getWeekBounds(today: string): [string, string] {
  const [year, month, day] = today.split('-').map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
  const monday = addDays(today, -(weekday === 0 ? 6 : weekday - 1))
  return [monday, addDays(monday, 6)]
}

function formatHistoryDate(value: string, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }).formatToParts(new Date(value))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('weekday')} ${get('day')} ${get('month')}`
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg>
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /></svg>
}

export default function ActivityPage() {
  const router = useRouter()
  const tz = useUserTimezone()
  const [selectedDate, setSelectedDate] = useState(() => todayLocalISO(tz))
  const [starting, setStarting] = useState(false)
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const programRef = useRef<HTMLElement>(null)

  const todayAtMountRef = useRef<string | null>(null)
  if (todayAtMountRef.current === null) todayAtMountRef.current = todayLocalISO(tz)
  useEffect(() => {
    const newToday = todayLocalISO(tz)
    if (selectedDate === todayAtMountRef.current && newToday !== todayAtMountRef.current) {
      setSelectedDate(newToday)
      todayAtMountRef.current = newToday
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stale selectedDate comparison
  }, [tz])

  useSetGeoScreen('activity', { selectedDate })

  const fetchData = useCallback(async (): Promise<TrainData> => {
    const [plansRes, inProgress, history] = await Promise.all([
      getPlans({ type: 'workout', active_only: true }).catch(() => []),
      getInProgressSession().catch(() => null),
      getWorkoutHistory(50).catch(() => []),
    ])
    const workoutPlan = (plansRes.find((plan) => plan.type === 'workout') as WorkoutPlan | undefined) ?? null
    return { workoutPlan, inProgress, history }
  }, [])

  const { data, loading, refetch } = useCachedQuery('train', fetchData, [])
  const refresh = useCallback(() => { void refetch() }, [refetch])

  useEffect(() => {
    window.addEventListener('workout:plan-deactivated', refresh)
    window.addEventListener('workout:session-updated', refresh)
    return () => {
      window.removeEventListener('workout:plan-deactivated', refresh)
      window.removeEventListener('workout:session-updated', refresh)
    }
  }, [refresh])
  useSyncRefetch(['plans:*', 'workout:advanced', 'workout:session-updated'], refresh)

  const workoutPlan = data?.workoutPlan ?? null
  const inProgress = data?.inProgress ?? null
  const history = data?.history ?? EMPTY_HISTORY
  const nextIdx = useMemo(() => nextWorkoutDayIndex(workoutPlan), [workoutPlan])
  const days = workoutPlan?.content?.days ?? []
  const nextWorkout = nextIdx >= 0 ? days[nextIdx] ?? null : null
  const isRestDay = nextWorkout?.is_rest_day === true
  const entryLabel = deriveWorkoutEntryLabel(inProgress, nextIdx >= 0 ? nextIdx : null)
  const isResume = entryLabel === 'Resume Workout'

  const indicators = useMemo(() => {
    const map = new Map<string, { food?: boolean; workout?: boolean }>()
    for (const session of history) {
      if (!session.completed_at) continue
      const date = todayLocalISO(tz, new Date(session.completed_at))
      map.set(date, { ...map.get(date), workout: true })
    }
    return map
  }, [history, tz])

  const selectedDateHistory = useMemo(() => history.filter((session) => (
    Boolean(session.completed_at) && todayLocalISO(tz, new Date(session.completed_at!)) === selectedDate
  )), [history, selectedDate, tz])

  const completedHistory = useMemo(() => history
    .filter((session) => session.status === 'completed' && session.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()), [history])
  const lastSession = completedHistory[0] ?? null

  const thisWeek = useMemo(() => {
    const [monday, sunday] = getWeekBounds(todayLocalISO(tz))
    return completedHistory.filter((session) => {
      const date = todayLocalISO(tz, new Date(session.completed_at!))
      return date >= monday && date <= sunday
    })
  }, [completedHistory, tz])

  const handleStartWorkout = async () => {
    if (starting) return
    setStarting(true)
    try {
      const session = await startWorkoutSession({ plan_id: workoutPlan?.id, plan_day_index: nextIdx >= 0 ? nextIdx : undefined, day_name: nextWorkout?.name })
      router.push(`/train/session?id=${session.id}`)
    } catch {
      toast.error('Failed to start workout')
    } finally {
      setStarting(false)
    }
  }

  const handleResume = () => {
    if (inProgress) router.push(`/train/session?id=${inProgress.id}`)
  }

  const plannedSessions = workoutPlan ? days.filter((day) => !day.is_rest_day).length : null
  const weeklyVolume = thisWeek.reduce((sum, session) => sum + (session.total_volume_kg ?? 0), 0) / 1000
  const lastWeekday = lastSession?.completed_at
    ? new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: tz }).format(new Date(lastSession.completed_at))
    : '—'

  return (
    <PageWrapper>
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">Train</h1>
        <button type="button" onClick={() => setCalendarOpen(true)} aria-label="Open workout calendar" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-16 bg-ink-08 text-ink-60"><CalendarIcon /></button>
      </header>
      <div className="-mx-gutter mt-3"><OfflineBand /></div>

      {!data && loading ? (
        <div className="mt-5 space-y-5">
          <Skeleton className="h-[196px] rounded-[22px] bg-ink-08" />
          <div className="grid grid-cols-3 gap-[10px]"><Skeleton className="h-[92px] rounded-[16px] bg-ink-08" /><Skeleton className="h-[92px] rounded-[16px] bg-ink-08" /><Skeleton className="h-[92px] rounded-[16px] bg-ink-08" /></div>
          <Skeleton className="h-[240px] rounded-[18px] bg-ink-08" />
        </div>
      ) : (
        <>
          {isResume && !isRestDay && (
            <button type="button" onClick={handleResume} className="mt-4 flex w-full items-center justify-between rounded-[16px] bg-ink-08 px-[14px] py-3 text-left">
              <span className="text-[15.5px] font-semibold text-ink">Resume · {inProgress?.day_name}</span><ChevronIcon className="h-5 w-5 text-ink-60" />
            </button>
          )}

          <FeatureCard className="mt-4" data-testid="activity-next-up-card">
            <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-cream-55">Next up</p>
            <h2 className="mt-2 text-[28px] font-bold leading-[1.1] tracking-[-0.6px] text-cream">{!workoutPlan ? 'No program yet' : isRestDay ? 'Rest day' : (nextWorkout?.name || `Day ${nextIdx + 1}`)}</h2>
            <p className="mt-2 text-[14px] text-cream-60">
              {!workoutPlan ? 'Geo can build one from your goals' : isRestDay ? 'Recovery · no session' : `${nextWorkout?.exercises?.length ?? 0} exercises · ${Math.max(15, Math.round(((nextWorkout?.exercises?.length ?? 0) * 7.5) / 5) * 5)} min`}
            </p>
            <SecondaryButton
              type="button" onNavy arrow disabled={starting} data-testid={workoutPlan && !isRestDay ? 'activity-start-workout-button' : undefined} className="mt-5"
              onClick={() => {
                if (!workoutPlan) useUIStore.getState().openSheet('geo-companion')
                else if (isRestDay) programRef.current?.scrollIntoView({ behavior: 'smooth' })
                else if (isResume) handleResume()
                else void handleStartWorkout()
              }}
            >
              {!workoutPlan ? 'Ask Geo' : isRestDay ? 'See program' : starting ? 'Starting...' : entryLabel}
            </SecondaryButton>
          </FeatureCard>

          <section className="mt-6">
            <SectionLabel>This week</SectionLabel>
            <div className="mt-3 grid grid-cols-3 gap-[10px]">
              <MetricTile label="Sessions" value={thisWeek.length} sub={plannedSessions === null ? '—' : `of ${plannedSessions} planned`} />
              <MetricTile label="Volume" value={weeklyVolume.toFixed(1)} unit="t" sub="this week" />
              <MetricTile label="Last" value={lastWeekday} sub={lastSession ? `${lastSession.day_name} · ${lastSession.duration_minutes ?? 0} min` : '—'} />
            </div>
          </section>

          {workoutPlan && (
            <section ref={programRef} className="mt-6 scroll-mt-4">
              <SectionLabel>Program</SectionLabel>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <h2 className="truncate text-[15.5px] font-semibold text-ink">{workoutPlan.content.name || 'Your program'}</h2>
                <span className="shrink-0 text-[13.5px] text-ink-55">Day {nextIdx + 1} of {days.length}</span>
              </div>
              <div className="mt-3 overflow-hidden rounded-[18px] border border-ink-12 bg-card" data-testid="activity-program-overview">
                {days.map((day, index) => {
                  const exerciseList = day.exercises ?? []
                  const canExpand = !day.is_rest_day && exerciseList.length > 0
                  const isExpanded = expandedDay === index
                  const isNext = index === nextIdx
                  return (
                    <div key={`${day.name}-${index}`} className="border-b border-ink-09 last:border-b-0">
                      <button type="button" onClick={() => canExpand && setExpandedDay(isExpanded ? null : index)} aria-expanded={isExpanded} className="flex w-full items-center gap-3 px-[14px] py-[13px] text-left">
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${isNext ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'}`}>{index + 1}</span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-[15.5px] font-semibold text-ink">{day.is_rest_day ? 'Rest' : (day.name || `Day ${index + 1}`)}</span><span className="block text-[13px] text-ink-55">{exerciseList.length} exercises</span></span>
                        <ChevronIcon className={`h-5 w-5 shrink-0 text-ink-50 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      {isExpanded && canExpand && (
                        <div className="space-y-1 pb-[13px] pl-9 pr-[14px]">
                          {exerciseList.map((exercise, exerciseIndex) => {
                            const detail = formatExDetail(exercise)
                            return <p key={`${exercise.name}-${exerciseIndex}`} className="text-[13.5px] text-ink-62">{exercise.name}{detail ? ` — ${detail}` : ''}</p>
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <button type="button" onClick={() => router.push(`/plans/view?id=${workoutPlan.id}`)} className="mt-3 text-[13.5px] font-semibold text-ink-60">View full plan →</button>
            </section>
          )}

          <section className="mt-6">
            <SectionLabel>History</SectionLabel>
            <div className="mt-3 overflow-hidden rounded-[18px] border border-ink-12 bg-card">
              {completedHistory.length === 0 ? <p className="px-[14px] py-5 text-[13.5px] text-ink-50">No completed workouts yet</p> : completedHistory.slice(0, 10).map((session, index) => {
                const setCount = session.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0)
                return (
                  <button key={session.id} type="button" onClick={() => router.push(`/train/session?id=${session.id}`)} className="flex w-full items-center gap-3 border-b border-ink-09 px-[14px] py-[13px] text-left last:border-b-0" data-testid={index === 0 ? 'activity-last-session' : undefined}>
                    <span className="min-w-0 flex-1"><span className="block text-[15.5px] font-medium text-ink">{formatHistoryDate(session.completed_at!, tz)}</span><span className="block truncate text-[13px] text-ink-55">{session.day_name} · {session.duration_minutes ?? 0} min · {setCount} sets</span></span>
                    <ChevronIcon className="h-5 w-5 shrink-0 text-ink-50" />
                  </button>
                )
              })}
            </div>
          </section>

          <div className="mt-4"><FreestyleButton type="button" icon="+" onClick={() => router.push('/logs/new/workout')}>Log a freestyle session</FreestyleButton></div>
        </>
      )}

      <BottomSheet open={calendarOpen} onClose={() => setCalendarOpen(false)} ariaLabel="Workout history calendar">
        <div className="px-gutter pb-6 pt-3">
          <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} indicators={indicators} label="Today" onLabelClick={() => setSelectedDate(todayLocalISO(tz))} tz={tz} />
          <div className="mt-4 overflow-hidden rounded-[18px] border border-ink-12 bg-card">
            {selectedDateHistory.length === 0 ? <p className="px-[14px] py-5 text-[13.5px] text-ink-50">No workouts on this day</p> : selectedDateHistory.map((session) => (
              <button key={session.id} type="button" onClick={() => router.push(`/train/session?id=${session.id}`)} className="flex w-full items-center gap-3 border-b border-ink-09 px-[14px] py-[13px] text-left last:border-b-0">
                <span className="min-w-0 flex-1"><span className="block text-[15.5px] font-semibold text-ink">{session.day_name}</span><span className="block text-[13px] text-ink-55">{session.duration_minutes ?? 0} min</span></span><ChevronIcon className="h-5 w-5 shrink-0 text-ink-50" />
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </PageWrapper>
  )
}
