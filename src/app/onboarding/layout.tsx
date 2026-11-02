'use client'

import { AuthGate } from '@/components/auth/auth-gate'
import { CreamLayout } from '@/components/onboarding/cream-layout'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate mode="onboarding">
      <CreamLayout>{children}</CreamLayout>
    </AuthGate>
  )
}
