'use client'

import { UtensilsCrossed, Dumbbell } from 'lucide-react'
import type { Plan, PlanStatus } from '@/types/plans.types'
import { formatDate } from '@/lib/utils'

const STATUS_STYLES: Record<PlanStatus, string> = {
  active: 'bg-[#34C759]/10 text-[#34C759]',
  draft: 'bg-surface text-text-secondary',
  superseded: 'bg-surface text-text-tertiary',
  completed: 'bg-[#3B82F6]/10 text-[#3B82F6]',
}

function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return 'No dates set'
  const fmt = (d: string) => formatDate(new Date(d))
  if (start && end) return `${fmt(start)} - ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

function getPreview(plan: Plan): string {
  if (plan.type === 'meal') {
    const target = plan.content.daily_targets?.calories
    if (target) return `${target} kcal / day target`
    const dayCount = plan.content.days?.length ?? 0
    return dayCount > 0 ? `${dayCount} day plan` : 'No details yet'
  }
  const dayCount = plan.content.days?.length ?? 0
  return dayCount > 0 ? `${dayCount} day plan` : 'No details yet'
}

export function PlanOverviewCard({ plan, onClick }: { plan: Plan; onClick: () => void }) {
  const isMeal = plan.type === 'meal'
  const Icon = isMeal ? UtensilsCrossed : Dumbbell
  const label = isMeal ? 'Meal Plan' : 'Workout Plan'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-surface border border-border rounded-2xl p-4 cursor-pointer hover:bg-surface-hover transition-colors"
    >
      {/* Top row: icon + label + status badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-accent" />
          <span className="text-sm font-medium text-text-primary">{label}</span>
        </div>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[plan.status]}`}
        >
          {plan.status}
        </span>
      </div>

      {/* Date range */}
      <p className="text-xs text-text-secondary mb-1">
        {formatDateRange(plan.start_date, plan.end_date)}
      </p>

      {/* Preview */}
      <p className="text-xs text-text-tertiary">{getPreview(plan)}</p>
    </button>
  )
}
