import type { Plan, PlanStatus } from '@/types/plans.types'

function parseDate(value: string): Date | null {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function compactDate(value: string): string {
  const date = parseDate(value)
  if (!date) return value
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]}`
}

export function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return 'No dates set'
  if (start && end) return `${compactDate(start)} – ${compactDate(end)}`
  if (start) return `From ${compactDate(start)}`
  return `Until ${compactDate(end!)}`
}

export function formatDayDate(dateStr: string | undefined, fallbackIndex?: number): string {
  if (!dateStr) return fallbackIndex === undefined ? 'Day' : `Day ${fallbackIndex + 1}`
  const date = parseDate(dateStr)
  return date ? date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }) : fallbackIndex === undefined ? 'Day' : `Day ${fallbackIndex + 1}`
}

export function statusLabel(status: PlanStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const PREVIOUS_LIMIT = 5

/**
 * Plans no longer in use, newest first. Every edit leaves a superseded copy with the same name, so one row per
 * name, and nothing that shares a name with an active plan (those are its own older versions).
 */
export function previousPlans(all: Plan[], active: Plan[]): Plan[] {
  const seen = new Set(active.map((plan) => `${plan.type}:${plan.content.name ?? ''}`))
  const rows: Plan[] = []
  for (const plan of all) {
    if (plan.status !== 'completed' && plan.status !== 'superseded') continue
    const key = `${plan.type}:${plan.content.name ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push(plan)
  }
  return rows.slice(0, PREVIOUS_LIMIT)
}

/**
 * The plan's next training day: from current_position (the cursor the backend advances after each session), skipping
 * rest days, wrapping round. Null when the plan has no training days.
 */
export function nextTrainingDay(days: { is_rest_day?: boolean }[], position = 0): number | null {
  if (!days.length) return null
  const start = ((Math.trunc(position) % days.length) + days.length) % days.length
  for (let step = 0; step < days.length; step += 1) {
    const index = (start + step) % days.length
    if (!days[index].is_rest_day) return index
  }
  return null
}

/** A plan day's short label for the week dots: the weekday initial when the day has a date, else its number. */
export function dayLetter(date: string | undefined, index: number): string {
  const parsed = date ? parseDate(date) : null
  return parsed ? 'SMTWTFS'[parsed.getUTCDay()] : String(index + 1)
}

/** "Tue" for a dated plan day; null without a date. */
export function dayWeekday(date: string | undefined): string | null {
  const parsed = date ? parseDate(date) : null
  return parsed ? parsed.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }) : null
}
