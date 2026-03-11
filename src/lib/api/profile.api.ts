import { apiFetch } from './client'
import type { Profile, OnboardingStatus, PersonalOnboardingInput, FitnessOnboardingInput, NutritionOnboardingInput } from '@/types/profile.types'

export async function getProfile(): Promise<Profile> {
  return apiFetch<Profile>('/v1/profile')
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile> {
  return apiFetch<Profile>('/v1/profile', { method: 'PUT', body: data })
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  return apiFetch<OnboardingStatus>('/v1/profile/onboarding')
}

export async function submitPersonalOnboarding(data: PersonalOnboardingInput): Promise<void> {
  return apiFetch<void>('/v1/profile/onboarding/personal', { method: 'POST', body: data })
}

export async function submitFitnessOnboarding(data: FitnessOnboardingInput): Promise<void> {
  return apiFetch<void>('/v1/profile/onboarding/fitness', { method: 'POST', body: data })
}

export async function submitNutritionOnboarding(data: NutritionOnboardingInput): Promise<void> {
  return apiFetch<void>('/v1/profile/onboarding/nutrition', { method: 'POST', body: data })
}
