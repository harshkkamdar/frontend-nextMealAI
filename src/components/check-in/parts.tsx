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

/** Geo's read of the week: avatar, label, a right-hand note (the week's change or the dates), the verdict. */
export function GeoRead({ verdict, aside, children, className }: { verdict: string | null; aside: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={cn(CARD, 'p-4', className)} aria-label="Geo's read">
      <div className="flex items-center gap-2">
        <GeoAvatar size={24} />
        <span className="text-label text-ink-65">Geo&apos;s read</span>
        <span className="ml-auto text-label text-ink-65 tabular-nums">{aside}</span>
      </div>
      {children}
      {verdict ? <p className="mt-3 text-pretty text-body leading-[1.45] text-ink">{verdict}</p> : null}
    </section>
  )
}

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
              <b className="font-display text-[20px] font-[800] tracking-[-0.015em] text-ink">{value == null ? '—' : fmt(value)}</b>
              {value == null ? null : <span className="text-caption font-semibold text-ink-65">{unit}</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}
