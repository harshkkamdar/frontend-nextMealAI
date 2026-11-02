'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { CARD, TILE_LABEL } from './parts'

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

/** The week in numbers (George's tiles): one quiet white tile split by hairlines; the caption carries the target. */
export function StatTiles({ items, enter }: { items: StatTile[]; enter?: boolean }) {
  return (
    <div className={cn(CARD, 'grid grid-cols-2 overflow-hidden', enter && 'enter-tiles')}>
      {items.map((item, index) => (
        <div key={item.label} className={cn('flex flex-col px-[14px] py-[13px]', index % 2 === 1 && 'border-l border-ink-09', index > 1 && 'border-t border-ink-09')}>
          <span className={TILE_LABEL}>{item.label}</span>
          <span className="mt-[3px] flex items-baseline gap-[2px]">
            <span className="text-[19px] font-semibold tracking-[-0.3px] text-ink tabular-nums">{item.value}</span>
            {item.unit && item.value !== '—' ? <span className="text-[13px] font-medium text-ink-62">{item.unit}</span> : null}
          </span>
          {item.sub ? <span className="mt-[2px] block truncate text-[12.5px] text-ink-62">{item.sub}</span> : null}
        </div>
      ))}
    </div>
  )
}
