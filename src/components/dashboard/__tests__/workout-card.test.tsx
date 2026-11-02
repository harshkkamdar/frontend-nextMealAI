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
    expect(screen.getByRole('button', { name: /Start workout/ })).toBeInTheDocument()
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
    expect(screen.getByText('Recovery today, no session')).toBeInTheDocument()
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

describe('WorkoutCard with an open session', () => {
  const session = (startedHoursAgo: number) => ({
    id: 's1', user_id: 'u1', plan_id: 'plan-1', plan_day_index: 0, day_name: 'Pull', status: 'in_progress' as const,
    started_at: new Date(Date.now() - startedHoursAgo * 3_600_000).toISOString(), completed_at: null,
    exercises: [{ name: 'Row', sets: [{ completed: true }, { completed: false }, { completed: false }, { completed: false }] }],
    total_volume_kg: null, duration_minutes: null, notes: null, created_at: '2026-10-23T00:00:00.000Z',
  }) as unknown as import('@/types/workout-session.types').WorkoutSession

  it('offers Resume for a session started recently, with no way to discard it', () => {
    const onResume = vi.fn()
    render(<WorkoutCard workoutPlan={makePlan()} today="2026-09-15" inProgress={session(1)} onStart={vi.fn()} onResume={onResume} onDiscard={vi.fn()} onSeeProgram={vi.fn()} onAskGeo={vi.fn()} />)
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByText('1 of 4 sets done')).toBeInTheDocument()
    screen.getByRole('button', { name: /Resume workout/ }).click()
    expect(onResume).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'End it and start fresh' })).toBeNull()
  })

  it('names a stale session as unfinished and lets it be ended', () => {
    const onDiscard = vi.fn()
    render(<WorkoutCard workoutPlan={makePlan()} today="2026-09-15" inProgress={session(48)} onStart={vi.fn()} onResume={vi.fn()} onDiscard={onDiscard} onSeeProgram={vi.fn()} onAskGeo={vi.fn()} />)
    expect(screen.getByText(/^Unfinished since /)).toBeInTheDocument()
    screen.getByRole('button', { name: 'End it and start fresh' }).click()
    expect(onDiscard).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }))
  })
})
