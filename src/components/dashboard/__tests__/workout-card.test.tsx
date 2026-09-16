import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkoutCard } from '@/components/dashboard/workout-card'
import type { WorkoutPlan } from '@/types/plans.types'

function makePlan(overrides: Partial<WorkoutPlan> = {}): WorkoutPlan {
  return {
    id: 'plan-1',
    user_id: 'user-1',
    type: 'workout',
    status: 'active',
    current_position: 0,
    content: {
      days: [
        {
          date: '2026-09-15',
          name: 'Leg Day',
          exercises: Array.from({ length: 6 }, (_, index) => ({ name: `Exercise ${index + 1}` })),
        },
      ],
    },
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('WorkoutCard', () => {
  it('renders the selected plan day and estimated duration', () => {
    render(
      <WorkoutCard
        workoutPlan={makePlan()}
        today="2026-09-15"
        onStart={vi.fn()}
        onSeeProgram={vi.fn()}
        onAskGeo={vi.fn()}
      />,
    )

    expect(screen.getByText('Leg Day')).toBeInTheDocument()
    expect(screen.getByText('6 exercises · 45 min')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Workout/ })).toBeInTheDocument()
  })

  it('renders the rest-day state', () => {
    render(
      <WorkoutCard
        workoutPlan={makePlan({
          content: { days: [{ date: '2026-09-15', name: '', is_rest_day: true, exercises: [] }] },
        })}
        today="2026-09-15"
        onStart={vi.fn()}
        onSeeProgram={vi.fn()}
        onAskGeo={vi.fn()}
      />,
    )

    expect(screen.getByText('Rest day')).toBeInTheDocument()
    expect(screen.getByText('Recovery · no session')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /See program/ })).toBeInTheDocument()
  })

  it('renders the no-program state', () => {
    render(
      <WorkoutCard
        workoutPlan={null}
        today="2026-09-15"
        onStart={vi.fn()}
        onSeeProgram={vi.fn()}
        onAskGeo={vi.fn()}
      />,
    )

    expect(screen.getByText('No program yet')).toBeInTheDocument()
    expect(screen.getByText('Geo can build one from your goals')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ask Geo/ })).toBeInTheDocument()
  })
})
