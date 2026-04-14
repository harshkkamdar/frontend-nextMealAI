/**
 * FB-07 — Monthly Calendar Grid
 *
 * Pure helpers for building a 7-column calendar grid for a given month.
 * Keeps the logic out of the React component so it can be unit-tested
 * without RTL.
 */

export interface DailyBreakdownRow {
  date: string // YYYY-MM-DD
  calories: number
  protein: number
  carbs: number
  fat: number
  workouts: number
}

export interface MonthGridCell {
  date: string // YYYY-MM-DD
  dayNum: number
  inMonth: boolean
  isToday: boolean
  calories: number | null // null = no food logged (render as "—")
  workouts: number // count of workout logs on the day
}

// Parse YYYY-MM-DD → local Date at noon (avoids DST edge cases shifting day).
function parseLocalNoon(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/**
 * Shift the month of an anchor date by `delta` (positive = forward).
 * Returns the first day of the shifted month as YYYY-MM-DD.
 */
export function shiftMonth(anchorISO: string, delta: number): string {
  const a = parseLocalNoon(anchorISO)
  const shifted = new Date(a.getFullYear(), a.getMonth() + delta, 1, 12, 0, 0, 0)
  return toISO(shifted)
}

function coerceCalories(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw !== 'number') return null
  if (!Number.isFinite(raw)) return null
  if (raw <= 0) return null
  return Math.round(raw)
}

function coerceWorkouts(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return 0
  return Math.floor(raw)
}

/**
 * Build a rectangular 7-column month grid for the calendar month that
 * contains `anchorISO`. Leading/trailing cells from the adjacent months
 * pad the first/last row so that the first column is always Sunday.
 *
 * - `inMonth = false` for pad cells (still renderable but muted).
 * - `calories` is null unless the breakdown row has a positive finite value.
 * - `workouts` defaults to 0.
 */
export function buildMonthGrid(
  anchorISO: string,
  breakdown: readonly DailyBreakdownRow[]
): MonthGridCell[][] {
  const anchor = parseLocalNoon(anchorISO)
  const year = anchor.getFullYear()
  const month = anchor.getMonth()

  // Index breakdown by date for O(1) lookup.
  const byDate = new Map<string, DailyBreakdownRow>()
  for (const row of breakdown) {
    if (row && typeof row.date === 'string') byDate.set(row.date, row)
  }

  const todayISO = toISO(new Date())

  // First day of the month, last day of the month.
  const first = new Date(year, month, 1, 12, 0, 0, 0)
  const last = new Date(year, month + 1, 0, 12, 0, 0, 0)

  // Grid starts on the Sunday on or before the 1st.
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - first.getDay())

  // Grid ends on the Saturday on or after the last day.
  const gridEnd = new Date(last)
  gridEnd.setDate(last.getDate() + (6 - last.getDay()))

  const rows: MonthGridCell[][] = []
  let current = new Date(gridStart)
  while (current <= gridEnd) {
    const row: MonthGridCell[] = []
    for (let i = 0; i < 7; i++) {
      const iso = toISO(current)
      const rowData = byDate.get(iso)
      row.push({
        date: iso,
        dayNum: current.getDate(),
        inMonth: current.getMonth() === month,
        isToday: iso === todayISO,
        calories: rowData ? coerceCalories(rowData.calories) : null,
        workouts: rowData ? coerceWorkouts(rowData.workouts) : 0,
      })
      current.setDate(current.getDate() + 1)
    }
    rows.push(row)
  }

  return rows
}
