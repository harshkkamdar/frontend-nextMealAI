import { beforeEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), toastSuccess: vi.fn(), startWithStatus: vi.fn(), getInProgress: vi.fn(), abandon: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, back: mocks.back, refresh: vi.fn() }),
  usePathname: () => '/plans',
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: mocks.toastSuccess },
}))

vi.mock('@/lib/api/workout-sessions.api', () => ({
  getInProgressSession: mocks.getInProgress,
  abandonWorkoutSession: mocks.abandon,
  startWorkoutSessionWithStatus: mocks.startWithStatus,
  // As the real one: the optimistic stand-in when the start was queued offline.
  startWorkoutSession: async (input: unknown) => {
    const result = await mocks.startWithStatus(input)
    return result.queued ? result.optimistic : result.data
  },
}))

vi.mock('@/components/plans/plan-changelog', () => ({
  PlanChangelog: () => null,
}))

import { WorkoutPlanDetail } from '@/components/plans/workout-plan-detail'
import type { WorkoutPlan } from '@/types/plans.types'

function makePlan(overrides: Partial<WorkoutPlan> = {}): WorkoutPlan {
  return {
    id: 'wp-1',
    user_id: 'u-1',
    type: 'workout',
    status: 'active',
    content: { days: [] },
    created_at: '2026-04-16T00:00:00Z',
    updated_at: '2026-04-16T00:00:00Z',
    ...overrides,
  }
}

describe('WorkoutPlanDetail — plan name in header', () => {
  // AC01.1
  it('displays content.name in the header when present', () => {
    const plan = makePlan({ content: { name: 'Push Pull Legs', days: [] } })
    render(<WorkoutPlanDetail plan={plan} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Push Pull Legs')
  })

  // AC01.3
  it('falls back to "Workout Plan" when content.name is undefined', () => {
    const plan = makePlan({ content: { days: [] } })
    render(<WorkoutPlanDetail plan={plan} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Workout Plan')
  })

  // AC01.3 variant — empty string treated as absent
  it('falls back to "Workout Plan" when content.name is empty string', () => {
    const plan = makePlan({ content: { name: '', days: [] } })
    render(<WorkoutPlanDetail plan={plan} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Workout Plan')
  })

  it('opens the next day on arrival and closes it on tap', async () => {
    const plan = makePlan({
      start_date: '2026-09-15',
      end_date: '2026-10-12',
      content: { name: 'PPL', days: [{ date: '2026-09-15', name: 'Push', is_rest_day: false, exercises: [{ name: 'Bench Press', sets: 3, reps: 10, rest_seconds: 90 }] }] },
    })
    render(<WorkoutPlanDetail plan={plan} />)
    expect(screen.getByText('Active until 12 Oct')).toBeInTheDocument()
    expect(screen.getByText('Days')).toBeInTheDocument()
    // The plan's next day is open on arrival, marked Next, with its Start.
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText('Bench Press').closest('li')).toHaveTextContent('Bench Press3 × 10 · 90 s')
    expect(screen.getByRole('button', { name: 'Start Push' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Push day 1/ }))
    expect(screen.getByRole('button', { name: /Push day 1/ })).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Start Push' })).not.toBeInTheDocument())
  })
})

describe('WorkoutPlanDetail — what Geo and the backend write', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getInProgress.mockResolvedValue(null)
  })

  it('shows the weight Geo set on an exercise (plans.service writes weight_kg)', () => {
    const plan = makePlan({ current_position: 0, content: { name: 'PPL', days: [{ date: '', name: 'Push', is_rest_day: false, exercises: [{ name: 'Bench Press', sets: 3, reps: 8, rest_seconds: 90, weight_kg: 60 }] }] } })
    render(<WorkoutPlanDetail plan={plan} />)
    expect(screen.getByText('Bench Press').closest('li')).toHaveTextContent('Bench Press3 × 8 · 60 kg · 90 s')
  })

  it('Back to plans opens the plans list, not the page before', () => {
    window.history.replaceState({ fiqrIndex: 4 }, '')
    render(<WorkoutPlanDetail plan={makePlan()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Back to plans' }))
    expect(mocks.push).toHaveBeenCalledWith('/plans')
    expect(mocks.back).not.toHaveBeenCalled()
  })

  it('offline, Start waits on the phone instead of opening a workout that cannot load', async () => {
    mocks.startWithStatus.mockResolvedValue({
      queued: true,
      item: { id: 'q1', kind: 'workout_start', method: 'POST', path: '/v1/workout-sessions', body: {}, attempts: 0, createdAt: '2026-11-17T10:00:00.000Z' },
      optimistic: { id: 'pending-q1', status: 'in_progress', exercises: [] },
    })
    const plan = makePlan({ current_position: 0, content: { name: 'PPL', days: [{ date: '', name: 'Push', is_rest_day: false, exercises: [{ name: 'Bench Press', sets: 3, reps: 8 }] }] } })
    render(<WorkoutPlanDetail plan={plan} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start Push' }))
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("Workout saved on your phone. It starts when you're back online"))
    expect(mocks.push).not.toHaveBeenCalled()
  })
})

// A workout_sessions row (select *) still in progress.
const openSession = (id: string, planId: string, dayIndex: number, dayName: string) => ({
  id, user_id: 'u-1', plan_id: planId, plan_day_index: dayIndex, day_name: dayName, status: 'in_progress',
  started_at: '2026-11-12T08:00:00.000Z', completed_at: null, total_volume_kg: null, duration_minutes: null, notes: null,
  created_at: '2026-11-12T08:00:00.000Z', deleted_at: null,
  exercises: [{ name: 'Bench Press', muscle_group: 'chest', planned_sets: 1, planned_reps: 8, rest_seconds: 90, instructions: [], notes: null, status: 'pending', sets: [{ set_number: 1, planned_reps: 8, planned_weight_kg: null, actual_reps: null, actual_weight_kg: null, completed: false, completed_at: null }] }],
})

describe('WorkoutPlanDetail — Start with another workout open', () => {
  const ppl = () => makePlan({ current_position: 2, content: { name: 'PPL', days: ['Push', 'Pull', 'Legs'].map((name) => ({ date: '', name, is_rest_day: false, exercises: [{ name: 'Squat', sets: 3, reps: 5 }] })) } })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getInProgress.mockResolvedValue(openSession('w-push', 'wp-1', 0, 'Push'))
    mocks.abandon.mockResolvedValue({ ...openSession('w-push', 'wp-1', 0, 'Push'), status: 'abandoned' })
    mocks.startWithStatus.mockResolvedValue({ queued: false, data: openSession('w-legs', 'wp-1', 2, 'Legs') })
  })

  it('asks first; Resume opens the open one and starts nothing', async () => {
    render(<WorkoutPlanDetail plan={ppl()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start Legs' }))
    expect(await screen.findByText('Push is still open')).toBeInTheDocument()
    expect(mocks.startWithStatus).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Resume Push' }))
    expect(mocks.push).toHaveBeenCalledWith('/train/session?id=w-push')
    expect(mocks.startWithStatus).not.toHaveBeenCalled()
  })

  it('discard abandons the open one, then starts this day', async () => {
    render(<WorkoutPlanDetail plan={ppl()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start Legs' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Discard it and start Legs' }))
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/train/session?id=w-legs'))
    expect(mocks.abandon).toHaveBeenCalledWith('w-push')
    expect(mocks.startWithStatus).toHaveBeenCalledWith({ plan_id: 'wp-1', plan_day_index: 2 })
    expect(mocks.abandon.mock.invocationCallOrder[0]).toBeLessThan(mocks.startWithStatus.mock.invocationCallOrder[0])
  })

  it('the same day already open just resumes (startSession returns it), with no question', async () => {
    mocks.getInProgress.mockResolvedValue(openSession('w-legs', 'wp-1', 2, 'Legs'))
    render(<WorkoutPlanDetail plan={ppl()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start Legs' }))
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/train/session?id=w-legs'))
    expect(screen.queryByText('Legs is still open')).not.toBeInTheDocument()
  })
})
