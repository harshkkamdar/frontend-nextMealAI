'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { generatePlans } from '@/lib/api/plans.api'

export default function GeneratingPage() {
  const router = useRouter()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    async function generate() {
      try {
        await generatePlans()
      } catch {
        // Plan generation failed — user can retry from review page or ask Geo
      } finally {
        router.push('/onboarding/review')
      }
    }

    generate()
  }, [router])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <GeoAvatar state="thinking" size={64} />

      <p className="text-lg font-medium text-text-primary">
        Creating your personalised plan...
      </p>

      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0ms' }} />
        <span className="size-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '200ms' }} />
        <span className="size-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '400ms' }} />
      </div>

      <p className="text-sm text-text-secondary text-center max-w-xs">
        Geo is calculating your calories, macros, and building your training program
      </p>
    </div>
  )
}
