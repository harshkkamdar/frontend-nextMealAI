import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
}))

const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: { error: (msg: string) => toastError(msg), success: vi.fn() },
}))

const getPlanMock = vi.fn()
vi.mock('@/lib/api/plans.api', () => ({
  getPlan: (...args: unknown[]) => getPlanMock(...args),
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  activatePlan: vi.fn(),
}))

vi.mock('@/lib/api/exercises.api', () => ({ searchExercises: vi.fn(async () => []) }))
vi.mock('@/lib/api/foods.api', () => ({ searchFoods: vi.fn(async () => []) }))

import { EditPlanView } from '@/app/(app)/plans/[id]/edit/page'

beforeEach(() => {
  pushMock.mockReset()
  toastError.mockReset()
  getPlanMock.mockReset()
})

describe('EditPlanPage', () => {
  it('routes to WorkoutPlanBuilder for workout plans', async () => {
    getPlanMock.mockResolvedValue({
      id: 'p1',
      user_id: 'u1',
      type: 'workout',
      status: 'active',
      content: { days: [{ date: '', name: 'Chest', is_rest_day: false, exercises: [{ name: 'Bench', sets: 3 }] }] },
      created_at: 'n',
      updated_at: 'n',
    })
    render(<EditPlanView id="p1" />)
    await waitFor(() => expect(screen.getByText('Edit Workout Plan')).toBeInTheDocument())
  })

  it('routes to MealPlanBuilder for meal plans', async () => {
    getPlanMock.mockResolvedValue({
      id: 'p2',
      user_id: 'u1',
      type: 'meal',
      status: 'active',
      content: {
        daily_targets: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
        days: [{ date: '2025-01-01', meals: [{ type: 'Breakfast', name: 'Oats' }] }],
      },
      created_at: 'n',
      updated_at: 'n',
    })
    render(<EditPlanView id="p2" />)
    await waitFor(() => expect(screen.getByText('Edit Meal Plan')).toBeInTheDocument())
  })

  it('redirects to /plans on load failure', async () => {
    getPlanMock.mockRejectedValue(new Error('not found'))
    render(<EditPlanView id="bad" />)
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/plans'))
    expect(toastError).toHaveBeenCalledWith('not found')
  })
})
