import type { PlanStatus } from '@/types/plans.types'

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
