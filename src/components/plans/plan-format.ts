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

/** Back to where the user came from; a screen opened directly (deep link, reload) goes to `fallback` instead. */
export function goBack(router: { back: () => void; push: (href: string) => void }, fallback: string): void {
  if (typeof window !== 'undefined' && window.history.length > 1) router.back()
  else router.push(fallback)
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
