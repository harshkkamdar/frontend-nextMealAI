'use client'

import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { titleDrift } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * Calls `onFrame(scrollY)` at most once per frame while the window scrolls (passive listener, rAF-throttled), and once
 * on mount. Skipped while the element sits in a page that is not the live one (route frame layers are inert).
 */
function useScrollFrame(el: RefObject<HTMLElement | null>, onFrame: (y: number) => void, enabled: boolean) {
  const cb = useRef(onFrame)
  useEffect(() => { cb.current = onFrame })
  useEffect(() => {
    if (!enabled) return
    let raf = 0
    const tick = () => { raf = 0; if (el.current && !el.current.closest('[inert]')) cb.current(window.scrollY) }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick) }
    tick()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [el, enabled])
}

/**
 * Large title drift (SPATIAL-BUILD "Press"/drift, spatial mock): as the page scrolls, the title block drifts down at
 * 0.2x, shrinks 3% and fades 55% over the first 110 px. Transform and opacity only, written straight to the element
 * (no React render per frame). Off under reduced motion. Spread the returned ref on the title block.
 */
export function useTitleDrift<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const reduce = useReducedMotion()
  useScrollFrame(ref, (y) => {
    const el = ref.current
    if (!el) return
    const d = titleDrift(y)
    el.style.transform = d.y ? `translate3d(0,${d.y.toFixed(2)}px,0) scale(${d.scale.toFixed(4)})` : ''
    el.style.opacity = d.y ? d.opacity.toFixed(3) : ''
    el.style.transformOrigin = '0 0'
  }, !reduce)
  return ref
}

/**
 * Optional background depth layer: a fixed, non-interactive layer behind the content that drifts up at `speed` of the
 * scroll (0.05 for the far layer, 0.16 for the near one), smoothed by a short critically damped spring (response 0.3 s).
 * Decoration only: give it Q2 tints, keep it behind the content (the page's content sits on a higher z).
 */
export function DriftLayer({ speed, className, children }: { speed: 0.05 | 0.16; className?: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const target = useMotionValue(0)
  const y = useSpring(target, { stiffness: 438, damping: 42 })
  useScrollFrame(ref, (scroll) => target.set(-scroll * speed), !reduce)
  return <motion.div ref={ref} aria-hidden="true" style={{ y }} className={cn('pointer-events-none fixed inset-0', className)}>{children}</motion.div>
}
