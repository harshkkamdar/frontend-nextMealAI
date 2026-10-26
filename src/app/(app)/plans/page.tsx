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

/** Section labels and every text column share one 20 px inset inside the 16 px gutter, in line with the back button. */
const SECTION = 'px-5 text-[13px] font-semibold text-ink-65'

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
        <div className={cn('mt-4 flex flex-col', enter && 'enter-rows')}>
          <section aria-labelledby="active-plans" className="flex flex-col gap-3">
            <h2 id="active-plans" className={SECTION}>Active</h2>
            {mealPlan
              ? <PlanOverviewCard plan={mealPlan} onClick={() => open(mealPlan)} onEdit={() => router.push(`/plans/edit?id=${mealPlan.id}`)} />
              : <EmptySlot label="No nutrition plan yet" href="/plans/new/meal" />}
            {workoutPlan
              ? <PlanOverviewCard plan={workoutPlan} onClick={() => open(workoutPlan)} onEdit={() => router.push(`/plans/edit?id=${workoutPlan.id}`)} />
              : <EmptySlot label="No training program yet" href="/plans/new/workout" />}
          </section>

          <section aria-labelledby="new-plan" className="mt-10">
            <h2 id="new-plan" className="px-5 text-[17px] font-semibold text-ink">Want a new plan?</h2>
            <p className="mt-1 px-5 text-[14.5px] leading-[1.45] text-ink-65">Tell Geo what you&apos;re after and it drafts one for you to check.</p>
            <PrimaryButton type="button" className="mt-4 h-[54px] rounded-full py-0" onClick={() => useUIStore.getState().openSheet('geo-companion')}>Ask Geo for a plan</PrimaryButton>
            <h3 className={cn(SECTION, 'mt-6')}>Or build it yourself</h3>
            <div className="mt-1">
              <BuildLink href="/plans/new/meal" label="Build nutrition plan by hand">Nutrition plan</BuildLink>
              <BuildLink href="/plans/new/workout" label="Build training program by hand">Training program</BuildLink>
            </div>
          </section>

          {earlier.length > 0 ? (
            <section aria-labelledby="earlier-plans" className="mt-10 flex flex-col gap-3">
              <h2 id="earlier-plans" className={SECTION}>Earlier</h2>
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
    <Link href={href} aria-label={label} className="flex min-h-12 items-center justify-between border-b border-ink-06 px-5 text-[16px] font-semibold text-ink last:border-b-0 active:opacity-60">
      {children}
      <ChevronRightIcon className="size-4 text-ink-35" />
    </Link>
  )
}
