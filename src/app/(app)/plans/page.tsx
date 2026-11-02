'use client'

import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Dumbbell, Utensils } from 'lucide-react'
import { MealPlanCard, PreviousPlanRow, SkeletonCard, WorkoutPlanCard } from '@/components/plans/plan-overview-card'
import { previousPlans } from '@/components/plans/plan-format'
import { CARD, FailCard, SectionHeading } from '@/components/plans/spatial-parts'
import { PushedHeader } from '@/components/layout/screen-header'
import { goBack } from '@/lib/navigation'
import { OfflineBand } from '@/components/shared/offline-band'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { getPlans } from '@/lib/api/plans.api'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { useFirstPaint } from '@/lib/use-first-paint'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'
import type { MealPlan, Plan, WorkoutPlan } from '@/types/plans.types'

export default function PlansPage() {
  useSetGeoScreen('plans', {})
  const router = useRouter()
  const enter = useFirstPaint('plans')
  const { data, loading, error, refetch } = useCachedQuery('plans', () => getPlans({ active_only: true }), [])
  // History is a second, non-blocking read: if it fails the screen simply has no "Earlier" section.
  const fetchAll = useCallback(() => getPlans().catch(() => [] as Plan[]), [])
  const { data: all, refetch: refetchAll } = useCachedQuery('plans-all', fetchAll, [])
  const plans = useMemo(() => data ?? [], [data])
  const refresh = useCallback(() => { void refetch(); void refetchAll() }, [refetch, refetchAll])
  useEffect(() => { const handleVisibility = () => { if (!document.hidden) refresh() }; document.addEventListener('visibilitychange', handleVisibility); return () => document.removeEventListener('visibilitychange', handleVisibility) }, [refresh])
  useSyncRefetch(['plans:*'], refresh)
  const mealPlan = (plans.find((plan) => plan.type === 'meal') as MealPlan) ?? null
  const workoutPlan = (plans.find((plan) => plan.type === 'workout') as WorkoutPlan) ?? null
  const earlier = useMemo(() => previousPlans(all ?? [], plans.filter((plan) => plan.status === 'active')), [all, plans])
  const open = (plan: Plan) => router.push(`/plans/view?id=${plan.id}`)

  return (
    <div className="mx-auto w-full max-w-md px-gutter pb-[var(--tabbar-clearance)]">
      <PushedHeader large title="Plans" onBack={() => goBack(router, '/settings')} />
      <div className="-mx-gutter mt-3"><OfflineBand /></div>

      {loading && !data ? (
        <div className="mt-7 flex flex-col gap-2.5" role="status" aria-busy="true" aria-label="Loading your plans">
          <SkeletonCard className="h-[170px]" />
          <SkeletonCard className="h-[170px]" />
          <SkeletonCard className="mt-7 h-[186px]" />
        </div>
      ) : error && !data ? (
        <div className="mt-4"><FailCard title="I couldn't load your plans" onRetry={refresh}>Check your connection and try again.</FailCard></div>
      ) : (
        <div className={cn('flex flex-col', enter && 'enter-rows')}>
          <section aria-labelledby="active-plans">
            <SectionHeading id="active-plans">Active</SectionHeading>
            <div className="flex flex-col gap-2.5">
              {mealPlan ? <MealPlanCard plan={mealPlan} onClick={() => open(mealPlan)} /> : <EmptySlot label="No nutrition plan yet" href="/plans/new/meal" />}
              {workoutPlan ? <WorkoutPlanCard plan={workoutPlan} onClick={() => open(workoutPlan)} /> : <EmptySlot label="No training plan yet" href="/plans/new/workout" />}
            </div>
          </section>

          <section aria-labelledby="new-plan">
            <SectionHeading id="new-plan">New plan</SectionHeading>
            <div className={cn(CARD, 'p-2')}>
              <BuildLink href="/plans/new/meal" icon={<Utensils className="size-5" strokeWidth={1.75} />} title="Build a nutrition plan" sub="By hand, three questions" />
              <BuildLink href="/plans/new/workout" icon={<Dumbbell className="size-5" strokeWidth={1.75} />} title="Build a training plan" sub="By hand, two questions" />
            </div>
            <PrimaryButton className="mt-4" onClick={() => useUIStore.getState().openSheet('geo-companion')}>Ask Geo for a plan</PrimaryButton>
          </section>

          {earlier.length > 0 ? (
            <section aria-labelledby="earlier-plans">
              <SectionHeading id="earlier-plans">Earlier</SectionHeading>
              <div className={cn(CARD, 'overflow-hidden')}>
                {earlier.map((plan) => <PreviousPlanRow key={plan.id} plan={plan} onClick={() => open(plan)} />)}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}

function EmptySlot({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="flex min-h-11 w-full items-center justify-center text-[15px] font-semibold text-ink-65 active:opacity-60">
      <span><span className="block text-center">{label}</span><span className="block text-center">Build one, or ask Geo below</span></span>
    </Link>
  )
}

function BuildLink({ href, icon, title, sub }: { href: string; icon: ReactNode; title: string; sub: string }) {
  return (
    <Link href={href} className="flex min-h-[60px] items-center gap-3 border-b border-ink-06 px-3 py-2.5 last:border-b-0 active:opacity-60">
      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center text-ink">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-bold text-ink">{title}</span>
        <span className="block truncate text-caption text-ink-65">{sub}</span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-ink-35" />
    </Link>
  )
}
