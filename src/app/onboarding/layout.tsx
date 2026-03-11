import type { ReactNode } from 'react'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-deep">
      <div className="max-w-md mx-auto min-h-screen md:max-w-4xl">
        {children}
      </div>
    </div>
  )
}
