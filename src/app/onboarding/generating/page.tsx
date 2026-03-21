'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GeoAvatar } from '@/components/shared/geo-avatar'

export default function GeneratingPage() {
  const router = useRouter()

  useEffect(() => {
    document.cookie = 'nextmealai-onboarded=true; path=/; max-age=300'

    const timeout = setTimeout(() => {
      router.push('/dashboard')
    }, 3000)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <GeoAvatar state="thinking" size={64} />

      <p className="text-lg font-medium text-text-primary">
        Creating your personalized plan...
      </p>

      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0ms' }} />
        <span className="size-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '200ms' }} />
        <span className="size-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  )
}
