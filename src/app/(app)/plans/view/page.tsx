'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { MealPlanDetail } from '@/components/plans/meal-plan-detail'
import { WorkoutPlanDetail } from '@/components/plans/workout-plan-detail'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { OfflineBand } from '@/components/shared/offline-band'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { getPlan } from '@/lib/api/plans.api'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { PageHeader } from '@/components/ui/fiqr/page-header'
import { ApiException } from '@/types/api.types'
import type { MealPlan, WorkoutPlan } from '@/types/plans.types'

export default function PlanDetailPage() {
  return <Suspense fallback={null}><PlanDetailRoute /></Suspense>
}

function PlanDetailRoute() {
  const id = useSearchParams().get('id') ?? ''
  if (!id) return <PageWrapper><p className="text-[13.5px] text-ink-65">Nothing selected. <Link href="/plans">Back to plans.</Link></p></PageWrapper>
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
    <PageWrapper>
      <div className="-mx-gutter"><OfflineBand /></div>
      {loading && !plan ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !plan ? (
        <>
          <PageHeader title="Plan" onBack={() => router.push('/plans')} backLabel="Back to plans" />
          {error && !(error instanceof ApiException && error.statusCode === 404)
            ? <ErrorState onRetry={() => void refetch()}>I couldn&apos;t load this plan. Check your connection and try again.</ErrorState>
            : <ErrorState>This plan no longer exists. It may have been replaced by a newer version.</ErrorState>}
        </>
      ) : plan.type === 'meal' ? (
        <MealPlanDetail plan={plan as MealPlan} />
      ) : (
        <WorkoutPlanDetail plan={plan as WorkoutPlan} />
      )}
    </PageWrapper>
  )
}
