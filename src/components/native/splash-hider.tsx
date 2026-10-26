'use client'

import { useEffect } from 'react'
import { hideSplash } from '@/lib/platform/app'
import { applyGlassMode } from '@/lib/platform/glass'

export function SplashHider() {
  useEffect(() => {
    applyGlassMode()
    void hideSplash()
    // The system Reduce Transparency setting can change while the app is open.
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-transparency: reduce)') : null
    const onChange = () => applyGlassMode()
    mq?.addEventListener?.('change', onChange)
    return () => mq?.removeEventListener?.('change', onChange)
  }, [])
  return null
}
