'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { PushedHeader } from '@/components/layout/screen-header'
import { MealPlanDetail } from '@/components/plans/meal-plan-detail'
import { SkeletonCard } from '@/components/plans/plan-overview-card'
import { goBack } from '@/lib/navigation'
import { WorkoutPlanDetail } from '@/components/plans/workout-plan-detail'
import { OfflineBand } from '@/components/shared/offline-band'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { getPlan } from '@/lib/api/plans.api'
import { FailCard } from '@/components/plans/spatial-parts'
import { ApiException } from '@/types/api.types'
import type { MealPlan, WorkoutPlan } from '@/types/plans.types'

export default function PlanDetailPage() {
  return <Suspense fallback={null}><PlanDetailRoute /></Suspense>
}

function PlanDetailRoute() {
  const router = useRouter()
  const id = useSearchParams().get('id') ?? ''
  if (!id) {
    return (
      <div className="mx-auto w-full max-w-md px-4">
        <PushedHeader title="Plan" onBack={() => goBack(router, '/plans')} backLabel="Back to plans" />
        <p className="mt-4 px-1 text-[15px] text-ink-65">No plan picked. <Link href="/plans" className="inline-flex min-h-11 items-center font-semibold text-ink underline">Back to plans</Link></p>
      </div>
    )
  }
  return <PlanDetailView id={id} />
}

function PlanDetailView({ id }: { id: string }) {
  useSetGeoScreen('plan_detail', { planId: id })
  const router = useRouter()
  const { data: plan, loading, error, refetch } = useCachedQuery(`plan:${id}`, () => getPlan(id), [id])

  // FB-R6.7 Build B — chat→UI sync. Geo edits this plan in chat → detail
  // view shows the new state without a manual refresh.
  useSyncRefetch(['plans:updated', 'plans:deactivated'], refetch)

  return (
    <div className="mx-auto w-full max-w-md px-4">
      {loading && !plan ? (
        <>
          <PushedHeader title="Plan" onBack={() => goBack(router, '/plans')} backLabel="Back to plans" />
          <div className="-mx-4"><OfflineBand /></div>
          <div className="mt-1 flex flex-col gap-2.5 px-1" role="status" aria-busy="true" aria-label="Loading this plan">
            <div aria-hidden="true" className="h-8 w-3/4 animate-pulse rounded-[10px] bg-ink-06" />
            <div aria-hidden="true" className="h-5 w-1/2 animate-pulse rounded-[8px] bg-ink-06" />
            <SkeletonCard className="mt-4 h-[150px]" />
            <SkeletonCard className="h-[260px]" />
          </div>
        </>
      ) : !plan ? (
        <>
          <PushedHeader title="Plan" onBack={() => goBack(router, '/plans')} backLabel="Back to plans" />
          <div className="-mx-4"><OfflineBand /></div>
          <div className="mt-1">
            {error && !(error instanceof ApiException && error.statusCode === 404)
              ? <FailCard title="I couldn't load this plan" onRetry={() => void refetch()}>Check your connection and try again.</FailCard>
              : <FailCard title="This plan is gone">It was probably replaced by a newer version. Your plans list has the current one.</FailCard>}
          </div>
        </>
      ) : (
        plan.type === 'meal' ? <MealPlanDetail plan={plan as MealPlan} /> : <WorkoutPlanDetail plan={plan as WorkoutPlan} />
      )}
    </div>
  )
}
