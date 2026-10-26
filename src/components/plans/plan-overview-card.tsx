'use client'

import { Pencil } from 'lucide-react'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { formatDateRange } from '@/components/plans/plan-format'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types/plans.types'

export const CARD = 'rounded-[24px] bg-card shadow-[var(--shadow-card)]'

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

export function planTitle(plan: Plan): string {
  return plan.content.name || (plan.type === 'meal' ? 'Nutrition plan' : 'Training program')
}

export function planMeta(plan: Plan): string {
  if (plan.type === 'meal') {
    const targets = plan.content.daily_targets
    return targets ? `${fmt(targets.calories)} kcal · ${fmt(targets.protein)} g protein` : 'Targets not set'
  }
  const days = plan.content.days ?? []
  const names = days.filter((day) => !day.is_rest_day).slice(0, 3).map((day) => day.name || 'Training').join('/')
  return `${days.length} ${days.length === 1 ? 'day' : 'days'}${names ? ` · ${names}` : ''}`
}

/** Active plan: kind, name, one line of numbers. The card opens the plan; the round pencil edits it. */
export function PlanOverviewCard({ plan, onClick, onEdit }: { plan: Plan; onClick: () => void; onEdit?: () => void }) {
  return (
    <div className={cn(CARD, 'relative')}>
      <button type="button" onClick={onClick} className="flex w-full rounded-[24px] p-5 pr-[72px] text-left transition-transform duration-100 ease-out active:scale-[.98]">
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-ink-65">{plan.type === 'meal' ? 'Nutrition' : 'Training'}</span>
          <span className="font-wide mt-1 line-clamp-2 block break-words text-[21px] font-bold leading-[1.15] tracking-[-0.3px] text-ink">{planTitle(plan)}</span>
          <span className="mt-1.5 line-clamp-2 block text-[14px] text-ink-65 tabular-nums">{planMeta(plan)}</span>
        </span>
      </button>
      {onEdit ? (
        <button
          type="button"
          aria-label={`Edit ${plan.type === 'meal' ? 'nutrition' : 'workout'} plan`}
          onClick={onEdit}
          className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.94]"
        >
          <Pencil className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

/** A plan that is no longer active: one row that opens it (where it can be made active again). */
export function PreviousPlanRow({ plan, onClick }: { plan: Plan; onClick: () => void }) {
  const when = plan.start_date || plan.end_date ? formatDateRange(plan.start_date, plan.end_date) : formatDateRange(plan.created_at).replace('From ', 'Made ')
  return (
    <button type="button" onClick={onClick} className="flex min-h-16 w-full items-center gap-3 border-b border-ink-06 px-5 py-3 text-left last:border-b-0 active:bg-ink-04">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] font-semibold text-ink">{planTitle(plan)}</span>
        <span className="block truncate text-[13px] text-ink-65">{plan.type === 'meal' ? 'Nutrition' : 'Training'} · {when}</span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-ink-35" />
    </button>
  )
}

/** Card-shaped placeholder with the exact box of what replaces it, so the swap never shifts the page. */
export function SkeletonCard({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn(CARD, 'animate-pulse', className)} />
}
