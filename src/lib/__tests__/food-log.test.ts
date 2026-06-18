import { describe, it, expect } from 'vitest'
import { buildFoodLogItems, isFoodDraftFilled, type FoodDraft } from '../food-log'

const draft = (over: Partial<FoodDraft> = {}): FoodDraft => ({
  food_name: 'Apple',
  quantity_g: 150,
  est_macros: { calories: 80, protein: 0, carbs: 21, fat: 0 },
  meal_type: 'snack',
  ...over,
})

describe('isFoodDraftFilled', () => {
  it('true only with a non-blank name', () => {
    expect(isFoodDraftFilled(draft())).toBe(true)
    expect(isFoodDraftFilled(draft({ food_name: '   ' }))).toBe(false)
    expect(isFoodDraftFilled(null)).toBe(false)
    expect(isFoodDraftFilled(undefined)).toBe(false)
  })
})

describe('buildFoodLogItems (BUG-009 multi-add commit)', () => {
  it('combines pending items plus a filled current draft', () => {
    const items = buildFoodLogItems([draft({ food_name: 'Banana' })], draft({ food_name: 'Oats' }))
    expect(items).toHaveLength(2)
    expect(items.map((i) => (i.payload as any).food_name)).toEqual(['Banana', 'Oats'])
    expect(items.every((i) => i.type === 'food' && i.source === 'manual')).toBe(true)
  })

  it('omits the current draft when it has no name (half-typed row not logged)', () => {
    const items = buildFoodLogItems([draft({ food_name: 'Banana' })], draft({ food_name: '' }))
    expect(items).toHaveLength(1)
    expect((items[0].payload as any).food_name).toBe('Banana')
  })

  it('trims names and drops blank/zero macros + quantity', () => {
    const items = buildFoodLogItems(
      [],
      { food_name: '  Toast  ', quantity_g: 0, est_macros: { calories: 90, protein: 0, carbs: 0, fat: 0 } },
    )
    expect(items).toHaveLength(1)
    const p = items[0].payload as any
    expect(p.food_name).toBe('Toast')
    expect(p.quantity_g).toBeUndefined() // 0 → dropped
    expect(p.est_macros).toEqual({ calories: 90 }) // zero protein/carbs/fat dropped
  })

  it('returns [] when nothing is loggable', () => {
    expect(buildFoodLogItems([], null)).toEqual([])
    expect(buildFoodLogItems([], draft({ food_name: '' }))).toEqual([])
  })
})
