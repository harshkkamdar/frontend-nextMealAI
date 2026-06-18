/**
 * FE-RCA F1 — Dashboard "today" derivation regression lock.
 *
 * Pre-fix behaviour (the bug):
 *   const dailyBreakdown = summary?.daily_breakdown?.find(d => d.date === today)
 *     ?? summary?.daily_breakdown?.[0]
 * The fallback to [0] rendered yesterday's calories as today's whenever
 * today had zero food logs. Diary, filtering by local_date strict-equality,
 * showed zero. The user saw two different answers for the same word.
 *
 * Post-fix: only the today-bucket counts. No row → zero.
 *
 * This file extracts the derivation as a pure function (matches the literal
 * expression now in dashboard/page.tsx) and asserts the corrected behaviour.
 */

import { describe, it, expect } from 'vitest'

/**
 * Mirrors the literal expression at dashboard/page.tsx after the F1 fix.
 * Kept inline (not exported from the page module) because the page is a
 * client component with many side-effectful imports.
 */
function deriveTodayBreakdown(
  summary: { daily_breakdown?: Array<{ date: string; calories: number; protein?: number; carbs?: number; fat?: number }> } | null,
  today: string,
): { date: string; calories: number; protein?: number; carbs?: number; fat?: number } | undefined {
  return summary?.daily_breakdown?.find((d) => d.date === today)
}

describe('FE-RCA F1 — dashboard today derivation (post-fix)', () => {
  it('returns undefined when today has no bucket, so caller renders 0 (not yesterday)', () => {
    const today = '2026-06-14'
    const summary = {
      daily_breakdown: [
        // The BE orders daily_breakdown by created_at ASC — [0] is the
        // EARLIEST day, not the latest. Pre-fix, falling back here meant
        // showing yesterday's calories as today's.
        { date: '2026-06-13', calories: 1842 },
      ],
    }

    const derived = deriveTodayBreakdown(summary, today)

    // The corrected behaviour: no today-bucket → undefined → caller's `?? 0`.
    expect(derived).toBeUndefined()
    expect(derived?.calories ?? 0).toBe(0)
  })

  it('returns the today-bucket when present (control case)', () => {
    const today = '2026-06-14'
    const summary = {
      daily_breakdown: [
        { date: '2026-06-13', calories: 1842 },
        { date: '2026-06-14', calories: 118 },
      ],
    }
    const derived = deriveTodayBreakdown(summary, today)
    expect(derived?.calories).toBe(118)
  })

  it('returns undefined for empty daily_breakdown', () => {
    expect(deriveTodayBreakdown({ daily_breakdown: [] }, '2026-06-14')).toBeUndefined()
  })

  it('returns undefined for null summary', () => {
    expect(deriveTodayBreakdown(null, '2026-06-14')).toBeUndefined()
  })

  it('agrees with the diary derivation on the same dataset (cross-page coherence)', () => {
    // The whole point of F1 is that Dashboard and Diary must not disagree
    // on what "today" means. Diary's filter (mirrored below) and the
    // dashboard's derivation should both yield zero today when today has
    // no food logs.
    const today = '2026-06-14'
    const foodLogs = [
      { local_date: '2026-06-13', payload: { est_macros: { calories: 1842 } } },
    ]
    const summary = { daily_breakdown: [{ date: '2026-06-13', calories: 1842 }] }

    const diaryTodayCalories = foodLogs
      .filter((l) => l.local_date === today)
      .reduce((sum, l) => sum + (l.payload.est_macros.calories ?? 0), 0)

    const dashboardTodayCalories = deriveTodayBreakdown(summary, today)?.calories ?? 0

    expect(diaryTodayCalories).toBe(0)
    expect(dashboardTodayCalories).toBe(0)
    expect(dashboardTodayCalories).toBe(diaryTodayCalories)
  })
})
