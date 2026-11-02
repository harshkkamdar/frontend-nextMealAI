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
  fallback: string = DEFAULT_GEO_LINE,
): string {
  return takeaway?.trim() || nudges.find((nudge) => nudge.message?.trim())?.message?.trim() || fallback
}

/** Geo's line on a quiet day, in George's pattern ("Legs today, then 83g more protein to close the gap"). */
export function quietDayGeoLine({ workout, restDay, protein, calories }: { workout: string | null; restDay: boolean; protein: number; calories: number }): string {
  if (protein <= 0) return DEFAULT_GEO_LINE
  if (workout) return `${workout} today, then ${Math.round(protein)} g protein to hit.`
  if (restDay) return `Rest day. ${Math.round(protein)} g protein still counts.`
  return `${Math.round(calories).toLocaleString('en-US')} kcal and ${Math.round(protein)} g protein to hit today.`
}

export function emphasizeGeoMeasurements(line: string): ReactNode {
  return line.split(MEASUREMENT_PATTERN).map((part, index) => (
    MEASUREMENT_EXACT_PATTERN.test(part)
      ? <em key={`${part}-${index}`} className="not-italic font-semibold text-accent-ink">{part}</em>
      : part
  ))
}

export function formatDashboardDate(today: string): string {
  const [year, month, day] = today.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date)
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(date)
  return `${weekday} ${day} ${monthName}`
}
