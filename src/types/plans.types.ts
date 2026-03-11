export type PlanType = 'meal' | 'workout'
export type PlanStatus = 'draft' | 'active' | 'superseded' | 'completed'

export interface MealPlanFood {
  name: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface MealPlanMeal {
  name: string
  time?: string
  foods?: MealPlanFood[]
  notes?: string
}

export interface MealPlanDay {
  day: string
  meals: MealPlanMeal[]
}

export interface WorkoutExercise {
  name: string
  sets?: number
  reps?: string
  duration?: string
  notes?: string
}

export interface WorkoutPlanDay {
  day: string
  name: string
  exercises?: WorkoutExercise[]
  rest?: boolean
}

interface PlanBase {
  id: string
  user_id: string
  type: PlanType
  status: PlanStatus
  version?: number
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface MealPlan extends PlanBase {
  type: 'meal'
  content: {
    days?: MealPlanDay[]
    daily_targets?: { calories: number; protein: number; carbs: number; fat: number }
    [key: string]: unknown
  }
}

export interface WorkoutPlan extends PlanBase {
  type: 'workout'
  content: {
    days?: WorkoutPlanDay[]
    [key: string]: unknown
  }
}

export type Plan = MealPlan | WorkoutPlan
