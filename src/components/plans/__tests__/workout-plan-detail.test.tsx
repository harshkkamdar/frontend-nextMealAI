import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
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
})
