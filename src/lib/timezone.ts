/**
 * FB-R5-02: tiny client mirror of the backend timezone helpers in
 * packages/core/src/lib/timezone.ts. We do NOT need DST-window math on the
 * client — the server owns log bucketing. We only need today's local date
 * for the calendar header.
 */

export function detectIanaTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz || 'UTC'
  } catch {
    return 'UTC'
  }
}

function isValidIanaTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function todayLocalISO(tz?: string | null, now: Date = new Date()): string {
  const effectiveTz = tz && isValidIanaTimezone(tz) ? tz : 'UTC'
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: effectiveTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}
