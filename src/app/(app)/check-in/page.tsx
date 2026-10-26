'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { CheckInDue } from '@/components/check-in/check-in-due'
import { CheckInInsufficient } from '@/components/check-in/check-in-insufficient'
import { CheckInMidWeek } from '@/components/check-in/check-in-mid-week'
import { CARD, CheckInEntrance, useHealthSource } from '@/components/check-in/parts'
import { PushedHeader } from '@/components/layout/screen-header'
import { OfflineBand } from '@/components/shared/offline-band'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { getCheckInStatus, type CheckInStatus } from '@/lib/api/check-in.api'
import { useFirstPaint } from '@/lib/use-first-paint'
import { cn } from '@/lib/utils'

/** Final-size blocks that fade in only after 150 ms with no data, then pulse (motion-feel 3h). */
function CheckInSkeleton() {
  const block = 'animate-pulse bg-card shadow-[var(--shadow-card)]'
  return (
    <div className="page-in mt-3 flex flex-col gap-3" style={{ animationDelay: '150ms' }} role="status" aria-busy="true" aria-label="Loading your week">
      <div className={cn(CARD, block, 'h-[212px]')} />
      <div className={cn(CARD, block, 'mt-3 h-[178px]')} />
      <div className="grid grid-cols-2 gap-[10px]">
        {[0, 1, 2, 3].map((index) => <div key={index} className={cn(block, 'h-[112px] rounded-[22px]')} />)}
      </div>
    </div>
  )
}

export default function CheckInPage() {
  const router = useRouter()
  const { data, loading, error, refetch } = useCachedQuery('check-in', getCheckInStatus, [])
  const enter = useFirstPaint('check-in')
  const source = useHealthSource()
  // After Apply the screen holds the week it applied, so the refetched next state never swaps the layout under the user.
  const [appliedFrom, setAppliedFrom] = useState<CheckInStatus | null>(null)
  const status = appliedFrom ?? data

  useSetGeoScreen('check-in', {
    state: data?.state ?? null,
    week: data?.week ?? null,
  })
  useSyncRefetch(['logs:*'], refetch)

  // Reached from Home's check-in card or its "This week" button; a cold open (notification) has nothing to go back to.
  const back = () => (window.history.length > 1 ? router.back() : router.replace('/dashboard'))

  const title = !status ? 'Check-in' : status.state === 'mid_week' ? `Week ${status.week.number} so far` : `Week ${status.week.number} check-in`

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-6">
      <PushedHeader title={title} onBack={back} backLabel="Back to Home" />

      <div className="-mx-4">
        <OfflineBand />
      </div>

      {!status && loading ? (
        <CheckInSkeleton />
      ) : !status && error ? (
        <div className="mt-4">
          <ErrorState onRetry={() => void refetch()}>I couldn&apos;t load your week. Check your connection and try again.</ErrorState>
        </div>
      ) : status ? (
        <CheckInEntrance.Provider value={enter}>
          <p className="mb-3 mt-1 text-center text-[13px] font-semibold text-ink-65">{status.week.label}</p>
          {status.state === 'due' ? (
            <CheckInDue
              status={status}
              refetch={refetch}
              applied={appliedFrom !== null}
              onApplied={() => setAppliedFrom(status)}
              onDone={back}
              enter={enter}
              source={source}
            />
          ) : null}
          {status.state === 'mid_week' ? <CheckInMidWeek status={status} enter={enter} source={source} /> : null}
          {status.state === 'insufficient' ? <CheckInInsufficient status={status} enter={enter} source={source} /> : null}
        </CheckInEntrance.Provider>
      ) : null}
    </div>
  )
}
