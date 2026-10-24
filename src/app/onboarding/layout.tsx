'use client'

import { AuthGate } from '@/components/auth/auth-gate'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate mode="onboarding">
      <div className="min-h-dvh bg-cream">{children}</div>
    </AuthGate>
  )
}
