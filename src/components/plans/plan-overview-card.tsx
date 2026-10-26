'use client'

import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { usePressTilt } from '@/components/ui/fiqr/press-tilt'
import { dayLetter, dayWeekday, formatDateRange, nextTrainingDay } from '@/components/plans/plan-format'
import { CARD, HueDot } from '@/components/plans/spatial-parts'
import { cn } from '@/lib/utils'
import type { MealPlan, Plan, WorkoutPlan } from '@/types/plans.types'

export { CARD }

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

export function planTitle(plan: Plan): string {
  return plan.content.name || (plan.type === 'meal' ? 'Nutrition plan' : 'Training plan')
}

/** How long the plan still runs, from its end date: "5 weeks left", "3 days left", "Ends today"; null without dates. */
export function timeLeft(endDate: string | undefined, today = new Date()): string | null {
  if (!endDate) return null
  const end = Date.UTC(+endDate.slice(0, 4), +endDate.slice(5, 7) - 1, +endDate.slice(8, 10))
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  if (Number.isNaN(end)) return null
  const days = Math.round((end - now) / 86400000)
  if (days < 0) return null
  if (days === 0) return 'Ends today'
  if (days < 14) return `${days} ${days === 1 ? 'day' : 'days'} left`
  return `${Math.round(days / 7)} weeks left`
}

const TITLE = 'font-display line-clamp-2 block text-[20px] font-[750] leading-[1.15] tracking-[-0.015em] text-ink [overflow-wrap:anywhere]'

/** B1 Answer card, nutrition: the day's calories with the three macros, so the list answers "what are my targets". */
export function MealPlanCard({ plan, onClick }: { plan: MealPlan; onClick: () => void }) {
  const tilt = usePressTilt<HTMLButtonElement>()
  const left = timeLeft(plan.end_date)
  const targets = plan.content.daily_targets
  const until = plan.end_date ? `until ${formatDateRange(undefined, plan.end_date).replace('Until ', '')}` : 'no end date'
  return (
    <button
      {...tilt}
      type="button"
      onClick={onClick}
      aria-label={`${planTitle(plan)}, nutrition${targets ? `, ${fmt(targets.calories)} kcal a day` : ''}`}
      className={cn(CARD, 'block w-full overflow-hidden p-4 text-left')}
    >
      <span className="flex items-start gap-2.5">
        <span className="min-w-0 flex-1">
          <b className={TITLE}>{planTitle(plan)}</b>
          <span className="mt-0.5 block text-caption text-ink-65">Nutrition, {until}</span>
        </span>
        {left ? <span className="shrink-0 rounded-full bg-ink-06 px-2.5 py-1 text-label text-ink">{left}</span> : null}
      </span>
      {targets && targets.calories > 0 ? (
        <>
          <span className="mt-3.5 flex items-baseline gap-1.5">
            <b className="font-display text-hero text-ink tabular-nums">{fmt(targets.calories)}</b>
            <span className="text-caption text-ink-65">kcal a day</span>
          </span>
          <span className="-mx-4 -mb-4 mt-2.5 grid grid-cols-3 border-t border-ink-06">
            {([['Protein', 'protein'], ['Carbs', 'carbs'], ['Fat', 'fat']] as const).map(([label, key]) => (
              <span key={key} className="block px-4 pb-3 pt-2.5">
                <span className="flex items-center gap-1.5 text-label text-ink-65"><HueDot macro={key} />{label}</span>
                <b className="text-body font-bold text-ink tabular-nums">{fmt(targets[key])} g</b>
              </span>
            ))}
          </span>
        </>
      ) : (
        <span className="mt-3 block text-body-sm text-ink-65">No targets set yet</span>
      )}
    </button>
  )
}

/** B1 Answer card, training: the next workout by name, and the plan's days as dots with the next one filled orange. */
export function WorkoutPlanCard({ plan, onClick }: { plan: WorkoutPlan; onClick: () => void }) {
  const tilt = usePressTilt<HTMLButtonElement>()
  const days = plan.content.days ?? []
  const training = days.filter((day) => !day.is_rest_day).length
  const next = nextTrainingDay(days, plan.current_position)
  const nextDay = next === null ? null : days[next]
  const nextName = nextDay ? nextDay.name || `Day ${(next ?? 0) + 1}` : null
  const weekday = nextDay ? dayWeekday(nextDay.date) : null
  return (
    <button
      {...tilt}
      type="button"
      onClick={onClick}
      aria-label={`${planTitle(plan)}, training${nextName ? `, next ${nextName}` : ''}`}
      className={cn(CARD, 'block w-full p-4 text-left')}
    >
      <b className={TITLE}>{planTitle(plan)}</b>
      <span className="mt-0.5 block text-caption text-ink-65">Training, {training} {training === 1 ? 'day' : 'days'}{days.length === 7 ? ' a week' : days.length > training ? `, ${days.length - training} rest` : ''}</span>
      {nextName ? (
        <span className="mt-3 block truncate text-body text-ink">Next: <b className="font-bold">{nextName}</b>{weekday ? `, ${weekday}` : ''}</span>
      ) : (
        <span className="mt-3 block text-body-sm text-ink-65">No workout days yet</span>
      )}
      {days.length ? (
        // shortcut: past 10 days the dots run out of room at 360 pt; split them into weeks if longer cycles turn up.
        <span aria-hidden="true" className="mt-3 flex justify-between gap-1">
          {days.slice(0, 10).map((day, index) => (
            <span key={index} className="flex flex-1 flex-col items-center gap-1 text-caption font-semibold text-ink-65">
              {dayLetter(day.date, index)}
              <i className={cn(
                'block size-[22px] rounded-full',
                day.is_rest_day ? 'shadow-[inset_0_0_0_1.5px_rgba(17,28,53,.25)]' : index === next ? 'bg-accent shadow-[0_0_0_3px_rgba(232,98,42,.2)]' : 'bg-ink',
              )} />
            </span>
          ))}
        </span>
      ) : null}
    </button>
  )
}

/** A plan that is no longer active: one row that opens it (where it can be made active again). */
export function PreviousPlanRow({ plan, onClick }: { plan: Plan; onClick: () => void }) {
  const when = plan.start_date || plan.end_date ? formatDateRange(plan.start_date, plan.end_date).replace(' – ', ' to ') : formatDateRange(plan.created_at).replace('From ', 'made ')
  return (
    <button type="button" onClick={onClick} className="flex min-h-[60px] w-full items-center gap-3 border-b border-ink-06 px-4 py-2.5 text-left last:border-b-0 active:bg-ink-04">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-bold text-ink">{planTitle(plan)}</span>
        <span className="block truncate text-caption text-ink-65">{plan.type === 'meal' ? 'Nutrition' : 'Training'}, {when}</span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-ink-35" />
    </button>
  )
}

/** Card-shaped placeholder with the exact box of what replaces it, so the swap never shifts the page. */
export function SkeletonCard({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn(CARD, 'animate-pulse', className)} />
}
