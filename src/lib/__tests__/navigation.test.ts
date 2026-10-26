import { describe, expect, it, vi } from 'vitest'
import { shouldCompleteSwipe, spring } from '@/lib/motion'
import { classifyNav, goBack } from '@/lib/navigation'

describe('classifyNav', () => {
  it('pushes a deeper screen over the current one', () => {
    expect(classifyNav(['/food'], '/foods', null)).toEqual({ kind: 'push', index: -1 })
    expect(classifyNav(['/plans'], '/plans/view', null)).toEqual({ kind: 'push', index: -1 })
  })

  it('pops to a screen still in the stack (back button, hardware back, swipe)', () => {
    expect(classifyNav(['/food', '/foods'], '/food', 'back')).toEqual({ kind: 'pop', index: 0 })
    expect(classifyNav(['/dashboard', '/plans', '/plans/view'], '/plans', 'back')).toEqual({ kind: 'pop', index: 1 })
  })

  it('pops to the root when the current tab is tapped again from a pushed screen', () => {
    expect(classifyNav(['/food', '/foods', '/logs'], '/food', null)).toEqual({ kind: 'pop', index: 0 })
  })

  it('fades between tab roots and when another tab is chosen from a pushed screen', () => {
    expect(classifyNav(['/dashboard'], '/food', null).kind).toBe('tab')
    expect(classifyNav(['/food', '/foods'], '/train', null).kind).toBe('tab')
  })

  it('reads browser back/forward outside the stack by history direction, not route depth', () => {
    expect(classifyNav(['/plans/view'], '/plans', 'back').kind).toBe('pop')
    expect(classifyNav(['/dashboard'], '/settings', 'forward').kind).toBe('push')
    expect(classifyNav(['/settings'], '/plans/view', 'back').kind).toBe('pop')
  })

  it('crossfades tab root to tab root even on browser or hardware back and forward', () => {
    expect(classifyNav(['/food'], '/dashboard', 'back').kind).toBe('tab')
    expect(classifyNav(['/dashboard'], '/train', 'forward').kind).toBe('tab')
  })

  it('does nothing when the route did not change', () => {
    expect(classifyNav(['/food'], '/food', null).kind).toBe('none')
  })
})

describe('shouldCompleteSwipe', () => {
  const w = 390
  it('with no flick, completes past half the width and snaps back short of it (UIKit)', () => {
    expect(shouldCompleteSwipe(0.51 * w, w, 0)).toBe(true)
    expect(shouldCompleteSwipe(0.49 * w, w, 0)).toBe(false)
  })
  it('projects the release velocity (Apple momentum): a short rightward flick completes, a leftward flick cancels late', () => {
    // 40 px + 600 px/s projected (~300 px) lands past half.
    expect(shouldCompleteSwipe(40, w, 600)).toBe(true)
    expect(shouldCompleteSwipe(0.8 * w, w, -600)).toBe(false)
    // A slow drift is not a flick: 120 px + 100 px/s (~50 px) stays short.
    expect(shouldCompleteSwipe(120, w, 100)).toBe(false)
  })
})

describe('spring.push', () => {
  // Integrates the spring 0 -> 1 at 1 ms steps: it must never overshoot and must be within 2 px (of 390) by ~0.5 s.
  it('settles without overshoot in about half a second', () => {
    const { stiffness: k, damping: c, mass: m } = spring.push
    let x = 0, v = 0, peak = 0, settledAt = -1
    for (let t = 1; t <= 1000; t++) {
      const a = (-k * (x - 1) - c * v) / m
      v += a / 1000
      x += v / 1000
      peak = Math.max(peak, x)
      if (settledAt < 0 && Math.abs(1 - x) * 390 < 2) settledAt = t
    }
    expect(peak).toBeLessThanOrEqual(1.0005)
    expect(settledAt).toBeGreaterThan(300)
    expect(settledAt).toBeLessThan(550)
  })
})

describe('goBack', () => {
  const router = () => ({ back: vi.fn(), push: vi.fn() })

  it('goes to the fallback on the first in-app entry, even with other sites behind it (external deep link)', () => {
    window.history.pushState({}, '', '/elsewhere')
    window.history.pushState({ fiqrIndex: 1 }, '', '/plans/view')
    const r = router()
    goBack(r, '/plans')
    expect(r.push).toHaveBeenCalledWith('/plans')
    expect(r.back).not.toHaveBeenCalled()
  })

  it('goes back after an in-app navigation', () => {
    window.history.pushState({ fiqrIndex: 2 }, '', '/plans/view')
    const r = router()
    goBack(r, '/plans')
    expect(r.back).toHaveBeenCalled()
  })
})
