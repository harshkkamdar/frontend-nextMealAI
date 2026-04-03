import { apiFetch } from './client'
import type { WorkoutSession, ExerciseHistory, StartSessionInput, SessionExercise } from '@/types/workout-session.types'

export async function startWorkoutSession(input: StartSessionInput): Promise<WorkoutSession> {
  return apiFetch<WorkoutSession>('/v1/workout-sessions', { method: 'POST', body: input })
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession> {
  return apiFetch<WorkoutSession>(`/v1/workout-sessions/${id}`)
}

export async function updateWorkoutSession(id: string, data: { exercises?: SessionExercise[]; notes?: string }): Promise<WorkoutSession> {
  return apiFetch<WorkoutSession>(`/v1/workout-sessions/${id}`, { method: 'PATCH', body: data })
}

export async function completeWorkoutSession(id: string): Promise<WorkoutSession> {
  return apiFetch<WorkoutSession>(`/v1/workout-sessions/${id}/complete`, { method: 'POST' })
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
