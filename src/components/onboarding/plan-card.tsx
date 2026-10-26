import type { CSSProperties, ReactNode } from 'react'
import { auroraSurface } from '@/components/onboarding/aurora'
import { cn } from '@/lib/utils'

/** The one card the plan screens share: the checklist while Geo builds, then the plan in the same place and size. */
/** `carried`: the card was already on screen (the build checklist), so it does not rise in again. */
export function PlanCard({ label, carried, className, children }: { label?: string; carried?: boolean; className?: string; children: ReactNode }) {
  return (
    <section aria-label={label} style={{ '--i': 2 } as CSSProperties} className={cn('min-h-[300px] rounded-[28px] p-3.5', !carried && 'rise', auroraSurface, className)}>
      {children}
    </section>
  )
}
