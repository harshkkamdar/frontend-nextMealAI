'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

import { CheckInDue, currentTargets, type TodayContext } from '@/components/check-in/check-in-due'
import { CheckInInsufficient } from '@/components/check-in/check-in-insufficient'
import { CheckInMidWeek } from '@/components/check-in/check-in-mid-week'
import { CARD, CheckInEntrance, useHealthSource } from '@/components/check-in/parts'
import { PushedHeader } from '@/components/layout/screen-header'
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
  const { data, loading, error, refetch } = useCachedQuery('check-in', getCheckInStatus, [])
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
  const status = appliedFrom?.status ?? data
  const ctx = appliedFrom?.ctx ?? todayData ?? NO_TODAY

  useSetGeoScreen('check-in', {
    state: data?.state ?? null,
    week: data?.week ?? null,
  })
  useSyncRefetch(['logs:*'], useCallback(async () => { await Promise.all([refetch(), refetchToday()]) }, [refetch, refetchToday]))

  // Reached from Home's check-in card or its "This week" button; a cold open (notification) has nothing to go back to.
  const back = () => goBack(router, '/dashboard')

  const title = !status ? 'Check-in' : status.state === 'mid_week' ? 'This week so far' : `Week ${status.week.number} check-in`

  return (
    <div className="mx-auto w-full max-w-md px-4">
      <PushedHeader title={title} onBack={back} backLabel="Back to Home" />

      <div className="-mx-4 mb-2.5">
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
            />
          ) : null}
          {status.state === 'mid_week' ? <CheckInMidWeek status={status} current={currentTargets(status, ctx)} enter={enter} source={source} /> : null}
          {status.state === 'insufficient' ? <CheckInInsufficient status={status} enter={enter} source={source} onDone={back} /> : null}
        </CheckInEntrance.Provider>
      ) : null}
    </div>
  )
}
