// Welcome stage physics (docs/redesign/motion-feel.md 3a).
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
