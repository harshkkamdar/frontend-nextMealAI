'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PushedHeader } from '@/components/layout/screen-header'
import { MACRO_HUES, SplitRing, macroSplit, type Targets } from '@/components/diary/plan-parts'
import { OfflineBand } from '@/components/shared/offline-band'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { usePressTilt } from '@/components/ui/fiqr/press-tilt'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { getPlans } from '@/lib/api/plans.api'
import { getProfile } from '@/lib/api/profile.api'
import { formatMacroKcal } from '@/lib/macros'
import { goBack } from '@/lib/navigation'
import { todayLocalISO } from '@/lib/timezone'
import { useUIStore } from '@/stores/ui.store'
import type { MealPlan } from '@/types/plans.types'

const CARD = 'rounded-card bg-card shadow-[var(--shadow-card)]'
const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')
const shortDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

/**
 * Where Food's targets come from (pushed from the diary's plan link; owner's 26 Oct 2026 enhancement of journey-food
 * "Your nutrition plan"): the active nutrition plan's daily targets and today's planned meals, or, without a plan,
 * the profile's targets. Changes go through Geo; the full plan stays one row away.
 */
export default function NutritionPlanPage() {
  const router = useRouter()
  const tz = useUserTimezone()
  const today = todayLocalISO(tz)
  const fetchData = useCallback(async () => {
    const [plans, profile] = await Promise.all([getPlans({ type: 'meal', active_only: true }), getProfile()])
    return { plan: (plans.find((p) => p.type === 'meal') as MealPlan | undefined) ?? null, profile }
  }, [])
  const { data, loading, refetch } = useCachedQuery('food:plan', fetchData, [])
  useSyncRefetch(['plans:updated', 'plans:deactivated'], refetch)
  const plan = data?.plan ?? null
  useSetGeoScreen('food_plan', { planId: plan?.id ?? null })

  const planTargets = plan?.content?.daily_targets
  const profile = data?.profile
  const targets: Targets = {
    calories: planTargets?.calories ?? profile?.daily_calorie_target ?? 0,
    protein: planTargets?.protein ?? profile?.daily_protein_g ?? 0,
    carbs: planTargets?.carbs ?? profile?.daily_carbs_g ?? 0,
    fat: planTargets?.fat ?? profile?.daily_fat_g ?? 0,
  }
  const split = macroSplit(targets)
  const todayPlan = plan?.content?.days?.find((d) => d.date?.slice(0, 10) === today)
  const todayMeals = todayPlan ? [...todayPlan.meals.map((m) => ({ label: m.type, name: m.name, kcal: m.calories })), ...(todayPlan.snacks ?? []).map((s) => ({ label: 'Snack', name: s.name, kcal: s.calories }))] : []
  const source = plan
    ? [plan.content?.name || 'Your plan', plan.start_date || plan.created_at ? `since ${shortDate(plan.start_date || plan.created_at)}` : null].filter(Boolean).join(' · ')
    : 'From your profile'
  const askGeo = () => useUIStore.getState().openSheet('geo-companion')

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10">
      <PushedHeader title={data && !plan ? 'Your targets' : 'Nutrition plan'} onBack={() => goBack(router, '/food')} backLabel="Back to Food" />
      <div className="-mx-4"><OfflineBand /></div>

      {!data && loading ? (
        <div className="mt-2 space-y-2.5" role="status" aria-busy="true" aria-label="Loading your targets">
          <div className={`${CARD} h-[268px] opacity-60`} />
          <div className={`${CARD} h-[132px] opacity-60`} />
        </div>
      ) : !data ? (
        <div className="mt-2"><ErrorState onRetry={() => void refetch()}>I couldn&apos;t load your targets. Check your connection and try again.</ErrorState></div>
      ) : (
        <div className="mt-2 flex flex-col gap-2.5">
          <section className={`${CARD} p-4`} aria-label="Daily targets">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption text-ink-65">{source}</p>
                {targets.calories > 0 ? (
                  <p className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-display text-hero text-ink tabular-nums">{fmt(targets.calories)}</span>
                    <span className="text-body-sm font-semibold text-ink-65">kcal a day</span>
                  </p>
                ) : <p className="mt-1 text-headline text-ink">No daily target yet</p>}
              </div>
              {targets.calories > 0 ? <SplitRing targets={targets} size={60} stroke={8} /> : null}
            </div>
            {targets.calories > 0 ? (
              <ul className="mt-3">
                {MACRO_HUES.map(({ key, label, color }) => (
                  <li key={key} className="flex min-h-12 items-center gap-3 border-t border-ink-06">
                    <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
                    <span className="flex-1 text-body text-ink">{label}</span>
                    <span className="text-caption text-ink-65 tabular-nums">{split[key]}% of kcal</span>
                    <span className="min-w-[64px] text-right text-body font-bold text-ink tabular-nums">{fmt(targets[key])} g</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {todayMeals.length ? (
            <section className={`${CARD} overflow-hidden`} aria-label="Today on the plan">
              <h2 className="px-4 pb-1 pt-3.5 text-label text-ink-65">Today on the plan</h2>
              {todayMeals.map((meal, index) => (
                <div key={`${meal.label}-${index}`} className="flex min-h-14 items-center gap-3 border-t border-ink-06 px-4 py-2 first-of-type:border-t-0">
                  <span className="min-w-0 flex-1">
                    <span className="block text-caption capitalize text-ink-65">{meal.label}</span>
                    <span className="block text-body-sm font-semibold text-ink [overflow-wrap:anywhere]">{meal.name}</span>
                  </span>
                  {meal.kcal != null ? <span className="shrink-0 text-body-sm font-semibold text-ink tabular-nums">{formatMacroKcal(meal.kcal)}<span className="text-label font-medium text-ink-65"> kcal</span></span> : null}
                </div>
              ))}
            </section>
          ) : null}

          <section className={`${CARD} p-4`}>
            <p className="text-body-sm text-ink-65">
              {plan
                ? plan.content?.notes?.trim() || 'Your diary measures every day against these numbers.'
                : 'A plan adds meal ideas that fit these numbers.'}
            </p>
            <button type="button" onClick={askGeo} className="mt-3.5 h-btn w-full rounded-[18px] bg-ink text-body font-bold text-cream transition-transform active:scale-[.97]">
              {plan ? 'Ask Geo to change it' : 'Build a plan with Geo'}
            </button>
          </section>

          {plan ? <FullPlanRow onOpen={() => router.push(`/plans/view?id=${plan.id}`)} /> : null}
        </div>
      )}
    </div>
  )
}

function FullPlanRow({ onOpen }: { onOpen: () => void }) {
  const tilt = usePressTilt<HTMLButtonElement>()
  return (
    <button type="button" onClick={onOpen} {...tilt} className={`${CARD} flex min-h-row w-full items-center gap-3 px-4 text-left`}>
      <span className="flex-1 text-body font-semibold text-ink">See the whole plan</span>
      <ChevronRightIcon className="size-4 text-ink-35" />
    </button>
  )
}
