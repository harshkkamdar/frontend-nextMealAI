'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getOnboardingStatus } from '@/lib/api/profile.api'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboardingStore } from '@/stores/onboarding.store'

export function AuthGate({ children, mode }: { children: React.ReactNode; mode: 'app' | 'onboarding' }) {
  const router = useRouter()
  const pathname = usePathname()
  const accessToken = useAuthStore((state) => state.accessToken)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const status = useOnboardingStore((state) => state.status)
  const setStatus = useOnboardingStore((state) => state.setStatus)
  const statusRequestStarted = useRef(false)

  useEffect(() => {
    if (!hasHydrated) return
    if (!accessToken) {
      router.replace('/login')
      return
    }
    if (status !== 'unknown' || statusRequestStarted.current) return

    statusRequestStarted.current = true
    getOnboardingStatus()
      .then((result) => {
        const complete = result.personal.complete && result.fitness.complete && result.nutrition.complete
        setStatus(complete ? 'complete' : 'incomplete')
      })
      .catch(() => setStatus('complete'))
  }, [accessToken, hasHydrated, router, setStatus, status])

  useEffect(() => {
    if (!hasHydrated || !accessToken || status === 'unknown') return
    if (mode === 'app' && status === 'incomplete') {
      router.replace('/onboarding/personal')
      return
    }
    if (mode === 'onboarding' && status === 'complete' && !pathname.startsWith('/onboarding/generating') && !pathname.startsWith('/onboarding/review')) {
      router.replace('/dashboard')
    }
  }, [accessToken, hasHydrated, mode, pathname, router, status])

  if (!hasHydrated || !accessToken || status === 'unknown') return null
  if (mode === 'app' && status === 'incomplete') return null
  if (mode === 'onboarding' && status === 'complete' && !pathname.startsWith('/onboarding/generating') && !pathname.startsWith('/onboarding/review')) return null
  return children
}
