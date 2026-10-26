import { describe, expect, it } from 'vitest'
import { project, rubberband } from '@/lib/motion'
import { beatDepth, flickTarget, scrub } from '../stage'

const W = 390

describe('welcome stage physics', () => {
  it('projects a flick the way iOS decelerates', () => {
    expect(project(1000)).toBeCloseTo(499, 0)
    expect(project(-500)).toBeCloseTo(-249.5, 1)
  })

  it('rubber-bands overshoot and never passes the dimension', () => {
    expect(rubberband(0, W)).toBe(0)
    expect(rubberband(100, W)).toBeLessThan(100)
    expect(rubberband(10000, W)).toBeLessThan(W)
  })

  it('tracks the finger 1:1 inside the stage and resists past the ends', () => {
    expect(scrub(1, -W / 2, W, 3)).toBeCloseTo(1.5)
    expect(scrub(0, 100, W, 3)).toBeLessThan(0)
    expect(scrub(0, 100, W, 3)).toBeGreaterThan(-100 / W)
    expect(scrub(3, -100, W, 3)).toBeGreaterThan(3)
    expect(scrub(3, -100, W, 3)).toBeLessThan(3 + 100 / W)
  })

  it('advances exactly one slide on a 500 px/s flick, even a short one', () => {
    expect(flickTarget(1.05, 1, -500, W, 3)).toBe(2)
    expect(flickTarget(0.95, 1, 500, W, 3)).toBe(0)
  })

  it('never skips more than one slide on a hard flick', () => {
    expect(flickTarget(1.4, 1, -6000, W, 3)).toBe(2)
    expect(flickTarget(0.6, 1, 6000, W, 3)).toBe(0)
  })

  it('returns to the start on a slow short drag and clamps at the ends', () => {
    expect(flickTarget(1.3, 1, 0, W, 3)).toBe(1)
    expect(flickTarget(1.6, 1, 0, W, 3)).toBe(2)
    expect(flickTarget(-0.1, 0, 2000, W, 3)).toBe(0)
    expect(flickTarget(3.1, 3, -2000, W, 3)).toBe(3)
  })

  it('steps beats in depth: the leaving beat shrinks and drifts up, the arriving one comes from in front, and one always shows', () => {
    expect(beatDepth(0)).toEqual({ opacity: 1, scale: 1, y: 0 })
    const back = beatDepth(0.5)
    const front = beatDepth(-0.5)
    expect(back.scale).toBeLessThan(1)
    expect(back.y).toBeLessThan(0)
    expect(front.scale).toBeGreaterThan(1)
    expect(front.y).toBeGreaterThan(0)
    for (let x = 0; x <= 1.0001; x += 0.01) {
      const leaving = beatDepth(x).opacity
      const arriving = beatDepth(x - 1).opacity
      expect(Math.max(leaving, arriving)).toBeGreaterThan(0.1)
      if (x > 0.6) expect(leaving).toBe(0)
      if (x < 0.4) expect(arriving).toBe(0)
    }
  })

  it('reduced motion keeps the crossfade and drops the travel', () => {
    expect(beatDepth(0.5, true)).toEqual({ opacity: 0.5, scale: 1, y: 0 })
  })
})
