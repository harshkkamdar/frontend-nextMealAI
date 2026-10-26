import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MetricTileProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  sub?: ReactNode
}

export function MetricTile({ label, value, unit, sub, className, ...props }: MetricTileProps) {
  return (
    <div className={cn('bg-card rounded-[20px] border border-ink-12 p-[14px]', className)} {...props}>
      <div className="text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-65">{label}</div>
      <div className="flex items-baseline gap-[3px]">
        <span className="text-[19px] font-semibold tracking-[-0.3px] text-ink">{value}</span>
        {unit ? <span className="text-[13px] font-medium text-ink-65">{unit}</span> : null}
      </div>
      {sub ? <div className="text-[12px] text-ink-65">{sub}</div> : null}
    </div>
  )
}
