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

/** Opacity of a layer at slide distance d: gone once a slide has moved `gone` of the way out (d > 0), visible again once
 *  the next one is within `arrive` (d < 0). With gone + arrive = 1 two slides never show the same layer at once. Quadratic,
 *  so a layer stays solid until near its hand-off instead of the whole stage dimming to a fog mid-drag. */
export const handoff = (d: number, gone: number, arrive: number) => Math.max(0, 1 - (Math.abs(d) / (d > 0 ? gone : arrive)) ** 2)
