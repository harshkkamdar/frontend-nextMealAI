'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { COUNT_UP_MS, easeOutCubic } from '@/lib/motion'

/** Counts from 0 to `target` once on mount (or when target first becomes known). Reduced motion shows the value at once. */
export function useCountUp(target: number | null | undefined, ms = COUNT_UP_MS): number {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target == null || reduce) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      setValue(Math.round(target * easeOutCubic(t)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms, reduce])

  return target == null ? 0 : reduce ? target : value
}
