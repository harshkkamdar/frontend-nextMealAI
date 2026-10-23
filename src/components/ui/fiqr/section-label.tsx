import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function SectionLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-65', className)} {...props} />
}
