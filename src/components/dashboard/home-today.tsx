'use client'

import { cn } from '@/lib/utils'

/** The week is ready: a quiet row that leads to Check-in (the screen's orange stays on Log food). */
export function CheckInDueRow({ weekLabel, daysLogged, onOpen, className }: { weekLabel: string; daysLogged: number | null; onOpen: () => void; className?: string }) {
  return (
    <button type="button" onClick={onOpen} className={cn('flex min-h-14 w-full items-center gap-3 rounded-[16px] border border-ink-12 bg-card px-4 py-3 text-left active:bg-ink-04', className)}>
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-semibold text-ink">Your week is ready</span>
        <span className="block truncate text-[13px] text-ink-65">{weekLabel}{daysLogged !== null ? `, ${daysLogged} of 7 days logged` : ''}</span>
      </span>
      <span aria-hidden="true" className="text-[17px] text-ink-50">→</span>
    </button>
  )
}

const Ph = ({ className }: { className: string }) => <span className={cn('block rounded-full bg-ink-08', className)} />

/** Loading: the final layout at real size with flat placeholders, so nothing shifts when data lands. */
export function HomeSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading today">
      <div className="flex items-start gap-[11px] border-b border-ink-09 py-[14px]">
        <span className="size-6 shrink-0 rounded-full bg-ink-08" />
        <span className="flex flex-1 flex-col gap-2 pt-1"><Ph className="h-3 w-[85%]" /><Ph className="h-3 w-[55%]" /></span>
      </div>
      <Ph className="mt-6 h-2.5 w-28" />
      <div className="mt-[14px] flex flex-col gap-[17px]">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="flex flex-col gap-[9px]">
            <span className="flex justify-between"><Ph className="h-3.5 w-16" /><Ph className="h-3 w-28" /></span>
            <Ph className="h-[7px] w-full" />
          </span>
        ))}
      </div>
      <div className="mt-4 h-[64px] rounded-[18px] bg-ink-08" />
      <div className="mt-4 h-[188px] rounded-[22px] bg-ink-08" />
      <div className="mt-4 h-[76px] rounded-[16px] border border-ink-12 bg-card" />
    </div>
  )
}
