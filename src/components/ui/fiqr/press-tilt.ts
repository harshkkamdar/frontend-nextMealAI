'use client'

import { useRef, type PointerEvent } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { TILT_SLOP_PX, spring, tiltFor } from '@/lib/motion'

/** Press in: 140 ms, a strong ease-out (Emil's ease-out quint), so the card answers the finger at once. */
const PRESS_IN = { duration: 0.14, ease: [0.23, 1, 0.32, 1] as const }

/**
 * Press tilt for cards (SPATIAL-BUILD "Press", mocks/spatial-app.html): while pressed the card tilts toward the finger
 * and sinks a little; on release it springs back. A press that travels past 10 px is a scroll or drag, so the tilt lets
 * go. Off under reduced motion. `max` is the tilt at full deflection: about 2.5 deg for cards, 5 for tiles.
 * Spread the result on the element, and leave its own transform transition off (the tilt writes `transform`).
 */
export function usePressTilt<T extends HTMLElement>(max = 2.5) {
  const reduce = useReducedMotion()
  const ref = useRef<T>(null)
  const press = useRef<{ x0: number; y0: number; rect: DOMRect } | null>(null)

  const lean = (e: PointerEvent<T>) => {
    const p = press.current
    if (!p || !ref.current || !p.rect.width || !p.rect.height) return
    const { rotateX, rotateY } = tiltFor((e.clientX - p.rect.left) / p.rect.width, (e.clientY - p.rect.top) / p.rect.height, max)
    animate(ref.current, { rotateX, rotateY, scale: 0.985, transformPerspective: 700 }, PRESS_IN)
  }
  const release = () => {
    if (!press.current || !ref.current) return
    press.current = null
    animate(ref.current, { rotateX: 0, rotateY: 0, scale: 1 }, spring.tap)
  }

  return {
    ref,
    onPointerDown: (e: PointerEvent<T>) => {
      if (reduce || !ref.current || (e.pointerType === 'mouse' && e.button !== 0)) return
      // Measured once per press, never during it.
      press.current = { x0: e.clientX, y0: e.clientY, rect: ref.current.getBoundingClientRect() }
      lean(e)
    },
    onPointerMove: (e: PointerEvent<T>) => {
      const p = press.current
      if (!p) return
      if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > TILT_SLOP_PX) release()
      else lean(e)
    },
    onPointerUp: release,
    onPointerCancel: release,
    onPointerLeave: release,
  }
}
