'use client'

import { useQuery } from '@tanstack/react-query'
import { MacroRing } from '@/components/dashboard/macro-ring'
import { TodayPlanCard } from '@/components/dashboard/today-plan-card'
import { SuggestionCard } from '@/components/dashboard/suggestion-card'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { getLogsSummary } from '@/lib/api/logs.api'
import { getPlans } from '@/lib/api/plans.api'
import { getSuggestions } from '@/lib/api/suggestions.api'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/stores/auth.store'
import { getGreeting, getDayOfWeek } from '@/lib/utils'
import type { MealPlan, WorkoutPlan } from '@/types/plans.types'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const greeting = getGreeting()
  const today = getDayOfWeek()

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: queryKeys.logsSummary('day'),
    queryFn: () => getLogsSummary('day'),
  })

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: queryKeys.plans({ active_only: true }),
    queryFn: () => getPlans({ active_only: true }),
  })

  const { data: suggestions } = useQuery({
    queryKey: queryKeys.suggestions({ status: 'pending' }),
    queryFn: () => getSuggestions({ status: 'pending' }),
  })

  const mealPlan = plans?.find((p): p is MealPlan => p.type === 'meal')
  const workoutPlan = plans?.find((p): p is WorkoutPlan => p.type === 'workout')
  const pendingSuggestion = suggestions?.[0]

  const macroData = summary
    ? {
        consumed: summary.totals.calories,
        target: summary.daily_targets?.calories ?? 2000,
        protein: {
          consumed: summary.totals.protein_g,
          target: summary.daily_targets?.protein_g ?? 150,
        },
        carbs: {
          consumed: summary.totals.carbs_g,
          target: summary.daily_targets?.carbs_g ?? 250,
        },
        fat: {
          consumed: summary.totals.fat_g,
          target: summary.daily_targets?.fat_g ?? 65,
        },
      }
    : null

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Good {greeting}{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Macro ring */}
      {summaryLoading ? (
        <CardSkeleton />
      ) : macroData ? (
        <MacroRing
          {...macroData}
          isEmpty={macroData.consumed === 0}
        />
      ) : (
        <div className="bg-bg-secondary rounded-2xl p-6">
          <p className="text-muted-foreground text-sm text-center">Could not load today&apos;s nutrition data</p>
        </div>
      )}

      {/* Today's plan */}
      <div className="mt-4">
        {plansLoading ? (
          <CardSkeleton />
        ) : (
          <TodayPlanCard mealPlan={mealPlan} workoutPlan={workoutPlan} today={today} />
        )}
      </div>

      {/* Suggestion card */}
      {pendingSuggestion && (
        <div className="mt-4">
          <SuggestionCard suggestion={pendingSuggestion} />
        </div>
      )}
    </PageWrapper>
  )
}
