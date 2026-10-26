'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { reducedFade, spring } from '@/lib/motion'

/** Resolves a CSS length (custom properties and env() included) to pixels. */
function cssLengthPx(length: string): number {
  const probe = document.createElement('div')
  probe.style.height = length
  document.body.appendChild(probe)
  const px = probe.offsetHeight
  probe.remove()
  return px
}

// Apple/Emil projection (motion-feel.md 3): where a flick would come to rest, px. Velocity in px/s.
const project = (v: number, rate = 0.998) => ((v / 1000) * rate) / (1 - rate)

export interface ResizableSheetProps {
  open: boolean
  onClose: () => void
  /**
   * Snap heights as fractions of the screen above the sheet's 8 pt inset, least to most visible
   * (e.g. [0.4, 0.7, 0.94]). Drag the handle to resize; on release the sheet settles on the level a flick
   * would reach. Dragging below the smallest dismisses.
   */
  levels?: number[]
  /** Which level to open at (index into `levels`). Default 0. */
  defaultLevelIndex?: number
  ariaLabel?: string
  children: ReactNode
}

/**
 * Draggable, snap-to-levels inset sheet: the FIQR v2 inset look of `BottomSheet` (8 pt in from the edges,
 * 38 pt corners, glass-cream, over the tab bar) with resizable height.
 *
 * Height is the resized quantity, so a pinned footer (food search's "Log food", the companion composer) always
 * sits at the sheet's bottom edge. The height follows the finger 1:1 while dragging; it is never animated.
 * On release the new height is committed at once and the sheet glides the difference on `translateY` with the
 * release velocity (a FLIP), so every settle, open and close is transform-only (motion-feel.md 3d, M11).
 */
export function ResizableSheet({
  open,
  onClose,
  levels = [0.5, 0.92],
  defaultLevelIndex = 0,
  ariaLabel,
  children,
}: ResizableSheetProps) {
  const reduce = useReducedMotion()
  const [render, setRender] = useState(false)
  const height = useMotionValue(0)
  const y = useMotionValue(0)
  const fade = useMotionValue(0)
  // The dim follows the sheet: full while it rests, clearing as it travels off screen (vaul's behaviour).
  const travel = useTransform(() => Math.min(1, Math.max(0, 1 - y.get() / Math.max(1, height.get()))))
  const dim = useTransform(() => (reduce ? fade.get() : travel.get()))
  const drag = useRef<{ startY: number; startH: number; lastY: number; lastT: number; v: number } | null>(null)
  const closing = useRef(false)
  const mounted = useRef(false)

  const avail = useCallback(
    // The tallest level stops below the status bar, so the sheet never sits under the clock.
    () => window.innerHeight - cssLengthPx('var(--nav-clearance)') - cssLengthPx('var(--safe-top)'),
    [],
  )
  const levelsPx = useCallback(() => {
    const a = avail()
    return levels.map((f) => Math.round(f * a))
  }, [levels, avail])

  // Mount at the start position: below the screen (or transparent, reduced motion).
  useEffect(() => {
    if (!open) return
    closing.current = false
    const h = levelsPx()[defaultLevelIndex] ?? levelsPx()[0]
    height.set(h)
    if (reduce) {
      y.set(0)
      fade.set(0)
    } else if (!mounted.current) {
      // Reopened mid-close: reverse from where it is instead of jumping back below the screen.
      // jump, not set: a set from 0 left a huge downward velocity, so the spring first dived ~430 px below the start.
      y.jump(h + 48)
    }
    mounted.current = true
    setRender(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs per open
  }, [open])

  // Then slide up on the sheet spring, started only once the sheet has committed. Started next to setRender, the
  // spring sometimes ran a frame or two before the first paint, so the sheet appeared already ~150 px up.
  useEffect(() => {
    if (!open || !render) return
    const c = reduce ? animate(fade, 1, reducedFade) : animate(y, 0, spring.sheet)
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs per open, once mounted
  }, [open, render])

  // Slide out (or fade, reduced motion), then unmount.
  useEffect(() => {
    if (open || !render) return
    const done = () => { mounted.current = false; setRender(false) }
    const c = reduce
      ? animate(fade, 0, { ...reducedFade, onComplete: done })
      : animate(y, height.get() + 48, { ...spring.sheet, velocity: drag.current?.v ?? 0, onComplete: done })
    drag.current = null
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs per close
  }, [open])

  useEffect(() => {
    if (!render) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [render, onClose])

  const onPointerDown = (e: ReactPointerEvent) => {
    // Grab mid-settle: fold the live offset into the height so nothing jumps (interruptible, N11).
    y.stop()
    const visible = height.get() - y.get()
    height.set(visible)
    y.set(0)
    drag.current = { startY: e.clientY, startH: visible, lastY: e.clientY, lastT: e.timeStamp, v: 0 }
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* noop */ }
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    const dt = e.timeStamp - d.lastT
    if (dt > 0) d.v = ((e.clientY - d.lastY) / dt) * 1000 // px/s, positive = downwards
    d.lastY = e.clientY
    d.lastT = e.timeStamp
    // Motion value, not state: the height tracks the finger without a React render per move.
    height.set(Math.max(40, Math.min(d.startH + d.startY - e.clientY, Math.round(0.96 * avail()))))
  }
  const endDrag = () => {
    const d = drag.current
    if (!d || closing.current) return
    const h = height.get()
    const pts = levelsPx()
    const landing = h - project(d.v)
    if (landing < pts[0] * 0.55) {
      closing.current = true
      onClose()
      return
    }
    const target = pts.reduce((a, b) => (Math.abs(b - landing) < Math.abs(a - landing) ? b : a), pts[0])
    drag.current = null
    // FLIP: commit the level's height, start the top edge where the finger left it, glide home.
    height.set(target)
    y.set(target - h)
    animate(y, 0, reduce ? { duration: 0 } : { ...spring.sheet, velocity: d.v })
  }

  if (!render) return null

  return (
    <div className="fixed inset-0 z-[60]">
      {/* The dim covers everything, the tab bar included (it sits at z 50). */}
      <motion.div onClick={onClose} style={{ opacity: dim }} className="absolute inset-0 bg-ink/30" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        style={{ height, y, opacity: reduce ? fade : 1 }}
        className="glass-cream absolute inset-x-2 bottom-[var(--nav-clearance)] z-[70] mx-auto flex max-w-[calc(28rem-16px)] flex-col overflow-hidden rounded-[38px]"
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex h-6 shrink-0 cursor-grab touch-none items-start justify-center pt-2.5 active:cursor-grabbing"
          aria-hidden="true"
        >
          <div className="h-[5px] w-9 rounded-full bg-ink-20" />
        </div>
        {children}
      </motion.div>
    </div>
  )
}
