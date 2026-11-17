import { apiFetch } from './client'
import { offlineMutate } from '@/lib/offline/mutate'
import type { DietWarning } from '@/types/logs.types'
import type { OfflineResult } from '@/types/offline.types'

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

/** POST /v1/favourites/:id/log. Nothing logged is a 400 NOTHING_LOGGED, not a 200 with `logged: 0`. */
type LogFavouriteResult = {
  success: boolean
  favourite: string
  logged: number
  total: number
  target_date: string
  /** An item clashes with the profile's diet; it logged anyway. */
  diet_warning?: DietWarning
}

/** One-tap log every item of a favourite (default today + the favourite's meal); offline it queues. */
export async function logFavouriteWithStatus(
  id: string,
  body?: { target_date?: string; target_meal_type?: string },
): Promise<OfflineResult<LogFavouriteResult>> {
  const payload = body ?? {}
  return offlineMutate(
    'favourite_log',
    'POST',
    `/v1/favourites/${id}/log`,
    payload,
    () => ({
      success: true,
      favourite: id,
      logged: 0,
      total: 0,
      target_date: payload.target_date ?? new Date().toISOString().slice(0, 10),
    }),
  )
}
