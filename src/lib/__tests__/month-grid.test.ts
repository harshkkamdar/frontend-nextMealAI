import { describe, it, expect } from 'vitest'
import { buildMonthGrid, shiftMonth, type DailyBreakdownRow } from '../month-grid'

describe('shiftMonth', () => {
  it('next month within year', () => {
    expect(shiftMonth('2026-03-15', 1)).toBe('2026-04-01')
  })
  it('prev month within year', () => {
    expect(shiftMonth('2026-03-15', -1)).toBe('2026-02-01')
  })
  it('next month crosses year', () => {
    expect(shiftMonth('2026-12-10', 1)).toBe('2027-01-01')
  })
  it('prev month crosses year', () => {
    expect(shiftMonth('2026-01-10', -1)).toBe('2025-12-01')
  })
})

describe('buildMonthGrid', () => {
  it('AC01.4 — grid uses month of anchor date', () => {
    const grid = buildMonthGrid('2026-03-15', [])
    // All in-month cells should be in March 2026
    const inMonth = grid.flat().filter((c) => c.inMonth)
    expect(inMonth[0].date).toBe('2026-03-01')
    expect(inMonth[inMonth.length - 1].date).toBe('2026-03-31')
    expect(inMonth).toHaveLength(31)
  })

  it('AC01.5 — cells merge breakdown calories and workout count', () => {
    const breakdown: DailyBreakdownRow[] = [
      { date: '2026-03-10', calories: 1842, protein: 0, carbs: 0, fat: 0, workouts: 1 },
      { date: '2026-03-11', calories: 2000, protein: 0, carbs: 0, fat: 0, workouts: 0 },
    ]
    const grid = buildMonthGrid('2026-03-15', breakdown)
    const day10 = grid.flat().find((c) => c.date === '2026-03-10')!
    const day11 = grid.flat().find((c) => c.date === '2026-03-11')!
    const day12 = grid.flat().find((c) => c.date === '2026-03-12')!
    expect(day10.calories).toBe(1842)
    expect(day10.workouts).toBe(1)
    expect(day11.calories).toBe(2000)
    expect(day11.workouts).toBe(0)
    expect(day12.calories).toBeNull()
    expect(day12.workouts).toBe(0)
  })

  it('AC01.7 — shiftMonth interacts with buildMonthGrid for navigation', () => {
    const next = shiftMonth('2026-03-15', 1)
    const grid = buildMonthGrid(next, [])
    const inMonth = grid.flat().filter((c) => c.inMonth)
    expect(inMonth).toHaveLength(30) // April
    expect(inMonth[0].date).toBe('2026-04-01')
  })

  it('AC01.8 — empty breakdown yields null-calorie cells (rendered as em-dash)', () => {
    const grid = buildMonthGrid('2026-03-15', [])
    const inMonth = grid.flat().filter((c) => c.inMonth)
    expect(inMonth.every((c) => c.calories === null && c.workouts === 0)).toBe(true)
  })

  it('AC01.12 — leap year Feb 2028 has 29 days', () => {
    const grid = buildMonthGrid('2028-02-15', [])
    const inMonth = grid.flat().filter((c) => c.inMonth)
    expect(inMonth).toHaveLength(29)
  })

  it('AC01.12 — non-leap Feb 2027 has 28 days', () => {
    const grid = buildMonthGrid('2027-02-15', [])
    const inMonth = grid.flat().filter((c) => c.inMonth)
    expect(inMonth).toHaveLength(28)
  })

  it('AC01.14 — NaN/null calories coerce to null cell', () => {
    const breakdown: DailyBreakdownRow[] = [
      // @ts-expect-error deliberate bad input
      { date: '2026-03-10', calories: null, protein: 0, carbs: 0, fat: 0, workouts: 0 },
      { date: '2026-03-11', calories: NaN, protein: 0, carbs: 0, fat: 0, workouts: 0 },
      { date: '2026-03-12', calories: -5, protein: 0, carbs: 0, fat: 0, workouts: 0 },
    ]
    const grid = buildMonthGrid('2026-03-15', breakdown)
    const day10 = grid.flat().find((c) => c.date === '2026-03-10')!
    const day11 = grid.flat().find((c) => c.date === '2026-03-11')!
    const day12 = grid.flat().find((c) => c.date === '2026-03-12')!
    expect(day10.calories).toBeNull()
    expect(day11.calories).toBeNull()
    expect(day12.calories).toBeNull()
  })

  it('grid is 7 columns wide, rows cover whole month including padding', () => {
    const grid = buildMonthGrid('2026-03-15', [])
    for (const row of grid) {
      expect(row).toHaveLength(7)
    }
    // first row must start on Sunday (getDay=0) per our contract
    expect(new Date(grid[0][0].date + 'T12:00:00').getDay()).toBe(0)
  })
})
