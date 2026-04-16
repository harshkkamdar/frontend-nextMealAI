import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const getPlansMock = vi.fn()
vi.mock('@/lib/api/plans.api', () => ({
  getPlans: (...args: unknown[]) => getPlansMock(...args),
}))

vi.mock('@/contexts/geo-screen-context', () => ({
  useSetGeoScreen: () => {},
}))

import PlansPage from '@/app/(app)/plans/page'

beforeEach(() => {
  pushMock.mockReset()
  getPlansMock.mockReset()
})

describe('PlansPage CTAs', () => {
  it('renders New Meal Plan and New Workout Plan buttons that navigate correctly', async () => {
    getPlansMock.mockResolvedValue([])
    render(<PlansPage />)
    await waitFor(() => screen.getByText('New Meal Plan'))

    fireEvent.click(screen.getByText('New Meal Plan'))
    expect(pushMock).toHaveBeenCalledWith('/plans/new/meal')

    fireEvent.click(screen.getByText('New Workout Plan'))
    expect(pushMock).toHaveBeenCalledWith('/plans/new/workout')
  })

  it('shows an edit button on existing plan cards that routes to /plans/:id/edit', async () => {
    getPlansMock.mockResolvedValue([
      {
        id: 'meal-1',
        user_id: 'u1',
        type: 'meal',
        status: 'active',
        content: { daily_targets: { calories: 2000, protein: 150, carbs: 200, fat: 60 } },
        created_at: 'n',
        updated_at: 'n',
      },
      {
        id: 'workout-1',
        user_id: 'u1',
        type: 'workout',
        status: 'active',
        content: { days: [{ date: '', name: 'Day 1', is_rest_day: false, exercises: [] }] },
        created_at: 'n',
        updated_at: 'n',
      },
    ])
    render(<PlansPage />)

    await waitFor(() => screen.getByLabelText('Edit meal plan'))
    fireEvent.click(screen.getByLabelText('Edit meal plan'))
    expect(pushMock).toHaveBeenCalledWith('/plans/meal-1/edit')

    fireEvent.click(screen.getByLabelText('Edit workout plan'))
    expect(pushMock).toHaveBeenCalledWith('/plans/workout-1/edit')
  })
})
