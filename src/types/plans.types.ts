export type PlanType = 'meal' | 'workout'
export type PlanStatus = 'draft' | 'active' | 'superseded' | 'completed'

export interface MealPlanMeal {
  type: string
  name: string
  time?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface MealPlanSnack {
  name: string
  time?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface MealPlanDay {
  date: string
  meals: MealPlanMeal[]
  snacks?: MealPlanSnack[]
}

export interface WorkoutExercise {
  name: string
  sets?: number
  reps?: number
  weight?: number
  duration_seconds?: number
  notes?: string
}

export interface WorkoutPlanDay {
  date: string
  name: string
  is_rest_day?: boolean
  exercises?: WorkoutExercise[]
}

export interface MealPlan {
  id: string
  user_id: string
  type: 'meal'
  status: PlanStatus
  version?: number
  start_date?: string
  end_date?: string
  content: {
    days?: MealPlanDay[]
    daily_targets?: { calories: number; protein: number; carbs: number; fat: number }
    notes?: string
  }
  created_at: string
  updated_at: string
}

export interface WorkoutPlan {
  id: string
  user_id: string
  type: 'workout'
  status: PlanStatus
  version?: number
  start_date?: string
  end_date?: string
  content: {
    days?: WorkoutPlanDay[]
    notes?: string
  }
  created_at: string
  updated_at: string
}

export type Plan = MealPlan | WorkoutPlan
