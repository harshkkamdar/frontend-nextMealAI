'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { CheckInDue, currentTargets, type TodayContext } from '@/components/check-in/check-in-due'
import { CheckInInsufficient } from '@/components/check-in/check-in-insufficient'
import { CheckInMidWeek } from '@/components/check-in/check-in-mid-week'
import { CARD, CheckInEntrance, useHealthSource } from '@/components/check-in/parts'
import { WeekDetailSheet, type WeekDetail } from '@/components/check-in/week-detail'
import { QuickLogSheet, type QuickLogType } from '@/components/dashboard/quick-log-sheet'
import { LargeTitleHeader } from '@/components/layout/screen-header'
import { CloseIcon, PersonFill } from '@/components/ui/fiqr/icons'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { FailCard } from '@/components/plans/spatial-parts'
import { OfflineBand } from '@/components/shared/offline-band'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { getCheckInStatus, type CheckInStatus } from '@/lib/api/check-in.api'
import { getLogsSummary } from '@/lib/api/logs.api'
import { getPlans } from '@/lib/api/plans.api'
import { getProfile } from '@/lib/api/profile.api'
import { goBack } from '@/lib/navigation'
import { todayLocalISO } from '@/lib/timezone'
import { useFirstPaint } from '@/lib/use-first-paint'
import { cn } from '@/lib/utils'
import type { MealPlan } from '@/types/plans.types'

/** Final-size blocks that fade in only after 150 ms with no data, then pulse (motion-feel 3h). */
function CheckInSkeleton() {
  const block = cn(CARD, 'animate-pulse')
  return (
    <div className="page-in flex flex-col gap-2.5" style={{ animationDelay: '150ms' }} role="status" aria-busy="true" aria-label="Loading your week">
      <div className={cn(block, 'h-[150px]')} />
      <div className={cn(block, 'h-[300px]')} />
      <div className={cn(block, 'h-[176px]')} />
    </div>
  )
}

const NO_TODAY: TodayContext = { eaten: { calories: 0, protein: 0, carbs: 0, fat: 0 }, carbs: null, fat: null, planName: null }

export default function CheckInPage() {
  const router = useRouter()
  const tz = useUserTimezone()
  const today = todayLocalISO(tz)
  const { data, loading, error, refetch } = useCachedQuery('check-in', () => getCheckInStatus(), [])
  // Today's intake and the four current targets: a second, non-blocking read (the preview shows zeros without it).
  const fetchToday = useCallback(async (): Promise<TodayContext> => {
    const [summary, plans, profile] = await Promise.all([
      getLogsSummary('day').catch(() => null),
      getPlans({ active_only: true }).catch(() => []),
      getProfile().catch(() => null),
    ])
    const day = summary?.daily_breakdown?.find((entry) => entry.date === today)
    const meal = plans.find((plan) => plan.type === 'meal') as MealPlan | undefined
    const pinned = meal?.content.daily_targets
    return {
      eaten: { calories: day?.calories ?? 0, protein: day?.protein ?? 0, carbs: day?.carbs ?? 0, fat: day?.fat ?? 0 },
      carbs: pinned?.carbs ?? profile?.daily_carbs_g ?? null,
      fat: pinned?.fat ?? profile?.daily_fat_g ?? null,
      planName: pinned ? meal?.content.name || 'your nutrition plan' : null,
    }
  }, [today])
  const { data: todayData, refetch: refetchToday } = useCachedQuery('check-in-today', fetchToday, [today])
  const enter = useFirstPaint('check-in')
  const source = useHealthSource()
  // After Apply the screen holds the week it applied, so the refetched next state never swaps the layout under the user.
  const [appliedFrom, setAppliedFrom] = useState<{ status: CheckInStatus; ctx: TodayContext } | null>(null)
  // Check in now: Geo's review of the last seven days, shown in place of the week until it is kept, applied or closed.
  const [early, setEarly] = useState<CheckInStatus | null>(null)
  const [starting, setStarting] = useState(false)
  const [detail, setDetail] = useState<WeekDetail>(null)
  const [quickLog, setQuickLog] = useState<QuickLogType>(null)
  const status = appliedFrom?.status ?? early ?? data
  const ctx = appliedFrom?.ctx ?? todayData ?? NO_TODAY

  const checkInNow = async () => {
    if (starting) return
    setStarting(true)
    try {
      setEarly(await getCheckInStatus(true))
      window.scrollTo({ top: 0 })
    } catch {
      toast.error("Couldn't start your check-in. Try again.")
    } finally {
      setStarting(false)
    }
  }
  const leaveEarly = () => {
    setEarly(null)
    setAppliedFrom(null)
    void refetch()
  }

  useSetGeoScreen('check-in', {
    state: data?.state ?? null,
    week: data?.week ?? null,
  })
  useSyncRefetch(['logs:*'], useCallback(async () => { await Promise.all([refetch(), refetchToday()]) }, [refetch, refetchToday]))

  // A tab now (George's nav); Keep and Done return to Home, or from a check-in started early, to the week.
  const back = status?.early ? leaveEarly : () => goBack(router, '/dashboard')

  const title = !status ? 'Check-in' : status.early ? 'Your check-in' : status.state === 'mid_week' ? `Week ${status.week.number} so far` : `Week ${status.week.number} check-in`
  const subtitle = status?.early ? `Last 7 days, ${status.week.label}` : status?.week.label

  return (
    <div className="mx-auto w-full max-w-md px-gutter">
      <LargeTitleHeader
        title={title}
        subtitle={subtitle}
        actions={status?.early
          ? <RoundButton aria-label="Close check-in" onClick={leaveEarly}><CloseIcon /></RoundButton>
          : <RoundButton aria-label="Profile and settings" onClick={() => router.push('/settings')}><PersonFill /></RoundButton>}
      />

      <div className="-mx-gutter mb-3 mt-2">
        <OfflineBand />
      </div>

      {!status && loading ? (
        <CheckInSkeleton />
      ) : !status && error ? (
        <FailCard title="I couldn't load your week" onRetry={() => void refetch()}>
          Check your connection and try again. Your targets haven&apos;t changed.
        </FailCard>
      ) : status ? (
        <CheckInEntrance.Provider value={enter}>
          {status.state === 'due' ? (
            <CheckInDue
              status={status}
              today={ctx}
              refetch={refetch}
              onApplied={() => setAppliedFrom({ status, ctx })}
              onDone={back}
              source={source}
              onDetail={setDetail}
            />
          ) : null}
          {status.state === 'mid_week' ? (
            <CheckInMidWeek
              status={status}
              current={currentTargets(status, ctx)}
              enter={enter}
              source={source}
              today={today}
              onDetail={setDetail}
              onCheckInNow={() => void checkInNow()}
              starting={starting}
            />
          ) : null}
          {status.state === 'insufficient' ? <CheckInInsufficient status={status} enter={enter} source={source} onDone={back} /> : null}
        </CheckInEntrance.Provider>
      ) : null}

      {status ? <WeekDetailSheet detail={detail} status={status} today={today} onClose={() => setDetail(null)} onDetail={setDetail} onLog={setQuickLog} /> : null}
      <QuickLogSheet
        type={quickLog}
        onClose={() => setQuickLog(null)}
        onDone={() => { setQuickLog(null); void refetch() }}
        water={0}
        weight={{ kg: status?.weight.current_kg ?? null, weekDelta: status?.weight.delta_week_kg ?? null, series: status?.weight.points.map((point) => point.kg) ?? [], date: null, today }}
      />
    </div>
  )
}
