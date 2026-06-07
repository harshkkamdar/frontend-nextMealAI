/**
 * FB-R6.7 follow-up — Dashboard WorkoutCard tests
 *
 * Two regressions caught from George's UAT screenshots:
 * 1. Dashboard showed "Lower A" while Activity showed "Upper A" for the same
 *    calendar date because the card used calendar-modulo from plan.start_date
 *    instead of plan.current_position. Card now honors the BE cursor (same
 *    helper Activity uses).
 * 2. "Plank Hold 3 × -1" — plan stored reps=-1 (sentinel for duration-based)
 *    and the card rendered it literally. Now treats reps<=0 as missing and
 *    prefers duration_seconds.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkoutCard } from '@/components/dashboard/workout-card'
import type { WorkoutPlan } from '@/types/plans.types'

function makePlan(overrides: Partial<WorkoutPlan> = {}): WorkoutPlan {
  return {
    id: 'plan-1',
    user_id: 'u',
    type: 'workout',
    status: 'active',
    version: 1,
    previous_version_id: null,
    start_date: '2026-06-01',
    end_date: null,
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
    generated_by: 'ai',
    current_position: 0,
    content: {
      days: [
        {
          name: 'Upper A',
          exercises: [
            { name: 'Barbell Bench Press', sets: 4, reps: 8 },
            { name: 'Plank Hold', sets: 3, reps: -1, duration_seconds: 30 },
          ],
        },
        {
          name: 'Lower A',
          exercises: [
            { name: 'Barbell Back Squat', sets: 4, reps: 8 },
          ],
        },
      ],
    } as any,
    ...overrides,
  } as WorkoutPlan
}

describe('WorkoutCard — FB-R6.7 follow-up', () => {
  it('honors plan.current_position for today\'s workout (matches Activity)', () => {
    // start was June 1, today is June 6 (5 days later). With calendar-modulo
    // the old card showed days[5 % 2] = days[1] = "Lower A". The new card
    // uses cursor (current_position=0) → days[0] = "Upper A".
    const plan = makePlan({ current_position: 0 })
    render(<WorkoutCard workoutPlan={plan} today="2026-06-06" />)
    expect(screen.getByText('Upper A')).toBeInTheDocument()
    expect(screen.queryByText('Lower A')).not.toBeInTheDocument()
  })

  it('follows cursor when Geo advance_to_workout has moved it', () => {
    const plan = makePlan({ current_position: 1 })
    render(<WorkoutCard workoutPlan={plan} today="2026-06-06" />)
    expect(screen.getByText('Lower A')).toBeInTheDocument()
    expect(screen.queryByText('Upper A')).not.toBeInTheDocument()
  })

  it('renders Plank Hold duration instead of "3 × -1" reps', () => {
    const plan = makePlan({ current_position: 0 })
    render(<WorkoutCard workoutPlan={plan} today="2026-06-06" />)
    // Plank Hold has sets=3, reps=-1 (sentinel), duration_seconds=30.
    expect(screen.getByText('Plank Hold')).toBeInTheDocument()
    expect(screen.getByText('3 × 30s')).toBeInTheDocument()
    expect(screen.queryByText(/× -1|×-1/)).not.toBeInTheDocument()
  })

  it('falls back to "no workout scheduled" when plan has no days', () => {
    const plan = makePlan({ content: { days: [] } as any })
    render(<WorkoutCard workoutPlan={plan} today="2026-06-06" />)
    expect(screen.getByText(/No workout scheduled today/i)).toBeInTheDocument()
  })

  it('shows the "no plan yet" empty state when workoutPlan is null', () => {
    render(<WorkoutCard workoutPlan={null} today="2026-06-06" />)
    expect(screen.getByText(/No workout plan yet/i)).toBeInTheDocument()
  })
})
