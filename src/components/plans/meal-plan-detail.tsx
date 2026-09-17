'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PlanChangelog } from '@/components/plans/plan-changelog'
import { formatDateRange, formatDayDate, statusLabel } from '@/components/plans/plan-format'
import { MetricTile } from '@/components/ui/fiqr/metric-tile'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { activatePlan } from '@/lib/api/plans.api'
import { formatMacroGrams, formatMacroKcal } from '@/lib/macros'
import { useUIStore } from '@/stores/ui.store'
import type { MealPlan, MealPlanMeal, MealPlanSnack } from '@/types/plans.types'

export function MealPlanDetail({ plan }: { plan: MealPlan }) {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState(0)
  const [activating, setActivating] = useState(false)
  const targets = plan.content.daily_targets
  const days = plan.content.days ?? []
  const day = days[selectedDay]
  async function makeActive() {
    setActivating(true)
    try { await activatePlan(plan.id); toast.success('Plan activated'); router.refresh() }
    catch { toast.error('Failed to activate plan') }
    finally { setActivating(false) }
  }

  return <div className="space-y-7">
    <header>
      <div className="flex items-center gap-2"><button type="button" onClick={() => router.back()} aria-label="Back" className="inline-flex h-9 w-9 items-center justify-center text-ink-60"><ChevronLeft className="h-6 w-6" /></button><h1 className="text-[22px] font-semibold text-ink">{plan.content.name || 'Nutrition Plan'}</h1></div>
      <p className="ml-11 mt-1 text-[13.5px] text-ink-55">{statusLabel(plan.status)} · {formatDateRange(plan.start_date, plan.end_date)}</p>
    </header>

    <section className="space-y-2.5">
      <SectionLabel>Daily targets</SectionLabel>
      {targets && targets.calories > 0 ? <div className="grid grid-cols-2 gap-[10px]">
        <MetricTile label="Calories" value={targets.calories.toLocaleString('en-US')} />
        <MetricTile label="Protein" value={targets.protein} unit="g" />
        <MetricTile label="Carbs" value={targets.carbs} unit="g" />
        <MetricTile label="Fat" value={targets.fat} unit="g" />
      </div> : <button type="button" onClick={() => useUIStore.getState().openSheet('geo-companion')} className="w-full rounded-[16px] border border-ink-12 bg-card p-[14px] text-left text-[15.5px] font-semibold text-ink">Targets not set · Ask Geo</button>}
    </section>

    {plan.content.notes ? <section className="space-y-2.5"><SectionLabel>Notes</SectionLabel><div className="rounded-[16px] border border-ink-12 bg-card p-[14px] text-[15.5px] leading-relaxed text-ink-80">{plan.content.notes}</div></section> : null}

    {day ? <section className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">{days.map((item, index) => <button type="button" key={`${item.date}-${index}`} onClick={() => setSelectedDay(index)} className={`h-9 shrink-0 rounded-full px-3 text-[13.5px] font-semibold ${selectedDay === index ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'}`}>{formatDayDate(item.date, index)}</button>)}</div>
      <div className="space-y-4">{day.meals.map((meal, index) => <MealBlock key={`${meal.type}-${index}`} meal={meal} />)}{day.snacks?.length ? <div className="space-y-2"><SectionLabel>Snacks</SectionLabel><div className="divide-y divide-ink-09 rounded-[16px] border border-ink-12 bg-card">{day.snacks.map((snack, index) => <FoodRow key={`${snack.name}-${index}`} food={snack} />)}</div></div> : null}</div>
    </section> : null}

    <PlanChangelog planId={plan.id} />
    <div className="space-y-3"><SecondaryButton onNavy={false} onClick={() => router.push(`/plans/edit?id=${plan.id}`)}>Edit plan</SecondaryButton>{plan.status !== 'active' ? <PrimaryButton onClick={makeActive} disabled={activating}>{activating ? 'Activating…' : 'Make this my plan'}</PrimaryButton> : null}</div>
  </div>
}

function MealBlock({ meal }: { meal: MealPlanMeal }) {
  return <div className="space-y-2"><SectionLabel>{meal.type} · {formatMacroKcal(meal.calories ?? 0)} kcal</SectionLabel><div className="rounded-[16px] border border-ink-12 bg-card"><FoodRow food={meal} /></div></div>
}

function FoodRow({ food }: { food: MealPlanMeal | MealPlanSnack }) {
  const macros = [food.protein != null ? `${formatMacroGrams(food.protein)} P` : null, food.carbs != null ? `${formatMacroGrams(food.carbs)} C` : null, food.fat != null ? `${formatMacroGrams(food.fat)} F` : null].filter(Boolean).join(' · ')
  return <div className="min-h-14 px-[14px] py-3"><div className="text-[15.5px] font-semibold text-ink">{food.name}</div>{macros ? <div className="text-[13px] text-ink-55">{macros}</div> : null}</div>
}
