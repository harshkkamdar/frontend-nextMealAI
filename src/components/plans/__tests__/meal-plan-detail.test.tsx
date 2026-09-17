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
  it('falls back to "Nutrition Plan" when content.name is undefined', () => {
    const plan = makePlan({ content: { days: [] } })
    render(<MealPlanDetail plan={plan} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nutrition Plan')
  })

  // AC01.4
  it('falls back to "Nutrition Plan" when content.name is empty string', () => {
    const plan = makePlan({ content: { name: '', days: [] } })
    render(<MealPlanDetail plan={plan} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nutrition Plan')
  })

  it('renders daily target tiles and meal-day pills', () => {
    const plan = makePlan({
      start_date: '2026-09-15',
      end_date: '2026-10-12',
      content: {
        name: 'Cut Phase',
        daily_targets: { calories: 2600, protein: 180, carbs: 250, fat: 70 },
        days: [{ date: '2026-09-15', meals: [{ type: 'Breakfast', name: 'Oats', calories: 612, protein: 30, carbs: 80, fat: 12 }] }],
      },
    })
    render(<MealPlanDetail plan={plan} />)
    expect(screen.getByText('Active · 15 Sep – 12 Oct')).toBeInTheDocument()
    expect(screen.getByText('Daily targets')).toBeInTheDocument()
    expect(screen.getByText('Calories')).toBeInTheDocument()
    expect(screen.getByText('Tue 15')).toBeInTheDocument()
    expect(screen.getByText('Breakfast · 612 kcal')).toBeInTheDocument()
  })
})
