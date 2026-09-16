import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function FeatureCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-ink text-cream rounded-[22px] p-[22px]', className)} {...props} />
}
