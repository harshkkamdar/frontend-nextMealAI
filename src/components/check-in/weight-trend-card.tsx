'use client'

import { useCallback, useId } from 'react'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { formatKg } from '@/components/workout/train-data'
import { weightJourney } from '@/components/dashboard/home-data'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { getLogs } from '@/lib/api/logs.api'
import { getProfile } from '@/lib/api/profile.api'
import { DRAW_MS } from '@/lib/motion'
import { formatDelta } from './format'
import { CARD, useDrawn } from './parts'

interface WeightTrendCardProps {
  /** The check-in's weekly averages: drawn only until the whole journey has loaded. */
  points: { week_end: string; kg: number }[]
  currentKg: number | null
  deltaKg: number | null
  /** `strong` on the due screen (ink line), `muted` while the week is still open or thin (ink 35%). */
  tone: 'strong' | 'muted'
  /** Set when the phone's Health app feeds the weigh-ins (Q32). */
  source?: string | null
  /** The due screen already leads with the week's change, so the card leaves it out. */
  hideDelta?: boolean
  /** Opens the weigh-ins behind the line. */
  onOpen?: () => void
}

const H = 96

/** Every weigh-in since joining plus the goal, shared by Home and Check-in (one cache entry). */
function useWeightJourney() {
  const fetchJourney = useCallback(async () => {
    const [profile, logs] = await Promise.all([getProfile(), getLogs({ type: 'weight', limit: 100 })])
    return { points: weightJourney(logs, { kg: profile.current_weight_kg, date: profile.created_at }), goalKg: profile.target_weight_kg ?? null }
  }, [])
  const { data, refetch } = useCachedQuery('weight-journey', fetchJourney, [])
  useSyncRefetch(['logs:*'], useCallback(() => { void refetch() }, [refetch]))
  return data ?? null
}

const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** George's progress chart: where you started, every weigh-in since, and the goal as a dashed line. */
export function WeightTrendCard({ points: weekly, currentKg, deltaKg, tone, source, hideDelta, onOpen }: WeightTrendCardProps) {
  const drawn = useDrawn()
  const clip = useId()
  const journey = useWeightJourney()
  const journeyPoints = journey?.points ?? []
  const points = journeyPoints.length >= 2 ? journeyPoints : weekly.map((point) => ({ date: point.week_end, kg: point.kg }))
  const goal = journey?.goalKg ?? null
  const stroke = tone === 'strong' ? 'var(--color-ink)' : 'var(--color-ink-35)'
  const kgs = points.map((point) => point.kg)
  const top = Math.max(...kgs, goal ?? -Infinity)
  const bottom = Math.min(...kgs, goal ?? Infinity)
  const y = (kg: number) => 6 + ((top - kg) / (top - bottom || 1)) * (H - 12)
  const ys = points.length >= 2 ? kgs.map(y) : []
  const line = ys.map((value, index) => `${(index / (ys.length - 1)) * 100},${value.toFixed(2)}`).join(' ')
  // The journey's newest weigh-in beats the screen's own figure (Home falls back to the joining weight after 8 quiet days).
  const latest = journeyPoints.length >= 2 ? kgs[kgs.length - 1] : currentKg ?? kgs[kgs.length - 1] ?? null
  const since = points.length >= 2 && latest !== null ? Math.round((latest - points[0].kg) * 100) / 100 : null
  // Moving toward the goal (or down, with no goal) reads as progress, in teal; never red.
  const progress = since !== null && since !== 0 && (goal === null ? since < 0 : Math.sign(since) === Math.sign(goal - points[0].kg))

  return (
    <section className={`${CARD} relative p-4`} aria-label="Weight progress">
      {/* The whole card opens the weigh-ins; an overlay keeps the chart out of the button's content. */}
      {onOpen ? <button type="button" onClick={onOpen} aria-label="Open weigh-ins" className="absolute inset-0 z-[1] rounded-card active:bg-ink-06/40" /> : null}
      <div className="flex items-baseline gap-2">
        <span className="flex items-center gap-1 text-[14px] font-semibold text-ink">Weight{onOpen ? <ChevronRightIcon className="size-3.5 text-ink-35" /> : null}</span>
        <span className="ml-auto whitespace-nowrap text-[13.5px] tabular-nums">
          <b className="font-semibold text-ink">{latest === null ? '—' : `${formatKg(latest)} kg`}</b>
          {deltaKg === null || hideDelta ? null : <span className="text-ink-65"> · {formatDelta(deltaKg)} this week</span>}
        </span>
      </div>
      {since !== null ? (
        <p className="mt-0.5 text-[13px] text-ink-65 tabular-nums">
          <b className={progress ? 'font-semibold text-macro-teal' : 'font-semibold text-ink'}>{since > 0 ? '+' : since < 0 ? '−' : ''}{formatKg(Math.abs(since))} kg</b> since {shortDate(points[0].date)}
          {goal !== null ? ` · Goal ${formatKg(goal)} kg` : ''}
        </p>
      ) : null}
      {source ? <p className="mt-0.5 text-[12.5px] text-ink-62">{source}</p> : null}

      {ys.length === 0 ? (
        <div className="mt-4">
          <span aria-hidden="true" className="block h-0 w-full border-t-[1.5px] border-dashed border-ink-20" />
          <p className="mt-3 text-[13px] text-ink-65">Log your weight to see your progress</p>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          {/* Top and bottom of the scale, level with the gridlines they label. */}
          <span aria-hidden="true" className="relative w-8 shrink-0 text-label font-medium text-ink-65 tabular-nums" style={{ height: H }}>
            <span className="absolute left-0 top-[6px] -translate-y-1/2">{Math.round(top)}</span>
            <span className="absolute left-0 -translate-y-1/2" style={{ top: H - 6 }}>{Math.round(bottom)}</span>
          </span>
          <span className="relative block min-w-0 flex-1" style={{ height: H }}>
            <svg aria-label={`Weight chart, ${formatKg(kgs[0])} kg on ${shortDate(points[0].date)} to ${formatKg(kgs[kgs.length - 1])} kg now${goal !== null ? `, goal ${formatKg(goal)} kg` : ''}`} role="img" className="block size-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 100 ${H}`}>
              <defs>
                <clipPath id={clip}>
                  {/* Draws left to right by scaling the clip, so the line itself is never re-measured (as on Home). */}
                  <rect x="0" y="-8" width="100" height={H + 16} style={{ transformOrigin: '0 0', transform: `scaleX(${drawn ? 1 : 0})`, transition: `transform ${DRAW_MS}ms ease-out 200ms` }} />
                </clipPath>
              </defs>
              <line x1="0" x2="100" y1="6" y2="6" stroke="var(--color-ink-06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1="0" x2="100" y1={H - 6} y2={H - 6} stroke="var(--color-ink-10)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              {goal !== null ? <line x1="0" x2="100" y1={y(goal)} y2={y(goal)} stroke="var(--color-macro-teal)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" /> : null}
              <polyline clipPath={`url(#${clip})`} fill="none" points={line} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
            {goal !== null ? <span aria-hidden="true" className="absolute right-0 -translate-y-full pb-0.5 text-[11px] font-semibold text-macro-teal" style={{ top: `${(y(goal) / H) * 100}%` }}>Goal</span> : null}
            {/* Latest weigh-in: an HTML dot so it stays round under the stretched viewBox. */}
            <span
              aria-hidden="true"
              className="absolute right-0 size-2 -translate-y-1/2 translate-x-1/2 rounded-full transition-opacity duration-200"
              style={{ top: `${(ys[ys.length - 1] / H) * 100}%`, background: stroke, opacity: drawn ? 1 : 0, transitionDelay: `${DRAW_MS + 200}ms` }}
            />
          </span>
        </div>
      )}
      {ys.length ? (
        <div aria-hidden="true" className="mt-2 flex justify-between pl-10 text-caption text-ink-65">
          <span>{shortDate(points[0].date)}</span>
          <span>Now</span>
        </div>
      ) : null}
    </section>
  )
}
