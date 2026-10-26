import { AuroraLayout } from '@/components/onboarding/aurora'

/** Welcome, sign-in and password screens share one Aurora, so it drifts from screen to screen instead of restarting. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuroraLayout>{children}</AuroraLayout>
}
