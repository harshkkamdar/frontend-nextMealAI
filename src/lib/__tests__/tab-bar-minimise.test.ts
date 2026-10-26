import { describe, expect, it } from 'vitest'
import { COLLAPSE_DELTA, COLLAPSE_MIN_Y, EXPAND_DELTA, TOP_Y, initialMinimise, minimiseStep, type MinimiseState } from '../tab-bar-minimise'

const scrollTo = (ys: number[], from: MinimiseState = initialMinimise) => ys.reduce((s, y) => minimiseStep(s, { type: 'scroll', y }), from)

describe('minimiseStep', () => {
  it('stays expanded near the top however far the finger travels there', () => {
    expect(scrollTo([10, 20, 30, TOP_Y]).minimised).toBe(false)
  })

  it('collapses once the page is past the threshold and has moved down by the delta', () => {
    expect(scrollTo([40, 80, COLLAPSE_MIN_Y + 10]).minimised).toBe(true)
  })

  it('does not collapse before COLLAPSE_MIN_Y even after a long downward run', () => {
    expect(scrollTo([0, 30, 60, COLLAPSE_MIN_Y - 1]).minimised).toBe(false)
  })

  it('needs a full COLLAPSE_DELTA from the lowest point, so jitter mid-page never collapses', () => {
    const mid = scrollTo([300], { minimised: false, anchor: 300 })
    expect(scrollTo([310, 305, 315, 300 + COLLAPSE_DELTA - 1], mid).minimised).toBe(false)
    expect(scrollTo([300 + COLLAPSE_DELTA], mid).minimised).toBe(true)
  })

  it('expands on a scroll up of EXPAND_DELTA from the deepest point, not on a smaller wobble', () => {
    const down = scrollTo([100, 200, 400])
    expect(down.minimised).toBe(true)
    expect(scrollTo([400 - EXPAND_DELTA + 1, 405], down).minimised).toBe(true)
    expect(scrollTo([405 - EXPAND_DELTA], scrollTo([405], down)).minimised).toBe(false)
  })

  it('expands near the top even when the last step was downward (iOS rubber band)', () => {
    const down = scrollTo([100, 200, 400])
    expect(scrollTo([-20], down).minimised).toBe(false)
  })

  it('expands on tap and re-arms the threshold from where the tap happened', () => {
    const down = scrollTo([100, 200, 400])
    const tapped = minimiseStep(down, { type: 'tap', y: 400 })
    expect(tapped).toEqual({ minimised: false, anchor: 400 })
    expect(scrollTo([400 + COLLAPSE_DELTA - 1], tapped).minimised).toBe(false)
    expect(scrollTo([400 + COLLAPSE_DELTA], tapped).minimised).toBe(true)
  })

  it('returns the same object when nothing changes, so React skips the render', () => {
    const down = scrollTo([100, 200, 400])
    expect(minimiseStep(down, { type: 'scroll', y: 395 })).toBe(down)
  })
})
