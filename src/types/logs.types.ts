export type LogType = 'food' | 'workout' | 'weight' | 'note'

export interface FoodLogEntry {
  name: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  serving_size?: string
  quantity?: number
}

export interface Log {
  id: string
  user_id: string
  type: LogType
  date: string
  notes?: string
  data?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface LogsSummary {
  period: string
  summary: {
    total_logs: number
    avg_daily_calories: number
    avg_daily_protein: number
    workout_count: number
    avg_sleep_hours: number
    avg_energy_rating: number
  }
  daily_breakdown?: Array<{
    date: string
    calories: number
    protein: number
    carbs: number
    fat: number
    workouts: number
  }>
}
