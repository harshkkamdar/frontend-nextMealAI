'use client'

import { Suspense } from 'react'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export default function FitnessOnboardingPage() {
  return (
    <Suspense>
      <OnboardingFlow module="fitness" />
    </Suspense>
  )
}
