'use client'

import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/layout/bottom-nav'
import { GeoCompanionSheet } from '@/components/geo/geo-companion-sheet'
import { QuickLogSheet } from '@/components/shared/quick-log-sheet'
import { GeoScreenContextProvider } from '@/contexts/geo-screen-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideBottomPad = /^\/chat\/.+/.test(pathname) || /^\/activity\/workout\/.+/.test(pathname)

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
