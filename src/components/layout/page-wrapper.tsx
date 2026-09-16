import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function PageWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('mx-auto w-full max-w-md px-gutter pb-6', className)}
      style={{ paddingTop: 'calc(20px + var(--safe-top))' }}
    >
      {children}
    </div>
  )
}
