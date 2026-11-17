import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getWorkoutSession: vi.fn(), updateWorkoutSession: vi.fn() }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }), useSearchParams: () => new URLSearchParams('id=s-old') }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))
vi.mock('@/contexts/geo-screen-context', () => ({ useSetGeoScreen: () => {} }))
vi.mock('@/hooks/useUserTimezone', () => ({ useUserTimezone: () => 'UTC' }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('@/lib/platform/health', () => ({ writeWorkoutToHealth: vi.fn() }))
vi.mock('@/lib/api/exercises.api', () => ({ searchExercises: vi.fn() }))
vi.mock('@/lib/api/workout-sessions.api', () => ({
  getWorkoutSession: mocks.getWorkoutSession, updateWorkoutSession: mocks.updateWorkoutSession,
  completeWorkoutSession: vi.fn(), abandonWorkoutSession: vi.fn(),
}))
// The number as it is, so a NaN shows instead of the count's first frame.
vi.mock('@/components/ui/fiqr/count-up', () => ({ CountUp: ({ value }: { value: number }) => <span>{String(value)}</span> }))

import WorkoutFollowPage from '../page'

// Mirrors workout-sessions.controller.ts getSession (a workout_sessions row, select *): an old finished session whose
// sets hold a rep range in actual_reps, so completeSession's volume came out NaN and was stored as null.
const oldSession = {
  id: 's-old', user_id: 'u', plan_id: 'p1', plan_day_index: 0, day_name: 'Push A', status: 'completed',
  started_at: '2026-10-20T07:00:00.000Z', completed_at: '2026-10-20T08:00:00.000Z',
  total_volume_kg: null, duration_minutes: 60, notes: null, created_at: '2026-10-20T07:00:00.000Z', deleted_at: null,
  exercises: [{
    name: 'Cable Fly', muscle_group: 'chest', planned_sets: 3, planned_reps: 10, rest_seconds: 90, instructions: [], notes: null, status: 'completed',
    sets: [
      { completed: true, set_number: 1, actual_reps: '10-12', actual_weight_kg: 1, planned_reps: 10, planned_weight_kg: null, completed_at: '2026-10-20T07:10:00.000Z' },
      { completed: true, set_number: 2, actual_reps: '10-12', actual_weight_kg: null, planned_reps: 10, planned_weight_kg: null, completed_at: '2026-10-20T07:12:00.000Z' },
      { completed: false, set_number: 3, actual_reps: null, actual_weight_kg: null, planned_reps: 10, planned_weight_kg: null, completed_at: null },
    ],
  }],
}

describe('Opening a past workout', () => {
  it('keeps its start time and shows a real volume', async () => {
    mocks.getWorkoutSession.mockResolvedValue(oldSession)
    mocks.updateWorkoutSession.mockResolvedValue(oldSession)
    render(<WorkoutFollowPage />)
    expect(await screen.findByText('Session done')).toBeInTheDocument()
    // A finished session has no clock to reset (it is far past the 6-hour stale mark).
    expect(mocks.updateWorkoutSession).not.toHaveBeenCalled()
    const totals = screen.getByRole('region', { name: 'Session totals' })
    expect(totals.textContent).not.toContain('NaN')
    expect(totals.textContent).toContain('10kg')
    expect(screen.getByText('Best 1 kg × 10 · 2 sets')).toBeInTheDocument()
  })
})
