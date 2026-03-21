'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { getLogsSummary } from '@/lib/api/logs.api'
import { getPlans } from '@/lib/api/plans.api'
import { getSuggestions } from '@/lib/api/suggestions.api'
import { getGreeting, formatDate, todayISO } from '@/lib/utils'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { NextUpCard } from '@/components/dashboard/next-up-card'
import { ProgressCard } from '@/components/dashboard/progress-card'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { WorkoutCard } from '@/components/dashboard/workout-card'
import { SuggestionCard } from '@/components/dashboard/suggestion-card'
import type { MealPlan, WorkoutPlan, Plan } from '@/types/plans.types'
import type { LogsSummary } from '@/types/logs.types'
import type { Suggestion } from '@/types/suggestions.types'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<LogsSummary | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  const today = todayISO()

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, plansRes, suggestionsRes] = await Promise.all([
        getLogsSummary('day').catch(() => null),
        getPlans({ active_only: true }).catch(() => [] as Plan[]),
        getSuggestions({ status: 'pending' }).catch(() => [] as Suggestion[]),
      ])
      setSummary(summaryRes)
      setPlans(plansRes)
      setSuggestions(suggestionsRes)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const mealPlan = (plans.find((p) => p.type === 'meal') as MealPlan) ?? null
  const workoutPlan = (plans.find((p) => p.type === 'workout') as WorkoutPlan) ?? null

  const dailyBreakdown = summary?.daily_breakdown?.[0]
  const caloriesConsumed = dailyBreakdown?.calories ?? summary?.summary?.avg_daily_calories ?? 0
  const proteinConsumed = dailyBreakdown?.protein ?? summary?.summary?.avg_daily_protein ?? 0
  const carbsConsumed = dailyBreakdown?.carbs ?? 0
  const fatConsumed = dailyBreakdown?.fat ?? 0

  const targets = mealPlan?.content?.daily_targets
  const caloriesTarget = targets?.calories ?? 2000
  const proteinTarget = targets?.protein ?? 150
  const carbsTarget = targets?.carbs ?? 250
  const fatTarget = targets?.fat ?? 65

  const water = 0
  const mood = 0
  const sleep = summary?.summary?.avg_sleep_hours ?? 0
  const energy = summary?.summary?.avg_energy_rating ?? 0

  const firstName = user?.email?.split('@')[0] ?? 'there'
  const initials = firstName.slice(0, 2).toUpperCase()

  function handleSuggestionAction() {
    setSuggestions((prev) => prev.slice(1))
  }

  return (
    <PageWrapper>
      {/* Page fade gradient */}
      <div
        className="fixed top-0 left-0 right-0 h-48 pointer-events-none -z-10"
        style={{
          background: 'linear-gradient(180deg, #FDF0EB 0%, #FFFFFF 100%)',
        }}
      />

      {/* Greeting row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
            Good {getGreeting()}, {firstName}
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">{formatDate(new Date())}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold shrink-0">
          {initials}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="space-y-4">
          <NextUpCard mealPlan={mealPlan} today={today} />
          <ProgressCard
            calories={{ consumed: caloriesConsumed, target: caloriesTarget }}
            protein={{ consumed: proteinConsumed, target: proteinTarget }}
            carbs={{ consumed: carbsConsumed, target: carbsTarget }}
            fat={{ consumed: fatConsumed, target: fatTarget }}
          />
          <QuickStats water={water} mood={mood} sleep={sleep} energy={energy} />
          <WorkoutCard workoutPlan={workoutPlan} today={today} />
          {suggestions.length > 0 && (
            <SuggestionCard
              suggestion={suggestions[0]}
              onAction={handleSuggestionAction}
            />
          )}
        </div>
      )}
    </PageWrapper>
  )
}
