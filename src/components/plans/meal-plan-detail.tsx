'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { MealPlan, PlanStatus } from '@/types/plans.types'
import { formatDate } from '@/lib/utils'
import { PlanChangelog } from '@/components/plans/plan-changelog'

const STATUS_STYLES: Record<PlanStatus, string> = {
  active: 'bg-[#34C759]/10 text-[#34C759]',
  draft: 'bg-surface text-text-secondary',
  superseded: 'bg-surface text-text-tertiary',
  completed: 'bg-[#3B82F6]/10 text-[#3B82F6]',
}

function formatDayDate(dateStr: string | undefined, fallbackIndex?: number): string {
  if (!dateStr) return fallbackIndex !== undefined ? `Day ${fallbackIndex + 1}` : 'Day'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return fallbackIndex !== undefined ? `Day ${fallbackIndex + 1}` : 'Day'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return 'No dates set'
  const fmt = (d: string) => formatDate(new Date(d))
  if (start && end) return `${fmt(start)} - ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

export function MealPlanDetail({ plan }: { plan: MealPlan }) {
  const router = useRouter()
  const targets = plan.content.daily_targets

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">Meal Plan</h1>
      </div>

      {/* Status + date range */}
      <div className="flex items-center gap-2 mb-6">
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[plan.status]}`}
        >
          {plan.status}
        </span>
        <span className="text-xs text-text-secondary">
          {formatDateRange(plan.start_date, plan.end_date)}
        </span>
      </div>

      {/* Daily targets */}
      {targets && (
        <div className="mb-8">
          {/* Calories — hero number */}
          <div className="bg-surface border border-border rounded-2xl p-6 text-center mb-4">
            <p className="text-4xl font-bold text-accent">{targets.calories}</p>
            <p className="text-xs text-text-tertiary mt-1 uppercase tracking-wider">kcal / day</p>
          </div>

          {/* Macros row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <p className="text-2xl font-semibold text-text-primary">{targets.protein}g</p>
              <p className="text-xs text-text-tertiary mt-1">protein</p>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <p className="text-2xl font-semibold text-text-primary">{targets.carbs}g</p>
              <p className="text-xs text-text-tertiary mt-1">carbs</p>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <p className="text-2xl font-semibold text-text-primary">{targets.fat}g</p>
              <p className="text-xs text-text-tertiary mt-1">fat</p>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {plan.content.notes && (
        <div className="bg-surface border border-border rounded-2xl p-5 mb-8">
          <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mb-2">Notes</p>
          <p className="text-sm leading-relaxed text-text-secondary">{plan.content.notes}</p>
        </div>
      )}

      {/* Day-by-day (only shown when meal days exist) */}
      {plan.content.days && plan.content.days.length > 0 && (
        <div className="space-y-3 mb-8">
          {plan.content.days.map((day, idx) => (
            <div key={idx} className="bg-surface border border-border rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                {formatDayDate(day.date, idx)}
              </h3>

              {/* Meals */}
              <div className="space-y-3">
                {day.meals.map((meal, mIdx) => (
                  <div key={mIdx}>
                    <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mb-0.5">
                      {meal.type}
                    </p>
                    <p className="text-sm font-medium text-text-primary">{meal.name}</p>
                    {(meal.calories != null || meal.protein != null) && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        {[
                          meal.calories != null ? `${meal.calories ?? 0} kcal` : null,
                          meal.protein != null ? `${meal.protein ?? 0}g P` : null,
                          meal.carbs != null ? `${meal.carbs ?? 0}g C` : null,
                          meal.fat != null ? `${meal.fat ?? 0}g F` : null,
                        ]
                          .filter(Boolean)
                          .join(' / ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Snacks */}
              {day.snacks && day.snacks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                    Snacks
                  </p>
                  {day.snacks.map((snack, sIdx) => (
                    <div key={sIdx}>
                      <p className="text-sm font-medium text-text-primary">{snack.name}</p>
                      {snack.calories != null && (
                        <p className="text-xs text-text-secondary mt-0.5">
                          {snack.calories ?? 0} kcal
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <PlanChangelog planId={plan.id} />
    </div>
  )
}
