import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface MetricItem {
  label: string
  value: ReactNode
  unit?: string
  sub?: ReactNode
  onClick?: () => void
  ariaLabel?: string
}

/**
 * George's metric tiles as one strip (DESIGN.md component 6): a single white tile split into columns by hairlines,
 * so the quiet metrics read as one row instead of a grid of boxes. Each column opens its detail.
 */
export function MetricStrip({ items, className }: { items: MetricItem[]; className?: string }) {
  return (
    <div className={cn('grid divide-x divide-ink-09 overflow-hidden rounded-[16px] border border-ink-12 bg-card', className)} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => {
        const body = (
          <>
            <span className="block text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-62">{item.label}</span>
            <span className="mt-[3px] flex items-baseline gap-[2px]">
              <span className="truncate text-[19px] font-semibold tracking-[-0.3px] text-ink tabular-nums">{item.value}</span>
              {item.unit ? <span className="text-[13px] font-medium text-ink-62">{item.unit}</span> : null}
            </span>
            {item.sub ? <span className="mt-[2px] block truncate text-[12px] text-ink-62">{item.sub}</span> : null}
          </>
        )
        return item.onClick ? (
          <button key={item.label} type="button" onClick={item.onClick} aria-label={item.ariaLabel} className="min-h-[76px] min-w-0 px-[12px] py-[13px] text-left transition-colors active:bg-ink-04">
            {body}
          </button>
        ) : (
          <div key={item.label} className="min-h-[76px] min-w-0 px-[12px] py-[13px]">{body}</div>
        )
      })}
    </div>
  )
}
