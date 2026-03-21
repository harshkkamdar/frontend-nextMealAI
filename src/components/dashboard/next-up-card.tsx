'use client'

import { UtensilsCrossed, Check, ArrowLeftRight, CalendarPlus } from 'lucide-react'
import Link from 'next/link'
import type { MealPlan } from '@/types/plans.types'

export function NextUpCard({ mealPlan, today }: { mealPlan: MealPlan | null; today: string }) {
  const todayMeals = mealPlan?.content?.days?.find((d) => d.date === today)
  const meal = todayMeals?.meals?.[0] ?? null

  if (!mealPlan || !meal) {
    return (
      <div className="bg-gradient-to-br from-accent-light via-[#FEE8DE] to-accent-light rounded-2xl p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <UtensilsCrossed className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Next up
          </span>
        </div>
        <p className="text-[17px] font-semibold text-text-primary mb-1">No active plan yet</p>
        <p className="text-xs text-text-secondary mb-3">
          Ask Geo to create a meal plan tailored to your goals.
        </p>
        <Link
          href="/chat"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-accent-hover px-4 py-2 text-sm font-medium text-white"
        >
          <CalendarPlus className="w-4 h-4" />
          Create plan
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-accent-light via-[#FEE8DE] to-accent-light rounded-2xl p-5">
      <div className="flex items-center gap-1.5 mb-2">
        <UtensilsCrossed className="w-4 h-4 text-accent" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
          Next up &middot; {meal.type}
        </span>
      </div>
      <p className="text-[17px] font-semibold text-text-primary mb-1">{meal.name}</p>
      <p className="text-xs text-text-secondary tabular-nums mb-4">
        {meal.calories ?? 0} cal &middot; {meal.protein ?? 0}g protein &middot;{' '}
        {meal.carbs ?? 0}g carbs &middot; {meal.fat ?? 0}g fat
      </p>
      <div className="flex items-center gap-2">
        <Link
          href="/logs/new/food"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-accent-hover px-4 py-2 text-sm font-medium text-white"
        >
          <Check className="w-4 h-4" />
          Log it
        </Link>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Swap
        </button>
      </div>
    </div>
  )
}
