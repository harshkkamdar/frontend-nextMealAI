import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/plans',
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
import { previousPlans } from '@/components/plans/plan-format'
import { timeLeft } from '@/components/plans/plan-overview-card'
import type { Plan } from '@/types/plans.types'

beforeEach(() => {
  pushMock.mockReset()
  getPlansMock.mockReset()
  openSheetMock.mockReset()
})

describe('previousPlans', () => {
  const plan = (id: string, type: 'meal' | 'workout', status: string, name?: string) => ({ id, user_id: 'u1', type, status, content: { name }, created_at: 'n', updated_at: 'n' }) as unknown as Plan

  it('keeps one row per earlier plan and drops older versions of an active plan', () => {
    const active = [plan('a', 'meal', 'active', 'Cut')]
    const all = [
      ...active,
      plan('b', 'meal', 'superseded', 'Cut'),
      plan('c', 'workout', 'completed', 'PPL'),
      plan('d', 'workout', 'superseded', 'PPL'),
      plan('e', 'meal', 'draft', 'Draft'),
      plan('f', 'meal', 'superseded', 'Bulk'),
    ]
    expect(previousPlans(all, active).map((p) => p.id)).toEqual(['c', 'f'])
  })

  it('caps the list at five', () => {
    const all = Array.from({ length: 8 }, (_, i) => plan(`p${i}`, 'meal', 'completed', `Plan ${i}`))
    expect(previousPlans(all, [])).toHaveLength(5)
  })
})

describe('timeLeft', () => {
  const today = new Date(2026, 9, 26)
  it('counts weeks, then days, then ends today; nothing for past or missing dates', () => {
    expect(timeLeft('2026-11-29', today)).toBe('5 weeks left')
    expect(timeLeft('2026-10-29', today)).toBe('3 days left')
    expect(timeLeft('2026-10-27', today)).toBe('1 day left')
    expect(timeLeft('2026-10-26', today)).toBe('Ends today')
    expect(timeLeft('2026-10-01', today)).toBeNull()
    expect(timeLeft(undefined, today)).toBeNull()
  })
})

describe('PlansPage earlier plans', () => {
  it('lists earlier plans from the full plan list and opens one', async () => {
    getPlansMock.mockImplementation(async (params?: { active_only?: boolean }) => params?.active_only ? [] : [
      { id: 'old-1', user_id: 'u1', type: 'workout', status: 'completed', start_date: '2026-06-01', end_date: '2026-07-01', content: { name: 'Summer strength' }, created_at: 'n', updated_at: 'n' },
    ])
    render(<PlansPage />)
    const row = await screen.findByText('Summer strength')
    expect(screen.getByText('Earlier')).toBeInTheDocument()
    fireEvent.click(row)
    expect(pushMock).toHaveBeenCalledWith('/plans/view?id=old-1')
  })
})

describe('PlansPage CTAs', () => {
  it('renders the Geo CTA and both manual builder links', async () => {
    getPlansMock.mockResolvedValue([])
    render(<PlansPage />)
    await waitFor(() => screen.getByText('Ask Geo for a plan'))

    fireEvent.click(screen.getByText('Ask Geo for a plan'))
    expect(openSheetMock).toHaveBeenCalledWith('geo-companion')

    expect(screen.getByRole('link', { name: /Build a nutrition plan/ })).toHaveAttribute('href', '/plans/new/meal')
    expect(screen.getByRole('link', { name: /Build a training plan/ })).toHaveAttribute('href', '/plans/new/workout')
    expect(screen.getByRole('link', { name: /No nutrition plan yet/ })).toHaveAttribute('href', '/plans/new/meal')
    expect(screen.getByRole('link', { name: /No training plan yet/ })).toHaveAttribute('href', '/plans/new/workout')
  })

  it('answers on the cards: the day\'s targets and the next workout, and each card opens its plan', async () => {
    getPlansMock.mockResolvedValue([
      {
        id: 'meal-1',
        user_id: 'u1',
        type: 'meal',
        status: 'active',
        content: { name: 'Lean cut', daily_targets: { calories: 2125, protein: 165, carbs: 218, fat: 66 } },
        created_at: 'n',
        updated_at: 'n',
      },
      {
        id: 'workout-1',
        user_id: 'u1',
        type: 'workout',
        status: 'active',
        current_position: 2,
        content: { name: 'Upper/lower', days: [
          { date: '', name: 'Upper A', exercises: [] },
          { date: '', name: 'Lower A', exercises: [] },
          { date: '', name: 'Rest', is_rest_day: true, exercises: [] },
          { date: '', name: 'Upper B', exercises: [] },
        ] },
        created_at: 'n',
        updated_at: 'n',
      },
    ])
    render(<PlansPage />)

    const meal = await screen.findByRole('button', { name: 'Lean cut, nutrition, 2,125 kcal a day' })
    expect(screen.getByText('218 g')).toBeInTheDocument()
    // current_position 2 is a rest day, so the next workout is the day after it.
    const workout = screen.getByRole('button', { name: 'Upper/lower, training, next Upper B' })
    fireEvent.click(meal)
    expect(pushMock).toHaveBeenCalledWith('/plans/view?id=meal-1')
    fireEvent.click(workout)
    expect(pushMock).toHaveBeenCalledWith('/plans/view?id=workout-1')
  })
})
