export type PlanType = 'meal' | 'workout'

export interface MealPlanFood {
  name: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
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
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MealPlan extends PlanBase {
  type: 'meal'
  days: MealPlanDay[]
}

export interface WorkoutPlan extends PlanBase {
  type: 'workout'
  days: WorkoutPlanDay[]
}

export type Plan = MealPlan | WorkoutPlan
