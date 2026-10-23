'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { WorkoutPlanBuilder } from '@/components/plans/workout-plan-builder'
import { MealPlanBuilder } from '@/components/plans/meal-plan-builder'
import { getPlan } from '@/lib/api/plans.api'
import type { Plan, MealPlan, WorkoutPlan } from '@/types/plans.types'

export default function EditPlanPage() {
  return <Suspense fallback={null}><EditPlanRoute /></Suspense>
}

function EditPlanRoute() {
  const id = useSearchParams().get('id') ?? ''
  if (!id) return <PageWrapper><p className="text-[13.5px] text-ink-65">Nothing selected. <Link href="/plans">Back to plans.</Link></p></PageWrapper>
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
      <PageWrapper>
        <CardSkeleton />
      </PageWrapper>
    )
  }

  if (!plan) return null

  return (
    <PageWrapper>
      {plan.type === 'workout' ? (
        <WorkoutPlanBuilder mode="edit" initialPlan={plan as WorkoutPlan} />
      ) : (
        <MealPlanBuilder mode="edit" initialPlan={plan as MealPlan} />
      )}
    </PageWrapper>
  )
}
