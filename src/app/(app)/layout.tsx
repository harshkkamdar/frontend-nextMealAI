'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { TabBar, hidesTabBar } from '@/components/layout/tab-bar'
import { LogSheet } from '@/components/layout/log-sheet'
import { RouteFrame } from '@/components/layout/route-frame'
import { LayoutGroup } from 'framer-motion'
import { GeoCompanionSheet } from '@/components/geo/geo-companion-sheet'
import { AuthGate } from '@/components/auth/auth-gate'
import { GeoScreenContextProvider } from '@/contexts/geo-screen-context'
import { getProfile, updateProfile } from '@/lib/api/profile.api'
import { NotificationsPrompt } from '@/components/native/notifications-prompt'
import { initNativeShell } from '@/lib/platform/app'
import { syncHealth } from '@/lib/platform/health'
import { registerPush, unregisterPush } from '@/lib/platform/notifications'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const hideBottomPad = hidesTabBar(pathname)

  useEffect(() => {
    const cleanupNativeShell = initNativeShell({
      onBack: () => {
        if (useUIStore.getState().activeSheet) {
          useUIStore.getState().closeSheet()
          return true
        }
        return false
      },
      onResume: () => { void syncHealth() },
      onUrl: (url) => {
        if (url.pathname === '/reset-password' || url.hash.includes('access_token')) {
          router.replace('/reset-password' + url.search + url.hash)
        }
      },
    })

    const handleNotificationsChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled: boolean }>).detail
      if (detail?.enabled) void registerPush()
      else void unregisterPush()
    }
    window.addEventListener('fiqr:notifications-changed', handleNotificationsChanged)

    return () => {
      cleanupNativeShell()
      window.removeEventListener('fiqr:notifications-changed', handleNotificationsChanged)
    }
  }, [router])

  useEffect(() => { void syncHealth() }, [])

  // FB-12: capture the browser's IANA timezone on first authenticated mount
  // so the backend can bucket logs onto the correct local calendar date.
  // Guarded with a ref so navigations between protected routes don't refire.
  // Waits for the stored session: on native it loads asynchronously, and an early profile read would 401 and log the user out.
  const sessionReady = useAuthStore((state) => state.hasHydrated && Boolean(state.accessToken))
  const tzCapturedRef = useRef(false)
  useEffect(() => {
    if (!sessionReady || tzCapturedRef.current) return
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
  }, [sessionReady])

  return (
    <AuthGate mode="app">
      <GeoScreenContextProvider>
        <div className={`min-h-screen overflow-x-clip bg-background ${hideBottomPad ? '' : 'pb-[var(--tabbar-clearance)]'}`}>
          <RouteFrame>{children}</RouteFrame>
          <LayoutGroup>
            <TabBar />
            <LogSheet />
          </LayoutGroup>
          <GeoCompanionSheet />
          <NotificationsPrompt />
        </div>
      </GeoScreenContextProvider>
    </AuthGate>
  )
}
