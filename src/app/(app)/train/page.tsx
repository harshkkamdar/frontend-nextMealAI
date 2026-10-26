'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarDays } from 'lucide-react'

import { LargeTitleHeader } from '@/components/layout/screen-header'
import { OfflineBand } from '@/components/shared/offline-band'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { Enter, HistoryCard, NextUpCard, ProgramCard, SectionTitle, TrainSkeleton, VolumeCard } from '@/components/workout/train-cards'
import { completedSessions, weekVolume } from '@/components/workout/train-data'
import { WeekStrip, weekDays } from '@/components/ui/fiqr/week-strip'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { getPlans } from '@/lib/api/plans.api'
import { getInProgressSession, getWorkoutHistory, startWorkoutSession } from '@/lib/api/workout-sessions.api'
import { todayLocalISO } from '@/lib/timezone'
import { useFirstPaint } from '@/lib/use-first-paint'
import { plural } from '@/lib/utils'
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
const shortDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-AU', { weekday: 'narrow', timeZone: 'UTC' })

export default function ActivityPage() {
  const router = useRouter()
  const tz = useUserTimezone()
  const first = useFirstPaint('train')
  const [selectedDate, setSelectedDate] = useState(() => todayLocalISO(tz))
  const [starting, setStarting] = useState(false)
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
    const failures: unknown[] = []
    const fail = <T,>(fallback: T) => (error: unknown) => { failures.push(error); return fallback }
    const [plansRes, inProgress, history] = await Promise.all([
      getPlans({ type: 'workout', active_only: true }).catch(fail([])),
      getInProgressSession().catch(fail(null)),
      getWorkoutHistory(50).catch(fail([])),
    ])
    // All three failing means there is nothing true to show; report it instead of "No program yet".
    if (failures.length === 3) throw failures[0]
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

  const today = todayLocalISO(tz)
  const workoutPlan = data?.workoutPlan ?? null
  const inProgress = data?.inProgress ?? null
  const history = data?.history ?? EMPTY_HISTORY
  const nextIdx = useMemo(() => nextWorkoutDayIndex(workoutPlan), [workoutPlan])
  const days = workoutPlan?.content?.days ?? []
  const nextWorkout = nextIdx >= 0 ? days[nextIdx] ?? null : null
  const isRestDay = nextWorkout?.is_rest_day === true
  const entryLabel = deriveWorkoutEntryLabel(inProgress, nextIdx >= 0 ? nextIdx : null)
  const isResume = entryLabel === 'Resume Workout'

  const doneDates = useMemo(() => {
    const set = new Set<string>()
    for (const session of history) if (session.completed_at) set.add(todayLocalISO(tz, new Date(session.completed_at)))
    return set
  }, [history, tz])

  const selectedDateHistory = useMemo(() => history.filter((session) => (
    Boolean(session.completed_at) && todayLocalISO(tz, new Date(session.completed_at!)) === selectedDate
  )), [history, selectedDate, tz])

  const completedHistory = useMemo(() => completedSessions(history), [history])
  const week = useMemo(() => weekDays(today, 1), [today])
  const perDay = useMemo(() => weekVolume(completedHistory, week, tz), [completedHistory, week, tz])
  const sessionsThisWeek = useMemo(() => completedHistory.filter((session) => week.includes(todayLocalISO(tz, new Date(session.completed_at!)))).length, [completedHistory, week, tz])

  const handleStartWorkout = async () => {
    if (starting) return
    setStarting(true)
    try {
      const session = await startWorkoutSession({ plan_id: workoutPlan?.id, plan_day_index: nextIdx >= 0 ? nextIdx : undefined, day_name: nextWorkout?.name })
      router.push(`/train/session?id=${session.id}`)
    } catch {
      toast.error("Couldn't start the workout. Try again.")
    } finally {
      setStarting(false)
    }
  }

  const handleResume = () => {
    if (inProgress) router.push(`/train/session?id=${inProgress.id}`)
  }

  // A tap opens that day's workouts; a swipe moves the strip a whole week and only changes the selection.
  const selectDay = (iso: string) => {
    const weekShift = Math.abs(new Date(`${iso}T12:00:00Z`).getTime() - new Date(`${selectedDate}T12:00:00Z`).getTime()) === 7 * 86400000
    setSelectedDate(iso)
    if (!weekShift) setCalendarOpen(true)
  }
  const plannedSessions = workoutPlan ? days.filter((day) => !day.is_rest_day).length : null
  const exerciseCount = nextWorkout?.exercises?.length ?? 0
  const afterRest = isRestDay ? days.slice(nextIdx + 1).concat(days.slice(0, nextIdx)).find((day) => !day.is_rest_day) : undefined

  const hero = !workoutPlan ? (
    <NextUpCard
      eyebrow="Next up"
      title="No program yet"
      meta="Geo can build one around your goals and kit."
      day={null}
      action={<PrimaryButton type="button" className="h-[52px] py-0" onClick={() => useUIStore.getState().openSheet('geo-companion')}>Ask Geo for a program</PrimaryButton>}
    />
  ) : isRestDay ? (
    <NextUpCard
      eyebrow="Today"
      title="Rest day"
      meta={afterRest ? `Recover today. ${afterRest.name || 'Your next session'} is up next.` : 'Recover today.'}
      day={null}
      action={(
        <button type="button" onClick={() => programRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex h-[52px] w-full items-center justify-center gap-1 rounded-[18px] bg-ink-06 text-[15px] font-semibold text-ink transition-transform active:scale-[.97]">
          See program <ChevronRightIcon className="size-4" />
        </button>
      )}
    />
  ) : (
    <NextUpCard
      eyebrow={isResume ? 'In progress' : 'Next up'}
      title={nextWorkout?.name || `Day ${nextIdx + 1}`}
      meta={`${plural(exerciseCount, 'exercise')} · about ${Math.max(15, Math.round((exerciseCount * 7.5) / 5) * 5)} min`}
      day={nextWorkout}
      action={(
        <PrimaryButton type="button" disabled={starting} data-testid="activity-start-workout-button" className="h-[52px] py-0" onClick={() => (isResume ? handleResume() : void handleStartWorkout())}>
          {starting ? 'Starting…' : isResume ? 'Resume workout' : 'Start workout'}
        </PrimaryButton>
      )}
    />
  )

  return (
    <div className="mx-auto w-full max-w-md px-4">
      <LargeTitleHeader
        title="Train"
        subtitle={workoutPlan ? (workoutPlan.content.name || 'Your program') : 'No program yet'}
        actions={(
          <RoundButton aria-label="Open workout calendar" onClick={() => setCalendarOpen(true)}><CalendarDays strokeWidth={1.75} /></RoundButton>
        )}
      >
        <WeekStrip className="mt-4" selected={selectedDate} today={today} onSelect={selectDay} marked={doneDates} markLabel="workout done" weekStartsOn={1} />
      </LargeTitleHeader>

      <div className="-mx-4 mt-3"><OfflineBand /></div>

      {!data && loading ? (
        <TrainSkeleton />
      ) : !data ? (
        <div className="mt-6"><ErrorState onRetry={refresh}>I couldn&apos;t load your training. Check your connection and try again.</ErrorState></div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          <Enter first={first} layer="hero">{hero}</Enter>

          <Enter first={first} layer="tile" className="mt-3">
            <SectionTitle>This week</SectionTitle>
            <VolumeCard perDay={perDay} labels={week.map(shortDay)} todayIndex={week.indexOf(today)} sessions={sessionsThisWeek} planned={plannedSessions} first={first} />
          </Enter>

          {workoutPlan ? (
            <section ref={programRef} className="mt-3 scroll-mt-24">
              <SectionTitle trailing={days.length ? `Day ${nextIdx + 1} of the cycle` : undefined}>Program</SectionTitle>
              <ProgramCard days={days} nextIdx={nextIdx} first={first} />
              <button type="button" onClick={() => router.push(`/plans/view?id=${workoutPlan.id}`)} className="mt-1 flex min-h-11 items-center gap-1 px-1 text-[14px] font-semibold text-ink-65">
                View full plan <ChevronRightIcon className="size-4" />
              </button>
            </section>
          ) : null}

          <section className={workoutPlan ? 'mt-1' : 'mt-3'}>
            <SectionTitle>History</SectionTitle>
            <HistoryCard sessions={completedHistory} tz={tz} first={first} onOpen={(id) => router.push(`/train/session?id=${id}`)} onLog={() => router.push('/logs/new/workout')} />
          </section>
        </div>
      )}

      <BottomSheet open={calendarOpen} onClose={() => setCalendarOpen(false)} ariaLabel="Workout history calendar">
        <div className="px-4 pb-6 pt-3">
          <WeekStrip selected={selectedDate} today={today} onSelect={setSelectedDate} marked={doneDates} markLabel="workout done" weekStartsOn={1} />
          <div className="mt-4 overflow-hidden rounded-[22px] bg-card shadow-[var(--shadow-card)]">
            {selectedDateHistory.length === 0 ? <p className="px-5 py-5 text-[14px] text-ink-65">No workout on this day</p> : selectedDateHistory.map((session) => (
              <button key={session.id} type="button" onClick={() => router.push(`/train/session?id=${session.id}`)} className="flex min-h-16 w-full items-center gap-3 border-b border-ink-06 px-5 py-3 text-left last:border-b-0 active:bg-ink-04">
                <span className="min-w-0 flex-1"><span className="block truncate text-[15.5px] font-semibold text-ink">{session.day_name}</span><span className="block text-[13px] text-ink-65">{session.duration_minutes ?? 0} min</span></span>
                <ChevronRightIcon className="size-4 shrink-0 text-ink-35" />
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
