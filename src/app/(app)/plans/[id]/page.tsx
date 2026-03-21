'use client'

import { use, useEffect, useState } from 'react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { MealPlanDetail } from '@/components/plans/meal-plan-detail'
import { WorkoutPlanDetail } from '@/components/plans/workout-plan-detail'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { getPlan } from '@/lib/api/plans.api'
import type { Plan, MealPlan, WorkoutPlan } from '@/types/plans.types'

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<Plan | null>(null)

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const data = await getPlan(id)
        setPlan(data)
      } catch {
        setPlan(null)
      } finally {
        setLoading(false)
      }
    }
    fetchPlan()
  }, [id])

  return (
    <PageWrapper>
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !plan ? (
        <p className="text-sm text-text-secondary text-center py-12">Plan not found</p>
      ) : plan.type === 'meal' ? (
        <MealPlanDetail plan={plan as MealPlan} />
      ) : (
        <WorkoutPlanDetail plan={plan as WorkoutPlan} />
      )}
    </PageWrapper>
  )
}
