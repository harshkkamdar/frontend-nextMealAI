import { describe, expect, it } from 'vitest'
import { macroSplit } from '../plan-parts'
import { copyDays, dayKind, dominantMacro, logPhoto, mealOf, quantityLabel, shiftISO, summaryCopy } from '../diary-logic'

const base = { dayLabel: 'Thu 22 Oct', logged: true }

describe('summaryCopy', () => {
  it('today leads with what is left, and the line says eaten of target', () => {
    expect(summaryCopy({ ...base, eaten: 1349, target: 2250, kind: 'today' })).toEqual({ value: 901, unit: 'kcal left', strong: '1,349', rest: ' eaten of 2,250' })
  })
  it('today over target says over, never a negative left', () => {
    expect(summaryCopy({ ...base, eaten: 2400, target: 2250, kind: 'today' })).toMatchObject({ value: 150, unit: 'kcal over' })
  })
  it('a past day shows eaten and how far over or under', () => {
    expect(summaryCopy({ ...base, eaten: 2318, target: 2250, kind: 'past' })).toEqual({ value: 2318, unit: 'kcal eaten', strong: '68', rest: ' over your 2,250 target' })
    expect(summaryCopy({ ...base, eaten: 2000, target: 2250, kind: 'past' }).rest).toBe(' under your 2,250 target')
  })
  it('an empty past day names the day', () => {
    expect(summaryCopy({ ...base, logged: false, eaten: 0, target: 2250, kind: 'past' }).rest).toBe('Nothing logged on Thu 22 Oct')
  })
  it('a future day is planned, and no target shows eaten only', () => {
    expect(summaryCopy({ ...base, eaten: 380, target: 2250, kind: 'future' }).unit).toBe('kcal planned')
    expect(summaryCopy({ ...base, eaten: 5397, target: 0, kind: 'today' })).toEqual({ value: 5397, unit: 'kcal eaten', strong: null, rest: 'No daily target set' })
  })
})

describe('days', () => {
  it('dayKind and shiftISO', () => {
    expect(dayKind('2026-10-26', '2026-10-26')).toBe('today')
    expect(dayKind('2026-10-25', '2026-10-26')).toBe('past')
    expect(dayKind('2026-10-27', '2026-10-26')).toBe('future')
    expect(shiftISO('2026-10-31', 1)).toBe('2026-11-01')
    expect(shiftISO('2026-04-05', -1)).toBe('2026-04-04')
  })
  it('copyDays skips the source day and offers at most three', () => {
    expect(copyDays('2026-10-26', '2026-10-26')).toEqual(['2026-10-27', '2026-10-28'])
    expect(copyDays('2026-10-25', '2026-10-26')).toEqual(['2026-10-26', '2026-10-27', '2026-10-28'])
    expect(copyDays('2026-10-20', '2026-10-26')).toEqual(['2026-10-25', '2026-10-26', '2026-10-27'])
  })
})

describe('rows', () => {
  it('dominantMacro weighs fat at 9 kcal per gram', () => {
    expect(dominantMacro({ protein: 24, carbs: 52, fat: 11 })).toBe('carbs')
    expect(dominantMacro({ protein: 20, carbs: 5, fat: 12 })).toBe('fat')
    expect(dominantMacro({ protein: 40, carbs: 10, fat: 5 })).toBe('protein')
    expect(dominantMacro({ calories: 0 })).toBeNull()
    expect(dominantMacro(undefined)).toBeNull()
  })
  it('logPhoto only accepts an https photo_url', () => {
    expect(logPhoto({ food_name: 'x' })).toBeNull()
    expect(logPhoto({ food_name: 'x', photo_url: 'javascript:alert(1)' } as never)).toBeNull()
    expect(logPhoto({ food_name: 'x', photo_url: 'https://cdn.example.com/a.jpg' } as never)).toBe('https://cdn.example.com/a.jpg')
  })
  it('mealOf files unknown meal types under Snack', () => {
    expect(mealOf({ food_name: 'x', meal_type: 'LUNCH' })).toBe('Lunch')
    expect(mealOf({ food_name: 'x', meal_type: 'supper' })).toBe('Snack')
    expect(mealOf({ food_name: 'x' })).toBe('Snack')
  })
  it('quantityLabel', () => {
    expect(quantityLabel({ food_name: 'x', servings: 2, serving_label: 'slice' })).toBe('2 slices')
    expect(quantityLabel({ food_name: 'x', quantity_g: 150 })).toBe('150g')
    expect(quantityLabel({ food_name: 'x', items: [{ name: 'a', est_macros: {} }, { name: 'b', est_macros: {} }] })).toBe('2 items, from your photo')
  })
})

describe('macroSplit', () => {
  it('shares energy at 4/4/9 kcal per gram', () => {
    expect(macroSplit({ calories: 2250, protein: 160, carbs: 230, fat: 70 })).toEqual({ protein: 29, carbs: 42, fat: 29 })
  })
  it('is all zeros without targets', () => {
    expect(macroSplit({ calories: 0, protein: 0, carbs: 0, fat: 0 })).toEqual({ protein: 0, carbs: 0, fat: 0 })
  })
})
