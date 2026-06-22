export type LogType = 'food' | 'workout' | 'sleep' | 'mood' | 'energy' | 'water' | 'weight' | 'correction'
export type LogSource = 'manual' | 'menu_scan' | 'ai_suggestion' | 'quick_log' | 'import'

export interface FoodMacros {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

/**
 * FB-10: per-component breakdown of an itemised food log. Produced by Geo
 * from image estimates so users can sanity-check each component before
 * logging the compound meal.
 */
export interface FoodLogItem {
  name: string
  quantity_g?: number
  quantity_label?: string
  est_macros: FoodMacros
  notes?: string
}

export interface FoodPayload {
  food_name: string
  quantity_g?: number
  est_macros?: FoodMacros
  meal_type?: string
  user_food_id?: string
  servings?: number
  notes?: string
  /** FB-10 — optional per-component breakdown for image estimates */
  items?: FoodLogItem[]
}

export interface WorkoutLogExerciseEntry {
  name: string
  sets?: number
  reps?: number
  weight_kg?: number
}

export interface WorkoutPayload {
  // Optional because workout-session completion entries (inserted by
  // backend POST /v1/workout-sessions/:id/complete) do not include `exercise`
  // — they carry day_name + session_id instead. See FB-09.
  exercise?: string
  sets?: number
  reps?: number
  weight_kg?: number
  duration_min?: number
  difficulty_rating?: number
  notes?: string
  // FB-D5 multi-exercise freestyle log
  title?: string
  exercises?: WorkoutLogExerciseEntry[]
  // Session-completion fields:
  session_id?: string
  day_name?: string
  exercises_completed?: number
  total_exercises?: number
}

export interface SleepPayload {
  hours: number
  quality_rating: number
  notes?: string
}

export interface MoodPayload {
  rating: number
  notes?: string
}

export interface EnergyPayload {
  rating: number
  time_of_day?: string
  notes?: string
}

export interface WaterPayload {
  glasses?: number
  liters?: number
}

export interface WeightPayload {
  weight_kg: number
  notes?: string
}

export type LogPayload = FoodPayload | WorkoutPayload | SleepPayload | MoodPayload | EnergyPayload | WaterPayload | WeightPayload

export interface Log {
  id: string
  user_id: string
  type: LogType
  payload: LogPayload
  source: LogSource
  /** FB-12 — user-local calendar date the log was bucketed into. Null on
   *  legacy rows until the backfill runs after a tz capture. */
  local_date?: string | null
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
  daily_breakdown?: {
    date: string
    calories: number
    protein: number
    carbs: number
    fat: number
    workouts: number
  }[]
}

export interface CreateLogInput {
  type: LogType
  payload: LogPayload
  source?: LogSource
  /** Optional user-local calendar date (YYYY-MM-DD). When set, the row buckets
   *  onto this date instead of "today" — lets the diary log onto the date the
   *  user is viewing. */
  local_date?: string
}
