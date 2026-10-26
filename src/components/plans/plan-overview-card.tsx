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
  const training = days.filter((day) => !day.is_rest_day).length
  return `${training} training ${training === 1 ? 'day' : 'days'}${days.length > training ? `, ${days.length - training} rest` : ''}`
}

/** How long the plan still runs, from its end date: "5 weeks left", "3 days left", "Ends today"; null without dates. */
export function timeLeft(endDate: string | undefined, today = new Date()): string | null {
  if (!endDate) return null
  const end = Date.UTC(+endDate.slice(0, 4), +endDate.slice(5, 7) - 1, +endDate.slice(8, 10))
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  if (Number.isNaN(end)) return null
  const days = Math.round((end - now) / 86400000)
  if (days < 0) return null
  if (days === 0) return 'Ends today'
  if (days < 14) return `${days} ${days === 1 ? 'day' : 'days'} left`
  return `${Math.round(days / 7)} weeks left`
}

/** Active plan: kind, name, one line of numbers. The card opens the plan; the round pencil edits it. */
export function PlanOverviewCard({ plan, onClick, onEdit }: { plan: Plan; onClick: () => void; onEdit?: () => void }) {
  const left = timeLeft(plan.end_date)
  return (
    <div className={cn(CARD, 'relative')}>
      <button type="button" onClick={onClick} className="flex w-full rounded-[24px] p-5 pr-14 text-left transition-transform duration-100 ease-out active:scale-[.98]">
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-ink-65">{plan.type === 'meal' ? 'Nutrition' : 'Training'}</span>
          <span className="font-wide mt-1 line-clamp-2 block break-words text-[22px] font-bold leading-[1.15] tracking-[-0.3px] text-ink">{planTitle(plan)}</span>
          <span className="mt-1.5 block truncate text-[14px] text-ink-65 tabular-nums">{planMeta(plan)}{left ? <> · <span className="font-semibold text-ink">{left}</span></> : null}</span>
        </span>
      </button>
      {onEdit ? (
        // Sits on the title's first line (eyebrow 17 + 4 gap + half of a 25 px line, minus half the 44 px target).
        <button
          type="button"
          aria-label={`Edit ${plan.type === 'meal' ? 'nutrition' : 'workout'} plan`}
          onClick={onEdit}
          className="absolute right-2 top-[32px] grid size-11 place-items-center text-ink-65 transition-transform active:scale-[.9]"
        >
          <Pencil className="size-5" strokeWidth={1.75} aria-hidden="true" />
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
