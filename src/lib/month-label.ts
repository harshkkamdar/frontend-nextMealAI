/**
 * FB-07 — Food Diary Month Label
 *
 * Given an array of ISO date strings (YYYY-MM-DD) representing the days
 * visible in the weekly strip, produce a human-readable month label that
 * makes cross-month weeks obvious.
 *
 * Format rules (refined spec):
 *   - single month:       "March 2026"
 *   - cross-month, 1 yr:  "March – April 2026"
 *   - cross-year:         "December 2025 – January 2026"
 *   - empty array:        ""  (defensive — caller may render nothing)
 *
 * Uses fixed English month names to avoid Intl locale surprises on server
 * rendering and tests. Localization is out of scope for FB-07.
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

// Parse ISO date (YYYY-MM-DD) into year/month without timezone drift.
function parseISO(iso: string): { year: number; month: number } {
  const [y, m] = iso.split('-')
  return { year: Number(y), month: Number(m) - 1 }
}

export function formatWeekMonthLabel(weekDates: readonly string[]): string {
  if (!weekDates.length) return ''

  const first = parseISO(weekDates[0])
  const last = parseISO(weekDates[weekDates.length - 1])

  const sameYear = first.year === last.year
  const sameMonth = sameYear && first.month === last.month

  if (sameMonth) {
    return `${MONTHS[first.month]} ${first.year}`
  }

  if (sameYear) {
    return `${MONTHS[first.month]} \u2013 ${MONTHS[last.month]} ${last.year}`
  }

  return `${MONTHS[first.month]} ${first.year} \u2013 ${MONTHS[last.month]} ${last.year}`
}
