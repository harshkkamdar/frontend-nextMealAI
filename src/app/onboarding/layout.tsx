'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { AuthGate } from '@/components/auth/auth-gate'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate mode="onboarding">
      <div className="min-h-screen bg-background">
        <PageWrapper>{children}</PageWrapper>
      </div>
    </AuthGate>
  )
}
