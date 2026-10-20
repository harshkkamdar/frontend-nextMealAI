'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { MealPlanDetail } from '@/components/plans/meal-plan-detail'
import { WorkoutPlanDetail } from '@/components/plans/workout-plan-detail'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { OfflineBand } from '@/components/shared/offline-band'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { getPlan } from '@/lib/api/plans.api'
import { toast } from 'sonner'
import type { MealPlan, WorkoutPlan } from '@/types/plans.types'

export default function PlanDetailPage() {
  return <Suspense fallback={null}><PlanDetailRoute /></Suspense>
}

function PlanDetailRoute() {
  const id = useSearchParams().get('id') ?? ''
  if (!id) return <PageWrapper><p className="text-[13.5px] text-ink-62">Nothing selected. <Link href="/plans">Back to plans.</Link></p></PageWrapper>
  return <PlanDetailView id={id} />
}

function PlanDetailView({ id }: { id: string }) {
  useSetGeoScreen('plan_detail', { planId: id })
  const { data: plan, loading, error, refetch } = useCachedQuery(`plan:${id}`, () => getPlan(id), [id])
  useEffect(() => { if (error) toast.error('Failed to load plan') }, [error])

  // FB-R6.7 Build B — chat→UI sync. Geo edits this plan in chat → detail
  // view shows the new state without a manual refresh.
  useSyncRefetch(['plans:updated', 'plans:deactivated'], refetch)

  return (
    <PageWrapper>
      <div className="-mx-gutter"><OfflineBand /></div>
      {loading && !plan ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !plan ? (
        <p className="py-12 text-center text-[13.5px] text-ink-62">Plan not found</p>
      ) : plan.type === 'meal' ? (
        <MealPlanDetail plan={plan as MealPlan} />
      ) : (
        <WorkoutPlanDetail plan={plan as WorkoutPlan} />
      )}
    </PageWrapper>
  )
}
