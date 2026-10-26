'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import type { MacroKey } from '@/lib/macros'
import { DRAW_MS } from '@/lib/motion'
import { CountUp } from '@/components/ui/fiqr/count-up'
import { usePressTilt } from '@/components/ui/fiqr/press-tilt'
import { cn } from '@/lib/utils'
import { formatSleep, type MealRow } from './home-data'
import { AlertIcon, HeartIcon, PlusLine, SparkleIcon } from './home-icons'

export const CARD = 'rounded-[22px] card-glass'

/** False on a revisit in the same session: charts and numbers paint at rest instead of drawing again (motion-feel 7). */
export const HomeEntrance = createContext(true)

function Count(props: { value: number; delay?: number }) {
  return <CountUp {...props} still={!useContext(HomeEntrance)} />
}

/** Flips true one frame after mount so CSS transitions draw from empty (first paint per session, Q23). */
export function useDrawn(): boolean {
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

// ── Rings ──

/** One progress ring, 0 to 1, drawn from empty once per visit. Used by the hero and the macro sheet. */
export function ArcRing({ fraction, color, stroke = 10, className, children }: { fraction: number; color: string; stroke?: number; className?: string; children?: ReactNode }) {
  const drawn = useDrawn()
  const r = 50 - stroke / 2
  const c = 2 * Math.PI * r
  const f = Math.min(1, Math.max(0, fraction))
  // Round caps add half the stroke at each end; shorten the dash by one stroke so the arc equals the fraction.
  const offset = f >= 1 ? 0 : Math.min(c, c * (1 - f) + stroke)
  return (
    <span className={cn('relative block shrink-0', className)}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-ink-06)" strokeWidth={stroke} />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={drawn ? offset : c}
          style={{ transition: `stroke-dashoffset ${DRAW_MS + 400}ms cubic-bezier(.22,1,.36,1)`, opacity: f > 0 ? 1 : 0 }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">{children}</span>
    </span>
  )
}

// ── Hero: ring first, macro dots, Geo's line with one action (Q17, D1) ──

interface Macro { key: Exclude<MacroKey, 'calories'>; label: string; current: number; target: number; color: string }

function MacroDots({ macro, onOpen }: { macro: Macro; onOpen: () => void }) {
  const drawn = useDrawn()
  const steps = macro.target > 0 ? Math.min(10, Math.round((macro.current / macro.target) * 10)) : 0
  return (
    <button type="button" onClick={onOpen} className="flex min-h-11 w-full flex-col justify-center text-left">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-caption font-semibold text-ink-65">{macro.label}</span>
        <span className="text-caption font-medium text-ink-65 tabular-nums">
          <b className="font-bold text-ink">{fmt(macro.current)}</b> / {macro.target > 0 ? fmt(macro.target) : '—'} g
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

export interface HeroAction {
  label: string
  /** Full name for screen readers when the chip label is cut short. */
  ariaLabel?: string
  busy?: boolean
  onRun: () => void
  /** "Other ideas" opens Geo; left out when the action already opens something. */
  onMore?: () => void
}

interface HeroCardProps {
  calories: { current: number; target: number }
  macros: { protein: [number, number]; carbs: [number, number]; fat: [number, number] }
  geoLine: ReactNode
  action: HeroAction | null
  onOpenMacro: (macro: MacroKey) => void
}

export function HeroCard({ calories, macros, geoLine, action, onOpenMacro }: HeroCardProps) {
  const list: Macro[] = [
    { key: 'protein', label: 'Protein', current: macros.protein[0], target: macros.protein[1], color: 'var(--color-ink)' },
    { key: 'carbs', label: 'Carbs', current: macros.carbs[0], target: macros.carbs[1], color: 'var(--color-macro-teal)' },
    { key: 'fat', label: 'Fat', current: macros.fat[0], target: macros.fat[1], color: 'var(--color-macro-ochre)' },
  ]
  const { current, target } = calories
  const over = target > 0 && current > target
  const remaining = target > 0 ? Math.abs(target - current) : current
  return (
    <section className={cn(CARD, 'p-4')} aria-label="Today's food">
      <div className="flex items-center gap-[14px]">
        <button type="button" onClick={() => onOpenMacro('calories')} className="rounded-full transition-transform active:scale-[.97]">
          <ArcRing fraction={target > 0 ? current / target : 0} color="var(--color-accent)" stroke={11} className="size-ring">
            <span className="font-display text-hero leading-none text-ink tabular-nums"><Count value={remaining} /></span>
            <span className="mt-1 text-label font-medium text-ink-65">{target > 0 ? (over ? 'kcal over' : 'kcal left') : 'kcal today'}</span>
          </ArcRing>
          <span className="sr-only">, {fmt(current)} of {fmt(target)} kcal eaten, show breakdown</span>
        </button>
        <div className="min-w-0 flex-1">
          {list.map((macro) => <MacroDots key={macro.key} macro={macro} onOpen={() => onOpenMacro(macro.key)} />)}
        </div>
      </div>
      <div className="mt-3 flex items-start gap-3 border-t border-ink-06 pt-3">
        <SparkleIcon className="mt-0.5 size-5 shrink-0 text-ink" />
        <div className="min-w-0 flex-1">
          <p className="text-body-sm text-ink">{geoLine}</p>
          {action ? (
            <div className="mt-2.5 flex items-center gap-4">
              <button
                type="button"
                onClick={action.onRun}
                disabled={action.busy}
                aria-label={action.ariaLabel}
                className="h-chip max-w-[62%] truncate rounded-full bg-ink px-4 text-body-sm font-bold text-cream transition-transform active:scale-[.97] disabled:opacity-60"
              >
                {action.label}
              </button>
              {action.onMore ? (
                <button type="button" onClick={action.onMore} className="min-h-11 text-body-sm font-bold text-ink underline decoration-1 underline-offset-[3px]">
                  Other ideas
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/** In-block error: the hero says what failed and offers Retry; nothing else pretends to be zero. */
export function HomeErrorCard({ savedAt, onRetry }: { savedAt: string | null; onRetry: () => void }) {
  const when = savedAt ? new Date(savedAt).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }) : null
  return (
    <section className={cn(CARD, 'p-4')} aria-label="Today's food" role="alert">
      <div className="flex items-start gap-2.5">
        <AlertIcon className="mt-0.5 size-5 shrink-0 text-accent" />
        <p className="text-body-sm text-ink">Couldn&apos;t load today&apos;s food.{when ? ` Last updated ${when}.` : ' Check your connection and try again.'}</p>
      </div>
      <button type="button" onClick={onRetry} className="ml-[22px] mt-1 min-h-11 min-w-11 px-2 text-body-sm font-bold text-ink underline decoration-1 underline-offset-[3px]">Retry</button>
    </section>
  )
}

// ── Tiles, log first: Water, Weight, Steps, Sleep (Q32) ──

const TILE = 'flex min-h-tile flex-col rounded-[20px] card-glass p-[14px] text-left'

function TileBody({ label, value, unit, caption, children }: { label: string; value: ReactNode; unit?: string; caption?: ReactNode; children?: ReactNode }) {
  return (
    <>
      <span className="text-caption font-semibold text-ink-65">{label}</span>
      <span className="mt-1.5 flex items-baseline gap-1">
        <span className="font-display text-hero leading-none text-ink tabular-nums">{value}</span>
        {unit ? <span className="text-caption font-semibold text-ink-65">{unit}</span> : null}
      </span>
      <span className="mt-auto block pt-2">{children}</span>
      {caption ? <span className="mt-1.5 flex min-w-0 items-center gap-1 text-label font-medium text-ink-65"><span className="flex min-w-0 items-center gap-1 truncate">{caption}</span></span> : null}
    </>
  )
}

function TileButton({ onClick, label, className, children }: { onClick?: () => void; label: string; className?: string; children: ReactNode }) {
  const tilt = usePressTilt<HTMLButtonElement>(5)
  return <button type="button" onClick={onClick} aria-label={label} className={cn(TILE, 'w-full', className)} {...tilt}>{children}</button>
}

/** One thin progress line, 0 to 1; grows from the left once per visit. */
function Progress({ fraction }: { fraction: number }) {
  const drawn = useDrawn()
  const f = Math.min(1, Math.max(0, fraction))
  return (
    <span className="flex h-3 items-end" aria-hidden="true">
      <span className="relative block h-[6px] w-full overflow-hidden rounded-full bg-ink-06">
        <span
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-ink transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
          style={{ transform: `scaleX(${drawn ? f : 0})`, transitionDelay: '200ms' }}
        />
      </span>
    </span>
  )
}

const Dash = () => <span className="inline-block h-[3px] w-4 -translate-y-1.5 rounded-full bg-ink-20" aria-hidden="true" />

export interface HealthSource { label: string; syncedAt: string | null }

function Synced({ source }: { source: HealthSource }) {
  const time = source.syncedAt ? new Date(source.syncedAt).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }) : null
  return <><HeartIcon className="size-3.5 shrink-0" />{time ? `Synced ${time}` : source.label}</>
}

export const WATER_GOAL_GLASSES = 8

export function WaterTile({ glasses, onOpen, onAdd }: { glasses: number; onOpen: () => void; onAdd: () => void }) {
  return (
    <div className="relative">
      <TileButton onClick={onOpen} label={`Water ${glasses} of ${WATER_GOAL_GLASSES} glasses, open water log`}>
        <TileBody label="Water" value={<Count value={glasses} delay={0.16} />} unit={`of ${WATER_GOAL_GLASSES}`} caption={glasses >= WATER_GOAL_GLASSES ? 'Done for today' : glasses ? 'glasses so far' : 'None yet today'}>
          <Progress fraction={glasses / WATER_GOAL_GLASSES} />
        </TileBody>
      </TileButton>
      {/* One tap adds a glass (Tiles: log first); it sits over the tile, not inside its button. */}
      <button type="button" onClick={onAdd} aria-label="Add one glass of water" className="absolute right-2.5 top-2.5 grid size-11 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.92]">
        <PlusLine className="size-5" />
      </button>
    </div>
  )
}

export function weightDeltaText(weekDelta: number | null): string | null {
  if (weekDelta === null) return null
  return weekDelta === 0 ? 'No change' : `${weekDelta > 0 ? '+' : '−'}${Math.abs(weekDelta).toFixed(1)} kg`
}

export function WeightTile({ kg, weekDelta, onLog }: { kg: number | null; weekDelta: number | null; onLog: () => void }) {
  const delta = weightDeltaText(weekDelta)
  const caption = kg === null ? 'Tap to log' : delta === null ? 'No trend yet' : (
    <span><b className={cn('font-semibold', weekDelta !== null && weekDelta < 0 ? 'text-macro-teal' : 'text-ink')}>{delta}</b> this week</span>
  )
  return (
    <TileButton onClick={onLog} label={`Weight ${kg === null ? 'not logged' : `${kg.toFixed(1)} kg`}, log weight`}>
      <TileBody label="Weight" value={kg === null ? <Dash /> : kg.toFixed(1)} unit={kg === null ? undefined : 'kg'} caption={caption} />
    </TileButton>
  )
}

export function StepsTile({ today, yesterday, source, connectLabel, onConnect, onOpen }: {
  today: number | null
  yesterday: number | null
  source: HealthSource | null
  /** Set on a phone whose Health app is not connected yet: the tile becomes one tap to connect (Q32). */
  connectLabel?: string | null
  onConnect?: () => void
  onOpen: () => void
}) {
  if (connectLabel && today === null) {
    return (
      <TileButton onClick={onConnect} label={`Steps. Connect ${connectLabel}`}>
        <TileBody label="Steps" value={<Dash />} caption={connectLabel}>
          <span className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-caption font-bold text-cream">Connect</span>
        </TileBody>
      </TileButton>
    )
  }
  const caption = today === null ? (yesterday ? `Yesterday ${fmt(yesterday)}` : 'Syncs from your phone') : source ? <Synced source={source} /> : 'of 10,000'
  return (
    <TileButton onClick={onOpen} label={`Steps ${today === null ? 'none yet' : fmt(today)}, open the week`}>
      <TileBody label="Steps" value={today === null ? <Dash /> : <Count value={today} delay={0.2} />} caption={caption}>
        <Progress fraction={(today ?? 0) / 10000} />
      </TileBody>
    </TileButton>
  )
}

export const SLEEP_GOAL_HOURS = 8

export function SleepTile({ hours, nights, source, onOpen }: { hours: number | null; nights: (number | null)[]; source: HealthSource | null; onOpen: () => void }) {
  const logged = nights.filter((night): night is number => night !== null)
  const average = logged.length >= 3 ? `${formatSleep(logged.reduce((a, b) => a + b, 0) / logged.length)} avg this week` : 'Last night'
  return (
    <TileButton onClick={onOpen} label={`Sleep ${hours === null ? 'not logged' : formatSleep(hours)}, ${hours === null ? 'log last night' : 'open the week'}`}>
      <TileBody label="Sleep" value={hours === null ? <Dash /> : formatSleep(hours)} caption={hours === null ? 'Not logged' : source ? <Synced source={source} /> : average}>
        <Progress fraction={(hours ?? 0) / SLEEP_GOAL_HOURS} />
      </TileBody>
    </TileButton>
  )
}

// ── Today's meals ──

export function MealsCard({ rows, onOpen, onLog }: { rows: MealRow[]; onOpen: () => void; onLog: () => void }) {
  if (rows.length === 0) {
    return (
      <button type="button" onClick={onLog} className="flex min-h-16 w-full items-center justify-center rounded-[22px] border-[1.5px] border-dashed border-ink-20 text-body-sm font-semibold text-ink-65 transition-transform active:scale-[.98]">
        Nothing logged yet. Tap to add a meal
      </button>
    )
  }
  return (
    <section className={cn(CARD, 'overflow-hidden')} aria-label="Today's meals">
      {rows.map((row) => (
        <button key={row.meal} type="button" onClick={onOpen} className="flex min-h-row w-full items-center gap-3 border-b border-ink-06 px-4 py-2.5 text-left last:border-b-0 active:bg-ink-04">
          <span className="min-w-0 flex-1">
            <span className="block text-body font-semibold text-ink">{row.meal}</span>
            <span className="block truncate text-caption text-ink-65">{row.items.join(', ')}</span>
          </span>
          <span className="text-body-sm font-semibold text-ink tabular-nums">{fmt(row.kcal)}<span className="text-caption font-medium text-ink-65"> kcal</span></span>
          <ChevronRightIcon className="size-4 text-ink-35" />
        </button>
      ))}
    </section>
  )
}

// ── Check-in due (D3): the day's one orange action ──

export function CheckInCard({ weekLabel, daysLogged, onOpen }: { weekLabel: string; daysLogged: number | null; onOpen: () => void }) {
  return (
    <section className={cn(CARD, 'p-4')} aria-label="Weekly check-in">
      <h2 className="text-headline text-ink">Your week is ready</h2>
      <p className="mt-0.5 truncate text-caption text-ink-65">{weekLabel}{daysLogged !== null ? `, ${daysLogged} of 7 days logged` : ''}</p>
      <PrimaryButton type="button" className="mt-3" onClick={onOpen}>See your week</PrimaryButton>
    </section>
  )
}

// ── Loading: the final layout with flat placeholders at real size, so nothing shifts when data lands ──

const Ph = ({ className }: { className: string }) => <span className={cn('block rounded-full bg-ink-06', className)} />

export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-[10px]" role="status" aria-busy="true" aria-label="Loading today">
      <div className={cn(CARD, 'flex items-center gap-[14px] p-4')}>
        <span className="grid size-ring shrink-0 place-items-center rounded-full border-[11px] border-ink-06"><Ph className="h-6 w-14" /></span>
        <span className="flex flex-1 flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex flex-col gap-2">
              <span className="flex justify-between"><Ph className="h-3 w-11" /><Ph className="h-3 w-14" /></span>
              <span className="flex gap-[3px]">{Array.from({ length: 10 }, (_, d) => <Ph key={d} className="h-[6px] flex-1" />)}</span>
            </span>
          ))}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        {['Water', 'Weight', 'Steps', 'Sleep'].map((label) => (
          <div key={label} className={cn(TILE, 'gap-3')}>
            <span className="text-caption font-semibold text-ink-65">{label}</span>
            <Ph className="h-6 w-16" />
            <Ph className="mt-auto h-[6px] w-full" />
          </div>
        ))}
      </div>
      <div className={cn(CARD, 'h-[92px] p-4')}><Ph className="h-3 w-14" /><Ph className="mt-3 h-5 w-36" /></div>
      <span className="mt-2 px-1 text-caption font-semibold text-ink-65">Meals</span>
      <div className={cn(CARD, 'h-[116px] p-4')}><Ph className="h-4 w-20" /><Ph className="mt-2 h-3 w-40" /><Ph className="mt-6 h-4 w-16" /></div>
    </div>
  )
}
