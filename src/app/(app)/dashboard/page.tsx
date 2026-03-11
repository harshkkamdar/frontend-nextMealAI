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

  const mealPlan = plans?.find((p): p is MealPlan => p.type === 'meal' && p.status === 'active')
  const workoutPlan = plans?.find((p): p is WorkoutPlan => p.type === 'workout' && p.status === 'active')
  const pendingSuggestion = suggestions?.[0]

  // Backend returns { period, summary: { avg_daily_calories, avg_daily_protein, ... } }
  // No carbs/fat at summary level — only available in daily_breakdown (week/month periods)
  const todayBreakdown = summary?.daily_breakdown?.[0]
  const macroData = summary
    ? {
        consumed: summary.summary.avg_daily_calories,
        target: 2000, // No targets from API — placeholder
        protein: {
          consumed: summary.summary.avg_daily_protein,
          target: 150,
        },
        carbs: {
          consumed: todayBreakdown?.carbs ?? 0,
          target: 250,
        },
        fat: {
          consumed: todayBreakdown?.fat ?? 0,
          target: 65,
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
