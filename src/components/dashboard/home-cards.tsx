'use client'

import type { ComponentType, ReactNode, SVGProps } from 'react'
import { createContext, useContext, useEffect, useId, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { ChartFill, ChevronRightIcon, SleepFill, StepsFill, WaterFill, WeightFill } from '@/components/ui/fiqr/icons'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import type { MacroKey } from '@/lib/macros'
import { DRAW_MS } from '@/lib/motion'
import { CountUp } from '@/components/ui/fiqr/count-up'
import { usePressTilt } from '@/components/ui/fiqr/press-tilt'
import { cn } from '@/lib/utils'
import { formatSleep, type MealRow } from './home-data'

const CARD = 'rounded-[22px] bg-card shadow-[var(--shadow-card)]'

/** False on a revisit in the same session: charts and numbers paint at rest instead of drawing again (motion-feel 7). */
export const HomeEntrance = createContext(true)

function Count(props: { value: number; delay?: number }) {
  return <CountUp {...props} still={!useContext(HomeEntrance)} />
}

/** Flips true one frame after mount so CSS transitions draw from empty (first paint per session, Q23). */
function useDrawn(): boolean {
  const reduced = useReducedMotion()
  const entering = useContext(HomeEntrance)
  const reduce = reduced || !entering
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return drawn || !!reduce
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

// ── Hero: calorie ring, macro dots with targets, Geo's line (Q17, D1, critic fixes 1, 3, 4) ──

interface Macro { key: Exclude<MacroKey, 'calories'>; label: string; current: number; target: number; color: string }

function Ring({ consumed, target }: { consumed: number; target: number }) {
  const drawn = useDrawn()
  const over = target > 0 && consumed > target
  const remaining = target > 0 ? Math.abs(target - consumed) : consumed
  const r = 54
  const c = 2 * Math.PI * r
  const fraction = target > 0 ? Math.min(1, consumed / target) : 0
  // Round caps add half the 12 px stroke at each end; shorten the dash by one stroke so the arc equals the fraction.
  const arcOffset = fraction >= 1 ? 0 : Math.min(c, c * (1 - fraction) + 12)
  return (
    <div className="relative size-ring shrink-0">
      <svg viewBox="0 0 132 132" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--color-ink-06)" strokeWidth="12" />
        <circle
          cx="66" cy="66" r={r} fill="none" stroke="var(--color-accent)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={drawn ? arcOffset : c}
          style={{ transition: `stroke-dashoffset ${DRAW_MS + 400}ms cubic-bezier(.22,1,.36,1)`, opacity: fraction > 0 ? 1 : 0 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-hero leading-none text-ink tabular-nums"><Count value={remaining} /></span>
        <span className="mt-1 text-[13px] font-semibold text-ink-65">{target > 0 ? (over ? 'kcal over' : 'kcal left') : 'kcal today'}</span>
      </div>
    </div>
  )
}

function MacroDots({ macro, onOpen }: { macro: Macro; onOpen: () => void }) {
  const drawn = useDrawn()
  const steps = macro.target > 0 ? Math.min(10, Math.round((macro.current / macro.target) * 10)) : 0
  return (
    <button type="button" onClick={onOpen} className="flex min-h-11 w-full flex-col justify-center text-left">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold text-ink-65">{macro.label}</span>
        <span className="text-[14px] font-semibold text-ink tabular-nums">
          {fmt(macro.current)}<span className="font-medium text-ink-65"> / {macro.target > 0 ? fmt(macro.target) : '—'} g</span>
        </span>
      </span>
      <span className="sr-only">, show breakdown</span>
      <span className="mt-1.5 flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <span
            key={index}
            className="h-[6px] flex-1 rounded-full transition-[opacity,transform] duration-300"
            style={{
              background: index < steps ? macro.color : 'var(--color-ink-06)',
              transform: drawn ? 'scaleX(1)' : 'scaleX(.3)',
              opacity: drawn ? 1 : 0,
              transitionDelay: `${300 + index * 35}ms`,
            }}
          />
        ))}
      </span>
    </button>
  )
}

interface HeroCardProps {
  calories: { current: number; target: number }
  macros: { protein: [number, number]; carbs: [number, number]; fat: [number, number] }
  geoLine: ReactNode
  onOpenMacro: (macro: MacroKey) => void
}

export function HeroCard({ calories, macros, geoLine, onOpenMacro }: HeroCardProps) {
  const list: Macro[] = [
    { key: 'protein', label: 'Protein', current: macros.protein[0], target: macros.protein[1], color: 'var(--color-ink)' },
    { key: 'carbs', label: 'Carbs', current: macros.carbs[0], target: macros.carbs[1], color: 'var(--color-macro-teal)' },
    { key: 'fat', label: 'Fat', current: macros.fat[0], target: macros.fat[1], color: 'var(--color-macro-ochre)' },
  ]
  return (
    <section className={cn(CARD, 'p-4')} aria-label="Today's food">
      <div className="flex items-center gap-[14px]">
        <button type="button" onClick={() => onOpenMacro('calories')} className="rounded-full transition-transform active:scale-[.97]">
          <Ring consumed={calories.current} target={calories.target} />
          <span className="sr-only">, {fmt(calories.current)} of {fmt(calories.target)} eaten, show breakdown</span>
        </button>
        <div className="min-w-0 flex-1">
          {list.map((macro) => <MacroDots key={macro.key} macro={macro} onOpen={() => onOpenMacro(macro.key)} />)}
        </div>
      </div>
      <div className="mt-4 flex items-start gap-3 border-t border-ink-06 pt-4">
        <GeoAvatar size={28} />
        <p className="min-w-0 flex-1 text-body-sm text-ink">{geoLine}</p>
      </div>
    </section>
  )
}

// ── Health tiles (Q12, Q32, critic fixes 2, 5, 6) ──

interface TileProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: ReactNode
  unit?: string
  caption?: ReactNode
  children?: ReactNode
  onClick?: () => void
  actionLabel?: string
}

function Tile({ icon: Icon, label, value, unit, caption, children, onClick, actionLabel }: TileProps) {
  // Demo of the Spatial press tilt (5 deg for tiles); it owns the tile's press transform.
  const tilt = usePressTilt<HTMLButtonElement>(5)
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-65">
        <Icon className="size-4" />{label}
      </span>
      <span className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-hero leading-none text-ink tabular-nums">{value}</span>
        {unit ? <span className="text-[14px] font-semibold text-ink-65">{unit}</span> : null}
      </span>
      <span className="mt-auto block pt-3">{children}</span>
      {caption ? <span className="mt-2 block truncate text-[12px] font-medium text-ink-65">{caption}</span> : null}
      {actionLabel ? <span className="sr-only">, {actionLabel}</span> : null}
    </>
  )
  const className = 'flex min-h-tile flex-col rounded-[20px] bg-card p-[14px] text-left shadow-[var(--shadow-card)]'
  return onClick
    ? <button type="button" onClick={onClick} className={className} {...tilt}>{body}</button>
    : <div className={className}>{body}</div>
}

/** One thin progress line, 0 to 1; grows from the left once per visit. */
function Progress({ fraction }: { fraction: number }) {
  const drawn = useDrawn()
  const f = Math.min(1, Math.max(0, fraction))
  return (
    <span className="flex h-6 items-end" aria-hidden="true">
      <span className="relative block h-[6px] w-full overflow-hidden rounded-full bg-ink-06">
        <span
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-ink transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
          style={{ transform: `scaleX(${drawn ? f : 0})`, transitionDelay: '200ms' }}
        />
      </span>
    </span>
  )
}

function Sparkline({ series }: { series: number[] }) {
  const drawn = useDrawn()
  const clip = useId()
  if (series.length < 2) return <span className="flex h-6 items-center" aria-hidden="true"><span className="h-0 w-full border-t-[1.5px] border-dashed border-ink-20" /></span>
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  const points = series.map((value, index) => `${(index / (series.length - 1)) * 100},${20 - ((value - min) / span) * 16}`).join(' ')
  const lastY = 20 - ((series[series.length - 1] - min) / span) * 16
  return (
    <span className="relative block h-6" aria-hidden="true">
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="block h-6 w-full overflow-visible">
      <defs>
        <clipPath id={clip}>
          {/* Draws left to right by scaling the clip, so the line itself is never re-measured. */}
          <rect x="0" y="-4" width="100" height="32" style={{ transformOrigin: '0 0', transform: `scaleX(${drawn ? 1 : 0})`, transition: `transform ${DRAW_MS}ms ease-out 200ms` }} />
        </clipPath>
      </defs>
      <line x1="0" x2="100" y1="23.5" y2="23.5" stroke="var(--color-ink-10)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <polyline clipPath={`url(#${clip})`} points={points} fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
    {/* Today's weigh-in: an HTML dot so it stays round under the stretched viewBox. */}
    <span className="absolute right-0 size-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-ink transition-opacity duration-200" style={{ top: `${(lastY / 24) * 100}%`, opacity: drawn ? 1 : 0, transitionDelay: `${DRAW_MS + 200}ms` }} />
    </span>
  )
}

export interface HealthSource { label: string; syncedAt: string | null }

function sourceCaption(source: HealthSource | null, fallback: ReactNode): ReactNode {
  if (!source) return fallback
  if (!source.syncedAt) return source.label
  const time = new Date(source.syncedAt).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
  return `${source.label} · ${time}`
}

export function StepsTile({ today, yesterday, source, connectLabel, onConnect }: {
  today: number | null
  yesterday: number | null
  source: HealthSource | null
  /** Set on a phone whose Health app is not connected yet: the tile becomes one tap to connect (Q32). */
  connectLabel?: string | null
  onConnect?: () => void
}) {
  if (connectLabel && today === null) {
    return (
      <Tile icon={StepsFill} label="Steps" value="—" caption={`Connect ${connectLabel}`} onClick={onConnect} actionLabel={`connect ${connectLabel}`}>
        <span className="inline-flex h-8 items-center rounded-full bg-ink px-3 text-[13px] font-semibold text-cream">Connect</span>
      </Tile>
    )
  }
  return (
    <Tile
      icon={StepsFill}
      label="Steps"
      value={today === null ? '—' : <Count value={today} delay={0.2} />}
      caption={today === null ? (yesterday ? `Yesterday ${fmt(yesterday)}` : sourceCaption(source, 'Syncs from your phone')) : sourceCaption(source, 'of 10,000')}
    >
      <Progress fraction={(today ?? 0) / 10000} />
    </Tile>
  )
}

export function WeightTile({ kg, weekDelta, series, onLog }: { kg: number | null; weekDelta: number | null; series: number[]; onLog: () => void }) {
  const caption = kg === null ? 'Tap to log' : weekDelta === null ? 'No trend yet' : weekDelta === 0 ? 'No change this week' : `${weekDelta > 0 ? '+' : '−'}${Math.abs(weekDelta).toFixed(1)} kg this week`
  return (
    <Tile icon={WeightFill} label="Weight" value={kg === null ? '—' : kg.toFixed(1)} unit={kg === null ? undefined : 'kg'} caption={caption} onClick={onLog} actionLabel="log weight">
      <Sparkline series={series} />
    </Tile>
  )
}

export const WATER_GOAL_GLASSES = 8

export function WaterTile({ glasses, onLog }: { glasses: number; onLog: () => void }) {
  return (
    <Tile icon={WaterFill} label="Water" value={<Count value={glasses} delay={0.24} />} unit={`of ${WATER_GOAL_GLASSES}`} caption={glasses >= WATER_GOAL_GLASSES ? 'Done for today' : glasses ? 'glasses so far' : 'Tap to add a glass'} onClick={onLog} actionLabel="log water">
      <Progress fraction={glasses / WATER_GOAL_GLASSES} />
    </Tile>
  )
}

export const SLEEP_GOAL_HOURS = 8

export function SleepTile({ hours, nights, source, onLog }: { hours: number | null; nights: (number | null)[]; source: HealthSource | null; onLog: () => void }) {
  const logged = nights.filter((night): night is number => night !== null)
  // Seven nights collapse to one honest number (critic round 2: unlabelled squares said nothing).
  const average = logged.length >= 3 ? `${formatSleep(logged.reduce((a, b) => a + b, 0) / logged.length)} avg this week` : 'Last night'
  return (
    <Tile icon={SleepFill} label="Sleep" value={hours === null ? '—' : formatSleep(hours)} caption={hours === null ? 'Tap to log last night' : sourceCaption(source, average)} onClick={onLog} actionLabel="log sleep">
      <Progress fraction={(hours ?? 0) / SLEEP_GOAL_HOURS} />
    </Tile>
  )
}

// ── Today's meals ──

export function MealsCard({ rows, onOpen, onLog }: { rows: MealRow[]; onOpen: () => void; onLog: () => void }) {
  if (rows.length === 0) {
    return (
      <button type="button" onClick={onLog} className="flex min-h-16 w-full items-center justify-center rounded-[24px] border-[1.5px] border-dashed border-ink-20 text-[15px] font-semibold text-ink-65 transition-transform active:scale-[.98]">
        Nothing logged yet. Tap to add a meal
      </button>
    )
  }
  return (
    <section className={cn(CARD, 'overflow-hidden')} aria-label="Today's meals">
      {rows.map((row) => (
        <button key={row.meal} type="button" onClick={onOpen} className="flex min-h-16 w-full items-center gap-3 border-b border-ink-06 px-5 py-3 text-left last:border-b-0 active:bg-ink-04">
          <span className="min-w-0 flex-1">
            <span className="block text-[15.5px] font-semibold text-ink">{row.meal}</span>
            <span className="block truncate text-[13px] text-ink-65">{row.items.join(', ')}</span>
          </span>
          <span className="text-[15px] font-semibold text-ink tabular-nums">{fmt(row.kcal)}<span className="text-[13px] font-medium text-ink-65"> kcal</span></span>
          <ChevronRightIcon className="size-4 text-ink-35" />
        </button>
      ))}
    </section>
  )
}

// ── Check-in due (D3) ──

export function CheckInCard({ weekLabel, onOpen }: { weekLabel: string; onOpen: () => void }) {
  return (
    <section className={cn(CARD, 'p-5')} aria-label="Weekly check-in">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-ink text-cream"><ChartFill className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-wide text-[19px] font-bold leading-tight text-ink">Your week is ready</p>
          <p className="mt-0.5 truncate text-[14px] text-ink-65">{weekLabel}</p>
        </div>
      </div>
      <PrimaryButton type="button" className="mt-4 justify-center" onClick={onOpen}>See your week</PrimaryButton>
    </section>
  )
}

// ── Loading ──

export function HomeSkeleton() {
  return (
    <div className="mt-6 space-y-3" role="status" aria-busy="true" aria-label="Loading today">
      <div className={cn(CARD, 'shimmer h-[248px]')} />
      <div className="grid grid-cols-2 gap-[10px]">
        {[0, 1, 2, 3].map((index) => <div key={index} className="shimmer h-[148px] rounded-[22px] bg-card shadow-[var(--shadow-card)]" />)}
      </div>
      <div className={cn(CARD, 'shimmer h-[104px]')} />
    </div>
  )
}
