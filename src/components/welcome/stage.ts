// Welcome beat physics (docs/redesign/motion-feel.md 3a; depth per mocks/aurora-onboarding.html).
import { project, rubberband } from '@/lib/motion'

/** Stage position while the finger is down: 1:1 inside [0, last], rubber band past either end. */
export function scrub(start: number, dx: number, w: number, last: number): number {
  const next = start - dx / w
  if (next < 0) return -rubberband(-next * w, w) / w
  if (next > last) return last + rubberband((next - last) * w, w) / w
  return next
}

/** Slide to settle on after release: project the flick's momentum, then allow at most one slide from where the drag began. */
export function flickTarget(p: number, start: number, vx: number, w: number, last: number): number {
  const from = Math.round(start)
  const landing = Math.round(p - project(vx) / w)
  return Math.max(0, from - 1, Math.min(last, from + 1, landing))
}

/** A beat at depth distance d (p - i): d > 0 has stepped back (smaller, drifting up), d < 0 is arriving from in front
 *  (larger, drifting down into place), as in mocks/aurora-onboarding.html. Opacity clears by about 0.6 of the way, so
 *  the outgoing beat is nearly gone before the incoming one fills. Reduced motion: opacity only. */
export function beatDepth(d: number, reduce = false): { opacity: number; scale: number; y: number } {
  const a = Math.abs(d)
  const opacity = Math.max(0, 1 - a * (reduce ? 1 : 1.7))
  if (reduce) return { opacity, scale: 1, y: 0 }
  return d >= 0 ? { opacity, scale: 1 - 0.07 * d, y: d ? -7 * d : 0 } : { opacity, scale: 1 + 0.05 * a, y: 13 * a }
}

/** The tallest beat visual's natural height (Food, measured at 375 x 667): below it a visual would clip. */
export const VISUAL_MIN_H = 284

/** Scale for a visual on a stage with `avail` px of content height: 1 where it fits, smaller on short phones. */
export function fitScale(avail: number, natural = VISUAL_MIN_H): number {
  return avail > 0 && avail < natural ? avail / natural : 1
}
