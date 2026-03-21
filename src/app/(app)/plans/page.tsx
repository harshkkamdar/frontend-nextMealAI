'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PlanOverviewCard } from '@/components/plans/plan-overview-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { getPlans } from '@/lib/api/plans.api'
import type { Plan, MealPlan, WorkoutPlan } from '@/types/plans.types'

export default function PlansPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])

  const fetchPlans = useCallback(async () => {
    try {
      const data = await getPlans({ active_only: true })
      setPlans(data)
    } catch {
      setPlans([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const mealPlan = (plans.find((p) => p.type === 'meal') as MealPlan) ?? null
  const workoutPlan = (plans.find((p) => p.type === 'workout') as WorkoutPlan) ?? null

  return (
    <PageWrapper>
      <h1 className="text-[22px] font-semibold tracking-tight text-text-primary mb-6">Plans</h1>

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
