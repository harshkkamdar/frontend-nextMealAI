'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PlanOverviewCard } from '@/components/plans/plan-overview-card'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { OfflineBand } from '@/components/shared/offline-band'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { PageHeader } from '@/components/ui/fiqr/page-header'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { getPlans } from '@/lib/api/plans.api'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { useUIStore } from '@/stores/ui.store'
import type { MealPlan, WorkoutPlan } from '@/types/plans.types'

export default function PlansPage() {
  useSetGeoScreen('plans', {})
  const router = useRouter()
  const { data, loading, error, refetch } = useCachedQuery('plans', () => getPlans({ active_only: true }), [])
  const plans = data ?? []
  useEffect(() => { const handleVisibility = () => { if (!document.hidden) void refetch() }; document.addEventListener('visibilitychange', handleVisibility); return () => document.removeEventListener('visibilitychange', handleVisibility) }, [refetch])
  useSyncRefetch(['plans:*'], refetch)
  const mealPlan = (plans.find((plan) => plan.type === 'meal') as MealPlan) ?? null
  const workoutPlan = (plans.find((plan) => plan.type === 'workout') as WorkoutPlan) ?? null

  return <PageWrapper>
    <PageHeader title="Plans" className="mb-6" />
    <div className="-mx-gutter"><OfflineBand /></div>
    {loading && !data ? <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div> : error && !data ? <ErrorState onRetry={() => void refetch()}>I couldn&apos;t load your plans. Check your connection and try again.</ErrorState> : <div className="space-y-6">
      <section className="space-y-2.5">
        <SectionLabel>Active</SectionLabel>
        {mealPlan ? <PlanOverviewCard plan={mealPlan} onClick={() => router.push(`/plans/view?id=${mealPlan.id}`)} onEdit={() => router.push(`/plans/edit?id=${mealPlan.id}`)} /> : <MissingRow label="No nutrition plan yet" href="/plans/new/meal" />}
        {workoutPlan ? <PlanOverviewCard plan={workoutPlan} onClick={() => router.push(`/plans/view?id=${workoutPlan.id}`)} onEdit={() => router.push(`/plans/edit?id=${workoutPlan.id}`)} /> : <MissingRow label="No training program yet" href="/plans/new/workout" />}
      </section>
      <div className="space-y-3">
        <PrimaryButton icon={<Plus className="h-5 w-5" />} onClick={() => useUIStore.getState().openSheet('geo-companion')}>Ask Geo for a plan</PrimaryButton>
        <div className="flex flex-col items-center gap-2">
          <Link href="/plans/new/meal" aria-label="Build nutrition plan by hand" className="flex min-h-11 items-center text-[13.5px] font-semibold text-ink-65">Build a nutrition plan by hand →</Link>
          <Link href="/plans/new/workout" aria-label="Build training program by hand" className="flex min-h-11 items-center text-[13.5px] font-semibold text-ink-65">Build a training program by hand →</Link>
        </div>
      </div>
    </div>}
  </PageWrapper>
}

function MissingRow({ label, href }: { label: string; href: string }) {
  return <div className="flex min-h-14 items-center justify-between rounded-[16px] border border-ink-12 bg-card px-[14px]"><span className="text-[15.5px] text-ink-65">{label}</span><Link href={href} className="text-[13.5px] font-semibold text-ink-65">Build one →</Link></div>
}
