import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

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

const searchFoodsMock = vi.fn()
vi.mock('@/lib/api/foods.api', () => ({
  searchFoods: (...args: unknown[]) => searchFoodsMock(...args),
}))

import { MealPlanBuilder, validate } from '@/components/plans/meal-plan-builder'
import type { MealPlan } from '@/types/plans.types'

beforeEach(() => {
  pushMock.mockReset()
  toastError.mockReset()
  toastSuccess.mockReset()
  createPlanMock.mockReset()
  updatePlanMock.mockReset()
  activatePlanMock.mockReset()
  searchFoodsMock.mockReset()
})

const fullTargets = { calories: 2000, protein: 150, carbs: 200, fat: 60 }

describe('MealPlanBuilder validation', () => {
  it('requires a name and targets', () => {
    const errors = validate({
      name: '',
      targets: {},
      days: [{ _key: '1', date: '2025-01-01', meals: [{ _key: 'm1', type: 'Breakfast', name: 'Oats' }] }],
    })
    expect(errors).toContain('Plan name is required')
    expect(errors).toContain('Calorie target is required')
  })

  it('requires at least one meal per day', () => {
    const errors = validate({
      name: 'Cut',
      targets: fullTargets,
      days: [{ _key: '1', date: '2025-01-01', meals: [] }],
    })
    expect(errors.some((e) => /at least one meal/.test(e))).toBe(true)
  })

  it('requires each meal to have a name', () => {
    const errors = validate({
      name: 'Cut',
      targets: fullTargets,
      days: [{ _key: '1', date: '2025-01-01', meals: [{ _key: 'm1', type: 'Breakfast', name: '' }] }],
    })
    expect(errors.some((e) => /needs a name/.test(e))).toBe(true)
  })

  it('passes with a full valid plan', () => {
    const errors = validate({
      name: 'Cut',
      targets: fullTargets,
      days: [{ _key: '1', date: '2025-01-01', meals: [{ _key: 'm1', type: 'Breakfast', name: 'Oats' }] }],
    })
    expect(errors).toEqual([])
  })
})

describe('MealPlanBuilder component', () => {
  it('renders default day + meal and lets you add/remove days', () => {
    render(<MealPlanBuilder mode="create" />)
    expect(screen.getByLabelText('Day 1 date')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Add day'))
    expect(screen.getByLabelText('Day 2 date')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Remove day 2'))
    expect(screen.queryByLabelText('Day 2 date')).not.toBeInTheDocument()
  })

  it('submits create payload with foods selection', async () => {
    searchFoodsMock.mockResolvedValue([
      {
        id: 'food-1',
        name: 'Oats',
        brand: 'Quaker',
        serving_size_g: 40,
        macros_per_serving: { calories: 150, protein: 5, carbs: 27, fat: 3 },
        source: 'personal',
        is_favorite: false,
        use_count: 0,
      },
    ])
    createPlanMock.mockResolvedValue({ id: 'plan-9' })
    activatePlanMock.mockResolvedValue(undefined)

    render(<MealPlanBuilder mode="create" />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Cut phase'), { target: { value: 'Cut' } })

    fireEvent.change(screen.getByPlaceholderText('Search foods'), { target: { value: 'oat' } })
    await waitFor(() => screen.getByText('Oats'))
    fireEvent.click(screen.getByText('Oats'))

    const submit = screen.getByRole('button', { name: 'Create plan' })
    await waitFor(() => expect(submit).not.toBeDisabled())
    fireEvent.click(submit)

    await waitFor(() => expect(createPlanMock).toHaveBeenCalled())
    const payload = createPlanMock.mock.calls[0][0]
    expect(payload.type).toBe('meal')
    expect(payload.content.daily_targets.calories).toBe(2000)
    expect(payload.content.days[0].meals[0].name).toBe('Oats')
    expect(payload.content.days[0].meals[0].calories).toBe(150)

    await waitFor(() => expect(activatePlanMock).toHaveBeenCalledWith('plan-9'))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/plans/plan-9'))
    expect(toastSuccess).toHaveBeenCalledWith('Meal plan created')
  })

  it('shows toast on create failure', async () => {
    searchFoodsMock.mockResolvedValue([
      {
        id: 'f',
        name: 'Rice',
        serving_size_g: 100,
        macros_per_serving: { calories: 130 },
        source: 'personal',
        is_favorite: false,
        use_count: 0,
      },
    ])
    createPlanMock.mockRejectedValue(new Error('nope'))

    render(<MealPlanBuilder mode="create" />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Cut phase'), { target: { value: 'Cut' } })
    fireEvent.change(screen.getByPlaceholderText('Search foods'), { target: { value: 'ri' } })
    await waitFor(() => screen.getByText('Rice'))
    fireEvent.click(screen.getByText('Rice'))
    fireEvent.click(screen.getByRole('button', { name: 'Create plan' }))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('nope'))
  })

  it('edit mode pre-fills and calls updatePlan', async () => {
    const initialPlan: MealPlan = {
      id: 'plan-77',
      user_id: 'u1',
      type: 'meal',
      status: 'active',
      content: {
        daily_targets: { calories: 1800, protein: 140, carbs: 180, fat: 50 },
        days: [{ date: '2025-03-01', meals: [{ type: 'Breakfast', name: 'Eggs' }] }],
      },
      created_at: 'n',
      updated_at: 'n',
    }
    updatePlanMock.mockResolvedValue({ id: 'plan-77' })

    render(<MealPlanBuilder mode="edit" initialPlan={initialPlan} />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Cut phase'), { target: { value: 'Recut' } })
    expect(screen.getByText('Eggs')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(updatePlanMock).toHaveBeenCalled())
    expect(updatePlanMock.mock.calls[0][0]).toBe('plan-77')
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/plans/plan-77'))
  })
})
