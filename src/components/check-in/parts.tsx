'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { CountUp } from '@/components/ui/fiqr/count-up'
import { healthLabel, isHealthConnected } from '@/lib/platform/health'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'

export const CARD = 'rounded-[24px] bg-card shadow-[var(--shadow-card)]'

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

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 text-[13px] font-semibold text-ink-65">{children}</h2>
}

/** Geo's read of the week: an optional hero number above the verdict. */
export function GeoRead({ verdict, week, children, className }: { verdict: string | null; week: string; children?: ReactNode; className?: string }) {
  return (
    <section className={cn(CARD, 'p-5', className)} aria-label="Geo's read">
      <div className="flex items-center gap-2.5">
        <GeoAvatar size={28} />
        <span className="text-[13px] font-semibold text-ink-65">Geo&apos;s read</span>
        <span className="ml-auto text-[13px] font-medium text-ink-65">{week}</span>
      </div>
      {children}
      {verdict ? <p className="mt-4 text-pretty text-[15px] leading-[1.5] text-ink-80">{verdict}</p> : null}
    </section>
  )
}

export function AskGeo() {
  return (
    <button
      className="mx-auto flex min-h-11 items-center px-4 text-[15px] font-semibold text-ink-65 transition-transform active:scale-[.97]"
      onClick={() => useUIStore.getState().openSheet('geo-companion')}
      type="button"
    >
      Ask Geo about this
    </button>
  )
}

/** Ink action for the calm path (keep targets, done). Never orange: the screen's one orange action is Apply. */
export const INK_BUTTON = 'flex h-[58px] w-full items-center justify-center rounded-[18px] bg-ink text-[18px] font-bold text-cream transition-transform enabled:active:scale-[.97] disabled:bg-ink-08 disabled:text-ink-35'
