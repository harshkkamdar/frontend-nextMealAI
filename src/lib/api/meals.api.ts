import { apiFetch } from './client'
import { offlineMutate } from '@/lib/offline/mutate'
import type { OfflineResult } from '@/types/offline.types'

export interface CopyMealResult {
  success: boolean
  copied: number
  total: number
  source_date: string
  target_date: string
  items: Array<{ success: boolean; food_name?: string; log_id?: string; error?: string }>
  message?: string
}

/** Re-log a past day's meal onto another day (default today). */
export async function copyMeal(params: {
  source_date: string
  target_date?: string
  source_meal_type?: string
  target_meal_type?: string
}): Promise<CopyMealResult> {
  const result = await copyMealWithStatus(params)
  return result.queued ? result.optimistic : result.data
}

export async function copyMealWithStatus(params: {
  source_date: string
  target_date?: string
  source_meal_type?: string
  target_meal_type?: string
}): Promise<OfflineResult<CopyMealResult>> {
  return offlineMutate('meal_copy', 'POST', '/v1/meals/copy', params, () => ({
    success: true,
    copied: 0,
    total: 0,
    source_date: params.source_date,
    target_date: params.target_date ?? new Date().toISOString().slice(0, 10),
    items: [],
  }))
}
