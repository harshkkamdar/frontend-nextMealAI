import { useEffect, useRef, useSyncExternalStore } from 'react'
import { animate, motionValue, useMotionValue, type MotionValue, type Transition } from 'framer-motion'
import { spring } from '@/lib/motion'

/**
 * Sheet depth (SPATIAL-BUILD "Sheets"): every open sheet holds its progress here (0 closed, 1 open), and the route
 * frame is the one writer that steps the screen behind back by the deepest of them. Sheets never touch the page.
 */
const held = new Set<MotionValue<number>>()
const stops = new Map<MotionValue<number>, () => void>()
const listeners = new Set<() => void>()

/** The deepest open sheet's progress, clamped to 0..1.05 (a flick may overshoot a little). */
export const sheetDepth = motionValue(0)

function recompute() {
  let d = 0
  held.forEach((p) => { d = Math.max(d, p.get()) })
  sheetDepth.set(Math.min(1.05, Math.max(0, d)))
}

/** Starts counting `progress` toward the depth. Idempotent. */
export function holdSheetDepth(progress: MotionValue<number>) {
  if (held.has(progress)) return
  held.add(progress)
  stops.set(progress, progress.on('change', recompute))
  recompute()
  listeners.forEach((l) => l())
}

/** Stops counting `progress`; once nothing is held the screen behind goes back to the page. Idempotent. */
export function releaseSheetDepth(progress: MotionValue<number>) {
  if (!held.delete(progress)) return
  stops.get(progress)?.()
  stops.delete(progress)
  recompute()
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
const anyHeld = () => held.size > 0

/** True while any sheet is open or still closing. */
export function useSheetHeld(): boolean {
  return useSyncExternalStore(subscribe, anyHeld, () => false)
}

/**
 * A sheet's progress for the depth: springs to 1 on open and to 0 on close, held from the open until the close lands.
 * `drag(p)` follows a finger (stops the spring); `settle(open, velocity)` hands the release velocity (progress/s) back to the spring.
 */
export function useSheetDepth(open: boolean, transition: Transition = spring.sheet) {
  const progress = useMotionValue(0)
  const openRef = useRef(open)
  useEffect(() => {
    openRef.current = open
    if (!open && progress.get() === 0) return
    if (open) holdSheetDepth(progress)
    const c = animate(progress, open ? 1 : 0, { ...transition, onComplete: () => { if (!openRef.current) releaseSheetDepth(progress) } })
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs per open change; the transition is a constant per sheet
  }, [open])
  useEffect(() => () => releaseSheetDepth(progress), [progress])
  return {
    progress,
    drag: (p: number) => { progress.stop(); progress.set(p) },
    settle: (toOpen: boolean, velocity = 0) => {
      animate(progress, toOpen ? 1 : 0, { ...transition, velocity, onComplete: () => { if (!openRef.current) releaseSheetDepth(progress) } })
    },
  }
}
