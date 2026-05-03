'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/layout/bottom-nav'
import { GeoCompanionSheet } from '@/components/geo/geo-companion-sheet'
import { QuickLogSheet } from '@/components/shared/quick-log-sheet'
import { GeoScreenContextProvider } from '@/contexts/geo-screen-context'
import { getProfile, updateProfile } from '@/lib/api/profile.api'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideBottomPad = /^\/chat\/.+/.test(pathname) || /^\/activity\/workout\/.+/.test(pathname)

  // FB-12: capture the browser's IANA timezone on first authenticated mount
  // so the backend can bucket logs onto the correct local calendar date.
  // Guarded with a ref so navigations between protected routes don't refire.
  const tzCapturedRef = useRef(false)
  useEffect(() => {
    if (tzCapturedRef.current) return
    tzCapturedRef.current = true
    ;(async () => {
      try {
        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (!detectedTz) return
        const profile = await getProfile()
        if (profile.timezone !== detectedTz) {
          await updateProfile({ timezone: detectedTz })
        }
      } catch {
        // Non-critical — silently swallow so the app shell still renders.
      }
    })()
  }, [])

  return (
    <GeoScreenContextProvider>
      <div className={`min-h-screen bg-background ${hideBottomPad ? '' : 'pb-20'}`}>
        {children}
        <BottomNav />
        <GeoCompanionSheet />
        <QuickLogSheet />
      </div>
    </GeoScreenContextProvider>
  )
}
