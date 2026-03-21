'use client'

import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/layout/bottom-nav'
import { QuickLogSheet } from '@/components/shared/quick-log-sheet'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isActiveChat = /^\/chat\/.+/.test(pathname)

  return (
    <div className={`min-h-screen bg-background ${isActiveChat ? '' : 'pb-20'}`}>
      {children}
      <BottomNav />
      <QuickLogSheet />
    </div>
  )
}
