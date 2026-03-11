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
  date: string
  period: string
  totals: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }
  daily_targets?: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }
  logs_count: number
}
