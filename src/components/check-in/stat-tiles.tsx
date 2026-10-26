'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { CARD, useDrawn } from './parts'

interface StatTile {
  label: string
  value: ReactNode
  unit?: string
  sub?: ReactNode
  /** Share of the target reached (0..1+); null when there is nothing to compare. */
  fraction?: number | null
}

/** value / target, or null when either side is missing. */
export const ratio = (value: number | null, target: number | null) => (value === null || !target ? null : value / target)

/** The track runs to 125% of target so the target is a tick, and over or under reads against it. */
const SPAN = 1.25

function Meter({ fraction, index }: { fraction: number; index: number }) {
  const drawn = useDrawn()
  return (
    <span aria-hidden="true" className="relative mt-2.5 block h-[3px] rounded-full bg-ink-06">
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <span
          className="absolute inset-0 origin-left rounded-full bg-ink-65 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
          style={{ transform: `scaleX(${drawn ? Math.min(SPAN, Math.max(0, fraction)) / SPAN : 0})`, transitionDelay: `${300 + index * 40}ms` }}
        />
      </span>
      <span className="absolute -top-[3px] h-[9px] w-[1.5px] rounded-full bg-ink" style={{ left: `${100 / SPAN}%` }} />
    </span>
  )
}

/** The week in numbers: one quiet card, two columns, secondary to the weight trend above it. */
export function StatTiles({ items, enter }: { items: StatTile[]; enter?: boolean }) {
  return (
    <div className={cn(CARD, 'grid grid-cols-2 overflow-hidden', enter && 'enter-tiles')}>
      {items.map((item, index) => (
        <div key={item.label} className={cn('flex flex-col px-5 py-4', index % 2 === 1 && 'border-l border-ink-06', index > 1 && 'border-t border-ink-06')}>
          <span className="text-[13px] font-semibold text-ink-65">{item.label}</span>
          <span className="mt-1 flex h-6 items-baseline gap-1">
            <span className="font-wide text-[20px] font-bold leading-none tracking-[-0.3px] text-ink tabular-nums">{item.value}</span>
            {item.unit && item.value !== '—' ? <span className="text-[13px] font-semibold text-ink-65">{item.unit}</span> : null}
          </span>
          {item.fraction == null ? null : <Meter fraction={item.fraction} index={index} />}
          {item.sub ? <span className="mt-2 block truncate text-[12px] font-medium text-ink-65">{item.sub}</span> : null}
        </div>
      ))}
    </div>
  )
}
