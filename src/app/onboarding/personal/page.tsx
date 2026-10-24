'use client'

import { Suspense } from 'react'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export default function PersonalOnboardingPage() {
  return (
    <Suspense>
      <OnboardingFlow module="personal" />
    </Suspense>
  )
}
