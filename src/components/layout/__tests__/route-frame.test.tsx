import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, type RenderResult } from '@testing-library/react'
import { RouteFrame } from '../route-frame'
import { navHistory } from '@/lib/navigation'
import { motionValue } from 'framer-motion'
import { holdSheetDepth, releaseSheetDepth } from '@/lib/depth'

// Fake clock before framer loads: its frame loop captures requestAnimationFrame at import.
const route = vi.hoisted(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] })
  return { pathname: '/food', reduce: false }
})
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))
vi.mock('framer-motion', async (original) => ({ ...(await original<typeof import('framer-motion')>()), useReducedMotion: () => route.reduce }))
vi.mock('@/lib/platform', () => ({ isNative: () => false }))

const W = window.innerWidth

function Page() {
  return <main><h1>{route.pathname}</h1><a href="#x">link</a></main>
}

/** Fake time, one frame per act step, so slide positions are deterministic however busy the machine is. */
async function wait(ms: number) {
  for (let t = 0; t < ms; t += 16) await act(async () => { vi.advanceTimersByTime(16) })
}

let view: RenderResult
const frame = () => <RouteFrame><Page /></RouteFrame>
function go(path: string) {
  route.pathname = path
  act(() => view.rerender(frame()))
}
const layer = (key: string) => document.querySelector<HTMLElement>(`[data-route="${key}"]`)
/** The layer's translateX in px (framer writes `transform: translateX(...)`), 0 when untransformed. */
function x(key: string): number {
  const m = layer(key)?.style.transform.match(/translateX\((-?[\d.]+)px\)/)
  return m ? parseFloat(m[1]) : 0
}

/** The layer's depth scale (framer writes `scale(...)`), 1 when unscaled. */
function scale(key: string): number {
  const m = layer(key)?.style.transform.match(/scale\((-?[\d.]+)\)/)
  return m ? parseFloat(m[1]) : 1
}

function touch(type: string, clientX: number, clientY = 300, timeStamp = performance.now()) {
  const e = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : [{ clientX, clientY }] })
  Object.defineProperty(e, 'timeStamp', { value: timeStamp })
  act(() => { document.body.dispatchEvent(e) })
  return e
}

beforeEach(() => {
  Object.assign(navHistory, { backPending: null, index: 0, swipeCommitted: false })
  route.pathname = '/food'
  route.reduce = false
  window.history.replaceState({}, '', '/food')
  view = render(frame())
})
afterEach(() => { view.unmount(); vi.restoreAllMocks() })

describe('RouteFrame swipe-back', () => {
  it('leaves tiny, vertical and leftward moves alone and claims only a committed rightward swipe', async () => {
    go('/foods')
    await wait(700)
    touch('touchstart', 5)
    expect(touch('touchmove', 8, 301).defaultPrevented).toBe(false)
    touch('touchend', 8)
    touch('touchstart', 5)
    expect(touch('touchmove', 0, 300).defaultPrevented).toBe(false)
    touch('touchend', 0)
    touch('touchstart', 5)
    expect(touch('touchmove', 30, 302).defaultPrevented).toBe(true)
    touch('touchend', 30)
    // A 2 px vertical wobble before the finger has travelled does not cancel the swipe.
    touch('touchstart', 5)
    expect(touch('touchmove', 6, 302).defaultPrevented).toBe(false)
    expect(touch('touchmove', 30, 303).defaultPrevented).toBe(true)
    touch('touchend', 30)
  })
})

describe('RouteFrame interrupted slides', () => {
  it('a push during a running push starts the half-slid page from where it is, with no jump', async () => {
    go('/foods')
    await wait(80)
    const before = x('/foods')
    expect(before).toBeGreaterThan(0.1 * W)
    go('/logs')
    await wait(16)
    // The page that was sliding in is now the one being covered: it heads left from its live x. Snapped to rest it
    // would be at x 0 or left of it in the first frame.
    expect(x('/foods')).toBeGreaterThan(0.1 * W)
    // The page under it stays shown until the half-slid page covers it.
    expect(layer('/food')?.style.display).not.toBe('none')
    await wait(800)
    expect(x('/foods')).toBeCloseTo(-0.04 * W, 0)
    expect(x('/logs')).toBe(0)
  })

  it('a push during a running pop starts the uncovered page from where it is', async () => {
    go('/foods')
    await wait(700)
    go('/food')
    await wait(80)
    const before = x('/food')
    expect(before).toBeLessThan(-0.005 * W)
    go('/logs')
    await wait(16)
    // It keeps heading left from its live x; snapped to rest it would start again from x 0.
    expect(x('/food')).toBeLessThan(before / 2)
  })
})

/** Drags from the left edge to `toX` and releases. */
async function swipe(toX: number) {
  const t0 = performance.now()
  touch('touchstart', 5, 300, t0)
  for (let i = 1; i <= 8; i++) { touch('touchmove', 5 + ((toX - 5) * i) / 8, 300, t0 + i * 16); await wait(16) }
  touch('touchend', toX, 300, t0 + 9 * 16)
}

describe('RouteFrame swipe-back commit', () => {
  it('a route commit later than 600 ms lands without sliding the page back and out again', async () => {
    go('/foods')
    await wait(700)
    // Browser back fires popstate quickly, but the route commits late (slow chunk load).
    vi.spyOn(window.history, 'back').mockImplementation(() => { setTimeout(() => window.dispatchEvent(new PopStateEvent('popstate', { state: null })), 20) })
    await swipe(0.7 * W)
    // Release spring (~0.5 s) plus the 600 ms fallback window, and more.
    await wait(1600)
    expect(x("/foods")).toBeGreaterThan(0.95 * W)
    go('/food')
    await wait(400)
    expect(layer('/foods')).toBeNull()
    expect(x('/food')).toBe(0)
  })

  it('with no history to go back to, puts the page back after 600 ms', async () => {
    go('/foods')
    await wait(700)
    vi.spyOn(window.history, 'back').mockImplementation(() => {})
    await swipe(0.7 * W)
    await wait(1800)
    expect(Math.abs(x("/foods"))).toBeLessThan(2)
  })
})

describe('RouteFrame swipe-back under reduced motion', () => {
  it('follows the finger without parallax and completes with the short crossfade, not the spring slide', async () => {
    route.reduce = true
    go('/foods')
    await wait(300)
    vi.spyOn(window.history, 'back').mockImplementation(() => { setTimeout(() => window.dispatchEvent(new PopStateEvent('popstate', { state: null })), 20) })
    await swipe(0.7 * W)
    const released = x('/foods')
    expect(x('/food')).toBe(0)
    await wait(60)
    expect(Math.abs(x('/foods') - released)).toBeLessThan(2)
    await wait(300)
    expect(layer('/foods')?.style.opacity).toBe('0')
    expect(x('/food')).toBe(0)
  })
})

describe('RouteFrame focus', () => {
  it('moves focus to the new page heading after a push and after a pop settles', async () => {
    go('/foods')
    await wait(700)
    expect(document.activeElement).toBe(layer('/foods')?.querySelector('h1'))
    go('/food')
    await wait(700)
    expect(document.activeElement).toBe(layer('/food')?.querySelector('h1'))
  })
})

describe('RouteFrame Spatial Depth', () => {
  it('a push steps the old page back (scale ~0.94, a little left) and lands the new page at full size; pop reverses it', async () => {
    go('/foods')
    await wait(80)
    // Mid-push the incoming page is still growing toward 1 and is lifted off the document flow.
    expect(scale('/foods')).toBeLessThan(1)
    expect(scale('/foods')).toBeGreaterThanOrEqual(0.97)
    expect(layer('/foods')?.dataset.lifted).toBe('true')
    await wait(800)
    expect(scale('/food')).toBeCloseTo(0.94, 2)
    expect(x('/food')).toBeCloseTo(-0.04 * W, 0)
    expect(scale('/foods')).toBe(1)
    // At rest the live page is back in the document flow.
    expect(layer('/foods')?.dataset.lifted).toBeUndefined()
    go('/food')
    await wait(800)
    expect(scale('/food')).toBe(1)
    expect(x('/food')).toBe(0)
  })

  it('a tab switch is a depth crossfade: the new tab comes forward from below 1 while the old one fades past 1', async () => {
    go('/dashboard')
    await wait(32)
    expect(scale('/dashboard')).toBeLessThan(1)
    expect(scale('/food')).toBeGreaterThan(1)
    await wait(500)
    expect(scale('/dashboard')).toBe(1)
    expect(x('/dashboard')).toBe(0)
  })

  it('a short fast flick from the edge completes by momentum projection', async () => {
    go('/foods')
    await wait(700)
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    // 100 px in 64 ms: about 1,500 px/s, projects well past half the width.
    const t0 = performance.now()
    touch('touchstart', 5, 300, t0)
    for (let i = 1; i <= 4; i++) { touch('touchmove', 5 + 25 * i, 300, t0 + i * 16); await wait(16) }
    touch('touchend', 105, 300, t0 + 5 * 16)
    await wait(700)
    expect(back).toHaveBeenCalled()
  })

  it('a sheet steps the live page back once it is lifted, and returns it to the flow when the sheet has closed', async () => {
    const p = motionValue(0)
    act(() => holdSheetDepth(p))
    expect(layer('/food')?.dataset.lifted).toBe('true')
    act(() => p.set(1))
    await wait(32)
    expect(scale('/food')).toBeCloseTo(0.945, 3)
    act(() => p.set(0))
    act(() => releaseSheetDepth(p))
    await wait(32)
    expect(scale('/food')).toBe(1)
    expect(layer('/food')?.dataset.lifted).toBeUndefined()
  })
})
