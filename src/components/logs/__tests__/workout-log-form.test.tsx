import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ replace: vi.fn(), success: vi.fn(), startWithStatus: vi.fn() }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), replace: mocks.replace }) }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: mocks.success } }))
vi.mock('@/lib/api/exercises.api', () => ({
  searchExercises: vi.fn(async () => [{ id: 'e1', name: 'Bench Press', primary_muscles: ['chest'], equipment: 'barbell', category: 'strength' }]),
}))
vi.mock('@/lib/api/workout-sessions.api', () => ({
  startWorkoutSessionWithStatus: mocks.startWithStatus,
  // As the real one: the optimistic stand-in when the start was queued offline.
  startWorkoutSession: async (input: unknown) => {
    const result = await mocks.startWithStatus(input)
    return result.queued ? result.optimistic : result.data
  },
}))

import { WorkoutLogForm } from '../workout-log-form'

describe('freestyle workout start', () => {
  beforeEach(() => vi.clearAllMocks())

  // StartSessionSchema takes whole numbers only (.int()), so a typed 2.5 or 47.5 used to come back as a 400.
  it('sends whole sets, reps and rest, and keeps a rest of 0', async () => {
    mocks.startWithStatus.mockResolvedValue({ queued: false, data: { id: 'w1', status: 'in_progress', exercises: [] } })
    render(<WorkoutLogForm />)
    fireEvent.change(screen.getByPlaceholderText('Search exercises'), { target: { value: 'ben' } })
    fireEvent.click(await screen.findByText('Bench Press'))
    fireEvent.change(screen.getByLabelText('Sets'), { target: { value: '3.6' } })
    fireEvent.change(screen.getByLabelText('Reps'), { target: { value: '8.2' } })
    fireEvent.change(screen.getByLabelText(/Rest/), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }))

    await waitFor(() => expect(mocks.startWithStatus).toHaveBeenCalledWith({
      day_name: 'Freestyle Workout',
      exercises: [{ name: 'Bench Press', muscle_group: 'chest', planned_sets: 4, planned_reps: 8, rest_seconds: 0 }],
    }))
  })

  it('offline, the start waits on the phone and the form stays open', async () => {
    mocks.startWithStatus.mockResolvedValue({
      queued: true,
      item: { id: 'q1', kind: 'workout_start', method: 'POST', path: '/v1/workout-sessions', body: {}, attempts: 0, createdAt: '2026-11-17T10:00:00.000Z' },
      optimistic: { id: 'pending-q1', status: 'in_progress', exercises: [] },
    })
    render(<WorkoutLogForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }))
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Workout saved on your phone. It starts when you're back online"))
    expect(mocks.replace).not.toHaveBeenCalled()
  })
})
