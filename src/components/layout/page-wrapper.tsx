import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function PageWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-md px-4 py-6', className)}>
      {children}
    </div>
  )
}
