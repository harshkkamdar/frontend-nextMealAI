import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CheckInStatus } from '@/lib/api/check-in.api'

const mocks = vi.hoisted(() => ({
  applyCheckIn: vi.fn(),
  emit: vi.fn(),
  push: vi.fn(),
  query: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() },
}))

vi.mock('@/lib/api/check-in.api', () => ({
  applyCheckIn: () => mocks.applyCheckIn(),
  getCheckInStatus: vi.fn(),
}))

vi.mock('@/hooks/use-cached-query', () => ({
  useCachedQuery: () => mocks.query(),
}))

vi.mock('@/hooks/use-sync-refetch', () => ({
  useSyncRefetch: vi.fn(),
}))

vi.mock('@/contexts/geo-screen-context', () => ({
  useSetGeoScreen: vi.fn(),
}))

vi.mock('@/components/shared/offline-band', () => ({
  OfflineBand: () => null,
}))

vi.mock('@/lib/sync/sync-bus', () => ({
  syncBus: { emit: mocks.emit },
}))

import CheckInPage from '@/app/(app)/check-in/page'

const baseStatus: CheckInStatus = {
  state: 'due',
  week: { start: '2026-09-08', end: '2026-09-14', label: '8 – 14 Sep', number: 6 },
  days_logged: 6,
  days_needed: 5,
  next_check_in_date: '2026-09-21',
  days_to_go: 0,
  weight: {
    current_kg: 78.4,
    delta_week_kg: -0.6,
    points: [
      { week_end: '2026-08-24', kg: 79.2 },
      { week_end: '2026-08-31', kg: 79 },
      { week_end: '2026-09-07', kg: 78.4 },
    ],
  },
  week_so_far: {
    avg_calories: 2140,
    avg_protein_g: 138,
    sessions_done: 4,
    sessions_planned: 4,
    sleep_avg_h: 7.1,
    sleep_nights: 6,
  },
  targets: { calories: 2200, protein_g: 165 },
  verdict: "You lost 0.6kg and trained four times — a bit faster than planned, so I'm raising your calories.",
  proposal: {
    new_calories: 2380,
    new_protein_g: 165,
    calorie_change_pct: 8,
    direction: 'up',
  },
}

function renderStatus(status: CheckInStatus) {
  const refetch = vi.fn().mockResolvedValue(undefined)
  mocks.query.mockReturnValue({
    data: status,
    loading: false,
    error: null,
    stale: false,
    savedAt: null,
    refetch,
  })
  const result = render(<CheckInPage />)
  return { ...result, refetch }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.applyCheckIn.mockResolvedValue(undefined)
})

describe('check-in states', () => {
  it('renders the due state and only it applies the proposed targets', async () => {
    const { container, refetch } = renderStatus(baseStatus)

    expect(screen.getByText('Week 6 check-in')).toBeInTheDocument()
    expect(container.querySelector('polyline')).toHaveAttribute('stroke', '#E8622A')

    fireEvent.click(screen.getByRole('button', { name: 'Apply new targets' }))

    await waitFor(() => expect(mocks.applyCheckIn).toHaveBeenCalledTimes(1))
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Targets updated')
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(mocks.emit).toHaveBeenCalledWith('plans:updated')
  })

  it('renders the mid-week state without an apply action', () => {
    const midWeek: CheckInStatus = {
      ...baseStatus,
      state: 'mid_week',
      week: { start: '2026-09-15', end: '2026-09-21', label: '15 – 21 Sep', number: 7 },
      days_logged: 1,
      days_to_go: 6,
      proposal: null,
      verdict: null,
    }
    const { container } = renderStatus(midWeek)

    expect(screen.getByText('6 days to go')).toBeInTheDocument()
    expect(container.querySelector('polyline')).toHaveAttribute('stroke', 'rgba(17,28,53,.35)')
    expect(screen.queryByRole('button', { name: /targets/i })).not.toBeInTheDocument()
    expect(mocks.applyCheckIn).not.toHaveBeenCalled()
  })

  it('renders insufficient data and keeps targets without applying a check-in', () => {
    const insufficient: CheckInStatus = {
      ...baseStatus,
      state: 'insufficient',
      days_logged: 3,
      weight: { ...baseStatus.weight, delta_week_kg: -0.3 },
      week_so_far: {
        ...baseStatus.week_so_far,
        sessions_done: 3,
        sleep_avg_h: 6.8,
        sleep_nights: 5,
      },
      verdict: "Three days logged isn't enough to tell whether your targets are right, so I'm leaving them alone.",
      proposal: null,
    }
    const { container } = renderStatus(insufficient)

    expect(screen.getByText('3 of 7 days logged')).toBeInTheDocument()
    expect(container.querySelector('polyline')).toHaveAttribute('stroke', 'rgba(17,28,53,.35)')

    fireEvent.click(screen.getByRole('button', { name: 'Keep current targets' }))

    expect(mocks.applyCheckIn).not.toHaveBeenCalled()
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Targets unchanged')
    expect(mocks.push).toHaveBeenCalledWith('/dashboard')
  })
})
