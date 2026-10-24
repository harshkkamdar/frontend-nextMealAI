import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ActivityLevel, DietaryStyle, ExperienceLevel, PrimaryGoal, Sex } from '@/types/profile.types'

/** Answers collected one screen at a time, kept across reloads until each module is posted. */
export interface OnboardingDraft {
  name: string
  sex: Sex | null
  dob: string
  heightCm: number | null
  goal: PrimaryGoal | null
  activity: ActivityLevel | null
  frequency: number | null
  experience: ExperienceLevel | null
  equipment: string[]
  injuries: string[]
  weightKg: number | null
  targetKg: number | null
  allergies: string[]
  diet: DietaryStyle | null
  dislikes: string[]
  cuisines: string[]
  meals: number | null
}

const EMPTY: OnboardingDraft = {
  name: '', sex: null, dob: '', heightCm: null,
  goal: null, activity: null, frequency: null, experience: null, equipment: [], injuries: [],
  weightKg: null, targetKg: null, allergies: [], diet: null, dislikes: [], cuisines: [], meals: null,
}

interface DraftState extends OnboardingDraft {
  set: (patch: Partial<OnboardingDraft>) => void
  reset: () => void
}

export const useOnboardingDraft = create<DraftState>()(
  persist(
    (set) => ({ ...EMPTY, set: (patch) => set(patch), reset: () => set(EMPTY) }),
    { name: 'fiqr-onboarding-draft', storage: createJSONStorage(() => localStorage) },
  ),
)
