/**
 * FE-RCA F7 — NextUpCard no longer renders "No meals scheduled today".
 *
 * George (2026-05-20): remove the "No meals scheduled today" empty state.
 * The nutrition plan only provides daily targets, not per-meal scheduling, so
 * the card was promising a capability the system doesn't deliver.
 *
 * Post-fix: when the plan exists but has no meals scheduled for today, the
 * card renders nothing (the macros target is already covered by ProgressCard).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextUpCard } from '@/components/dashboard/next-up-card'
import type { MealPlan } from '@/types/plans.types'

const TODAY = '2026-06-14'

describe('FE-RCA F7 — NextUpCard empty-state removal', () => {
  it('renders nothing when the plan has no entry for today (no "No meals scheduled" literal)', () => {
    const planWithoutTodayMeals = {
      id: 'p1',
      type: 'meal',
      content: {
        daily_targets: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
        days: [
          { date: '2026-06-13', meals: [{ type: 'breakfast', name: 'Oats', calories: 400, protein: 20, carbs: 60, fat: 10 }] },
        ],
      },
    } as unknown as MealPlan

    const { container } = render(
      <NextUpCard mealPlan={planWithoutTodayMeals} today={TODAY} loggedMealTypes={[]} />,
    )

    // The card returns null in this branch.
    expect(container.firstChild).toBeNull()
    // Defensive: the literal must NOT appear.
    expect(screen.queryByText(/No meals scheduled today/i)).toBeNull()
  })

  it('still renders the meal when the plan has one scheduled for today', () => {
    const plan = {
      id: 'p1',
      type: 'meal',
      content: {
        daily_targets: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
        days: [
          {
            date: TODAY,
            meals: [
              { type: 'breakfast', name: 'Oats with whey', calories: 400, protein: 30, carbs: 50, fat: 8 },
            ],
          },
        ],
      },
    } as unknown as MealPlan

    render(<NextUpCard mealPlan={plan} today={TODAY} loggedMealTypes={[]} />)
    expect(screen.getByText('Oats with whey')).toBeInTheDocument()
  })

  it('still renders the "no nutrition plan yet" compact prompt when mealPlan is null', () => {
    // The prompt to create a plan is a different surface — this is correct UX
    // since the user has no plan at all.
    render(<NextUpCard mealPlan={null} today={TODAY} loggedMealTypes={[]} />)
    expect(screen.getByText(/No nutrition plan yet/i)).toBeInTheDocument()
  })

  it('renders the "all meals logged" success state when applicable', () => {
    const plan = {
      id: 'p1',
      type: 'meal',
      content: {
        days: [
          {
            date: TODAY,
            meals: [{ type: 'breakfast', name: 'Oats', calories: 400, protein: 30, carbs: 50, fat: 8 }],
          },
        ],
      },
    } as unknown as MealPlan
    render(<NextUpCard mealPlan={plan} today={TODAY} loggedMealTypes={['breakfast']} />)
    expect(screen.getByText('All meals logged for today')).toBeInTheDocument()
  })
})
