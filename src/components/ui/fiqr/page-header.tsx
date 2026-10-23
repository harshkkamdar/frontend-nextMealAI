import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  eyebrow?: ReactNode
  sub?: ReactNode
  onBack?: () => void
  backLabel?: string
  trailing?: ReactNode
  className?: string
}

/** One header for every screen: optional 44px back chevron, left-aligned 22/600 title clamped to two lines. */
export function PageHeader({ title, eyebrow, sub, onBack, backLabel = 'Back', trailing, className }: PageHeaderProps) {
  return (
    <header className={cn('flex items-start gap-1', className)}>
      {onBack ? (
        <button type="button" onClick={onBack} aria-label={backLabel} className="-ml-[11px] flex size-11 shrink-0 items-center justify-center text-ink">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5-7 7 7 7" /></svg>
        </button>
      ) : null}
      <div className={cn('min-w-0 flex-1', onBack && 'pt-[7px]')}>
        {eyebrow ? <p className="truncate text-[12px] font-medium uppercase tracking-[1.4px] text-ink-65">{eyebrow}</p> : null}
        <h1 className="line-clamp-2 text-[22px] font-semibold leading-[1.2] tracking-[-0.4px] text-ink">{title}</h1>
        {sub ? <p className="mt-1 text-[13.5px] text-ink-65">{sub}</p> : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </header>
  )
}
