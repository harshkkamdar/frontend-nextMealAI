'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import { CARD } from '@/components/plans/plan-overview-card'
import { PlanDetailFrame, SectionTitle } from '@/components/plans/plan-detail-parts'
import { formatDayDate } from '@/components/plans/plan-format'
import { Chip } from '@/components/ui/fiqr/chip'
import { activatePlan } from '@/lib/api/plans.api'
import { formatMacroGrams, formatMacroKcal } from '@/lib/macros'
import { reducedFade } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'
import type { MealPlan, MealPlanMeal, MealPlanSnack } from '@/types/plans.types'

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

export function MealPlanDetail({ plan }: { plan: MealPlan }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [selectedDay, setSelectedDay] = useState(0)
  const [activating, setActivating] = useState(false)
  const targets = plan.content.daily_targets
  const days = plan.content.days ?? []
  const day = days[selectedDay]
  async function makeActive() {
    setActivating(true)
    try { await activatePlan(plan.id); toast.success('This is your plan now'); router.refresh() }
    catch { toast.error("Couldn't make it active. Try again.") }
    finally { setActivating(false) }
  }

  return (
    <PlanDetailFrame plan={plan} kind="Nutrition plan" fallbackTitle="Nutrition Plan" activating={activating} onActivate={makeActive}>
      <SectionTitle>Daily targets</SectionTitle>
      {targets && targets.calories > 0 ? (
        <section className={cn(CARD, 'p-5')} aria-label="Daily targets">
          <p className="text-[13px] font-semibold text-ink-65">Calories</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="font-wide text-[40px] font-[750] leading-none tracking-[-1px] text-ink tabular-nums">{fmt(targets.calories)}</span>
            <span className="text-[15px] font-semibold text-ink-65">kcal a day</span>
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-ink-06 pt-4">
            <Macro label="Protein" grams={targets.protein} color="var(--color-ink)" />
            <Macro label="Carbs" grams={targets.carbs} color="var(--color-macro-teal)" />
            <Macro label="Fat" grams={targets.fat} color="var(--color-macro-ochre)" />
          </div>
        </section>
      ) : (
        <button type="button" onClick={() => useUIStore.getState().openSheet('geo-companion')} className="flex min-h-16 w-full items-center rounded-[24px] border-[1.5px] border-dashed border-ink-20 px-5 text-left transition-transform active:scale-[.98]">
          <span>
            <span className="block text-[15.5px] font-semibold text-ink">No targets yet</span>
            <span className="block text-[13px] text-ink-65">Ask Geo to work them out with you</span>
          </span>
        </button>
      )}

      {day ? (
        <>
          <SectionTitle>Meals</SectionTitle>
          <div role="group" aria-label="Plan days" data-no-swipe-back className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {days.map((item, index) => (
              <Chip
                key={`${item.date}-${index}`}
                selected={selectedDay === index}
                onClick={() => { void haptic('selection'); setSelectedDay(index) }}
                className="shrink-0 transition-transform active:scale-[.96]"
              >
                {formatDayDate(item.date, index)}
              </Chip>
            ))}
          </div>
          {/* The old day fades out while the new one fades in on top of it (popLayout), so there is never an empty frame. */}
          <div className="relative">
          <AnimatePresence initial={false} mode="popLayout">
          <motion.div key={selectedDay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: reduce ? reducedFade : { duration: 0.14, ease: 'easeOut' } }} transition={reduce ? reducedFade : { duration: 0.2, ease: 'easeOut' }} className="flex w-full flex-col gap-3">
            {day.meals.length || day.snacks?.length ? (
              <section className={cn(CARD, 'overflow-hidden')}>
                {day.meals.map((meal, index) => <FoodRow key={`${meal.type}-${index}`} label={`${meal.type} · ${formatMacroKcal(meal.calories ?? 0)} kcal`} food={meal} />)}
                {day.snacks?.map((snack, index) => <FoodRow key={`${snack.name}-${index}`} label={`Snack · ${formatMacroKcal(snack.calories ?? 0)} kcal`} food={snack} />)}
              </section>
            ) : (
              <div className="flex min-h-16 items-center rounded-[24px] border-[1.5px] border-dashed border-ink-20 px-5 text-[15px] font-semibold text-ink-65">Nothing planned for this day</div>
            )}
          </motion.div>
          </AnimatePresence>
          </div>
        </>
      ) : null}
    </PlanDetailFrame>
  )
}

function Macro({ label, grams, color }: { label: string; grams: number; color: string }) {
  return (
    <div>
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-65"><span aria-hidden="true" className="size-2 rounded-full" style={{ background: color }} />{label}</span>
      <span className="mt-1 block text-[19px] font-bold text-ink tabular-nums">{fmt(grams)}<span className="text-[14px] font-semibold text-ink-65"> g</span></span>
    </div>
  )
}

function FoodRow({ label, food }: { label: string; food: MealPlanMeal | MealPlanSnack }) {
  const macros = [food.protein != null ? `${formatMacroGrams(food.protein)} P` : null, food.carbs != null ? `${formatMacroGrams(food.carbs)} C` : null, food.fat != null ? `${formatMacroGrams(food.fat)} F` : null].filter(Boolean).join(' · ')
  return (
    <div className="border-b border-ink-06 px-5 py-3.5 last:border-b-0">
      <p className="text-[13px] font-semibold text-ink-65">{label}</p>
      <p className="mt-0.5 break-words text-[15.5px] font-semibold text-ink">{food.name}</p>
      {macros ? <p className="mt-0.5 text-[13px] text-ink-65 tabular-nums">{macros}</p> : null}
    </div>
  )
}
