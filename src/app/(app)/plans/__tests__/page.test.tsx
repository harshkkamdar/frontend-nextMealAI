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

const openSheetMock = vi.fn()
vi.mock('@/stores/ui.store', () => ({
  useUIStore: { getState: () => ({ openSheet: openSheetMock }) },
}))

vi.mock('@/contexts/geo-screen-context', () => ({
  useSetGeoScreen: () => {},
}))

import PlansPage from '@/app/(app)/plans/page'

beforeEach(() => {
  pushMock.mockReset()
  getPlansMock.mockReset()
  openSheetMock.mockReset()
})

describe('PlansPage CTAs', () => {
  it('renders the Geo CTA and both manual builder links', async () => {
    getPlansMock.mockResolvedValue([])
    render(<PlansPage />)
    await waitFor(() => screen.getByText('Ask Geo for a plan'))

    fireEvent.click(screen.getByText('Ask Geo for a plan'))
    expect(openSheetMock).toHaveBeenCalledWith('geo-companion')

    expect(screen.getByRole('link', { name: 'Build nutrition plan by hand' })).toHaveAttribute('href', '/plans/new/meal')
    expect(screen.getByRole('link', { name: 'Build training program by hand' })).toHaveAttribute('href', '/plans/new/workout')
    expect(screen.getByText('Build a nutrition plan by hand →')).toBeInTheDocument()
    expect(screen.getByText('Build a training program by hand →')).toBeInTheDocument()
    expect(screen.getByText('No nutrition plan yet')).toBeInTheDocument()
    expect(screen.getByText('No training program yet')).toBeInTheDocument()
  })

  it('shows an edit button on existing plan cards that routes to the query-based edit page', async () => {
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

    await waitFor(() => screen.getByLabelText('Edit nutrition plan'))
    expect(screen.getByText('2,000 kcal · 150 g protein')).toBeInTheDocument()
    expect(screen.getByText('1 day · Day 1')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Edit nutrition plan'))
    expect(pushMock).toHaveBeenCalledWith('/plans/edit?id=meal-1')

    fireEvent.click(screen.getByLabelText('Edit workout plan'))
    expect(pushMock).toHaveBeenCalledWith('/plans/edit?id=workout-1')
  })
})
