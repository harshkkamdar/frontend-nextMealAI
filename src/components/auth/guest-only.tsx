'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Guest screens (welcome, sign-in, sign-up, password). Signed in when the screen opened: go to the app. Signed in on
 * this screen (sign-in or sign-up just succeeded): the form leads the way out with its own transition, so the screen
 * stays up until it has left instead of vanishing the moment the token lands.
 */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const accessToken = useAuthStore((state) => state.accessToken)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [openedAsGuest, setOpenedAsGuest] = useState(false)

  useEffect(() => {
    if (!hasHydrated) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- records a one-time fact about how the screen opened
    if (!accessToken) setOpenedAsGuest(true)
    else if (!openedAsGuest) router.replace('/dashboard')
  }, [accessToken, hasHydrated, openedAsGuest, router])

  if (!hasHydrated || (accessToken && !openedAsGuest)) return null
  return children
}
