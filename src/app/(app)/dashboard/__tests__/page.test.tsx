import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Log } from '@/types/logs.types'

const mocks = vi.hoisted(() => ({
  data: null as Record<string, unknown> | null,
  push: vi.fn(),
  success: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  getLogs: vi.fn(),
  apiFetch: vi.fn(),
  fetchers: {} as Record<string, () => Promise<unknown>>,
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: vi.fn() } }))
vi.mock('@/lib/api/logs.api', () => ({ createLogWithStatus: mocks.create, deleteLog: mocks.remove, getLogs: mocks.getLogs, getLogsSummary: vi.fn() }))
vi.mock('@/lib/api/client', async (original) => ({ ...(await original<object>()), apiFetch: mocks.apiFetch }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('@/hooks/use-cached-query', () => ({
  useCachedQuery: (key: string, fetcher: () => Promise<unknown>) => (mocks.fetchers[key] = fetcher, { data: key === 'dashboard' ? mocks.data : [], loading: false, error: null, stale: false, savedAt: null, refetch: vi.fn() }),
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
import { backendGetLogs, logRow, shiftDay } from '@/test/backend-logs'

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
    expect(screen.getByRole('button', { name: /^Steps 8412, open the week/ })).toBeInTheDocument()
  })

  it('renders a dash, never a fake 0, when today has no steps', () => {
    mocks.data = dashboardData([])
    render(<DashboardPage />)

    const tile = screen.getByRole('button', { name: 'Steps, open the week' })
    expect(within(tile).queryByText('0')).toBeNull()
    expect(within(tile).getByText('No data')).toBeInTheDocument()
  })
})

describe('Dashboard one-tap logs with Undo', () => {
  beforeEach(() => {
    mocks.success.mockReset()
    mocks.create.mockReset().mockResolvedValue({ queued: false, data: { id: 'log-new' } })
    mocks.remove.mockReset().mockResolvedValue(undefined)
  })

  const undo = () => (mocks.success.mock.calls[0][1] as { action: { label: string; onClick: () => void } }).action

  it('the Water column opens the water log instead of logging on a tap', () => {
    mocks.data = dashboardData([])
    render(<DashboardPage />)
    fireEvent.click(screen.getByRole('button', { name: /^Water 0 of 8 glasses/ }))
    expect(mocks.create).not.toHaveBeenCalled()
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
    const past = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)
    mocks.data = {
      ...dashboardData([{ id: 'f1', user_id: 'u1', type: 'food', payload: { food_name: 'Greek yoghurt', est_macros: { calories: 100, protein: 17 } }, source: 'manual', local_date: past, created_at: `${past}T08:00:00.000Z`, updated_at: `${past}T08:00:00.000Z` }]),
      profile: { daily_calorie_target: 2000, daily_protein_g: 140 },
    }
    render(<DashboardPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Log Greek yoghurt again, 17 g protein' }))
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Greek yoghurt logged to Snack. Saved on your phone, syncs when you're back online"))
  })
})

describe('Dashboard week of logs', () => {
  it("reads the whole week, so last week's weigh-in survives a busy week of food and water", async () => {
    const today = todayLocalISO('UTC')
    // Eight days of 8 food + 8 water rows, and one weigh-in 7 days back: 129 rows, past one 100-row page.
    const rows = [logRow('w', 'weight', shiftDay(today, -7), `${shiftDay(today, -7)}T06:00:00.000Z`, { weight_kg: 81.4 })]
    for (let day = 0; day < 8; day += 1) {
      for (let i = 0; i < 16; i += 1) {
        const date = shiftDay(today, -day)
        rows.push(logRow(`${day}-${i}`, i < 8 ? 'food' : 'water', date, `${date}T${String(7 + i).padStart(2, '0')}:00:00.000Z`, i < 8 ? { food_name: 'Rice', est_macros: { calories: 200 } } : { glasses: 1 }))
      }
    }
    const actual = await vi.importActual<typeof import('@/lib/api/logs.api')>('@/lib/api/logs.api')
    mocks.getLogs.mockImplementation(actual.getLogs)
    const logsApi = backendGetLogs(rows, today)
    mocks.apiFetch.mockImplementation((path: string) => path.startsWith('/v1/logs') ? logsApi(path) : Promise.reject(new Error('404')))
    mocks.data = dashboardData([])
    render(<DashboardPage />)
    const data = await mocks.fetchers.dashboard() as { logs: Log[] }
    expect(data.logs).toHaveLength(129)
    expect(data.logs.find((log) => log.type === 'weight')?.payload).toEqual({ weight_kg: 81.4 })
  })
})
