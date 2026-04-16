import { apiFetch } from './client'
import type { FoodSearchResult, UserFood, CreateFoodInput } from '@/types/foods.types'

export async function getPersonalFoods(): Promise<UserFood[]> {
  const res = await apiFetch<{ foods: UserFood[] }>('/v1/foods')
  return res.foods ?? []
}

export async function searchFoods(
  query: string,
  source: 'all' | 'personal' | 'usda' = 'all',
  limit = 20
): Promise<FoodSearchResult[]> {
  const res = await apiFetch<{ results: FoodSearchResult[] }>(
    `/v1/foods/search?q=${encodeURIComponent(query)}&source=${source}&limit=${limit}`
  )
  return res.results ?? []
}

export async function saveFood(data: CreateFoodInput): Promise<UserFood> {
  return apiFetch<UserFood>('/v1/foods', { method: 'POST', body: data })
}

export async function updateFood(id: string, data: Partial<{ name: string; is_favorite: boolean; macros_per_serving: object }>): Promise<UserFood> {
  return apiFetch<UserFood>(`/v1/foods/${id}`, { method: 'PATCH', body: data })
}

export async function deleteUserFood(id: string): Promise<void> {
  await apiFetch(`/v1/foods/${id}`, { method: 'DELETE' })
}

export async function getRecentFoods(limit = 8): Promise<UserFood[]> {
  const foods = await getPersonalFoods()
  return foods
    .filter((f) => f.last_used_at)
    .sort((a, b) => new Date(b.last_used_at!).getTime() - new Date(a.last_used_at!).getTime())
    .slice(0, limit)
}
