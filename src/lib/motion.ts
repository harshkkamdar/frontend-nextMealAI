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
  /**
   * Spatial Depth push and pop (SPATIAL-BUILD, mocks/spatial-app.html): response 0.42 s, critically damped (zeta 1.0),
   * no overshoot, within 2 px of 390 by about 0.49 s. Animates progress 0..1.
   */
  push: { type: 'spring', stiffness: 224, damping: 30, mass: 1, restDelta: 0.001, restSpeed: 0.01 },
  /** The same spring after a flick release (zeta 0.82): the momentum earns a slight overshoot (WWDC18 803). */
  pushFlick: { type: 'spring', stiffness: 224, damping: 24.5, mass: 1, restDelta: 0.001, restSpeed: 0.01 },
  /** Tab switch depth crossfade (scale only; opacity uses the ease-out fades): critically damped, visibly done by ~0.17 s. */
  tab: { type: 'spring', stiffness: 500, damping: 45, mass: 1 },
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

/**
 * Spatial Depth geometry (SPATIAL-BUILD "Fixed system"). The page behind a push steps back: smaller, a little to the
 * left, under a light ink dim (no blur: an animated blur dropped frames). The page in front slides in from the right
 * edge, growing from 0.97 as it lands. A sheet drops and shrinks the screen behind it a little less.
 */
export const DEPTH = { behindScale: 0.94, behindShift: 0.04, behindDim: 0.1, frontScale: 0.97, sheetScale: 0.055, sheetDrop: 10 } as const

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * A push pair at progress p: 0 = the front page covers the screen, 1 = it is gone and the page behind is at rest.
 * x is a fraction of the width. Past the ends (a flick overshoot) only the page behind moves, so no gap opens.
 */
export function depthPair(p: number) {
  const f = clamp(p, 0, 1)
  const d = clamp(1 - p, -0.04, 1.05)
  return {
    front: { x: f, scale: 1 - (1 - DEPTH.frontScale) * f },
    behind: { x: -DEPTH.behindShift * d, scale: 1 - (1 - DEPTH.behindScale) * d, dim: DEPTH.behindDim * Math.max(0, d) },
  }
}

/** The screen behind a sheet at sheet progress s (0 closed, 1 open): y in px. */
export function sheetBehind(s: number) {
  const k = clamp(s, 0, 1.05)
  return { y: DEPTH.sheetDrop * k, scale: 1 - DEPTH.sheetScale * k }
}

/** Swipe-back: touches must start within this many px of the left edge. */
export const SWIPE_EDGE_PX = 20
/** Swipe-back: the finger must travel this far rightward (and more sideways than down) before the swipe is claimed. */
export const SWIPE_SLOP_PX = 8

/** Swipe-back release: where the page would come to rest with the flick's momentum (Apple projection) decides; half the width. */
export function shouldCompleteSwipe(dx: number, width: number, velocityPxPerS: number): boolean {
  return dx + project(velocityPxPerS) > width / 2
}

/** Press tilt: a press that travels further than this is a drag or a scroll, so the tilt lets go. */
export const TILT_SLOP_PX = 10

/**
 * Press tilt toward the finger (mocks/spatial-app.html): fx, fy are the finger's position across the card (0..1).
 * The pressed corner sinks; at a corner each axis turns max / 2 degrees.
 */
export function tiltFor(fx: number, fy: number, max: number) {
  return { rotateX: -(clamp(fy, 0, 1) - 0.5) * max, rotateY: (clamp(fx, 0, 1) - 0.5) * max }
}

/** Large title on scroll: drifts down at 0.2x, shrinks 3% and fades 55% over the first 110 px. */
export function titleDrift(scrollY: number) {
  const y = clamp(scrollY, 0, 110)
  const k = y / 110
  return { y: y * 0.2, scale: 1 - 0.03 * k, opacity: 1 - 0.55 * k }
}
