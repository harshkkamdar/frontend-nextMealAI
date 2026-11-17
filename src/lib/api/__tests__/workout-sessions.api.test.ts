import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
  OfflineError: class OfflineError extends Error {},
}))

vi.mock('@/lib/platform/network', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/platform/network')>()
  return { ...actual, isOnline: vi.fn().mockResolvedValue(false) }
})

import { completeWorkoutSession } from '@/lib/api/workout-sessions.api'
import { useOfflineQueue } from '@/lib/offline/queue.store'
import type { WorkoutSession } from '@/types/workout-session.types'

// A workout_sessions row as getSession returns it, mid-workout.
const live = {
  id: 's-1', user_id: 'u', plan_id: 'p1', plan_day_index: 0, day_name: 'Push', status: 'in_progress',
  started_at: '2026-11-17T07:00:00.000Z', completed_at: null, total_volume_kg: null, duration_minutes: null, notes: null,
  created_at: '2026-11-17T07:00:00.000Z', deleted_at: null,
  exercises: [{
    name: 'Bench Press', muscle_group: 'chest', planned_sets: 1, planned_reps: 8, rest_seconds: 90, instructions: [], notes: null, status: 'completed',
    sets: [{ set_number: 1, planned_reps: 8, planned_weight_kg: 60, actual_reps: 8, actual_weight_kg: 60, completed: true, completed_at: '2026-11-17T07:10:00.000Z', previous_reps: 8, previous_weight_kg: 57.5 }],
  }],
} as WorkoutSession

describe('completeWorkoutSession offline', () => {
  beforeEach(() => useOfflineQueue.setState({ items: [], dead: [] }))

  // The session page shows what this returns as the receipt, which reads exercises.
  it('stands in with the session itself, marked completed, and queues the finish', async () => {
    const done = await completeWorkoutSession('s-1', live)
    expect(done.status).toBe('completed')
    expect(done.completed_at).toEqual(expect.any(String))
    expect(done.exercises).toEqual(live.exercises)
    expect(done.day_name).toBe('Push')
    expect(useOfflineQueue.getState().items[0].path).toBe('/v1/workout-sessions/s-1/complete')
  })
})
