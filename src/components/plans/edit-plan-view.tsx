'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PushedHeader } from '@/components/layout/screen-header'
import { SkeletonCard } from '@/components/plans/plan-overview-card'
import { goBack } from '@/lib/navigation'
import { WorkoutPlanBuilder } from '@/components/plans/workout-plan-builder'
import { MealPlanBuilder } from '@/components/plans/meal-plan-builder'
import { getPlan } from '@/lib/api/plans.api'
import type { Plan, MealPlan, WorkoutPlan } from '@/types/plans.types'

/** Loads a plan and opens the matching builder in edit mode. Lives outside the page file: Next rejects extra exports from a page. */
export function EditPlanView({ id }: { id: string }) {
  const router = useRouter()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const p = await getPlan(id)
        if (!cancelled) setPlan(p)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load plan'
        toast.error(message)
        router.push('/plans')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, router])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md px-4">
        <PushedHeader title="Edit plan" onBack={() => goBack(router, '/plans')} />
        <div className="mx-1 mt-1 h-1 rounded-full bg-ink-08" />
        <div className="space-y-3 px-1 pt-7" role="status" aria-busy="true" aria-label="Loading your plan">
          <div aria-hidden="true" className="h-[31px] w-4/5 animate-pulse rounded-[10px] bg-ink-06" />
          <div aria-hidden="true" className="h-[20px] w-3/5 animate-pulse rounded-[8px] bg-ink-06" />
          <SkeletonCard className="!mt-7 h-[56px] !rounded-[14px]" />
          <SkeletonCard className="h-[56px] !rounded-[14px]" />
        </div>
      </div>
    )
  }

  if (!plan) return null

  return plan.type === 'workout'
    ? <WorkoutPlanBuilder mode="edit" initialPlan={plan as WorkoutPlan} />
    : <MealPlanBuilder mode="edit" initialPlan={plan as MealPlan} />
}
