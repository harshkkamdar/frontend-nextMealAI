'use client'

import { useId } from 'react'
import { WeightFill } from '@/components/ui/fiqr/icons'
import { DRAW_MS } from '@/lib/motion'
import { formatDelta } from './format'
import { CARD, useDrawn } from './parts'

interface WeightTrendCardProps {
  points: { week_end: string; kg: number }[]
  currentKg: number | null
  deltaKg: number | null
  /** `strong` on the due screen (ink line), `muted` while the week is still open or thin (ink 35%). */
  tone: 'strong' | 'muted'
  /** Set when the phone's Health app feeds the weigh-ins (Q32). */
  source?: string | null
}

const H = 56

/** y per point in a 0..100 x 0..H box, 6 px headroom so the end dot never clips. */
function chartY(points: WeightTrendCardProps['points']): number[] {
  const values = points.map((point) => point.kg)
  const max = Math.max(...values)
  const span = max - Math.min(...values) || 1
  return values.map((kg) => 6 + ((max - kg) / span) * (H - 12))
}

export function WeightTrendCard({ points, currentKg, deltaKg, tone, source }: WeightTrendCardProps) {
  const drawn = useDrawn()
  const clip = useId()
  const stroke = tone === 'strong' ? 'var(--color-ink)' : 'var(--color-ink-35)'
  const ys = points.length >= 2 ? chartY(points) : []
  const line = ys.map((y, index) => `${(index / (ys.length - 1)) * 100},${y.toFixed(2)}`).join(' ')

  return (
    <section className={`${CARD} p-5`} aria-label="Weight trend">
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-65">
        <WeightFill className="size-4" />Weight trend
      </span>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-wide text-[28px] font-bold leading-none tracking-[-0.6px] text-ink tabular-nums">
          {currentKg === null ? '—' : currentKg.toFixed(1)}
        </span>
        {currentKg === null ? null : <span className="text-[14px] font-semibold text-ink-65">kg</span>}
        {deltaKg === null ? null : <span className="ml-auto text-[13px] font-semibold text-ink-65 tabular-nums">{formatDelta(deltaKg)} kg this week</span>}
      </div>

      {ys.length === 0 ? (
        <div className="mt-4">
          <span aria-hidden="true" className="block h-0 w-full border-t-[1.5px] border-dashed border-ink-20" />
          <p className="mt-3 text-[13px] text-ink-65">Log your weight to see a trend</p>
        </div>
      ) : (
        <span className="relative mt-4 block" style={{ height: H }}>
          <svg aria-label="Weight trend chart" role="img" className="block size-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 100 ${H}`}>
            <defs>
              <clipPath id={clip}>
                {/* Draws left to right by scaling the clip, so the line itself is never re-measured (as on Home). */}
                <rect x="0" y="-8" width="100" height={H + 16} style={{ transformOrigin: '0 0', transform: `scaleX(${drawn ? 1 : 0})`, transition: `transform ${DRAW_MS}ms ease-out 200ms` }} />
              </clipPath>
            </defs>
            <line x1="0" x2="100" y1={H - 0.5} y2={H - 0.5} stroke="var(--color-ink-10)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <polyline clipPath={`url(#${clip})`} fill="none" points={line} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          {/* Latest weigh-in: an HTML dot so it stays round under the stretched viewBox. */}
          <span
            aria-hidden="true"
            className="absolute right-0 size-2 -translate-y-1/2 translate-x-1/2 rounded-full transition-opacity duration-200"
            style={{ top: `${(ys[ys.length - 1] / H) * 100}%`, background: stroke, opacity: drawn ? 1 : 0, transitionDelay: `${DRAW_MS + 200}ms` }}
          />
        </span>
      )}

      {source || ys.length ? (
        <p className="mt-3 text-[12px] font-medium text-ink-65">{source ? `Includes ${source} weigh-ins` : `Last ${points.length} weeks`}</p>
      ) : null}
    </section>
  )
}
