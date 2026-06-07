/**
 * FB-R6.7 Build C — CheckInCard tests
 *
 * New shape: 7-day table + 1-line takeaway. Legacy narrative path retained for
 * back-compat during cutover and tested separately.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CheckInCard } from '@/components/dashboard/check-in-card'
import type { DashboardCheckIn, DashboardCheckInDay } from '@/lib/api/dashboard.api'

// jsdom polyfill for crypto.randomUUID — drilldown link needs it.
if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.randomUUID !== 'function') {
  Object.defineProperty(globalThis, 'crypto', {
    value: { randomUUID: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
    configurable: true,
  })
}

function makeDay(overrides: Partial<DashboardCheckInDay>): DashboardCheckInDay {
  return {
    date: '2026-05-15',
    day_of_week: 'Mon',
    calories: { actual: 1900, target: 2000 },
    protein: { actual: 145, target: 150 },
    carbs: { actual: 195, target: 200 },
    fat: { actual: 68, target: 70 },
    hit: true,
    ...overrides,
  }
}

const FULL: DashboardCheckIn = {
  days: [
    makeDay({ date: '2026-05-09', day_of_week: 'Sat', hit: false, protein: { actual: 90, target: 150 } }),
    makeDay({ date: '2026-05-10', day_of_week: 'Sun', hit: true }),
    makeDay({ date: '2026-05-11', day_of_week: 'Mon', hit: true }),
    makeDay({ date: '2026-05-12', day_of_week: 'Tue', hit: false, calories: { actual: 1500, target: 2000 } }),
    makeDay({ date: '2026-05-13', day_of_week: 'Wed', hit: true }),
    makeDay({ date: '2026-05-14', day_of_week: 'Thu', hit: false, carbs: { actual: 100, target: 200 } }),
    makeDay({ date: '2026-05-15', day_of_week: 'Fri', hit: true }),
  ],
  takeaway: "Focus this week: protein. You're 30g/day short on average.",
  metrics: {
    macro_adherence_pct: 57,
    weight_delta_kg: null,
    workout_count_7d: 3,
    data_days: 7,
  },
  generated_at: '2026-05-15T20:00:00.000Z',
  v: 2,
}

describe('CheckInCard — FB-R6.7 Build C', () => {
  it('renders the 7-row daily table with day_of_week labels', () => {
    render(<CheckInCard checkIn={FULL} />)
    expect(screen.getByTestId('check-in-days-table')).toBeInTheDocument()
    for (const d of FULL.days) {
      expect(screen.getByText(d.day_of_week)).toBeInTheDocument()
    }
  })

  it('renders the takeaway sentence verbatim', () => {
    render(<CheckInCard checkIn={FULL} />)
    expect(
      screen.getByText((content) => content.includes(FULL.takeaway))
    ).toBeInTheDocument()
  })

  it('renders ✓ only on days with hit=true', () => {
    render(<CheckInCard checkIn={FULL} />)
    const checks = screen.getAllByLabelText('hit target')
    // 4 hits in FULL fixture.
    expect(checks.length).toBe(4)
    const misses = screen.getAllByLabelText('missed target')
    expect(misses.length).toBe(3)
  })

  it('falls back to legacy narrative when days[] is missing (v=1 cutover)', () => {
    const legacy: DashboardCheckIn = {
      days: [],
      takeaway: 'Focus this week: protein. Up your protein by 20g/day.',
      metrics: FULL.metrics,
      generated_at: FULL.generated_at,
      narrative: 'Legacy paragraph from v=1 cache row.',
    }
    render(<CheckInCard checkIn={legacy} />)
    expect(screen.getByText('Legacy paragraph from v=1 cache row.')).toBeInTheDocument()
    expect(screen.queryByTestId('check-in-days-table')).not.toBeInTheDocument()
  })

  it('drill-down link prefills the Geo chat', () => {
    render(<CheckInCard checkIn={FULL} />)
    const link = screen.getByTestId('check-in-drilldown-link') as HTMLAnchorElement
    expect(link.getAttribute('href') ?? '').toMatch(/\/chat\/.+\?prefill=/)
  })

  it('uses the dashboard card chrome (visual contract)', () => {
    render(<CheckInCard checkIn={FULL} />)
    const card = screen.getByTestId('check-in-card')
    expect(card.className).toContain('bg-surface')
    expect(card.className).toContain('border-border')
    expect(card.className).toContain('rounded-2xl')
  })

  it('drilldown UUID is stable across re-renders (/cso P1 — no orphan sessions)', () => {
    const { rerender } = render(<CheckInCard checkIn={FULL} />)
    const initialHref = (
      screen.getByTestId('check-in-drilldown-link') as HTMLAnchorElement
    ).getAttribute('href')
    expect(initialHref).toBeTruthy()

    rerender(<CheckInCard checkIn={FULL} />)
    const afterRerenderHref = (
      screen.getByTestId('check-in-drilldown-link') as HTMLAnchorElement
    ).getAttribute('href')
    expect(afterRerenderHref).toBe(initialHref)

    rerender(
      <CheckInCard
        checkIn={{
          ...FULL,
          takeaway: 'Focus this week: calories. 200kcal under daily.',
        }}
      />
    )
    const afterPropChangeHref = (
      screen.getByTestId('check-in-drilldown-link') as HTMLAnchorElement
    ).getAttribute('href')
    expect(afterPropChangeHref).toBe(initialHref)
  })
})
