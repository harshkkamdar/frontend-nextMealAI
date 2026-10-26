import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/plans',
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('@/lib/api/workout-sessions.api', () => ({
  startWorkoutSession: vi.fn(),
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
