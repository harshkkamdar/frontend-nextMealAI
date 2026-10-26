import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Log } from '@/types/logs.types'

const mocks = vi.hoisted(() => ({
  data: null as Record<string, unknown> | null,
  push: vi.fn(),
  success: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: vi.fn() } }))
vi.mock('@/lib/api/logs.api', () => ({ createLogWithStatus: mocks.create, deleteLog: mocks.remove, getLogs: vi.fn(), getLogsSummary: vi.fn() }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
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

    const tile = screen.getByRole('button', { name: 'Steps none yet, open the week' })
    expect(within(tile).queryByText('0')).toBeNull()
    expect(screen.getByText('Syncs from your phone')).toBeInTheDocument()
  })
})

describe('Dashboard one-tap logs with Undo', () => {
  beforeEach(() => {
    mocks.success.mockReset()
    mocks.create.mockReset().mockResolvedValue({ queued: false, data: { id: 'log-new' } })
    mocks.remove.mockReset().mockResolvedValue(undefined)
  })

  const undo = () => (mocks.success.mock.calls[0][1] as { action: { label: string; onClick: () => void } }).action

  it('the Water + logs one glass at once, and Undo deletes that log', async () => {
    mocks.data = dashboardData([])
    render(<DashboardPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Add one glass of water' }))

    expect(screen.getByRole('button', { name: /^Water 1 of 8 glasses/ })).toBeInTheDocument()
    expect(mocks.create).toHaveBeenCalledWith({ type: 'water', payload: { glasses: 1 }, source: 'quick_log' })
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Glass added, 1 of 8', expect.anything()))
    expect(undo().label).toBe('Undo')
    undo().onClick()
    expect(mocks.remove).toHaveBeenCalledWith('log-new')
    await waitFor(() => expect(screen.getByRole('button', { name: /^Water 0 of 8 glasses/ })).toBeInTheDocument())
  })

  it("Geo's chip re-logs a past high-protein food, and Undo deletes it", async () => {
    const day = todayLocalISO('UTC')
    const past = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)
    mocks.data = {
      ...dashboardData([{ id: 'f1', user_id: 'u1', type: 'food', payload: { food_name: 'Greek yoghurt', est_macros: { calories: 100, protein: 17 } }, source: 'manual', local_date: past, created_at: `${past}T08:00:00.000Z`, updated_at: `${past}T08:00:00.000Z` }]),
      profile: { daily_calorie_target: 2000, daily_protein_g: 140 },
    }
    render(<DashboardPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Log Greek yoghurt again, 17 g protein' }))

    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'food', local_date: day, payload: expect.objectContaining({ food_name: 'Greek yoghurt', meal_type: 'snack' }) }))
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Greek yoghurt logged to Snack', expect.anything()))
    undo().onClick()
    expect(mocks.remove).toHaveBeenCalledWith('log-new')
  })

  it('a log queued offline says so and offers no Undo', async () => {
    mocks.create.mockResolvedValue({ queued: true, optimistic: { id: 'pending-1' } })
    mocks.data = dashboardData([])
    render(<DashboardPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Add one glass of water' }))
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Glass added, 1 of 8. Saved on your phone, syncs when you're back online"))
  })
})
