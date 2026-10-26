import { describe, expect, it } from 'vitest'
import { DEPTH, depthPair, sheetBehind, spring, tiltFor, titleDrift } from '@/lib/motion'

/** Integrates a framer spring 0 -> 1 at 1 ms steps. */
function run({ stiffness: k, damping: c, mass: m = 1 }: { stiffness: number; damping: number; mass?: number }, v0 = 0) {
  let x = 0, v = v0, peak = 0
  for (let t = 1; t <= 1500; t++) {
    v += ((-k * (x - 1) - c * v) / m) / 1000
    x += v / 1000
    peak = Math.max(peak, x)
  }
  return { peak, x }
}

describe('depthPair (Spatial Depth push)', () => {
  it('at rest the front page covers the screen and the page behind sits back, scaled and dimmed', () => {
    const { front, behind } = depthPair(0)
    expect(front).toEqual({ x: 0, scale: 1 })
    expect(behind.scale).toBeCloseTo(DEPTH.behindScale)
    expect(behind.x).toBeCloseTo(-DEPTH.behindShift)
    expect(behind.dim).toBeCloseTo(DEPTH.behindDim)
  })
  it('when the front page is gone the page behind is back at rest', () => {
    const { front, behind } = depthPair(1)
    expect(front.x).toBe(1)
    expect(front.scale).toBeCloseTo(DEPTH.frontScale)
    expect(behind).toEqual({ x: -0, scale: 1, dim: 0 })
  })
  it('is linear in between, so pop is the exact reverse of push', () => {
    const half = depthPair(0.5)
    expect(half.behind.scale).toBeCloseTo((1 + DEPTH.behindScale) / 2)
    expect(half.front.x).toBe(0.5)
  })
  it('a flick overshoot never pulls the front page past the left edge or dims the page behind past its rest', () => {
    const over = depthPair(1.04)
    expect(over.front.x).toBe(1)
    expect(over.behind.dim).toBe(0)
    expect(over.behind.scale).toBeGreaterThan(1)
    expect(depthPair(-0.1).front.x).toBe(0)
  })
  it('keeps the scale about 0.94 and the step back small (SPATIAL-BUILD)', () => {
    expect(DEPTH.behindScale).toBeGreaterThanOrEqual(0.93)
    expect(DEPTH.behindScale).toBeLessThanOrEqual(0.95)
    expect(DEPTH.behindShift).toBeLessThanOrEqual(0.06)
  })
})

describe('sheetBehind', () => {
  it('drops and shrinks the screen behind a sheet in proportion to the sheet', () => {
    expect(sheetBehind(0)).toEqual({ y: 0, scale: 1 })
    expect(sheetBehind(1).scale).toBeCloseTo(1 - DEPTH.sheetScale)
    expect(sheetBehind(1).y).toBe(DEPTH.sheetDrop)
    expect(sheetBehind(2)).toEqual(sheetBehind(1.05))
  })
})

describe('spring.push and spring.pushFlick', () => {
  it('push settles with no overshoot', () => {
    const { peak, x } = run(spring.push)
    expect(peak).toBeLessThanOrEqual(1.0005)
    expect(x).toBeCloseTo(1, 3)
  })
  it('a flick release earns a slight overshoot, never above a bounce of 0.4', () => {
    const { peak } = run(spring.pushFlick, 3)
    expect(peak).toBeGreaterThan(1.001)
    expect(peak).toBeLessThan(1.1)
    const zeta = spring.pushFlick.damping / (2 * Math.sqrt(spring.pushFlick.stiffness))
    expect(zeta).toBeGreaterThanOrEqual(0.6)
  })
})

describe('tiltFor', () => {
  it('tilts toward the finger: the pressed corner sinks', () => {
    // Finger at the top right corner.
    const t = tiltFor(1, 0, 2.5)
    expect(t.rotateX).toBeCloseTo(1.25)
    expect(t.rotateY).toBeCloseTo(1.25)
  })
  it('stays flat at the centre and clamps a finger dragged outside the card', () => {
    expect(tiltFor(0.5, 0.5, 5)).toEqual({ rotateX: -0, rotateY: 0 })
    expect(tiltFor(3, -2, 5)).toEqual(tiltFor(1, 0, 5))
  })
})

describe('titleDrift', () => {
  it('rests at the top and drifts down, shrinks and fades a little over the first 110 px', () => {
    expect(titleDrift(0)).toEqual({ y: 0, scale: 1, opacity: 1 })
    const mid = titleDrift(55)
    expect(mid.y).toBeCloseTo(11)
    expect(mid.opacity).toBeCloseTo(1 - 0.55 / 2)
    expect(titleDrift(400)).toEqual(titleDrift(110))
    expect(titleDrift(-30)).toEqual(titleDrift(0))
  })
})
