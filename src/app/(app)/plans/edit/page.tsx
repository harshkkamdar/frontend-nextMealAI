'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { PushedHeader } from '@/components/layout/screen-header'
import { SkeletonCard } from '@/components/plans/plan-overview-card'
import { goBack } from '@/components/plans/plan-format'
import { WorkoutPlanBuilder } from '@/components/plans/workout-plan-builder'
import { MealPlanBuilder } from '@/components/plans/meal-plan-builder'
import { getPlan } from '@/lib/api/plans.api'
import type { Plan, MealPlan, WorkoutPlan } from '@/types/plans.types'

export default function EditPlanPage() {
  return <Suspense fallback={null}><EditPlanRoute /></Suspense>
}

function EditPlanRoute() {
  const id = useSearchParams().get('id') ?? ''
  const router = useRouter()
  if (!id) {
    return (
      <div className="mx-auto w-full max-w-md px-4">
        <PushedHeader title="Edit plan" onBack={() => router.push('/plans')} backLabel="Back to plans" />
        <p className="mt-4 px-1 text-[15px] text-ink-65">No plan picked. <Link href="/plans" className="inline-flex min-h-11 items-center font-semibold text-ink underline">Back to plans</Link></p>
      </div>
    )
  }
  return <EditPlanView id={id} />
}

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
