import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  back: vi.fn(),
  replace: vi.fn(),
  createLog: vi.fn(),
  startWorkoutSession: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.back, replace: mocks.replace }),
}))

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}))

vi.mock('@/lib/api/logs.api', () => ({
  createLogWithStatus: (...args: unknown[]) => mocks.createLog(...args),
  getLogs: vi.fn(async () => []),
}))

vi.mock('@/lib/api/exercises.api', () => ({
  searchExercises: vi.fn(async () => []),
}))

vi.mock('@/lib/api/workout-sessions.api', () => ({
  startWorkoutSession: (...args: unknown[]) => mocks.startWorkoutSession(...args),
}))

import { EnergyLogForm } from '../energy-log-form'
import { MoodLogForm } from '../mood-log-form'
import { SleepLogForm } from '../sleep-log-form'
import { WaterLogForm } from '../water-log-form'
import { WeightLogForm } from '../weight-log-form'
import { WorkoutLogForm } from '../workout-log-form'

describe('manual log form guards and FIQR inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('water adds one glass per log and keeps its positive-value guard', async () => {
    mocks.createLog.mockResolvedValueOnce({ queued: false, data: {} })
    render(<WaterLogForm />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('glass · 250 ml')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(mocks.createLog).toHaveBeenCalledWith({ type: 'water', payload: { glasses: 1 }, source: 'manual' }))
    await waitFor(() => expect(mocks.back).toHaveBeenCalled())

    mocks.createLog.mockClear()
    fireEvent.click(screen.getByLabelText('Fewer glasses'))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(mocks.toastError).toHaveBeenCalledWith('Add at least 1 glass')
    expect(mocks.createLog).not.toHaveBeenCalled()
  })

  it('a failed save shows why and turns Save into Try again', async () => {
    mocks.createLog.mockRejectedValueOnce(new Error('500'))
    render(<MoodLogForm />)
    fireEvent.click(screen.getByRole('radio', { name: '7 of 10' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save")
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(mocks.back).not.toHaveBeenCalled()
  })

  it('does not save weight when the numeric input is empty', () => {
    render(<WeightLogForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(mocks.toastError).toHaveBeenCalledWith('Weight is required')
    expect(mocks.createLog).not.toHaveBeenCalled()
  })

  it('does not save mood or energy until a rating is selected', () => {
    const mood = render(<MoodLogForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(mocks.toastError).toHaveBeenCalledWith('Select a mood rating')
    mood.unmount()

    render(<EnergyLogForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(mocks.toastError).toHaveBeenCalledWith('Select an energy rating')
    expect(mocks.createLog).not.toHaveBeenCalled()
  })

  it('sleep steps by 15 minutes and still needs a quality rating', () => {
    render(<SleepLogForm />)
    expect(screen.getByLabelText('7h 30m slept')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('15 minutes more'))
    expect(screen.getByLabelText('7h 45m slept')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(mocks.toastError).toHaveBeenCalledWith('Select a quality rating')
    expect(mocks.createLog).not.toHaveBeenCalled()
  })

  it('starts the existing freestyle session flow from the new action', async () => {
    mocks.startWorkoutSession.mockResolvedValueOnce({ id: 'session-1' })
    render(<WorkoutLogForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }))

    await waitFor(() => expect(mocks.startWorkoutSession).toHaveBeenCalledWith({
      day_name: 'Freestyle Workout',
      exercises: [],
    }))
    expect(mocks.replace).toHaveBeenCalledWith('/train/session?id=session-1')
  })
})
