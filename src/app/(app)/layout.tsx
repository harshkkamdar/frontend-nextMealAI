'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { accessToken, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.push('/login')
    }
  }, [accessToken, isLoading, router])

  if (!accessToken) {
    // Show loading state while checking auth
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-brand animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <main className="max-w-md mx-auto pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
