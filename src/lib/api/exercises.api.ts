import { apiFetch } from './client'

// FB-08 — minimal exercise search wrapper used by the manual workout plan
// builder. The backend returns `{ results: Exercise[] }` from
// `GET /v1/exercises/search?q=...`, mirroring foods.api.ts.

export interface ExerciseSearchResult {
  id: string
  name: string
  primary_muscles?: string[]
  equipment?: string | null
  category?: string | null
}

export async function searchExercises(query: string, limit = 20): Promise<ExerciseSearchResult[]> {
  if (!query.trim()) return []
  const res = await apiFetch<{ results: ExerciseSearchResult[] } | ExerciseSearchResult[]>(
    `/v1/exercises/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  )
  return Array.isArray(res) ? res : res.results ?? []
}
