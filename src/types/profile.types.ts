export type Sex = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'light' | 'lightly_active' | 'moderate' | 'moderately_active' | 'active' | 'very_active'
export type PrimaryGoal = 'fat_loss' | 'muscle_gain' | 'maintenance' | 'body_recomposition' | 'improve_health' | 'athletic_performance'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type DietaryStyle = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'halal' | 'kosher'

export interface Profile {
  id: string
  user_id: string
  full_name?: string
  dob?: string
  sex?: Sex
  height_cm?: number
  current_weight_kg?: number
  target_weight_kg?: number
  activity_level?: ActivityLevel
  primary_goal?: PrimaryGoal
  dietary_style?: DietaryStyle
  experience_level?: ExperienceLevel
  equipment?: string[]
  injuries?: string[]
  allergies?: string[]
  disliked_foods?: string[]
  preferred_cuisines?: string[]
  meals_per_day?: number
  workout_frequency?: number
  onboarding_personal_complete?: boolean
  onboarding_fitness_complete?: boolean
  onboarding_nutrition_complete?: boolean
  created_at: string
  updated_at: string
}

export interface OnboardingStatus {
  personal: { complete: boolean; completed_at: string | null }
  fitness: { complete: boolean; completed_at: string | null }
  nutrition: { complete: boolean; completed_at: string | null }
}

export function canUseApp(status: OnboardingStatus): boolean {
  return status.personal.complete && status.fitness.complete && status.nutrition.complete
}

export interface PersonalOnboardingInput {
  name: string
  dob: string
  sex: Sex
  height_cm: number
}

export interface FitnessOnboardingInput {
  equipment: string[]
  injuries: string[]
  experience_level?: ExperienceLevel
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
