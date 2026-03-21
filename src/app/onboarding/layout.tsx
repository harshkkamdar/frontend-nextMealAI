import { PageWrapper } from '@/components/layout/page-wrapper'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PageWrapper>{children}</PageWrapper>
    </div>
  )
}
