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

// Three weigh-ins: the engine (check-in-engine.ts) reads no week with fewer.
const WEIGH_INS: Record<number, number> = { 0: 78.6, 2: 78.4, 4: 78.2 }
const week = (start: string, logged: number) => Array.from({ length: 7 }, (_, i) => {
  const date = `2026-09-${String(Number(start.slice(8)) + i).padStart(2, '0')}`
  const fed = i < logged
  return { date, calories: fed ? 2100 + i * 10 : null, protein_g: fed ? 140 : null, carbs_g: fed ? 220 : null, fat_g: fed ? 70 : null, sessions: i === 1 ? ['Upper A'] : [], sleep_h: fed ? 7.5 : null, weight_kg: fed ? WEIGH_INS[i] ?? null : null }
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
    current_kg: 78.2,
    delta_week_kg: -0.9,
    // Weekly averages, each ending on the check-in weekday (Monday).
    points: [
      { week_end: '2026-08-31', kg: 80.1 },
      { week_end: '2026-09-07', kg: 79.3 },
      { week_end: '2026-09-14', kg: 78.4 },
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
  verdict: "You lost 0.9 kg this week, the second week running ahead of your 0.5 kg target, so I'm raising your calories to 2,375 to protect your muscle.",
  // What getCheckInStatus builds from runWeeklyCheckIn: fat loss ahead of target two valid weeks running is +7.5%,
  // 2200 × 1.075 rounded to 25 kcal = 2375, a change of 8.0%. Protein stays.
  proposal: {
    new_calories: 2375,
    new_protein_g: 165,
    calorie_change_pct: 8,
    direction: 'up',
  },
}

// POST /v1/check-in answers with runWeeklyCheckIn's CheckInResult (check-in.service.ts).
const checkInInput = (calories: number, thisWeekKg: number) => ({
  goal: { type: 'fat_loss', target_weekly_change_kg: -0.5, current_calorie_target: calories, current_protein_target_g: 165 },
  compliance: { workout_compliance_pct: 100, nutrition_compliance_pct: 86, calories_logged_days: 6, weigh_ins_logged: 3, sleep_avg_hours: 7.1, mood_avg: 4, energy_avg: 4 },
  metrics: { weight_trend_avg_this_week_kg: thisWeekKg, weight_trend_avg_last_week_kg: 79.3, actual_weekly_change_kg: Math.round((thisWeekKg - 79.3) * 10) / 10, weeks_on_current_targets: 3 },
  context: { prior_progress_state: 'ahead_of_target', prior_recovery_concern: false, bmr: 1720, protein_floor_g: 125 },
})
const raised = (calories: number, newCalories: number, pct: number, applied: boolean) => ({
  week_validity: 'valid', progress_state: 'ahead_of_target', program_action: 'calorie_adjustment',
  calorie_adjustment_pct: pct, adjustment_direction: 'increase', wellness_flags: [], next_checkin_days: 7,
  new_calorie_target: newCalories, new_protein_target_g: 165, reached_bmr_floor: false,
  follow_up_question: 'Does the new target feel doable for the week ahead?',
  geo_response: `You're losing faster than planned, so your target goes up to ${newCalories} kcal.`,
  applied, metrics: checkInInput(calories, 78.4), data_notes: [],
})
// Apply on the proposal above: the backend re-decides on the same week and saves 2375.
const APPLIED = raised(2200, 2375, 8, true)
// Keep (apply: false) still runs the engine and records the check-in; nothing is saved.
const KEPT = raised(2200, 2375, 8, false)

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
  mocks.applyCheckIn.mockImplementation(async (_weekEnd: string, apply = true) => (apply ? APPLIED : KEPT))
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
    // 2375 kcal: fat round(2375 * 0.28 / 9) = 74, carbs round((2375 - 660 - 666) / 4) = 262
    expect(screen.getByText(/of 262 g/)).toBeInTheDocument()
    expect(screen.getByText(/of 74 g/)).toBeInTheDocument()
    expect(screen.getByLabelText('was 248 g')).toBeInTheDocument()
    expect(screen.getByText('1,135')).toBeInTheDocument()
    expect(screen.getByText('Calories, carbs and fat go up; protein stays. Lean cut updates too.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Current' }))
    expect(screen.getByText('960')).toBeInTheDocument()
    expect(screen.getByText(/of 248 g/)).toBeInTheDocument()
  })

  it('settles into what the backend saved and swaps Apply for Done', async () => {
    // The status is cached for up to 6 hours; targets edited to 2300 since then make the POST decide from 2300:
    // 2300 × 1.075 rounded to 25 = 2475 (+7.6%). The screen shows what was saved, not the cached proposal.
    mocks.applyCheckIn.mockResolvedValue(raised(2300, 2475, 7.6, true))
    renderStatus(baseStatus)

    fireEvent.click(screen.getByRole('button', { name: 'Apply new targets' }))

    await waitFor(() => expect(screen.getByText('Saved. Home, your food diary and Lean cut now use 2,475 kcal.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Done' }).closest('[inert]')).toBeNull()
    expect(screen.getByRole('button', { name: /Updating your targets/ }).closest('[inert]')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'New targets' })).not.toBeInTheDocument()
  })

  it('says nothing changed when the backend applied nothing', async () => {
    // A weigh-in since the cached status put the week on track (-0.5 kg): the POST re-decides a hold and saves nothing.
    mocks.applyCheckIn.mockResolvedValue({
      week_validity: 'valid', progress_state: 'on_track', program_action: 'none',
      calorie_adjustment_pct: null, adjustment_direction: null, wellness_flags: [], next_checkin_days: 7,
      new_calorie_target: null, new_protein_target_g: null, reached_bmr_floor: false, follow_up_question: null,
      geo_response: "You're right on track, so nothing changes this week.", applied: false,
      metrics: checkInInput(2200, 78.8), data_notes: [],
    })
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
