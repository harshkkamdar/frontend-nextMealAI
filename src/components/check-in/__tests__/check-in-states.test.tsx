import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CheckInStatus } from '@/lib/api/check-in.api'

const mocks = vi.hoisted(() => ({
  applyCheckIn: vi.fn(),
  getStatus: vi.fn(),
  emit: vi.fn(),
  push: vi.fn(),
  query: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  health: { label: null as string | null, connected: false },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, back: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/check-in',
}))

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}))

vi.mock('@/lib/api/check-in.api', () => ({
  applyCheckIn: (...args: unknown[]) => mocks.applyCheckIn(...args),
  getCheckInStatus: (...args: unknown[]) => mocks.getStatus(...args),
}))

// Today's intake and the four current targets ride on a second query ('check-in-today').
const TODAY = { eaten: { calories: 1240, protein: 92, carbs: 120, fat: 38 }, carbs: 248, fat: 72, planName: 'Lean cut' }
vi.mock('@/hooks/use-cached-query', () => ({
  useCachedQuery: (key: string) => key === 'check-in' ? mocks.query() : { data: TODAY, loading: false, error: null, refetch: vi.fn() },
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

vi.mock('@/lib/platform/health', () => ({
  healthLabel: () => mocks.health.label,
  isHealthConnected: async () => mocks.health.connected,
}))

vi.mock('@/lib/sync/sync-bus', () => ({
  syncBus: { emit: mocks.emit },
}))

import CheckInPage from '@/app/(app)/check-in/page'

const week = (start: string, logged: number) => Array.from({ length: 7 }, (_, i) => {
  const date = `2026-09-${String(Number(start.slice(8)) + i).padStart(2, '0')}`
  const fed = i < logged
  return { date, calories: fed ? 2100 + i * 10 : null, protein_g: fed ? 140 : null, carbs_g: fed ? 220 : null, fat_g: fed ? 70 : null, sessions: i === 1 ? ['Upper A'] : [], sleep_h: fed ? 7.5 : null, weight_kg: i === 0 ? 78.6 : null }
})

const baseStatus: CheckInStatus = {
  state: 'due',
  early: false,
  week: { start: '2026-09-08', end: '2026-09-14', label: '8 – 14 Sep', number: 6 },
  days_elapsed: 7,
  days: week('2026-09-08', 6),
  last_check_in: { date: '2026-09-07', applied: false, calories: null },
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
  // Today is the Wednesday of the mid-week fixture (15 to 21 Sep), so later days are still to come.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-16T10:00:00'))
  mocks.applyCheckIn.mockResolvedValue(undefined)
  mocks.health = { label: null, connected: false }
})

afterEach(() => vi.useRealTimers())

describe('check-in states', () => {
  it('renders the due state and only it applies the proposed targets', async () => {
    const { container, refetch } = renderStatus(baseStatus)

    expect(screen.getByRole('heading', { name: 'Week 6 check-in' })).toBeInTheDocument()
    expect(container.querySelector('polyline')).toHaveAttribute('stroke', 'var(--color-ink)')

    fireEvent.click(screen.getByRole('button', { name: 'Apply new targets' }))

    await waitFor(() => expect(mocks.applyCheckIn).toHaveBeenCalledWith('2026-09-14'))
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Targets updated')
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(mocks.emit).toHaveBeenCalledWith('plans:updated')
  })

  const midWeek: CheckInStatus = {
    ...baseStatus,
    state: 'mid_week',
    week: { start: '2026-09-15', end: '2026-09-21', label: '15 – 21 Sep', number: 7 },
    days_elapsed: 2,
    days: week('2026-09-15', 2),
    days_logged: 2,
    days_to_go: 5,
    proposal: null,
    verdict: null,
  }

  it('renders the week in progress with the days logged so far, and no apply action', () => {
    const { container } = renderStatus(midWeek)

    expect(screen.getByText('5 days to go')).toBeInTheDocument()
    expect(screen.getByText('2 of 2 days logged')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Wednesday 16 Sept?, 2,110 kcal logged/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Saturday 19 Sept?, still to come/ })).toBeDisabled()
    expect(container.querySelector('polyline')).toHaveAttribute('stroke', 'var(--color-ink-35)')
    expect(screen.queryByRole('button', { name: /targets/i })).not.toBeInTheDocument()
    expect(mocks.applyCheckIn).not.toHaveBeenCalled()
  })

  it('Check in now opens Geo\'s review of the last seven days, and closing it returns to the week', async () => {
    mocks.getStatus.mockResolvedValue({ ...baseStatus, early: true, week: { ...baseStatus.week, label: '10 – 16 Sep' } })
    const { refetch } = renderStatus(midWeek)

    fireEvent.click(screen.getByRole('button', { name: 'Check in now' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Your check-in' })).toBeInTheDocument())
    expect(mocks.getStatus).toHaveBeenCalledWith(true)
    expect(screen.getByText('Last 7 days, 10 – 16 Sep')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close check-in' }))
    expect(screen.getByRole('heading', { name: 'Week 7 so far' })).toBeInTheDocument()
    expect(refetch).toHaveBeenCalled()
  })

  it('says the week is already checked in instead of offering another check-in', () => {
    renderStatus({ ...midWeek, last_check_in: { date: '2026-09-16', applied: true, calories: 2300 } })

    expect(screen.queryByRole('button', { name: 'Check in now' })).not.toBeInTheDocument()
    expect(screen.getByText(/Your targets moved to 2,300 kcal/)).toBeInTheDocument()
  })

  it('every number opens its days: a tile lists the week, a day opens the food diary on that date', async () => {
    renderStatus(midWeek)

    fireEvent.click(screen.getByRole('button', { name: /Avg calories/ }))
    expect((await screen.findAllByRole('heading', { name: 'Calories this week' })).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Wed 16 Sept?/ }))
    expect(mocks.push).toHaveBeenCalledWith('/food?date=2026-09-16')
  })

  it('a day in the strip opens that day', async () => {
    renderStatus(midWeek)

    fireEvent.click(screen.getByRole('button', { name: /Wednesday 16 Sept?/ }))
    expect((await screen.findAllByRole('heading', { name: 'Wednesday 16 September' })).length).toBeGreaterThan(0)
    expect(screen.getByText('Upper A', { exact: false })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open food diary' }))
    expect(mocks.push).toHaveBeenCalledWith('/food?date=2026-09-16')
  })

  it('renders insufficient data and keeping records the check-in without changing targets', async () => {
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

    expect(screen.getByRole('img', { name: '3 of 7 days logged' })).toBeInTheDocument()
    expect(container.querySelector('polyline')).toHaveAttribute('stroke', 'var(--color-ink-35)')

    fireEvent.click(screen.getByRole('button', { name: 'Keep current targets' }))

    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith('Targets unchanged'))
    expect(mocks.applyCheckIn).toHaveBeenCalledWith('2026-09-14', false)
    expect(mocks.push).toHaveBeenCalledWith('/dashboard')
  })

  it('shows all four targets Apply writes, as their effect on today', () => {
    renderStatus(baseStatus)
    // 2380 kcal: fat round(2380 * 0.28 / 9) = 74, carbs round((2380 - 660 - 666) / 4) = 264
    expect(screen.getByText(/of 264 g/)).toBeInTheDocument()
    expect(screen.getByText(/of 74 g/)).toBeInTheDocument()
    expect(screen.getByLabelText('was 248 g')).toBeInTheDocument()
    expect(screen.getByText('1,140')).toBeInTheDocument()
    expect(screen.getByText('Calories, carbs and fat go up; protein stays. Lean cut updates too.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Current' }))
    expect(screen.getByText('960')).toBeInTheDocument()
    expect(screen.getByText(/of 248 g/)).toBeInTheDocument()
  })

  it('settles into what the backend saved and swaps Apply for Done', async () => {
    mocks.applyCheckIn.mockResolvedValue({ applied: true, new_calorie_target: 2300, new_protein_target_g: 165 })
    renderStatus(baseStatus)

    fireEvent.click(screen.getByRole('button', { name: 'Apply new targets' }))

    await waitFor(() => expect(screen.getByText('Saved. Home, your food diary and Lean cut now use 2,300 kcal.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Done' }).closest('[inert]')).toBeNull()
    expect(screen.getByRole('button', { name: /Updating your targets/ }).closest('[inert]')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'New targets' })).not.toBeInTheDocument()
  })

  it('says nothing changed when the backend applied nothing', async () => {
    mocks.applyCheckIn.mockResolvedValue({ applied: false, new_calorie_target: null })
    renderStatus(baseStatus)

    fireEvent.click(screen.getByRole('button', { name: 'Apply new targets' }))

    await waitFor(() => expect(screen.getByText('Nothing changed. Your targets are still 2,200 kcal.')).toBeInTheDocument())
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
  })

  it('keeps the proposal and says so when apply fails', async () => {
    mocks.applyCheckIn.mockRejectedValue(new Error('500'))
    const { refetch } = renderStatus(baseStatus)

    fireEvent.click(screen.getByRole('button', { name: 'Apply new targets' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent("That didn't save, so your targets are still 2,200 kcal."))
    expect(refetch).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Done' }).closest('[inert]')).not.toBeNull()
  })

  it('keeping on a hold records the check-in without applying anything', async () => {
    renderStatus({ ...baseStatus, proposal: { new_calories: 2200, new_protein_g: 165, calorie_change_pct: 0, direction: 'hold' } })

    fireEvent.click(screen.getByRole('button', { name: 'Keep my targets' }))

    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith('Targets unchanged'))
    expect(mocks.applyCheckIn).toHaveBeenCalledWith('2026-09-14', false)
  })

  it('a proposal can be turned down', async () => {
    renderStatus(baseStatus)

    fireEvent.click(screen.getByRole('button', { name: 'Keep current targets' }))

    await waitFor(() => expect(mocks.applyCheckIn).toHaveBeenCalledWith('2026-09-14', false))
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Targets unchanged')
  })

  it('labels weigh-ins that come from the Health app', async () => {
    mocks.health = { label: 'Apple Health', connected: true }
    renderStatus(baseStatus)

    expect(await screen.findByText('Apple Health')).toBeInTheDocument()
  })
})
