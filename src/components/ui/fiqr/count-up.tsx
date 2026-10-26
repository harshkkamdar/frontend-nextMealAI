'use client'

import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { COUNT_UP_MS } from '@/lib/motion'

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

/**
 * A number that counts to `value` on a motion value (motion-feel 3f): no React render per frame, starts from the
 * last value shown when data refreshes, tabular figures so its width never jumps. Reduced motion shows it at once.
 */
export function CountUp({ value, format = fmt, delay = 0.12, still = false }: { value: number; format?: (n: number) => string; delay?: number; /** Paint at rest (revisit): no count. */ still?: boolean }) {
  const reduce = useReducedMotion() || still
  const mv = useMotionValue(reduce ? value : 0)
  const text = useTransform(mv, format)
  const started = useRef(false)
  useEffect(() => {
    if (reduce) { mv.set(value); return }
    const controls = animate(mv, value, { duration: COUNT_UP_MS / 1000, ease: [0.33, 1, 0.68, 1], delay: started.current ? 0 : delay })
    started.current = true
    return () => controls.stop()
  }, [value, reduce, mv, delay])
  return <motion.span className="tabular-nums">{text}</motion.span>
}
