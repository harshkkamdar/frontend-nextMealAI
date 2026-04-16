import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
}))

const toastError = vi.fn()
const toastSuccess = vi.fn()
vi.mock('sonner', () => ({
  toast: { error: (msg: string) => toastError(msg), success: (msg: string) => toastSuccess(msg) },
}))

const createPlanMock = vi.fn()
const updatePlanMock = vi.fn()
const activatePlanMock = vi.fn()
vi.mock('@/lib/api/plans.api', () => ({
  createPlan: (...args: unknown[]) => createPlanMock(...args),
  updatePlan: (...args: unknown[]) => updatePlanMock(...args),
  activatePlan: (...args: unknown[]) => activatePlanMock(...args),
}))

const searchExercisesMock = vi.fn()
vi.mock('@/lib/api/exercises.api', () => ({
  searchExercises: (...args: unknown[]) => searchExercisesMock(...args),
}))

import { WorkoutPlanBuilder, validate } from '@/components/plans/workout-plan-builder'
import type { WorkoutPlan } from '@/types/plans.types'

beforeEach(() => {
  pushMock.mockReset()
  toastError.mockReset()
  toastSuccess.mockReset()
  createPlanMock.mockReset()
  updatePlanMock.mockReset()
  activatePlanMock.mockReset()
  searchExercisesMock.mockReset()
})

describe('WorkoutPlanBuilder validation', () => {
  it('requires a plan name', () => {
    const errors = validate({
      name: '',
      days: [
        {
          _key: '1',
          date: '',
          name: 'Day 1',
          is_rest_day: false,
          exercises: [{ _key: 'e1', name: 'Bench', sets: 3, reps: 10 }],
        },
      ],
    })
    expect(errors).toContain('Plan name is required')
  })

  it('requires each non-rest day to have exercises', () => {
    const errors = validate({
      name: 'PPL',
      days: [{ _key: '1', date: '', name: 'Day 1', is_rest_day: false, exercises: [] }],
    })
    expect(errors.some((e) => /at least one exercise/.test(e))).toBe(true)
  })

  it('allows rest days without exercises', () => {
    const errors = validate({
      name: 'PPL',
      days: [{ _key: '1', date: '', name: 'Rest', is_rest_day: true, exercises: [] }],
    })
    expect(errors).toEqual([])
  })

  it('requires exercise name and sets >= 1', () => {
    const errors = validate({
      name: 'PPL',
      days: [
        {
          _key: '1',
          date: '',
          name: 'Day 1',
          is_rest_day: false,
          exercises: [{ _key: 'e1', name: '', sets: 0 }],
        },
      ],
    })
    expect(errors.some((e) => /needs a name/.test(e))).toBe(true)
    expect(errors.some((e) => /sets ≥ 1/.test(e))).toBe(true)
  })
})

describe('WorkoutPlanBuilder component', () => {
  it('renders one initial day and lets you add/remove days', () => {
    render(<WorkoutPlanBuilder mode="create" />)
    expect(screen.getByLabelText('Day 1 name')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Add day'))
    expect(screen.getByLabelText('Day 2 name')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Remove day 2'))
    expect(screen.queryByLabelText('Day 2 name')).not.toBeInTheDocument()
  })

  it('submit is blocked until required fields are valid', async () => {
    render(<WorkoutPlanBuilder mode="create" />)
    const submit = screen.getByRole('button', { name: 'Create plan' })
    expect(submit).toBeDisabled()
  })

  it('adds an exercise via search and submits create payload', async () => {
    searchExercisesMock.mockResolvedValue([
      { id: 'ex-1', name: 'Bench Press', primary_muscles: ['chest'] },
    ])
    createPlanMock.mockResolvedValue({ id: 'plan-123' })
    activatePlanMock.mockResolvedValue(undefined)

    render(<WorkoutPlanBuilder mode="create" />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Push Pull Legs'), {
      target: { value: 'Bulk' },
    })

    fireEvent.click(screen.getByText('Add exercise'))
    const searchInput = screen.getByPlaceholderText('Search exercises')
    fireEvent.change(searchInput, { target: { value: 'ben' } })

    await waitFor(() => screen.getByText('Bench Press'))
    fireEvent.click(screen.getByText('Bench Press'))

    const submit = screen.getByRole('button', { name: 'Create plan' })
    await waitFor(() => expect(submit).not.toBeDisabled())
    fireEvent.click(submit)

    await waitFor(() => expect(createPlanMock).toHaveBeenCalled())
    const payload = createPlanMock.mock.calls[0][0]
    expect(payload.type).toBe('workout')
    expect(payload.content.days[0].exercises[0].name).toBe('Bench Press')
    expect(payload.content.days[0].exercises[0].sets).toBe(3)

    await waitFor(() => expect(activatePlanMock).toHaveBeenCalledWith('plan-123'))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/plans/plan-123'))
    expect(toastSuccess).toHaveBeenCalledWith('Workout plan created')
  })

  it('shows toast on create failure', async () => {
    searchExercisesMock.mockResolvedValue([{ id: 'ex-1', name: 'Squat' }])
    createPlanMock.mockRejectedValue(new Error('boom'))

    render(<WorkoutPlanBuilder mode="create" />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Push Pull Legs'), {
      target: { value: 'Bulk' },
    })
    fireEvent.click(screen.getByText('Add exercise'))
    fireEvent.change(screen.getByPlaceholderText('Search exercises'), { target: { value: 'squ' } })
    await waitFor(() => screen.getByText('Squat'))
    fireEvent.click(screen.getByText('Squat'))

    fireEvent.click(screen.getByRole('button', { name: 'Create plan' }))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('boom'))
  })

  it('edit mode pre-fills from initialPlan and calls updatePlan', async () => {
    const initialPlan: WorkoutPlan = {
      id: 'plan-42',
      user_id: 'u1',
      type: 'workout',
      status: 'active',
      content: {
        days: [
          {
            date: '',
            name: 'Chest',
            is_rest_day: false,
            exercises: [{ name: 'Bench Press', sets: 4, reps: 8 }],
          },
        ],
      },
      created_at: 'now',
      updated_at: 'now',
    }
    updatePlanMock.mockResolvedValue({ id: 'plan-42' })

    render(<WorkoutPlanBuilder mode="edit" initialPlan={initialPlan} />)
    // The name input is empty because content.name isn't persisted; type a name.
    fireEvent.change(screen.getByPlaceholderText('e.g. Push Pull Legs'), {
      target: { value: 'Chest day' },
    })

    // Day card should render with existing exercise already selected
    expect(screen.getByDisplayValue('Chest')).toBeInTheDocument()
    expect(screen.getByText('Bench Press')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(updatePlanMock).toHaveBeenCalled())
    expect(updatePlanMock.mock.calls[0][0]).toBe('plan-42')
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/plans/plan-42'))
  })
})
