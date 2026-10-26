import type { FoodPayload, Log, StepsPayload } from '@/types/logs.types'

/** Calendar date of a log in the user's day (backend local_date, else the UTC date of created_at). */
export function logDate(log: Log): string {
  return log.local_date ?? log.created_at.slice(0, 10)
}

/** YYYY-MM-DD shifted by `days` (UTC arithmetic on a calendar date, so no DST drift). */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

function newestFirst(a: Log, b: Log): number {
  return b.created_at.localeCompare(a.created_at)
}

function ofType(logs: Log[], type: string): Log[] {
  return logs.filter((log) => log.type === type).sort(newestFirst)
}

function num(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

export interface StepsTile {
  today: number | null
  /** Shown under a dash when today has no data yet (Q32: never a fake 0). */
  yesterday: number | null
}

export function stepsTile(logs: Log[], today: string): StepsTile {
  const steps = ofType(logs, 'steps')
  const on = (date: string) => {
    const log = steps.find((entry) => logDate(entry) === date)
    return log ? num((log.payload as StepsPayload).steps) : null
  }
  return { today: on(today), yesterday: on(shiftDate(today, -1)) }
}

export interface WeightTile {
  kg: number | null
  /** Change against the newest weigh-in at least 6 days older, rounded to 0.1 kg. */
  weekDelta: number | null
  /** Oldest to newest, one point per day with a weigh-in, for the sparkline. */
  series: number[]
}

export function weightTile(logs: Log[], fallbackKg: number | null | undefined, today: string): WeightTile {
  const byDay = new Map<string, number>()
  for (const log of ofType(logs, 'weight')) {
    const kg = num((log.payload as { weight_kg?: number }).weight_kg)
    const date = logDate(log)
    if (kg !== null && !byDay.has(date)) byDay.set(date, kg)
  }
  const days = [...byDay.keys()].sort()
  const series = days.map((date) => byDay.get(date) as number)
  const latestDay = days[days.length - 1]
  const kg = latestDay ? byDay.get(latestDay) as number : num(fallbackKg)
  let weekDelta: number | null = null
  if (latestDay) {
    const cutoff = shiftDate(latestDay, -6)
    const older = days.filter((date) => date <= cutoff && date >= shiftDate(today, -14)).pop()
    if (older) weekDelta = Math.round(((byDay.get(latestDay) as number) - (byDay.get(older) as number)) * 10) / 10
  }
  return { kg, weekDelta, series }
}

export interface SleepTile {
  /** Hours for the most recent night logged today or yesterday. */
  hours: number | null
  /** Seven nights ending today, oldest first; null where nothing was logged. */
  nights: (number | null)[]
}

export function sleepTile(logs: Log[], today: string): SleepTile {
  const sleep = ofType(logs, 'sleep')
  const on = (date: string) => {
    const log = sleep.find((entry) => logDate(entry) === date)
    return log ? num((log.payload as { hours?: number }).hours) : null
  }
  const nights = Array.from({ length: 7 }, (_, index) => on(shiftDate(today, index - 6)))
  return { hours: nights[6] ?? nights[5], nights }
}

export function waterGlassesToday(logs: Log[], today: string): number {
  return ofType(logs, 'water')
    .filter((log) => logDate(log) === today)
    .reduce((total, log) => total + (num((log.payload as { glasses?: number }).glasses) ?? 0), 0)
}

export const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

export interface MealRow {
  meal: (typeof MEAL_ORDER)[number]
  kcal: number
  items: string[]
}

/** Today's food logs as one row per meal, in day order; meals with nothing logged are left out. */
export function mealRows(logs: Log[], today: string): MealRow[] {
  const rows = new Map<MealRow['meal'], MealRow>()
  for (const log of logs) {
    if (log.type !== 'food' || logDate(log) !== today) continue
    const payload = log.payload as FoodPayload & { calories?: number }
    const raw = (payload.meal_type ?? 'Snack').toLowerCase()
    const meal = MEAL_ORDER.find((name) => raw.startsWith(name.toLowerCase())) ?? 'Snack'
    const row = rows.get(meal) ?? { meal, kcal: 0, items: [] }
    row.kcal += Math.round(Number(payload.calories) || 0)
    if (payload.food_name) row.items.push(payload.food_name)
    rows.set(meal, row)
  }
  return MEAL_ORDER.flatMap((meal) => rows.get(meal) ?? [])
}

/** "7h 12m" (critic fix 5). */
export function formatSleep(hours: number): string {
  const total = Math.round(hours * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return m ? `${h}h ${m}m` : `${h}h`
}
