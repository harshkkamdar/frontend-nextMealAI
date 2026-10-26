'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import { PlanDetailFrame } from '@/components/plans/plan-detail-parts'
import { formatDayDate } from '@/components/plans/plan-format'
import { CARD, HueDot, SectionHeading } from '@/components/plans/spatial-parts'
import { activatePlan } from '@/lib/api/plans.api'
import { reducedFade } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'
import type { MealPlan, MealPlanMeal, MealPlanSnack } from '@/types/plans.types'

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

/** V1 Nutrition plan view: targets lead (one figure), then the day's meals behind day chips, then notes and history. */
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
      {targets && targets.calories > 0 ? (
        <section className={cn(CARD, 'overflow-hidden p-4')} aria-label="Daily targets">
          <span className="text-label text-ink-65">Daily targets</span>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-hero text-ink tabular-nums">{fmt(targets.calories)}</span>
            <span className="text-body-sm font-semibold text-ink-65">kcal a day</span>
          </p>
          <div className="-mx-4 -mb-4 mt-3.5 grid grid-cols-3 border-t border-ink-06">
            {([['Protein', 'protein'], ['Carbs', 'carbs'], ['Fat', 'fat']] as const).map(([label, key], index) => (
              <div key={key} className={cn('px-4 py-3', index > 0 && 'border-l border-ink-06')}>
                <span className="flex items-center gap-1.5 text-label text-ink-65"><HueDot macro={key} />{label}</span>
                <p className="mt-0.5 font-display text-[20px] font-[750] tracking-[-0.015em] text-ink tabular-nums">{fmt(targets[key])}<span className="text-caption font-semibold tracking-normal text-ink-65"> g</span></p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <button type="button" onClick={() => useUIStore.getState().openSheet('geo-companion')} className="flex min-h-[68px] w-full flex-col justify-center rounded-card border-[1.5px] border-dashed border-ink-20 px-[18px] py-3 text-left transition-transform active:scale-[.98]">
          <span className="block text-body font-bold text-ink">No targets yet</span>
          <span className="block text-caption text-ink-65">Ask Geo to work them out with you</span>
        </button>
      )}

      {day ? (
        <>
          <SectionHeading>Meals</SectionHeading>
          <div role="group" aria-label="Plan days" data-no-swipe-back className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {days.map((item, index) => (
              <button
                key={`${item.date}-${index}`}
                type="button"
                aria-pressed={selectedDay === index}
                onClick={() => { void haptic('selection'); setSelectedDay(index) }}
                className={`min-h-chip shrink-0 whitespace-nowrap rounded-full px-4 text-body-sm font-semibold tabular-nums transition-transform active:scale-[.96] ${selectedDay === index ? 'bg-ink text-cream' : 'bg-card text-ink shadow-[0_1px_2px_rgba(17,28,53,.06)]'}`}
              >
                {formatDayDate(item.date, index)}
              </button>
            ))}
          </div>
          {/* The old day fades out while the new one fades in on top of it (popLayout), so there is never an empty frame. */}
          <div className="relative mt-2">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div key={selectedDay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: reduce ? reducedFade : { duration: 0.14, ease: 'easeOut' } }} transition={reduce ? reducedFade : { duration: 0.2, ease: 'easeOut' }} className="flex w-full flex-col">
                {day.meals.length || day.snacks?.length ? (
                  <section className={cn(CARD, 'overflow-hidden')}>
                    {day.meals.map((meal, index) => <FoodRow key={`${meal.type}-${index}`} label={meal.type} food={meal} />)}
                    {day.snacks?.map((snack, index) => <FoodRow key={`${snack.name}-${index}`} label="Snack" food={snack} />)}
                  </section>
                ) : (
                  <div className="flex min-h-[68px] flex-col justify-center rounded-card border-[1.5px] border-dashed border-ink-20 px-[18px] py-3">
                    <span className="text-body font-bold text-ink">Nothing planned for {formatDayDate(day.date, selectedDay)}</span>
                    <span className="text-caption text-ink-65">Edit the plan to add meals, or ask Geo</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      ) : null}
    </PlanDetailFrame>
  )
}

/** One planned food: type, the name (wraps; it is the content), its macros in words, kcal on the right. */
function FoodRow({ label, food }: { label: string; food: MealPlanMeal | MealPlanSnack }) {
  const macros = [food.protein != null ? `${fmt(food.protein)} g protein` : null, food.carbs != null ? `${fmt(food.carbs)} g carbs` : null, food.fat != null ? `${fmt(food.fat)} g fat` : null].filter(Boolean).join(', ')
  return (
    <div className="flex items-start gap-3 border-b border-ink-06 px-4 py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-caption text-ink-65">{label}</p>
        <p className="text-body font-bold text-ink [overflow-wrap:anywhere]">{food.name}</p>
        {macros ? <p className="text-caption text-ink-65 tabular-nums">{macros}</p> : null}
      </div>
      {food.calories != null ? <p className="shrink-0 text-body font-bold text-ink tabular-nums">{fmt(food.calories)}<span className="text-caption font-semibold text-ink-65"> kcal</span></p> : null}
    </div>
  )
}
