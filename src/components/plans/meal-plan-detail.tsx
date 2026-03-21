'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { MealPlan, PlanStatus } from '@/types/plans.types'
import { formatDate } from '@/lib/utils'

const STATUS_STYLES: Record<PlanStatus, string> = {
  active: 'bg-[#34C759]/10 text-[#34C759]',
  draft: 'bg-surface text-text-secondary',
  superseded: 'bg-surface text-text-tertiary',
  completed: 'bg-[#3B82F6]/10 text-[#3B82F6]',
}

function formatDayDate(dateStr: string): string {
  const d = new Date(dateStr)
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
      <div className="flex items-center gap-2 mb-4">
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
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-text-primary">{targets.calories}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">kcal</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-text-primary">{targets.protein}g</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">protein</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-text-primary">{targets.carbs}g</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">carbs</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-text-primary">{targets.fat}g</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">fat</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {plan.content.notes && (
        <p className="text-xs text-text-secondary mb-6 italic">{plan.content.notes}</p>
      )}

      {/* Day-by-day */}
      {plan.content.days && plan.content.days.length > 0 ? (
        <div className="space-y-3">
          {plan.content.days.map((day, idx) => (
            <div key={idx} className="bg-surface border border-border rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                {formatDayDate(day.date)}
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
                          meal.calories != null ? `${meal.calories} kcal` : null,
                          meal.protein != null ? `${meal.protein}g P` : null,
                          meal.carbs != null ? `${meal.carbs}g C` : null,
                          meal.fat != null ? `${meal.fat}g F` : null,
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
                          {snack.calories} kcal
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-tertiary text-center py-8">No meal days configured yet</p>
      )}
    </div>
  )
}
