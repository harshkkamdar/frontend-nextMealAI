'use client'

import { useRouter } from 'next/navigation'

import { CheckInDue } from '@/components/check-in/check-in-due'
import { CheckInInsufficient } from '@/components/check-in/check-in-insufficient'
import { CheckInMidWeek } from '@/components/check-in/check-in-mid-week'
import { OfflineBand } from '@/components/shared/offline-band'
import { GeoLine } from '@/components/ui/fiqr/geo-line'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { getCheckInStatus } from '@/lib/api/check-in.api'

export default function CheckInPage() {
  const router = useRouter()
  const { data, loading, error, refetch } = useCachedQuery('check-in', getCheckInStatus, [])

  useSetGeoScreen('check-in', {
    state: data?.state ?? null,
    week: data?.week ?? null,
  })
  useSyncRefetch(['logs:*'], refetch)

  if (!data && loading) {
    return (
      <main className="mx-auto w-full max-w-md space-y-4 px-gutter pb-6" style={{ paddingTop: 'calc(20px + var(--safe-top))' }}>
        <Skeleton className="h-[52px] rounded-[16px]" />
        <Skeleton className="h-[176px] rounded-[22px]" />
        <Skeleton className="h-[220px] rounded-[16px]" />
      </main>
    )
  }

  if (!data && error) {
    return (
      <main className="mx-auto w-full max-w-md px-gutter pb-6" style={{ paddingTop: 'calc(20px + var(--safe-top))' }}>
        <GeoLine>Couldn&apos;t load your week. Pull to refresh.</GeoLine>
        <SecondaryButton onClick={() => void refetch()} onNavy={false}>Try again</SecondaryButton>
      </main>
    )
  }

  if (!data) return null

  const title = data.state === 'mid_week'
    ? `Week ${data.week.number} so far`
    : `Week ${data.week.number} check-in`

  return (
    <main
      className="mx-auto flex w-full max-w-md flex-col"
      style={{ minHeight: 'calc(100dvh - 80px - var(--safe-bottom))' }}
    >
      <header className="flex items-center gap-[14px] px-gutter" style={{ paddingTop: 'calc(16px + var(--safe-top))' }}>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium uppercase tracking-[1.4px] text-ink-65">{data.week.label}</p>
          <h1 className="mt-[3px] text-[22px] font-semibold tracking-[-0.4px] text-ink">{title}</h1>
        </div>
        <button
          aria-label="Open settings"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-ink-16 bg-ink-08 text-ink-65"
          onClick={() => router.push('/settings')}
          type="button"
        >
          <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24">
            <circle cx="12" cy="8.6" r="3.8" stroke="currentColor" strokeWidth="1.75" />
            <path d="M4.8 20.2c1.3-3.9 3.8-5.8 7.2-5.8s5.9 1.9 7.2 5.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
          </svg>
        </button>
      </header>

      <OfflineBand />

      <div className="flex flex-1 flex-col px-gutter">
        {data.state === 'due' ? <CheckInDue refetch={refetch} status={data} /> : null}
        {data.state === 'mid_week' ? <CheckInMidWeek status={data} /> : null}
        {data.state === 'insufficient' ? <CheckInInsufficient status={data} /> : null}
      </div>
    </main>
  )
}
