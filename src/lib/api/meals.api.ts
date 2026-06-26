import { apiFetch } from './client'

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
  return apiFetch<CopyMealResult>('/v1/meals/copy', { method: 'POST', body: params })
}
