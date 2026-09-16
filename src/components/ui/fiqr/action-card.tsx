import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function ActionCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-accent text-cream rounded-[18px] px-[18px] py-4 shadow-[var(--shadow-action)]', className)} {...props} />
}
