'use client'

import { useEffect } from 'react'
import { hideSplash } from '@/lib/platform/app'
import { applyGlassMode } from '@/lib/platform/glass'

export function SplashHider() {
  useEffect(() => {
    applyGlassMode()
    void hideSplash()
  }, [])
  return null
}
