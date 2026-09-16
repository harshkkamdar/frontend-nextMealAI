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
    <div className={cn('bg-card rounded-[16px] border border-ink-12 px-[14px] py-[13px]', className)} {...props}>
      <div className="text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-62">{label}</div>
      <div className="flex items-baseline gap-[3px]">
        <span className="text-[19px] font-semibold tracking-[-0.3px] text-ink">{value}</span>
        {unit ? <span className="text-[13px] font-medium text-ink-55">{unit}</span> : null}
      </div>
      {sub ? <div className="text-[12px] text-ink-55">{sub}</div> : null}
    </div>
  )
}
