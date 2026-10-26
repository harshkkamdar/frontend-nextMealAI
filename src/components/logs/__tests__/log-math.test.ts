import { describe, expect, it } from 'vitest'
import type { FoodEstimate } from '@/lib/api/foods.api'
import type { Log } from '@/types/logs.types'
import {
  estimateEdits, groupLogsByDay, mealForTime, parseMeal, photoItemMacros, photoItemsFrom, photoTotals, scaleMacros, stepItem,
} from '../log-math'

const at = (h: number, m = 0) => new Date(2026, 9, 26, h, m)

describe('mealForTime and parseMeal', () => {
  it('maps the clock to a meal', () => {
    expect(mealForTime(at(7))).toBe('Breakfast')
    expect(mealForTime(at(10, 29))).toBe('Breakfast')
    expect(mealForTime(at(12, 41))).toBe('Lunch')
    expect(mealForTime(at(15, 30))).toBe('Snack')
    expect(mealForTime(at(19))).toBe('Dinner')
  })
  it('reads a meal from a URL value and rejects anything else', () => {
    expect(parseMeal('dinner')).toBe('Dinner')
    expect(parseMeal('brunch')).toBeNull()
    expect(parseMeal(null)).toBeNull()
  })
})

describe('scaleMacros', () => {
  it('scales per-serving macros to the chosen grams', () => {
    expect(scaleMacros({ calories: 165, protein: 31, carbs: 0, fat: 3.6 }, 100, 150)).toEqual({ calories: 248, protein: 46.5, carbs: 0, fat: 5.4 })
  })
  it('gives zeros, not NaN, for a food with no serving size', () => {
    expect(scaleMacros({ calories: 100 }, 0, 50).calories).toBe(0)
  })
})

const EST: FoodEstimate = {
  estimate_id: 'e1',
  items: [
    { name: 'Chicken', quantity_g: 160, calories: 330, protein: 34, carbs: 0, fat: 21, confidence: 0.82 },
    { name: 'Rice', quantity_g: 200, calories: 260, protein: 5, carbs: 56, fat: 1, confidence: 0.74 },
    { name: 'Sauce', calories: 85, protein: 3, carbs: 6, fat: 6, confidence: 0.4 },
  ],
  totals: { calories: 675, protein: 42, carbs: 62, fat: 28 },
  confidence: 0.4,
}

describe('photo items', () => {
  it('starts each item at the estimate, a portion multiplier when there are no grams', () => {
    const items = photoItemsFrom(EST)
    expect(items.map((i) => i.amount)).toEqual([160, 200, 1])
    expect(photoTotals(items).calories).toBe(675)
  })
  it('steps grams in tens and portions in quarters, never below one step', () => {
    const [chicken, , sauce] = photoItemsFrom(EST)
    expect(stepItem(chicken, 1).amount).toBe(170)
    expect(photoItemMacros(stepItem(chicken, 1)).calories).toBe(Math.round(330 * 170 / 160))
    expect(stepItem(sauce, -1).amount).toBe(0.75)
    let small = { ...chicken, amount: 10 }
    small = stepItem(stepItem(small, -1), -1)
    expect(small.amount).toBe(5)
  })
})

/** The backend's R7-03 rule (food-estimates.controller.ts resolvePhotoLogQuantityAndMacros), mirrored to prove the round trip. */
function backendLogged(original: FoodEstimate, edits: ReturnType<typeof estimateEdits>) {
  const sum = (items: { quantity_g?: number }[]) => items.reduce((s, i) => s + (i.quantity_g ?? 0), 0)
  const entered = sum(edits.items)
  const orig = sum(original.items)
  const q = entered > 0 ? entered : orig > 0 ? orig : 100
  const f = orig > 0 && Math.abs(q - orig) > 0.5 ? q / orig : 1
  return f === 1 ? edits.totals.calories : Math.round(edits.totals.calories * f)
}

describe('estimateEdits', () => {
  it('sends the estimate unchanged when nothing moved', () => {
    const edits = estimateEdits(EST, photoItemsFrom(EST))
    expect(edits.totals.calories).toBe(675)
    expect(edits.items).toHaveLength(3)
    expect(edits.items[2].quantity_g).toBeUndefined()
  })
  it('logs exactly the sum the user saw after per-item edits and a removal', () => {
    const items = photoItemsFrom(EST)
    items[1] = stepItem(stepItem(items[1], 1), 1)
    items[2] = { ...items[2], removed: true }
    const seen = photoTotals(items).calories
    const edits = estimateEdits(EST, items)
    expect(edits.items.map((i) => i.name)).toEqual(['Chicken', 'Rice'])
    expect(edits.items[1].quantity_g).toBe(220)
    expect(backendLogged(EST, edits)).toBe(seen)
  })
})

describe('groupLogsByDay', () => {
  const log = (id: string, day: string, hour: number) => ({ id, type: 'water', payload: {}, local_date: day, created_at: `${day}T${String(hour).padStart(2, '0')}:00:00` }) as unknown as Log
  it('labels Today, Yesterday, then the date, newest first', () => {
    const groups = groupLogsByDay([log('a', '2026-10-24', 9), log('b', '2026-10-26', 8), log('c', '2026-10-26', 12), log('d', '2026-10-25', 7)], at(13))
    expect(groups.map((g) => g.label)).toEqual(['Today', 'Yesterday', 'Sat 24 Oct'])
    expect(groups[0].logs.map((l) => l.id)).toEqual(['c', 'b'])
  })
})
