'use client'

import { useEffect } from 'react'
import { hideSplash } from '@/lib/platform/app'

export function SplashHider() {
  useEffect(() => {
    void hideSplash()
  }, [])
  return null
}
