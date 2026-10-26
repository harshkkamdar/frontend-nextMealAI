'use client'

import { AuthGate } from '@/components/auth/auth-gate'
import { AuroraLayout } from '@/components/onboarding/aurora'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate mode="onboarding">
      <AuroraLayout>{children}</AuroraLayout>
    </AuthGate>
  )
}
