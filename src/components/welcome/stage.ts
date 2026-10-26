// Welcome stage physics (docs/redesign/motion-feel.md 3a). `project` and `rubberband` belong in src/lib/motion.ts per the
// spec; they live here until that shared file can take them.

/** Where a flick would come to rest, in px. rate .998 = iOS normal scroll deceleration. */
export const project = (vPxPerS: number, rate = 0.998) => ((vPxPerS / 1000) * rate) / (1 - rate)

/** iOS rubber band: resistance grows with overshoot. */
export const rubberband = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over))

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
