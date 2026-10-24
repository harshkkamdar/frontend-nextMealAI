import type { Transition } from 'framer-motion'

/** FIQR v2 motion presets (docs/redesign/design-system.md "Motion"). Animate transform and opacity only. */
export const spring = {
  tap: { type: 'spring', stiffness: 500, damping: 35 },
  sheet: { type: 'spring', stiffness: 320, damping: 32 },
  page: { type: 'spring', stiffness: 260, damping: 30 },
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
