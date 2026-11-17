import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ replace: vi.fn(), startWorkoutSession: vi.fn() }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), replace: mocks.replace }) }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/lib/api/exercises.api', () => ({
  searchExercises: vi.fn(async () => [{ id: 'e1', name: 'Bench Press', primary_muscles: ['chest'], equipment: 'barbell', category: 'strength' }]),
}))
vi.mock('@/lib/api/workout-sessions.api', () => ({ startWorkoutSession: mocks.startWorkoutSession }))

import { WorkoutLogForm } from '../workout-log-form'

describe('freestyle workout start', () => {
  // StartSessionSchema takes whole numbers only (.int()), so a typed 2.5 or 47.5 used to come back as a 400.
  it('sends whole sets, reps and rest, and keeps a rest of 0', async () => {
    mocks.startWorkoutSession.mockResolvedValue({ id: 'w1' })
    render(<WorkoutLogForm />)
    fireEvent.change(screen.getByPlaceholderText('Search exercises'), { target: { value: 'ben' } })
    fireEvent.click(await screen.findByText('Bench Press'))
    fireEvent.change(screen.getByLabelText('Sets'), { target: { value: '3.6' } })
    fireEvent.change(screen.getByLabelText('Reps'), { target: { value: '8.2' } })
    fireEvent.change(screen.getByLabelText(/Rest/), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }))

    await waitFor(() => expect(mocks.startWorkoutSession).toHaveBeenCalledWith({
      day_name: 'Freestyle Workout',
      exercises: [{ name: 'Bench Press', muscle_group: 'chest', planned_sets: 4, planned_reps: 8, rest_seconds: 0 }],
    }))
  })
})
