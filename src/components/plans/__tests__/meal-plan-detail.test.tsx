import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

vi.mock('@/components/plans/plan-changelog', () => ({
  PlanChangelog: () => null,
}))

import { MealPlanDetail } from '@/components/plans/meal-plan-detail'
import type { MealPlan } from '@/types/plans.types'

function makePlan(overrides: Partial<MealPlan> = {}): MealPlan {
  return {
    id: 'mp-1',
    user_id: 'u-1',
    type: 'meal',
    status: 'active',
    content: { days: [] },
    created_at: '2026-04-16T00:00:00Z',
    updated_at: '2026-04-16T00:00:00Z',
    ...overrides,
  }
}

describe('MealPlanDetail — plan name in header', () => {
  // AC01.2
  it('displays content.name in the header when present', () => {
    const plan = makePlan({ content: { name: 'Cut Phase', days: [] } })
    render(<MealPlanDetail plan={plan} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cut Phase')
  })

  // AC01.3 meal variant
  it('falls back to "Meal Plan" when content.name is undefined', () => {
    const plan = makePlan({ content: { days: [] } })
    render(<MealPlanDetail plan={plan} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Meal Plan')
  })

  // AC01.4
  it('falls back to "Meal Plan" when content.name is empty string', () => {
    const plan = makePlan({ content: { name: '', days: [] } })
    render(<MealPlanDetail plan={plan} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Meal Plan')
  })
})
