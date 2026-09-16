import type { ReactNode } from 'react'

const DEFAULT_GEO_LINE = "Log your first meal today and I'll take it from there."
const MEASUREMENT_PATTERN = /(\d[\d,.]*\s?(?:g|kcal|cal))/g
const MEASUREMENT_EXACT_PATTERN = /^\d[\d,.]*\s?(?:g|kcal|cal)$/

export function getDashboardFirstName(
  fullName: string | null | undefined,
  email: string | null | undefined,
): string {
  return fullName?.trim().split(/\s+/)[0] || email?.split('@')[0] || 'there'
}

export function getDashboardGeoLine(
  takeaway: string | null | undefined,
  nudges: Array<{ message?: string | null }>,
): string {
  return takeaway?.trim() || nudges.find((nudge) => nudge.message?.trim())?.message?.trim() || DEFAULT_GEO_LINE
}

export function emphasizeGeoMeasurements(line: string): ReactNode {
  return line.split(MEASUREMENT_PATTERN).map((part, index) => (
    MEASUREMENT_EXACT_PATTERN.test(part)
      ? <em key={`${part}-${index}`} className="not-italic font-semibold text-accent">{part}</em>
      : part
  ))
}

export function formatDashboardDate(today: string): string {
  const [year, month, day] = today.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date)
}
