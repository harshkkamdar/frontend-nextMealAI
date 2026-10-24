'use client'

import { Suspense } from 'react'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export default function NutritionOnboardingPage() {
  return (
    <Suspense>
      <OnboardingFlow module="nutrition" />
    </Suspense>
  )
}
