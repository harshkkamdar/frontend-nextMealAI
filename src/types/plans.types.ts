export type PlanType = 'meal' | 'workout'

export interface MealPlanDay {
  day: string
  meals: Array<{
    name: string
    time?: string
    foods?: Array<{ name: string; calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number }>
    notes?: string
  }>
}

export interface WorkoutPlanDay {
  day: string
  name: string
  exercises?: Array<{
    name: string
    sets?: number
    reps?: string
    duration?: string
    notes?: string
  }>
  rest?: boolean
}

export interface Plan {
  id: string
  user_id: string
  type: PlanType
  name: string
  is_active: boolean
  days: MealPlanDay[] | WorkoutPlanDay[]
  created_at: string
  updated_at: string
}
