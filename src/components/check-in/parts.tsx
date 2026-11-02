'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { CARD, HueDot, SectionHeading, TextButton } from '@/components/plans/spatial-parts'
import { CountUp } from '@/components/ui/fiqr/count-up'
import { healthLabel, isHealthConnected } from '@/lib/platform/health'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'

import type { DayTargets } from './apply-targets'

export { CARD, INK_BUTTON } from '@/components/plans/spatial-parts'

/** False on a revisit in the same session: numbers and charts paint at rest (motion-feel principle 7). */
export const CheckInEntrance = createContext(true)

/** Flips true one frame after mount so CSS transitions draw from empty, first paint only (Q23). */
export function useDrawn(): boolean {
  const reduced = useReducedMotion()
  const entering = useContext(CheckInEntrance)
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return drawn || !!reduced || !entering
}

export function Count({ value, format }: { value: number; format?: (n: number) => string }) {
  return <CountUp value={value} format={format} still={!useContext(CheckInEntrance)} />
}

/** "Apple Health" or "Health Connect" when the phone's Health app feeds the data, so it can be labelled (Q32). */
export function useHealthSource(): string | null {
  const label = healthLabel()
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    if (label) void isHealthConnected().then(setConnected)
  }, [label])
  return label && connected ? label : null
}

export const SectionTitle = SectionHeading

/** Geo's read of the week (George): the navy card with the largest type on the screen; the data below is evidence. */
export function GeoRead({ verdict, aside, children, className }: { verdict: string | null; aside: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-[22px] bg-ink p-[22px] text-cream', className)} aria-label="Geo's read">
      <div className="flex items-center gap-[9px]">
        <GeoAvatar size={22} onNavy />
        <span className="text-[11.5px] font-semibold uppercase tracking-[1.8px] text-cream-55">Geo&apos;s read</span>
        <span className="ml-auto text-[12px] font-medium text-cream-60 tabular-nums">{aside}</span>
      </div>
      {children}
      {verdict ? <p className="mt-[14px] text-pretty text-[21px] font-semibold leading-[1.3] tracking-[-0.3px] text-cream">{verdict}</p> : null}
    </section>
  )
}

/** George's tile label: 11 / 600, uppercase, tracked. */
export const TILE_LABEL = 'text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-62'

export function AskGeo({ label = 'Ask Geo about this' }: { label?: string }) {
  return <TextButton className="mt-1" onClick={() => useUIStore.getState().openSheet('geo-companion')}>{label}</TextButton>
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

/** The four daily targets as rows, each with its macro hue (the mock's ledger, keep mode). */
export function TargetLedger({ targets }: { targets: Partial<Record<keyof DayTargets, number | null>> }) {
  const rows = [['Calories', 'calories', 'kcal'], ['Protein', 'protein', 'g'], ['Carbs', 'carbs', 'g'], ['Fat', 'fat', 'g']] as const
  return (
    <div className={cn(CARD, 'overflow-hidden')}>
      {rows.map(([label, key, unit]) => {
        const value = targets[key]
        return (
          <div key={key} className="flex min-h-[60px] items-center gap-2.5 border-b border-ink-06 px-4 py-2.5 last:border-b-0">
            <span className="flex flex-1 items-center gap-2 text-body font-semibold text-ink"><HueDot macro={key} />{label}</span>
            <span className="flex items-baseline gap-1.5 whitespace-nowrap tabular-nums">
              <b className="text-[19px] font-semibold tracking-[-0.3px] text-ink">{value == null ? '—' : fmt(value)}</b>
              {value == null ? null : <span className="text-caption font-semibold text-ink-65">{unit}</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}
