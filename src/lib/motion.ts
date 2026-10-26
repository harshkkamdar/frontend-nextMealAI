import type { Transition } from 'framer-motion'

/** FIQR v2 motion presets (docs/redesign/design-system.md "Motion"). Animate transform and opacity only. */
export const spring = {
  tap: { type: 'spring', stiffness: 500, damping: 35 },
  sheet: { type: 'spring', stiffness: 320, damping: 32 },
  page: { type: 'spring', stiffness: 260, damping: 30 },
  /** Critically damped: stage scrub settle, repositioning, list entrance (motion-feel.md). */
  glide: { type: 'spring', stiffness: 300, damping: 35, mass: 1 },
  /** Small earned overshoot (~0.15 bounce): tab lens, orb morph. */
  lens: { type: 'spring', stiffness: 380, damping: 33, mass: 1 },
  /** iOS navigation push and pop: critically damped (zeta 1.0), no overshoot, ~0.42 s to within 2 px. Animates progress 0..1. */
  push: { type: 'spring', stiffness: 320, damping: 36, mass: 1, restDelta: 0.001, restSpeed: 0.01 },
} as const satisfies Record<string, Transition>

/** Reduced motion: every preset becomes a short fade. */
export const reducedFade: Transition = { duration: 0.15, ease: 'linear' }

export const COUNT_UP_MS = 900
export const DRAW_MS = 700

/** Ease-out cubic, used for count-ups and chart draw-in. */
export function easeOutCubic(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return 1 - (1 - c) ** 3
}

/** Apple/Emil projection: where a flick would come to rest (px). rate .998 = iOS normal scroll deceleration. */
export const project = (vPxPerS: number, rate = 0.998) => ((vPxPerS / 1000) * rate) / (1 - rate)

/** iOS rubber band: resistance grows with overshoot; c = .55. */
export const rubberband = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over))

/** Native push geometry (motion-feel 3c): the covered page parallaxes to -30% and dims to ink 8%. */
export const PUSH_PARALLAX = 0.3
export const PUSH_DIM = 0.08
/** Swipe-back: touches must start within this many px of the left edge. */
export const SWIPE_EDGE_PX = 20
/** Swipe-back: the finger must travel this far rightward (and more sideways than down) before the swipe is claimed. */
export const SWIPE_SLOP_PX = 8

/** Swipe-back release: a clear flick decides by direction, otherwise the page must be past 35% of the width. */
export function shouldCompleteSwipe(dx: number, width: number, velocityPxPerS: number): boolean {
  if (velocityPxPerS > 300) return true
  if (velocityPxPerS < -300) return false
  return dx / width > 0.35
}
