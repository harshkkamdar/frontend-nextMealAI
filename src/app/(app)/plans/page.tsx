'use client'

import { useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PushedHeader } from '@/components/layout/screen-header'
import { CARD, PlanOverviewCard, PreviousPlanRow, SkeletonCard } from '@/components/plans/plan-overview-card'
import { goBack, previousPlans } from '@/components/plans/plan-format'
import { OfflineBand } from '@/components/shared/offline-band'
import { ErrorState } from '@/components/ui/fiqr/error-state'
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
    <div className="mx-auto w-full max-w-md px-4 pb-6">
      <PushedHeader title="Plans" onBack={() => goBack(router, '/settings')} />
      <div className="-mx-4"><OfflineBand /></div>

      {loading && !data ? (
        <div className="mt-4 space-y-3" role="status" aria-busy="true" aria-label="Loading your plans">
          <SkeletonCard className="h-[118px]" />
          <SkeletonCard className="h-[118px]" />
          <SkeletonCard className="mt-8 h-[196px]" />
        </div>
      ) : error && !data ? (
        <div className="mt-4"><ErrorState onRetry={refresh}>I couldn&apos;t load your plans. Check your connection and try again.</ErrorState></div>
      ) : (
        <div className={cn('mt-4 flex flex-col gap-3', enter && 'enter-rows')}>
          <h2 className="px-1 text-[13px] font-semibold text-ink-65">Active</h2>
          {mealPlan
            ? <PlanOverviewCard plan={mealPlan} onClick={() => open(mealPlan)} onEdit={() => router.push(`/plans/edit?id=${mealPlan.id}`)} />
            : <EmptySlot label="No nutrition plan yet" href="/plans/new/meal" />}
          {workoutPlan
            ? <PlanOverviewCard plan={workoutPlan} onClick={() => open(workoutPlan)} onEdit={() => router.push(`/plans/edit?id=${workoutPlan.id}`)} />
            : <EmptySlot label="No training program yet" href="/plans/new/workout" />}

          <section className={cn(CARD, 'mt-5 p-5')} aria-labelledby="new-plan">
            <h2 id="new-plan" className="font-wide text-[19px] font-bold leading-tight text-ink">Want a new plan?</h2>
            <p className="mt-1 text-[14.5px] leading-[1.45] text-ink-65">Tell Geo what you&apos;re after and it drafts one for you to check.</p>
            <PrimaryButton type="button" className="mt-4 h-[54px] rounded-full py-0" onClick={() => useUIStore.getState().openSheet('geo-companion')}>Ask Geo for a plan</PrimaryButton>
            <div className="mt-3 border-t border-ink-06 pt-1">
              <BuildLink href="/plans/new/meal" label="Build nutrition plan by hand">Build a nutrition plan yourself</BuildLink>
              <BuildLink href="/plans/new/workout" label="Build training program by hand">Build a training program yourself</BuildLink>
            </div>
          </section>

          {earlier.length > 0 ? (
            <>
              <h2 className="mt-5 px-1 text-[13px] font-semibold text-ink-65">Earlier</h2>
              <section className={cn(CARD, 'overflow-hidden')} aria-label="Earlier plans">
                {earlier.map((plan) => <PreviousPlanRow key={plan.id} plan={plan} onClick={() => open(plan)} />)}
              </section>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

function EmptySlot({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="flex min-h-[72px] items-center gap-3 rounded-[24px] border-[1.5px] border-dashed border-ink-20 px-5 transition-transform duration-100 ease-out active:scale-[.98]">
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-semibold text-ink">{label}</span>
        <span className="block text-[13px] text-ink-65">Build one, or ask Geo below</span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-ink-35" />
    </Link>
  )
}

function BuildLink({ href, label, children }: { href: string; label: string; children: string }) {
  return (
    <Link href={href} aria-label={label} className="flex min-h-12 items-center justify-between text-[15px] font-semibold text-ink">
      {children}
      <ChevronRightIcon className="size-4 text-ink-35" />
    </Link>
  )
}
