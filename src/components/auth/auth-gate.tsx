'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getOnboardingStatus, getProfile } from '@/lib/api/profile.api'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboardingStore } from '@/stores/onboarding.store'

export function AuthGate({ children, mode }: { children: React.ReactNode; mode: 'app' | 'onboarding' }) {
  const router = useRouter()
  const pathname = usePathname()
  const accessToken = useAuthStore((state) => state.accessToken)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const status = useOnboardingStore((state) => state.status)
  const setStatus = useOnboardingStore((state) => state.setStatus)
  const consent = useOnboardingStore((state) => state.consent)
  const setConsent = useOnboardingStore((state) => state.setConsent)
  const statusRequestStarted = useRef(false)
  const profileRequestStarted = useRef(false)
  const isConsentPath = pathname.startsWith('/onboarding/consent')

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
    if (!hasHydrated || !accessToken || status !== 'complete') return
    if (consent !== 'unknown' || profileRequestStarted.current) return

    profileRequestStarted.current = true
    getProfile()
      .then((profile) => {
        const consentFields = profile as typeof profile & {
          ai_consent_at?: string | null
          health_disclaimer_ack_at?: string | null
        }
        setConsent(Boolean(consentFields.ai_consent_at && consentFields.health_disclaimer_ack_at))
      })
      .catch(() => setConsent(false))
  }, [accessToken, consent, hasHydrated, setConsent, status])

  useEffect(() => {
    if (!hasHydrated || !accessToken || status === 'unknown') return
    if (mode === 'app' && status === 'incomplete') {
      router.replace('/onboarding/personal')
      return
    }
    if (mode === 'app' && status === 'complete' && consent === 'missing') {
      router.replace('/onboarding/consent')
      return
    }
    if (mode === 'onboarding' && status === 'complete' && consent === 'given' && !isConsentPath && !pathname.startsWith('/onboarding/generating') && !pathname.startsWith('/onboarding/review')) {
      router.replace('/dashboard')
    }
  }, [accessToken, consent, hasHydrated, isConsentPath, mode, pathname, router, status])

  if (!hasHydrated || !accessToken) return null
  if (isConsentPath) return children
  if (status === 'unknown') return null
  if (mode === 'app' && status === 'incomplete') return null
  if (status === 'complete' && consent === 'unknown') return null
  if (mode === 'app' && status === 'complete' && consent === 'missing') return null
  if (mode === 'onboarding' && status === 'complete' && consent === 'given' && !pathname.startsWith('/onboarding/generating') && !pathname.startsWith('/onboarding/review')) return null
  return children
}
