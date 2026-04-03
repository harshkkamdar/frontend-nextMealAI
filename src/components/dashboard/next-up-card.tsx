'use client'

import { UtensilsCrossed, Check, MessageSquarePlus } from 'lucide-react'
import Link from 'next/link'
import type { MealPlan } from '@/types/plans.types'

export function NextUpCard({
  mealPlan,
  today,
  loggedMealTypes = [],
  onCreatePlan,
}: {
  mealPlan: MealPlan | null
  today: string
  loggedMealTypes?: string[]
  onCreatePlan?: () => void
}) {
  // No meal plan — compact prompt
  if (!mealPlan) {
    return (
      <div className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-text-tertiary" />
          <p className="text-sm text-text-secondary">No meal plan yet</p>
        </div>
        <button
          type="button"
          onClick={onCreatePlan}
          className="flex items-center gap-1 text-xs font-medium text-accent hover:underline shrink-0"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          Ask Geo
        </button>
      </div>
    )
  }

  // Try exact date match first, then partial match
  const todayMeals = mealPlan?.content?.days?.find(
    (d) => d.date === today || d.date?.startsWith?.(today)
  )
  const loggedSet = new Set(loggedMealTypes.filter(Boolean).map((t) => t.toLowerCase()))
  const meal = todayMeals?.meals?.find(
    (m) => !loggedSet.has(m.type?.toLowerCase?.() ?? '')
  ) ?? null
  const allMealsLogged = todayMeals?.meals && todayMeals.meals.length > 0 && !meal

  if (allMealsLogged) {
    return (
      <div className="bg-gradient-to-br from-accent-light via-[#FEE8DE] to-accent-light rounded-2xl p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <UtensilsCrossed className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Meals</span>
        </div>
        <p className="text-[17px] font-semibold text-text-primary mb-1">All meals logged for today</p>
        <p className="text-xs text-text-secondary mb-3">Great job staying on track!</p>
        <Link
          href="/logs/new/food"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-text-secondary"
        >
          <Check className="w-4 h-4" />
          Log a snack
        </Link>
      </div>
    )
  }

  if (!meal) {
    // Plan exists but no meal scheduled today
    const targets = mealPlan.content?.daily_targets
    return (
      <div className="bg-gradient-to-br from-accent-light via-[#FEE8DE] to-accent-light rounded-2xl p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <UtensilsCrossed className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Next up</span>
        </div>
        <p className="text-[17px] font-semibold text-text-primary mb-1">No meals scheduled today</p>
        <p className="text-xs text-text-secondary mb-3">
          {targets ? `Target: ${targets.calories ?? 0} cal · ${targets.protein ?? 0}g protein` : 'Log your meals manually.'}
        </p>
        <Link
          href="/logs/new/food"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-accent-hover px-4 py-2 text-sm font-medium text-white"
        >
          <Check className="w-4 h-4" />
          Log a meal
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
      </div>
    </div>
  )
}
