import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface StatTile {
  label: string
  value: ReactNode
  unit?: string
  sub?: ReactNode
}

/** The week in numbers: white tiles, two per row (tile radius 22); they rise in after the hero on first paint. */
export function StatTiles({ items, enter }: { items: StatTile[]; enter?: boolean }) {
  return (
    <div className={cn('grid grid-cols-2 gap-[10px]', enter && 'enter-tiles')}>
      {items.map((item) => (
        <div key={item.label} className="flex min-h-[112px] flex-col rounded-[22px] bg-card p-4 shadow-[var(--shadow-card)]">
          <span className="text-[13px] font-semibold text-ink-65">{item.label}</span>
          <span className="mt-2 flex items-baseline gap-1">
            <span className="font-wide text-[28px] font-bold leading-none tracking-[-0.6px] text-ink tabular-nums">{item.value}</span>
            {item.unit && item.value !== '—' ? <span className="text-[14px] font-semibold text-ink-65">{item.unit}</span> : null}
          </span>
          {item.sub ? <span className="mt-auto block truncate pt-3 text-[12px] font-medium text-ink-65">{item.sub}</span> : null}
        </div>
      ))}
    </div>
  )
}
