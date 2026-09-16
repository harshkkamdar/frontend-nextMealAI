import { apiFetch } from './client'
import { offlineMutate } from '@/lib/offline/mutate'
import { useAuthStore } from '@/stores/auth.store'
import type { OfflineResult } from '@/types/offline.types'
import type { WorkoutSession, ExerciseHistory, StartSessionInput, SessionExercise } from '@/types/workout-session.types'

export async function startWorkoutSession(input: StartSessionInput): Promise<WorkoutSession> {
  const result = await startWorkoutSessionWithStatus(input)
  return result.queued ? result.optimistic : result.data
}

export async function startWorkoutSessionWithStatus(
  input: StartSessionInput,
): Promise<OfflineResult<WorkoutSession>> {
  return offlineMutate('workout_start', 'POST', '/v1/workout-sessions', input, (item) => {
    const now = new Date().toISOString()
    return {
      id: `pending-${item.id}`,
      user_id: useAuthStore.getState().user?.id ?? '',
      plan_id: input.plan_id ?? null,
      plan_day_index: input.plan_day_index ?? null,
      day_name: input.day_name ?? 'Workout',
      status: 'in_progress',
      started_at: now,
      completed_at: null,
      exercises: (input.exercises ?? []).map((exercise) => ({
        name: exercise.name,
        muscle_group: exercise.muscle_group ?? null,
        planned_sets: exercise.planned_sets ?? 3,
        planned_reps: exercise.planned_reps ?? 10,
        rest_seconds: exercise.rest_seconds ?? 90,
        status: 'pending',
        sets: [],
      })),
      total_volume_kg: null,
      duration_minutes: null,
      notes: null,
      created_at: now,
    }
  })
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession> {
  return apiFetch<WorkoutSession>(`/v1/workout-sessions/${id}`)
}

export async function updateWorkoutSession(
  id: string,
  data: { exercises?: SessionExercise[]; notes?: string; started_at?: string }
): Promise<WorkoutSession> {
  const result = await updateWorkoutSessionWithStatus(id, data)
  return result.queued ? result.optimistic : result.data
}

export async function updateWorkoutSessionWithStatus(
  id: string,
  data: { exercises?: SessionExercise[]; notes?: string; started_at?: string },
): Promise<OfflineResult<WorkoutSession>> {
  return offlineMutate(
    'workout_patch',
    'PATCH',
    `/v1/workout-sessions/${id}`,
    data,
    () => ({ id, ...data } as unknown as WorkoutSession),
  )
}

export async function completeWorkoutSession(id: string): Promise<WorkoutSession> {
  const result = await completeWorkoutSessionWithStatus(id)
  return result.queued ? result.optimistic : result.data
}

export async function completeWorkoutSessionWithStatus(
  id: string,
): Promise<OfflineResult<WorkoutSession>> {
  return offlineMutate(
    'workout_complete',
    'POST',
    `/v1/workout-sessions/${id}/complete`,
    undefined,
    () => ({
      id,
      status: 'completed',
      completed_at: new Date().toISOString(),
    } as unknown as WorkoutSession),
  )
}

export async function abandonWorkoutSession(id: string): Promise<WorkoutSession> {
  return apiFetch<WorkoutSession>(`/v1/workout-sessions/${id}/abandon`, { method: 'POST' })
}

export async function getExerciseHistory(exercise: string, limit = 4): Promise<ExerciseHistory[]> {
  const res = await apiFetch<{ history: ExerciseHistory[] }>(
    `/v1/workout-sessions/history?exercise=${encodeURIComponent(exercise)}&limit=${limit}`
  )
  return res.history ?? []
}

export async function getInProgressSession(): Promise<WorkoutSession | null> {
  const res = await apiFetch<{ session: WorkoutSession | null }>('/v1/workout-sessions/in-progress')
  return res.session
}

export async function getWorkoutHistory(limit = 10): Promise<WorkoutSession[]> {
  const res = await apiFetch<{ sessions: WorkoutSession[] }>(`/v1/workout-sessions/history?limit=${limit}`)
  return res.sessions ?? []
}
