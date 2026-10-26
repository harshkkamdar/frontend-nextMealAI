import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, type RenderResult } from '@testing-library/react'
import { RouteFrame } from '../route-frame'

const route = vi.hoisted(() => ({ pathname: '/food', reduce: false }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))
vi.mock('framer-motion', async (original) => ({ ...(await original<typeof import('framer-motion')>()), useReducedMotion: () => route.reduce }))
vi.mock('@/lib/platform', () => ({ isNative: () => false }))

const W = window.innerWidth

function Page() {
  return <main><h1>{route.pathname}</h1><a href="#x">link</a></main>
}

/** Real time in small act steps: one long act starves framer's frame loop in jsdom. */
async function wait(ms: number) {
  for (let t = 0; t < ms; t += 16) await act(async () => { await new Promise((r) => setTimeout(r, 16)) })
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

function touch(type: string, clientX: number, clientY = 300, timeStamp = performance.now()) {
  const e = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : [{ clientX, clientY }] })
  Object.defineProperty(e, 'timeStamp', { value: timeStamp })
  act(() => { document.body.dispatchEvent(e) })
  return e
}

beforeEach(() => {
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
  })
})
