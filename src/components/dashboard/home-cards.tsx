'use client'

import type { ComponentType, ReactNode, SVGProps } from 'react'
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { ChartFill, ChevronRightIcon, SleepFill, StepsFill, WaterFill, WeightFill } from '@/components/ui/fiqr/icons'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import type { MacroKey } from '@/lib/macros'
import { DRAW_MS } from '@/lib/motion'
import { useCountUp } from '@/lib/use-count-up'
import { cn } from '@/lib/utils'
import { formatSleep, type MealRow } from './home-data'

const CARD = 'rounded-[24px] bg-card shadow-[var(--shadow-card)]'

/** Flips true one frame after mount so CSS transitions draw from empty (once per visit, Q23). */
function useDrawn(): boolean {
  const reduce = useReducedMotion()
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
  const shown = useCountUp(remaining)
  const r = 54
  const c = 2 * Math.PI * r
  const fraction = target > 0 ? Math.min(1, consumed / target) : 0
  return (
    <div className="relative size-[132px] shrink-0">
      <svg viewBox="0 0 132 132" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--color-ink-06)" strokeWidth="12" />
        <circle
          cx="66" cy="66" r={r} fill="none" stroke="var(--color-accent)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={drawn ? c * (1 - fraction) : c}
          style={{ transition: `stroke-dashoffset ${DRAW_MS + 400}ms cubic-bezier(.22,1,.36,1)`, opacity: fraction > 0 ? 1 : 0 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-wide text-[40px] font-[750] leading-none tracking-[-1px] text-ink tabular-nums">{fmt(shown)}</span>
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
    <section className={cn(CARD, 'p-5')} aria-label="Today's food">
      <div className="flex items-center gap-5">
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
        <p className="min-w-0 flex-1 text-[15px] leading-[1.45] text-ink">{geoLine}</p>
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
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-65">
        <Icon className="size-4" />{label}
      </span>
      <span className="mt-2 flex items-baseline gap-1">
        <span className="font-wide text-[28px] font-bold leading-none tracking-[-0.6px] text-ink tabular-nums">{value}</span>
        {unit ? <span className="text-[14px] font-semibold text-ink-65">{unit}</span> : null}
      </span>
      <span className="mt-auto block pt-3">{children}</span>
      {caption ? <span className="mt-2 block truncate text-[12px] font-medium text-ink-65">{caption}</span> : null}
      {actionLabel ? <span className="sr-only">, {actionLabel}</span> : null}
    </>
  )
  const className = cn('flex min-h-[148px] flex-col rounded-[22px] bg-card p-4 text-left shadow-[var(--shadow-card)]', onClick && 'transition-transform active:scale-[.97]')
  return onClick
    ? <button type="button" onClick={onClick} className={className}>{body}</button>
    : <div className={className}>{body}</div>
}

/** A filled bar of 20 segments; 0 to 1. */
function Segments({ fraction }: { fraction: number }) {
  const drawn = useDrawn()
  const filled = Math.round(Math.min(1, Math.max(0, fraction)) * 20)
  return (
    <span className="flex h-6 items-end gap-[2px]" aria-hidden="true">
      {Array.from({ length: 20 }, (_, index) => (
        <span
          key={index}
          className="h-full flex-1 origin-bottom rounded-[2px] transition-transform duration-500"
          style={{ background: index < filled ? 'var(--color-ink)' : 'var(--color-ink-06)', transform: drawn ? 'scaleY(1)' : 'scaleY(.2)', transitionDelay: `${200 + index * 20}ms` }}
        />
      ))}
    </span>
  )
}

function Sparkline({ series }: { series: number[] }) {
  const drawn = useDrawn()
  if (series.length < 2) return <span className="flex h-6 items-center" aria-hidden="true"><span className="h-0 w-full border-t-[1.5px] border-dashed border-ink-20" /></span>
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  const points = series.map((value, index) => `${(index / (series.length - 1)) * 100},${22 - ((value - min) / span) * 18}`).join(' ')
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="block h-6 w-full overflow-visible" aria-hidden="true">
      <polyline
        points={points} fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        pathLength={1} strokeDasharray={1} strokeDashoffset={drawn ? 0 : 1}
        style={{ transition: `stroke-dashoffset ${DRAW_MS}ms ease-out 200ms` }}
      />
    </svg>
  )
}

function NightStrip({ nights }: { nights: (number | null)[] }) {
  const drawn = useDrawn()
  const lastNight = nights[6] ? 6 : nights[5] ? 5 : -1
  return (
    <span className="flex h-6 items-end gap-[5px]" aria-hidden="true">
      {nights.map((hours, index) => (
        <span
          key={index}
          className="flex-1 origin-bottom rounded-[3px] transition-transform duration-500"
          style={{
            height: hours ? `${Math.max(18, Math.min(100, (hours / 10) * 100))}%` : '18%',
            background: hours ? (index === lastNight ? 'var(--color-ink)' : 'var(--color-ink-20)') : 'var(--color-ink-06)',
            transform: drawn ? 'scaleY(1)' : 'scaleY(0)',
            transitionDelay: `${200 + index * 40}ms`,
          }}
        />
      ))}
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
  const shown = useCountUp(today)
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
      value={today === null ? '—' : fmt(shown)}
      caption={today === null ? (yesterday ? `Yesterday ${fmt(yesterday)}` : sourceCaption(source, 'Syncs from your phone')) : sourceCaption(source, 'of 10,000')}
    >
      <Segments fraction={(today ?? 0) / 10000} />
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
  const shown = useCountUp(glasses)
  return (
    <Tile icon={WaterFill} label="Water" value={fmt(shown)} unit={`of ${WATER_GOAL_GLASSES}`} caption={glasses >= WATER_GOAL_GLASSES ? 'Done for today' : glasses ? 'glasses so far' : 'Tap to add a glass'} onClick={onLog} actionLabel="log water">
      <Segments fraction={glasses / WATER_GOAL_GLASSES} />
    </Tile>
  )
}

export function SleepTile({ hours, nights, source, onLog }: { hours: number | null; nights: (number | null)[]; source: HealthSource | null; onLog: () => void }) {
  return (
    <Tile icon={SleepFill} label="Sleep" value={hours === null ? '—' : formatSleep(hours)} caption={hours === null ? 'Tap to log last night' : sourceCaption(source, 'Last night')} onClick={onLog} actionLabel="log sleep">
      <NightStrip nights={nights} />
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
