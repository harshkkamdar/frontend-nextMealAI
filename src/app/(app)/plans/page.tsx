'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PlanOverviewCard } from '@/components/plans/plan-overview-card'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { getPlans } from '@/lib/api/plans.api'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { useUIStore } from '@/stores/ui.store'
import type { MealPlan, Plan, WorkoutPlan } from '@/types/plans.types'

export default function PlansPage() {
  useSetGeoScreen('plans', {})
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try { setPlans(await getPlans({ active_only: true })) }
    catch (err: unknown) { setPlans([]); toast.error(err instanceof Error ? err.message : 'Failed to load plans') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchPlans() }, [fetchPlans])
  useEffect(() => { const handleVisibility = () => { if (!document.hidden) fetchPlans() }; document.addEventListener('visibilitychange', handleVisibility); return () => document.removeEventListener('visibilitychange', handleVisibility) }, [fetchPlans])
  useSyncRefetch(['plans:*'], fetchPlans)
  const mealPlan = (plans.find((plan) => plan.type === 'meal') as MealPlan) ?? null
  const workoutPlan = (plans.find((plan) => plan.type === 'workout') as WorkoutPlan) ?? null

  return <PageWrapper>
    <h1 className="mb-6 text-[22px] font-semibold text-ink">Plans</h1>
    {loading ? <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div> : <div className="space-y-6">
      <section className="space-y-2.5">
        <SectionLabel>Active</SectionLabel>
        {mealPlan ? <PlanOverviewCard plan={mealPlan} onClick={() => router.push(`/plans/view?id=${mealPlan.id}`)} onEdit={() => router.push(`/plans/edit?id=${mealPlan.id}`)} /> : <MissingRow label="No nutrition plan yet" href="/plans/new/meal" />}
        {workoutPlan ? <PlanOverviewCard plan={workoutPlan} onClick={() => router.push(`/plans/view?id=${workoutPlan.id}`)} onEdit={() => router.push(`/plans/edit?id=${workoutPlan.id}`)} /> : <MissingRow label="No training program yet" href="/plans/new/workout" />}
      </section>
      <div className="space-y-3">
        <PrimaryButton icon={<Plus className="h-5 w-5" />} onClick={() => useUIStore.getState().openSheet('geo-companion')}>Ask Geo for a plan</PrimaryButton>
        <div className="flex flex-col items-center gap-2">
          <Link href="/plans/new/meal" aria-label="Build nutrition plan by hand" className="text-[13.5px] font-semibold text-ink-60">Build one by hand →</Link>
          <Link href="/plans/new/workout" aria-label="Build training program by hand" className="text-[13.5px] font-semibold text-ink-60">Build one by hand →</Link>
        </div>
      </div>
    </div>}
  </PageWrapper>
}

function MissingRow({ label, href }: { label: string; href: string }) {
  return <div className="flex min-h-14 items-center justify-between rounded-[16px] border border-ink-12 bg-card px-[14px]"><span className="text-[15.5px] text-ink-50">{label}</span><Link href={href} className="text-[13.5px] font-semibold text-ink-60">Build one →</Link></div>
}
