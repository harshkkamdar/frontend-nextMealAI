'use client'

import { useEffect, useRef } from 'react'
import { SWIPE_EDGE_PX, SWIPE_SLOP_PX, shouldCompleteSwipe } from '@/lib/motion'

/**
 * Left-edge swipe-back for the Aurora flow (welcome, sign-in, setup), the same gesture rules as the app's route frame
 * (edge, slop, projected release past half the width). The flow's screens step in depth, not by sliding, so the
 * release runs the screen's own back action (its depth step) instead of dragging the page with the finger.
 * shortcut: no live finger tracking (depth-nav animates frozen copies on release); add it if the owner asks for a drag.
 */
export function useEdgeSwipeBack(onBack?: () => void) {
  const back = useRef(onBack)
  useEffect(() => { back.current = onBack })
  const enabled = Boolean(onBack)

  useEffect(() => {
    if (!enabled) return
    let start: { x: number; y: number } | null = null
    let claimed = false
    let last = { x: 0, t: 0 }
    let velocity = 0

    const onStart = (e: TouchEvent) => {
      const p = e.touches[0]
      start = e.touches.length === 1 && p.clientX <= SWIPE_EDGE_PX ? { x: p.clientX, y: p.clientY } : null
      claimed = false
      velocity = 0
      if (start) last = { x: p.clientX, t: performance.now() }
    }
    const onMove = (e: TouchEvent) => {
      if (!start) return
      const p = e.touches[0]
      const dx = p.clientX - start.x
      const dy = p.clientY - start.y
      if (!claimed) {
        // Down (or left) first is a scroll, not a back swipe: let it go.
        if (Math.abs(dy) > SWIPE_SLOP_PX && Math.abs(dy) >= dx) { start = null; return }
        if (dx > SWIPE_SLOP_PX) claimed = true
      }
      const t = performance.now()
      if (t > last.t) velocity = ((p.clientX - last.x) / (t - last.t)) * 1000
      last = { x: p.clientX, t }
    }
    const onEnd = (e: TouchEvent) => {
      if (!start || !claimed) { start = null; return }
      const x = e.changedTouches[0]?.clientX ?? last.x
      const done = shouldCompleteSwipe(x - start.x, window.innerWidth, velocity)
      start = null
      if (done) back.current?.()
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    const onCancel = () => { start = null }
    window.addEventListener('touchcancel', onCancel)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onCancel)
    }
  }, [enabled])
}
