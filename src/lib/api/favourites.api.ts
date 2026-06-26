import { apiFetch } from './client'

export interface FavouriteItem {
  food_name: string
  quantity_g?: number
  est_macros?: { calories?: number; protein?: number; carbs?: number; fat?: number }
  meal_type?: string
}
export interface Favourite {
  id: string
  name: string
  items: FavouriteItem[]
  default_meal_type: string | null
  created_at: string
}

export async function getFavourites(): Promise<Favourite[]> {
  const r = await apiFetch<{ favourites: Favourite[] }>('/v1/favourites')
  return r.favourites ?? []
}

/** Create a favourite — from explicit items, or from a logged day+meal. */
export async function createFavourite(body: {
  name: string
  items?: FavouriteItem[]
  default_meal_type?: string
  source_date?: string
  source_meal_type?: string
}): Promise<Favourite> {
  return apiFetch<Favourite>('/v1/favourites', { method: 'POST', body })
}

export async function deleteFavourite(id: string): Promise<void> {
  await apiFetch(`/v1/favourites/${id}`, { method: 'DELETE' })
}

/** One-tap log every item of a favourite (default today + the favourite's meal). */
export async function logFavourite(
  id: string,
  body?: { target_date?: string; target_meal_type?: string },
): Promise<{ success: boolean; favourite: string; logged: number; total: number; target_date: string }> {
  return apiFetch(`/v1/favourites/${id}/log`, { method: 'POST', body: body ?? {} })
}
