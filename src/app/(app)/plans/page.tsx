'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PlanOverviewCard } from '@/components/plans/plan-overview-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { getPlans } from '@/lib/api/plans.api'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import type { Plan, MealPlan, WorkoutPlan } from '@/types/plans.types'

export default function PlansPage() {
  useSetGeoScreen('plans', {})
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPlans({ active_only: true })
      setPlans(data)
    } catch (err: any) {
      setPlans([])
      toast.error(err?.message || 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // Re-fetch when returning to this page from another tab/page
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) fetchPlans()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchPlans])

  const mealPlan = (plans.find((p) => p.type === 'meal') as MealPlan) ?? null
  const workoutPlan = (plans.find((p) => p.type === 'workout') as WorkoutPlan) ?? null

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">Plans</h1>
        <button
          onClick={fetchPlans}
          disabled={loading}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40"
          aria-label="Refresh plans"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Meal Plan section */}
          <section>
            <h2 className="text-sm font-medium text-text-secondary mb-2">Meal Plan</h2>
            {mealPlan ? (
              <PlanOverviewCard
                plan={mealPlan}
                onClick={() => router.push(`/plans/${mealPlan.id}`)}
              />
            ) : (
              <EmptyState
                icon={MessageCircle}
                title="No meal plan"
                description="Chat with Geo to create a plan"
              />
            )}
          </section>

          {/* Workout Plan section */}
          <section>
            <h2 className="text-sm font-medium text-text-secondary mb-2">Workout Plan</h2>
            {workoutPlan ? (
              <PlanOverviewCard
                plan={workoutPlan}
                onClick={() => router.push(`/plans/${workoutPlan.id}`)}
              />
            ) : (
              <EmptyState
                icon={MessageCircle}
                title="No workout plan"
                description="Chat with Geo to create a plan"
              />
            )}
          </section>
        </div>
      )}
    </PageWrapper>
  )
}
