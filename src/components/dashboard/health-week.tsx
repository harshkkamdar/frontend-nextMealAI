'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PushedHeader } from '@/components/layout/screen-header'
import { OfflineBand } from '@/components/shared/offline-band'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { getLogs } from '@/lib/api/logs.api'
import { goBack } from '@/lib/navigation'
import { healthLabel, isHealthConnected, lastHealthSync } from '@/lib/platform/health'
import { todayLocalISO } from '@/lib/timezone'
import { cn } from '@/lib/utils'
import { CARD } from './home-cards'
import { formatSleep, weekSeries } from './home-data'
import { QuickLogSheet } from './quick-log-sheet'

export function useHealthSource(): { label: string | null; connected: boolean | null; syncedAt: string | null; recheck: () => void } {
  const label = healthLabel()
  const [state, setState] = useState<{ connected: boolean | null; syncedAt: string | null }>({ connected: null, syncedAt: null })
  const recheck = useCallback(() => {
    if (!label) return
    void Promise.all([isHealthConnected(), lastHealthSync()]).then(([connected, syncedAt]) => setState({ connected, syncedAt }))
  }, [label])
  useEffect(recheck, [recheck])
  return { label, ...state, recheck }
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')
const weekday = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-AU', { weekday: 'short', timeZone: 'UTC' })
}

/** Steps or Sleep pushed from Home's tile: today's value, the source, seven days as bars, the average. */
export function HealthWeek({ metric }: { metric: 'steps' | 'sleep' }) {
  const router = useRouter()
  const today = todayLocalISO(useUserTimezone())
  const health = useHealthSource()
  const [logging, setLogging] = useState(false)
  const fetchWeek = useCallback(() => getLogs({ type: metric, days: 8, limit: 100 }), [metric])
  const { data, refetch } = useCachedQuery(`dashboard-week-${metric}`, fetchWeek, [today])
  useSyncRefetch(['logs:*'], useCallback(() => { void refetch() }, [refetch]))

  const days = weekSeries(data ?? [], metric, today)
  const latest = metric === 'sleep' ? days[6].value ?? days[5].value : days[6].value
  const logged = days.flatMap((day) => (day.value === null ? [] : [day.value]))
  const average = logged.length ? logged.reduce((a, b) => a + b, 0) / logged.length : null
  const show = (n: number) => (metric === 'steps' ? fmt(n) : formatSleep(n))
  const top = Math.max(...logged, metric === 'steps' ? 10000 : 10)
  const title = metric === 'steps' ? 'Steps' : 'Sleep'
  const time = health.syncedAt ? new Date(health.syncedAt).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }) : null
  const source = health.label && health.connected ? `From ${health.label}${time ? `, synced ${time}` : ''}` : metric === 'sleep' ? 'Logged by you' : 'Syncs from your phone'

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-6">
      <PushedHeader large title={title} onBack={() => goBack(router, '/dashboard')} backLabel="Back to Today" />
      <div className="-mx-4"><OfflineBand /></div>
      <p className="mt-2 flex items-baseline gap-2 px-1">
        <span className="font-display text-title text-ink tabular-nums">{latest === null ? '—' : show(latest)}</span>
        <span className="text-caption font-semibold text-ink-65">{metric === 'steps' ? 'of 10,000 today' : 'last night'}</span>
      </p>
      <p className="mt-0.5 px-1 text-caption text-ink-65">{source}</p>
      <section className={cn(CARD, 'mt-3 p-4')} aria-label={`${title}, last seven days`}>
        <ol className="flex h-[168px] items-end gap-2">
          {days.map((day, index) => (
            <li key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="sr-only">{weekday(day.date)}: {day.value === null ? 'nothing logged' : show(day.value)}</span>
              <span className="flex w-full flex-1 items-end" aria-hidden="true">
                <span className={cn('block w-full rounded-[8px]', index === 6 ? 'bg-ink' : 'bg-ink-10')} style={{ height: `${Math.max(day.value ? 4 : 2, ((day.value ?? 0) / top) * 100)}%` }} />
              </span>
              <span className="text-label font-medium text-ink-65" aria-hidden="true">{weekday(day.date)}</span>
            </li>
          ))}
        </ol>
      </section>
      <p className="mt-3 px-0.5 text-caption text-ink-65">{average === null ? 'Nothing logged this week yet.' : `7-day average ${show(average)}`}</p>
      {metric === 'sleep' ? (
        <>
          <PrimaryButton type="button" className="mt-4 bg-ink text-cream text-[16px]" onClick={() => setLogging(true)}>Log last night</PrimaryButton>
          <QuickLogSheet type={logging ? 'sleep' : null} onClose={() => setLogging(false)} onDone={() => { setLogging(false); void refetch() }} water={0} weight={{ kg: null, weekDelta: null, series: [], date: null, today }} />
        </>
      ) : null}
    </div>
  )
}
