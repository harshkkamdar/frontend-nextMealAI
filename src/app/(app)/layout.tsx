'use client'

import { BottomNav } from '@/components/layout/bottom-nav'
import { QuickLogSheet } from '@/components/shared/quick-log-sheet'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <BottomNav />
      <QuickLogSheet />
    </div>
  )
}
