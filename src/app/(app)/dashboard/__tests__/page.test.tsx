import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Log } from '@/types/logs.types'

const mocks = vi.hoisted(() => ({
  data: null as Record<string, unknown> | null,
  push: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/hooks/use-cached-query', () => ({
  useCachedQuery: (key: string) => ({ data: key === 'dashboard' ? mocks.data : [], loading: false, error: null, stale: false, savedAt: null, refetch: vi.fn() }),
}))
vi.mock('@/components/ui/fiqr/count-up', () => ({ CountUp: ({ value }: { value: number }) => value.toLocaleString('en-AU') }))
vi.mock('@/hooks/use-sync-refetch', () => ({ useSyncRefetch: () => {} }))
vi.mock('@/hooks/useUserTimezone', () => ({ useUserTimezone: () => 'UTC' }))
vi.mock('@/contexts/geo-screen-context', () => ({ useSetGeoScreen: () => {} }))
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: { user: { id: string; email: string } }) => unknown) => selector({ user: { id: 'u1', email: 'user@example.com' } }),
}))
vi.mock('@/stores/ui.store', () => ({ useUIStore: { getState: () => ({ openSheet: vi.fn() }) } }))
vi.mock('@/components/shared/offline-band', () => ({ OfflineBand: () => null }))
vi.mock('@/lib/platform/health', () => ({ healthLabel: () => null, isHealthConnected: vi.fn(), lastHealthSync: vi.fn() }))

import DashboardPage from '@/app/(app)/dashboard/page'
import { todayLocalISO } from '@/lib/timezone'

function dashboardData(stepLogs: Log[]) {
  return {
    summary: {
      period: 'day',
      summary: { total_logs: 0, avg_daily_calories: 0, avg_daily_protein: 0, workout_count: 0, avg_sleep_hours: 0, avg_energy_rating: 0 },
      daily_breakdown: [],
    },
    plans: [],
    profile: null,
    logs: stepLogs,
    checkIn: null,
    status: null,
  }
}

function stepsLog(steps: number, createdAt = new Date().toISOString()): Log {
  return {
    id: `steps-${steps}`,
    user_id: 'u1',
    type: 'steps',
    payload: { steps },
    source: 'import',
    local_date: todayLocalISO('UTC'),
    created_at: createdAt,
    updated_at: createdAt,
  }
}

describe('Dashboard Steps tile', () => {
  beforeEach(() => {
    mocks.push.mockReset()
  })

  it('renders today’s newest steps log', () => {
    mocks.data = dashboardData([
      stepsLog(3000, '2026-10-20T08:00:00.000Z'),
      stepsLog(8412, '2026-10-20T12:00:00.000Z'),
    ])
    render(<DashboardPage />)

    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getByText('8,412')).toBeInTheDocument()
    expect(screen.getByText('of 10,000')).toBeInTheDocument()
  })

  it('renders a dash, never a fake 0, when today has no steps', () => {
    mocks.data = dashboardData([])
    render(<DashboardPage />)

    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getByText('Syncs from your phone')).toBeInTheDocument()
  })
})
