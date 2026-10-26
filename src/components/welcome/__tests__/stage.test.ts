import { describe, expect, it } from 'vitest'
import { flickTarget, project, rubberband, scrub } from '../stage'

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
})
