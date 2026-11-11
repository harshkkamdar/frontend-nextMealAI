'use client'

import { useState } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import type { FoodPayload, Log } from '@/types/logs.types'
import { ChoiceGrid, GroupLabel } from './choice-grid'
import { kcalText, shiftISO } from './diary-logic'
import { dayChip } from './row-actions-sheet'

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const
/** Today and the week ahead: the backend takes meals preset up to 7 days forward. */
const PLAN_DAYS = 8

interface CopyMealDialogProps {
  open: boolean
  /** The meal being copied FROM (e.g. "Snack"): the default target meal. */
  sourceMeal: string | null
  /** The meal's foods; each can be left behind. */
  items: Log[]
  /** The day the meal is on, and the user's today (YYYY-MM-DD). */
  sourceDate: string
  today: string
  onClose: () => void
  onCopy: (logs: Log[], date: string, meal: string) => void
}

/**
 * Copy a meal's foods to a day and meal (George: pick the foods, plan days ahead). Every food starts ticked; the day
 * defaults to today, or tomorrow when the meal is today's.
 */
export function CopyMealDialog({ open, sourceMeal, items, sourceDate, today, onClose, onCopy }: CopyMealDialogProps) {
  const [left, setLeft] = useState<string[]>([])
  const [day, setDay] = useState<string | null>(null)
  const [meal, setMeal] = useState<string | null>(null)

  // Each opening starts fresh (state adjusted during render, as in the row actions sheet).
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) { setLeft([]); setDay(null); setMeal(null) }
  }

  const days = Array.from({ length: PLAN_DAYS }, (_, index) => shiftISO(today, index))
  const pickedDay = day ?? (sourceDate === today ? days[1] : today)
  const pickedMeal = meal ?? sourceMeal ?? 'Breakfast'
  const chosen = items.filter((item) => !left.includes(item.id))
  const toggle = (id: string) => setLeft((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel={`Copy ${sourceMeal?.toLowerCase() ?? 'meal'}`}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-1">
        <h2 className="px-1 text-[22px] font-bold tracking-[-0.3px] text-ink">Copy {sourceMeal?.toLowerCase()}</h2>
        <GroupLabel>Foods</GroupLabel>
        <ul className="overflow-hidden rounded-card tile">
          {items.map((item) => {
            const payload = item.payload as FoodPayload
            const on = !left.includes(item.id)
            return (
              <li key={item.id} className="border-b border-ink-06 last:border-b-0">
                <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2 active:bg-ink-04">
                  <input type="checkbox" checked={on} onChange={() => toggle(item.id)} className="size-5 shrink-0 accent-[var(--color-ink)]" />
                  <span className="min-w-0 flex-1 truncate text-body font-semibold text-ink">{payload.food_name}</span>
                  <span className="shrink-0 text-caption text-ink-65 tabular-nums">{kcalText(payload.est_macros?.calories)} kcal</span>
                </label>
              </li>
            )
          })}
        </ul>
        <GroupLabel>Day</GroupLabel>
        <ChoiceGrid label="Day" cols={3} choices={days.map((d) => dayChip(d, today))} value={pickedDay} onPick={setDay} />
        <GroupLabel>Meal</GroupLabel>
        <ChoiceGrid label="Meal" choices={MEALS.map((m) => ({ value: m, label: m }))} value={pickedMeal} onPick={setMeal} />
        <PrimaryButton type="button" disabled={chosen.length === 0} onClick={() => onCopy(chosen, pickedDay, pickedMeal)} className="mt-5 justify-center">
          {chosen.length === 0 ? 'Pick a food to copy' : `Copy ${chosen.length} ${chosen.length === 1 ? 'food' : 'foods'}`}
        </PrimaryButton>
        <button type="button" onClick={onClose} className="mt-2 h-11 w-full text-[15px] font-semibold text-ink-65">
          Cancel
        </button>
      </div>
    </BottomSheet>
  )
}
