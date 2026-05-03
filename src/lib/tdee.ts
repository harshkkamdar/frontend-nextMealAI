/**
 * Frontend mirror of the backend TDEE formula in
 * `backend-nextMealAI/.../lib/tdee.ts`. Used for LIVE preview in the profile
 * form so users see how their daily targets shift as they change goal /
 * weight / height / activity, without having to tap Save first.
 *
 * IMPORTANT: keep this in sync with the backend. Both use Mifflin-St Jeor
 * BMR, the same activity multipliers, and the same goal modifiers scaled by
 * (current_weight - target_weight) delta. The backend remains authoritative
 * — this is just a UX preview.
 */

export interface ComputeTdeeInput {
  weightKg: number | null
  heightCm: number | null
  ageYears: number | null
  sex: string | null
  activityLevel: string | null
  primaryGoal: string | null
  targetWeightKg: number | null
}

export interface DailyTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  lightly_active: 1.375,
  moderate: 1.55,
  moderately_active: 1.55,
  active: 1.725,
  high: 1.725,
  very_active: 1.9,
}

export function computeAgeFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  if (age <= 0 || age > 120) return null
  return age
}

export function computeDailyTargets(input: ComputeTdeeInput): DailyTargets | null {
  const { weightKg, heightCm, ageYears, sex, activityLevel, primaryGoal, targetWeightKg } = input
  if (weightKg == null || heightCm == null || ageYears == null || !sex || !activityLevel) return null
  const s = sex === 'male' ? 5 : sex === 'female' ? -161 : -78
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + s
  const mult = ACTIVITY_MULTIPLIERS[activityLevel]
  if (!mult) return null
  let tdee = bmr * mult

  const delta = targetWeightKg != null ? Math.abs(weightKg - targetWeightKg) : null

  if (primaryGoal === 'fat_loss') {
    let m = 0.8
    if (delta != null) {
      if (delta < 3) m = 0.9
      else if (delta < 7) m = 0.85
      else if (delta > 15) m = 0.75
    }
    tdee *= m
  } else if (primaryGoal === 'muscle_gain') {
    let m = 1.1
    if (delta != null) {
      if (delta < 2) m = 1.05
      else if (delta > 10) m = 1.15
    }
    tdee *= m
  } else if (primaryGoal === 'body_recomposition') {
    tdee *= 0.95
  }

  const calories = Math.round(tdee / 50) * 50
  return {
    calories,
    protein: Math.round((calories * 0.25) / 4),
    carbs: Math.round((calories * 0.45) / 4),
    fat: Math.round((calories * 0.3) / 9),
  }
}
