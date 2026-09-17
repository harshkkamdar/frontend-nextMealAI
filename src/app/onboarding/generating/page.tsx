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
      <GeoAvatar variant="face" state="thinking" size={64} />

      <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">
        Building your plan…
      </h1>

      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0ms' }} />
        <span className="size-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '200ms' }} />
        <span className="size-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '400ms' }} />
      </div>

      <p className="max-w-xs text-center text-[15.5px] text-ink-60">
        Geo is working out your calories, macros and training days.
      </p>
    </div>
  )
}
