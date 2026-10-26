import { describe, expect, it } from 'vitest'
import { formatSleep, mealRows, shiftDate, sleepTile, stepsTile, waterGlassesToday, weightTile } from '@/components/dashboard/home-data'
import type { Log } from '@/types/logs.types'

const TODAY = '2026-10-26'

function log(type: string, date: string, payload: Record<string, unknown>, at = `${date}T08:00:00.000Z`): Log {
  return { id: `${type}-${date}-${at}`, user_id: 'u1', type, payload, source: 'manual', local_date: date, created_at: at, updated_at: at } as Log
}

describe('home-data', () => {
  it('shifts calendar dates across month ends', () => {
    expect(shiftDate('2026-11-01', -1)).toBe('2026-10-31')
    expect(shiftDate(TODAY, 6)).toBe('2026-11-01')
  })

  it('takes the newest steps log per day and keeps yesterday for the no-data state', () => {
    const logs = [
      log('steps', TODAY, { steps: 3000 }, `${TODAY}T08:00:00.000Z`),
      log('steps', TODAY, { steps: 8412 }, `${TODAY}T12:00:00.000Z`),
      log('steps', '2026-10-25', { steps: 6210 }),
    ]
    expect(stepsTile(logs, TODAY)).toEqual({ today: 8412, yesterday: 6210 })
    expect(stepsTile(logs.slice(2), TODAY)).toEqual({ today: null, yesterday: 6210 })
  })

  it('reports weight, a week delta and a day-ordered series', () => {
    const logs = [
      log('weight', '2026-10-19', { weight_kg: 79 }),
      log('weight', '2026-10-23', { weight_kg: 78.6 }),
      log('weight', TODAY, { weight_kg: 78.2 }),
    ]
    expect(weightTile(logs, 80, TODAY)).toEqual({ kg: 78.2, weekDelta: -0.8, series: [79, 78.6, 78.2] })
  })

  it('falls back to the profile weight with no delta when nothing is logged', () => {
    expect(weightTile([], 81.5, TODAY)).toEqual({ kg: 81.5, weekDelta: null, series: [] })
    expect(weightTile([], null, TODAY).kg).toBeNull()
  })

  it('builds a seven-night sleep strip and uses last night', () => {
    const tile = sleepTile([log('sleep', '2026-10-25', { hours: 7.2 }), log('sleep', '2026-10-21', { hours: 6 })], TODAY)
    expect(tile.nights).toEqual([null, 6, null, null, null, 7.2, null])
    expect(tile.hours).toBe(7.2)
    expect(formatSleep(7.2)).toBe('7h 12m')
    expect(formatSleep(8)).toBe('8h')
  })

  it('sums only today’s water', () => {
    expect(waterGlassesToday([log('water', TODAY, { glasses: 2 }), log('water', TODAY, { glasses: 1 }), log('water', '2026-10-25', { glasses: 5 })], TODAY)).toBe(3)
  })

  it('groups today’s food by meal in day order', () => {
    const rows = mealRows([
      log('food', TODAY, { food_name: 'Chicken wrap', meal_type: 'lunch', est_macros: { calories: 540.4, protein: 38 } }),
      log('food', TODAY, { food_name: 'Oats', meal_type: 'Breakfast', est_macros: { calories: 310 } }),
      log('food', TODAY, { food_name: 'Banana', meal_type: 'breakfast', calories: 105 }),
      log('food', '2026-10-25', { food_name: 'Pizza', meal_type: 'dinner', calories: 900 }),
    ], TODAY)
    expect(rows).toEqual([
      { meal: 'Breakfast', kcal: 415, items: ['Oats', 'Banana'] },
      { meal: 'Lunch', kcal: 540, items: ['Chicken wrap'] },
    ])
  })
})
