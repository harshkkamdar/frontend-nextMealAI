'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { useDrawn } from './parts'

interface StatTile {
  label: string
  value: ReactNode
  unit?: string
  sub?: ReactNode
  /** Share of the target reached (0..1); null when there is nothing to compare. */
  fraction?: number | null
}

/** value / target, or null when either side is missing. */
export const ratio = (value: number | null, target: number | null) => (value === null || !target ? null : value / target)

function Meter({ fraction, index }: { fraction: number; index: number }) {
  const drawn = useDrawn()
  return (
    <span aria-hidden="true" className="relative mt-3 block h-[3px] overflow-hidden rounded-full bg-ink-06">
      <span
        className="absolute inset-0 origin-left rounded-full bg-ink transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
        style={{ transform: `scaleX(${drawn ? Math.min(1, Math.max(0, fraction)) : 0})`, transitionDelay: `${300 + index * 40}ms` }}
      />
    </span>
  )
}

/** The week in numbers: white tiles, two per row (tile radius 22), each with a hairline against its target. */
export function StatTiles({ items, enter }: { items: StatTile[]; enter?: boolean }) {
  return (
    <div className={cn('grid grid-cols-2 gap-[10px]', enter && 'enter-tiles')}>
      {items.map((item, index) => (
        <div key={item.label} className="flex flex-col rounded-[22px] bg-card p-5 shadow-[var(--shadow-card)]">
          <span className="text-[13px] font-semibold text-ink-65">{item.label}</span>
          <span className="mt-1.5 flex items-baseline gap-1">
            <span className="font-wide text-[28px] font-bold leading-none tracking-[-0.6px] text-ink tabular-nums">{item.value}</span>
            {item.unit && item.value !== '—' ? <span className="text-[14px] font-semibold text-ink-65">{item.unit}</span> : null}
          </span>
          {item.fraction == null ? null : <Meter fraction={item.fraction} index={index} />}
          {item.sub ? <span className="mt-2 block truncate text-[12px] font-medium text-ink-65">{item.sub}</span> : null}
        </div>
      ))}
    </div>
  )
}
