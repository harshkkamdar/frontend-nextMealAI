export type Sex = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'
export type PrimaryGoal = 'fat_loss' | 'muscle_gain' | 'maintenance' | 'body_recomposition'
export type DietaryStyle = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'halal' | 'kosher'

export interface Profile {
  id: string
  user_id: string
  full_name?: string       // NOT 'name'
  dob?: string
  sex?: Sex
  height_cm?: number
  current_weight_kg?: number   // NOT 'weight_kg'
  target_weight_kg?: number
  activity_level?: ActivityLevel
  primary_goal?: PrimaryGoal
  dietary_style?: DietaryStyle
  equipment?: string[]
  injuries?: string[]
  allergies?: string[]
  disliked_foods?: string[]    // NOT 'dislikes'
  preferred_cuisines?: string[]  // NOT 'cuisines'
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

// Helper to derive can_use_app from onboarding status
export function canUseApp(status: OnboardingStatus): boolean {
  return status.personal.complete && status.fitness.complete && status.nutrition.complete
}

export interface PersonalOnboardingInput {
  name: string
  dob: string
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
