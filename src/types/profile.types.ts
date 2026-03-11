export type Sex = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'
export type PrimaryGoal = 'fat_loss' | 'muscle_gain' | 'maintenance' | 'body_recomposition'
export type DietaryStyle = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'halal' | 'kosher'

export interface Profile {
  id: string
  user_id: string
  name: string
  dob?: string
  sex?: Sex
  height_cm?: number
  weight_kg?: number
  target_weight_kg?: number
  activity_level?: ActivityLevel
  primary_goal?: PrimaryGoal
  dietary_style?: DietaryStyle
  equipment?: string[]
  injuries?: string[]
  allergies?: string[]
  dislikes?: string[]
  cuisines?: string[]
  meals_per_day?: number
  workout_frequency?: number
  onboarding_completed?: boolean
  created_at: string
  updated_at: string
}

export interface OnboardingStatus {
  can_use_app: boolean
  completed_modules: string[]
  missing_modules: string[]
}

export interface PersonalOnboardingInput {
  name: string
  dob: string // YYYY-MM-DD
  sex: Sex
}

export interface FitnessOnboardingInput {
  equipment: string[]
  injuries: string[]
  activity_level: ActivityLevel
  workout_frequency: number
  primary_goal: PrimaryGoal
}

export interface NutritionOnboardingInput {
  allergies: string[]
  dietary_style?: DietaryStyle
  dislikes?: string[]
  cuisines?: string[]
  meals_per_day?: number
  weight_kg?: number
  target_weight_kg?: number
}
