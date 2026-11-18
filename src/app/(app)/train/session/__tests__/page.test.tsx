import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getWorkoutSession: vi.fn(), updateWorkoutSession: vi.fn(), completeWorkoutSession: vi.fn(), searchExercises: vi.fn() }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }), useSearchParams: () => new URLSearchParams('id=s-old') }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))
vi.mock('@/contexts/geo-screen-context', () => ({ useSetGeoScreen: () => {} }))
vi.mock('@/hooks/useUserTimezone', () => ({ useUserTimezone: () => 'UTC' }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('@/lib/platform/health', () => ({ writeWorkoutToHealth: vi.fn() }))
vi.mock('@/lib/api/exercises.api', () => ({ searchExercises: mocks.searchExercises }))
vi.mock('@/lib/api/workout-sessions.api', () => ({
  getWorkoutSession: mocks.getWorkoutSession, updateWorkoutSession: mocks.updateWorkoutSession,
  completeWorkoutSession: mocks.completeWorkoutSession, abandonWorkoutSession: vi.fn(),
}))
// The number as it is, so a NaN shows instead of the count's first frame.
vi.mock('@/components/ui/fiqr/count-up', () => ({ CountUp: ({ value }: { value: number }) => <span>{String(value)}</span> }))

import WorkoutFollowPage from '../page'

// Mirrors workout-sessions.controller.ts getSession (a workout_sessions row, select *): an old finished session whose
// sets hold a rep range in actual_reps, so completeSession's volume came out NaN and was stored as null.
const oldSession = {
  id: 's-old', user_id: 'u', plan_id: 'p1', plan_day_index: 0, day_name: 'Push A', status: 'completed',
  started_at: '2026-10-20T07:00:00.000Z', completed_at: '2026-10-20T08:00:00.000Z',
  total_volume_kg: null, duration_minutes: 60, notes: null, created_at: '2026-10-20T07:00:00.000Z', deleted_at: null,
  exercises: [{
    name: 'Cable Fly', muscle_group: 'chest', planned_sets: 3, planned_reps: 10, rest_seconds: 90, instructions: [], notes: null, status: 'completed',
    sets: [
      { completed: true, set_number: 1, actual_reps: '10-12', actual_weight_kg: 1, planned_reps: 10, planned_weight_kg: null, completed_at: '2026-10-20T07:10:00.000Z' },
      { completed: true, set_number: 2, actual_reps: '10-12', actual_weight_kg: null, planned_reps: 10, planned_weight_kg: null, completed_at: '2026-10-20T07:12:00.000Z' },
      { completed: false, set_number: 3, actual_reps: null, actual_weight_kg: null, planned_reps: 10, planned_weight_kg: null, completed_at: null },
    ],
  }],
}

describe('Opening a past workout', () => {
  it('keeps its start time and shows a real volume', async () => {
    mocks.getWorkoutSession.mockResolvedValue(oldSession)
    mocks.updateWorkoutSession.mockResolvedValue(oldSession)
    render(<WorkoutFollowPage />)
    expect(await screen.findByText('Session done')).toBeInTheDocument()
    // A finished session has no clock to reset (it is far past the 6-hour stale mark).
    expect(mocks.updateWorkoutSession).not.toHaveBeenCalled()
    const totals = screen.getByRole('region', { name: 'Session totals' })
    expect(totals.textContent).not.toContain('NaN')
    expect(totals.textContent).toContain('10kg')
    expect(screen.getByText('Best 1 kg × 10 · 2 sets')).toBeInTheDocument()
  })
})

// startSession's row for a session under way: carried-forward sets hold last time's numbers in previous_*.
const set = (n: number, extra: Record<string, unknown> = {}) => ({
  set_number: n, planned_reps: 10, planned_weight_kg: null, actual_reps: null, actual_weight_kg: null, completed: false, completed_at: null, ...extra,
})
const liveSession = (exercises: Record<string, unknown>[]) => ({
  id: 's-old', user_id: 'u', plan_id: 'p1', plan_day_index: 1, day_name: 'Pull', status: 'in_progress',
  started_at: new Date(Date.now() - 20 * 60_000).toISOString(), completed_at: null,
  total_volume_kg: null, duration_minutes: null, notes: null, created_at: new Date().toISOString(), deleted_at: null,
  exercises: exercises.map((exercise) => ({ muscle_group: 'back', planned_sets: 2, planned_reps: 10, rest_seconds: 90, instructions: [], notes: null, status: 'pending', ...exercise })),
})

describe('A workout under way', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.updateWorkoutSession.mockImplementation(async (id: string, data: object) => ({ ...liveSession([]), id, ...data }))
  })

  it('shows a timed exercise\'s target in seconds', async () => {
    // A plank from the plan: startSession copies duration_seconds and still fills planned_reps with its default 10.
    mocks.getWorkoutSession.mockResolvedValue(liveSession([{ name: 'Plank', planned_sets: 3, rest_seconds: 60, duration_seconds: 60, sets: [set(1), set(2), set(3)] }]))
    render(<WorkoutFollowPage />)
    expect(await screen.findByText(/^3 × 60 s/)).toBeInTheDocument()
    expect(screen.queryByText(/3 × 10/)).not.toBeInTheDocument()
  })

  it('a timed set records seconds, not reps, and the receipt shows them', async () => {
    const session = liveSession([{ name: 'Plank', planned_sets: 1, rest_seconds: 60, duration_seconds: 60, sets: [set(1)] }])
    mocks.getWorkoutSession.mockResolvedValue(session)
    // completeSession as the backend runs it: a completed set with no actual_reps is backfilled from planned_reps.
    mocks.completeWorkoutSession.mockImplementation(async () => {
      const saved = mocks.updateWorkoutSession.mock.lastCall![1].exercises
      const exercises = saved.map((exercise: { sets: Record<string, unknown>[] }) => ({ ...exercise, sets: exercise.sets.map((s) => (s.completed ? { ...s, actual_reps: s.actual_reps ?? s.planned_reps } : s)) }))
      return { ...session, exercises, status: 'completed', completed_at: new Date().toISOString(), total_volume_kg: 0, duration_minutes: 5 }
    })
    render(<WorkoutFollowPage />)

    expect(await screen.findByLabelText('seconds')).toHaveValue('60')
    expect(screen.queryByLabelText('reps')).toBeNull()
    expect(screen.queryByLabelText('weight')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'More seconds' }))
    expect(screen.getByLabelText('seconds')).toHaveValue('65')
    fireEvent.click(screen.getByRole('button', { name: 'Complete set 1' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Finish workout' })[0])

    await waitFor(() => expect(mocks.completeWorkoutSession).toHaveBeenCalled())
    expect(mocks.updateWorkoutSession.mock.lastCall![1].exercises[0].sets[0]).toMatchObject({ completed: true, actual_seconds: 65, actual_reps: null })
    expect(await screen.findByText('Best 65 s · 1 set')).toBeInTheDocument()
    expect(screen.queryByText(/reps/)).toBeNull()
  })

  it('saves the set ticked just before Finish, then finishes', async () => {
    const session = liveSession([{ name: 'Lat Pulldown', planned_sets: 1, sets: [set(1, { planned_weight_kg: 50, previous_reps: 10, previous_weight_kg: 50 })] }])
    mocks.getWorkoutSession.mockResolvedValue(session)
    mocks.completeWorkoutSession.mockImplementation(async () => ({ ...session, status: 'completed', completed_at: new Date().toISOString(), total_volume_kg: 500, duration_minutes: 20 }))
    render(<WorkoutFollowPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Complete set 1' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Finish workout' })[0])

    await waitFor(() => expect(mocks.completeWorkoutSession).toHaveBeenCalled())
    expect(mocks.updateWorkoutSession).toHaveBeenCalledWith('s-old', { exercises: [expect.objectContaining({ sets: [expect.objectContaining({ completed: true, actual_weight_kg: 50, actual_reps: 10 })] })] })
    expect(mocks.updateWorkoutSession.mock.invocationCallOrder[0]).toBeLessThan(mocks.completeWorkoutSession.mock.invocationCallOrder[0])
  })

  it('+ Add set starts from the weight of the last set, done or typed', async () => {
    // First time on Bench Press: startSession left planned_weight_kg null; set 1 was done at 60 kg.
    mocks.getWorkoutSession.mockResolvedValue(liveSession([{ name: 'Bench Press', planned_sets: 1, status: 'completed', sets: [set(1, { actual_reps: 10, actual_weight_kg: 60, completed: true, completed_at: new Date().toISOString() })] }]))
    const { unmount } = render(<WorkoutFollowPage />)
    fireEvent.click(await screen.findByRole('button', { name: '+ Add set' }))
    expect(screen.getByLabelText('weight')).toHaveValue('60')
    unmount()

    // Set 2 has 62.5 typed but isn't done yet.
    mocks.getWorkoutSession.mockResolvedValue(liveSession([{ name: 'Bench Press', status: 'in_progress', sets: [set(1, { actual_reps: 10, actual_weight_kg: 60, completed: true, completed_at: new Date().toISOString() }), set(2, { actual_weight_kg: 62.5 })] }]))
    render(<WorkoutFollowPage />)
    fireEvent.click(await screen.findByRole('button', { name: '+ Add set' }))
    expect(screen.getByRole('button', { name: 'Set 3 62.5 kilograms, edit' })).toBeInTheDocument()
  })

  it('drops the old exercise\'s last-time numbers when it is swapped', async () => {
    // Set 1 of Row is done; last time was bodyweight × 10 on both sets.
    mocks.getWorkoutSession.mockResolvedValue(liveSession([{
      name: 'Row', status: 'in_progress',
      sets: [
        set(1, { actual_reps: 10, completed: true, completed_at: new Date().toISOString(), previous_reps: 10, previous_weight_kg: null }),
        set(2, { previous_reps: 10, previous_weight_kg: null }),
      ],
    }]))
    mocks.searchExercises.mockResolvedValue([{ id: 'x1', name: 'Wide-Grip Lat Pulldown', primary_muscles: ['lats'], equipment: 'cable', category: 'strength' }])
    render(<WorkoutFollowPage />)
    expect((await screen.findAllByText(/BW × 10/)).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Swap Row' }))
    fireEvent.change(await screen.findByPlaceholderText('Search exercises…'), { target: { value: 'lat' } })
    fireEvent.click(await screen.findByText('Wide-Grip Lat Pulldown'))
    fireEvent.click(screen.getByRole('button', { name: 'Swap' }))

    // The Row card may still be fading out beside it; read the new one.
    const card = (await screen.findByText('Wide-Grip Lat Pulldown', { selector: 'h2' })).closest('article')!
    expect(within(card).getByText(/^Set 2 · last time/)).toHaveTextContent('Set 2 · last time —')
    expect(within(card).queryByText(/BW × 10/)).not.toBeInTheDocument()
  })
})
