import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  getPlans: vi.fn(),
  getInProgressSession: vi.fn(),
  getWorkoutHistory: vi.fn(),
  startWorkoutSessionWithStatus: vi.fn(),
  abandonWorkoutSession: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push, back: vi.fn() }), usePathname: () => '/train' }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), mocks.toast) }))
vi.mock('@/contexts/geo-screen-context', () => ({ useSetGeoScreen: () => {} }))
vi.mock('@/hooks/useUserTimezone', () => ({ useUserTimezone: () => 'UTC' }))
vi.mock('@/lib/api/plans.api', () => ({ getPlans: mocks.getPlans }))
vi.mock('@/lib/api/workout-sessions.api', () => ({
  getInProgressSession: mocks.getInProgressSession,
  getWorkoutHistory: mocks.getWorkoutHistory,
  abandonWorkoutSession: mocks.abandonWorkoutSession,
  startWorkoutSessionWithStatus: mocks.startWorkoutSessionWithStatus,
  // As the real one: the optimistic stand-in when the start was queued offline.
  startWorkoutSession: async (input: unknown) => {
    const result = await mocks.startWorkoutSessionWithStatus(input)
    return result.queued ? result.optimistic : result.data
  },
}))

import ActivityPage from '../page'

const exercise = (name: string) => ({ name, sets: 3, reps: 10, rest_seconds: 90 })
// A plans row (select *) for an active PPL program whose cursor is on Pull.
const plan = {
  id: 'p1', user_id: 'u', type: 'workout', status: 'active', version: 1, previous_version_id: null, generated_by: 'ai',
  start_date: '2026-10-01', end_date: null, current_position: 1, deleted_at: null,
  created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z',
  content: {
    name: 'PPL',
    days: [
      { date: '', name: 'Push', is_rest_day: false, exercises: [exercise('Bench Press')] },
      { date: '', name: 'Pull', is_rest_day: false, exercises: [exercise('Row')] },
      { date: '', name: 'Legs', is_rest_day: false, exercises: [exercise('Squat')] },
    ],
  },
}
// A workout_sessions row: Push, started on 12 Nov and never finished.
const session = (id: string, dayIndex: number, dayName: string, startedAt: string) => ({
  id, user_id: 'u', plan_id: 'p1', plan_day_index: dayIndex, day_name: dayName, status: 'in_progress',
  started_at: startedAt, completed_at: null, total_volume_kg: null, duration_minutes: null, notes: null, created_at: startedAt, deleted_at: null,
  exercises: [{ name: 'Bench Press', muscle_group: 'chest', planned_sets: 1, planned_reps: 10, rest_seconds: 90, instructions: [], notes: null, status: 'pending', sets: [{ set_number: 1, planned_reps: 10, planned_weight_kg: null, actual_reps: null, actual_weight_kg: null, completed: false, completed_at: null }] }],
})
const unfinishedPush = session('w-push', 0, 'Push', '2026-11-12T08:00:00.000Z')

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-17T10:00:00.000Z'))
  mocks.getPlans.mockResolvedValue([plan])
  mocks.getInProgressSession.mockResolvedValue(null)
  mocks.getWorkoutHistory.mockResolvedValue([])
  mocks.abandonWorkoutSession.mockResolvedValue({ ...unfinishedPush, status: 'abandoned' })
  mocks.startWorkoutSessionWithStatus.mockResolvedValue({ queued: false, data: session('w-pull', 1, 'Pull', '2026-11-17T10:00:00.000Z') })
})

afterEach(() => vi.useRealTimers())

describe('Train: starting a workout', () => {
  it('asks about an unfinished workout first; Resume opens it and starts nothing', async () => {
    mocks.getInProgressSession.mockResolvedValue(unfinishedPush)
    render(<ActivityPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Start workout' }))

    expect(await screen.findByText('Push is still open')).toBeInTheDocument()
    expect(mocks.startWorkoutSessionWithStatus).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Resume Push' }))
    expect(mocks.push).toHaveBeenCalledWith('/train/session?id=w-push')
    expect(mocks.startWorkoutSessionWithStatus).not.toHaveBeenCalled()
  })

  it('discarding the unfinished workout abandons it, then starts the new one', async () => {
    mocks.getInProgressSession.mockResolvedValue(unfinishedPush)
    render(<ActivityPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Start workout' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Discard it and start Pull' }))

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/train/session?id=w-pull'))
    expect(mocks.abandonWorkoutSession).toHaveBeenCalledWith('w-push')
    expect(mocks.startWorkoutSessionWithStatus).toHaveBeenCalledWith({ plan_id: 'p1', plan_day_index: 1, day_name: 'Pull' })
    expect(mocks.abandonWorkoutSession.mock.invocationCallOrder[0]).toBeLessThan(mocks.startWorkoutSessionWithStatus.mock.invocationCallOrder[0])
  })

  it('offline, the start waits on the phone and Train stays put', async () => {
    mocks.startWorkoutSessionWithStatus.mockResolvedValue({
      queued: true,
      item: { id: 'q1', kind: 'workout_start', method: 'POST', path: '/v1/workout-sessions', body: {}, attempts: 0, createdAt: '2026-11-17T10:00:00.000Z' },
      optimistic: session('pending-q1', 1, 'Pull', '2026-11-17T10:00:00.000Z'),
    })
    render(<ActivityPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Start workout' }))

    await waitFor(() => expect(mocks.toast.success).toHaveBeenCalledWith("Workout saved on your phone. It starts when you're back online"))
    expect(mocks.push).not.toHaveBeenCalled()
  })
})

describe('Train calendar', () => {
  it('says what is planned on a planned day instead of "No workout"', async () => {
    render(<ActivityPage />)
    // Pull is today; the cycle puts Legs tomorrow.
    fireEvent.click(await screen.findByRole('button', { name: 'Wednesday 18 November, planned' }))
    expect(await screen.findByText('Legs is planned')).toBeInTheDocument()
    expect(screen.queryByText('No workout on this day')).not.toBeInTheDocument()
  })

  it('steps back a week to find last week\'s workout, and forward only as far as the plan goes', async () => {
    // getWorkoutHistory's row: Legs, finished last Tuesday.
    mocks.getWorkoutHistory.mockResolvedValue([{ ...session('w-legs', 2, 'Legs', '2026-11-10T07:00:00.000Z'), status: 'completed', completed_at: '2026-11-10T08:00:00.000Z', duration_minutes: 55 }])
    render(<ActivityPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Open workout calendar' }))
    const calendar = await screen.findByRole('dialog', { name: 'Workout history calendar' })

    fireEvent.click(within(calendar).getByRole('button', { name: 'Previous week' }))
    expect(within(calendar).getByRole('button', { name: 'Tuesday 10 November, workout done' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(calendar).getByText('Legs')).toBeInTheDocument()

    // Planned days run two weeks ahead (to 30 Nov): back to this week, then two weeks on, then no further.
    const next = within(calendar).getByRole('button', { name: 'Next week' })
    fireEvent.click(next)
    fireEvent.click(next)
    expect(next).toBeEnabled()
    fireEvent.click(next)
    expect(within(calendar).getByRole('button', { name: 'Tuesday 1 December' })).toHaveAttribute('aria-pressed', 'true')
    expect(next).toBeDisabled()
  })
})
