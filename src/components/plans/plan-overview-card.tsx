'use client'

import { ChevronRight, Pencil } from 'lucide-react'
import type { Plan } from '@/types/plans.types'

function planMeta(plan: Plan): string {
  if (plan.type === 'meal') {
    const targets = plan.content.daily_targets
    return targets ? `${targets.calories.toLocaleString('en-US')} kcal · ${targets.protein.toLocaleString('en-US')} g protein` : 'Targets not set'
  }
  const days = plan.content.days ?? []
  const names = days.filter((day) => !day.is_rest_day).slice(0, 3).map((day) => day.name || 'Training').join('/')
  return `${days.length} ${days.length === 1 ? 'day' : 'days'}${names ? ` · ${names}` : ''}`
}

export function PlanOverviewCard({ plan, onClick, onEdit }: { plan: Plan; onClick: () => void; onEdit?: () => void }) {
  const title = plan.content.name || (plan.type === 'meal' ? 'Nutrition plan' : 'Training program')
  return (
    <div role="link" tabIndex={0} onClick={onClick} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onClick() }} className="flex cursor-pointer items-center justify-between rounded-[16px] border border-ink-12 bg-card p-[14px]">
      <div className="min-w-0">
        <div className="truncate text-[17px] font-bold text-ink">{title}</div>
        <div className="mt-0.5 text-[13.5px] text-ink-65">{planMeta(plan)}</div>
        <span className="mt-2 inline-flex h-6 items-center rounded-full bg-ink-08 px-2 text-[11px] font-semibold uppercase tracking-[1.4px] text-ink">Active</span>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-2">
        {onEdit ? <button type="button" aria-label={`Edit ${plan.type === 'meal' ? 'nutrition' : 'workout'} plan`} onClick={(event) => { event.stopPropagation(); onEdit() }} className="inline-flex h-10 w-10 items-center justify-center text-ink-65"><Pencil className="h-6 w-6" /></button> : null}
        <ChevronRight className="h-5 w-5 text-ink-65" />
      </div>
    </div>
  )
}
