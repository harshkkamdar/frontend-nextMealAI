import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import { usePressTilt } from '../press-tilt'

// Fake clock before framer loads: its frame loop captures requestAnimationFrame at import.
const env = vi.hoisted(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] })
  return { reduce: false }
})
vi.mock('framer-motion', async (original) => ({ ...(await original<typeof import('framer-motion')>()), useReducedMotion: () => env.reduce }))

function Card() {
  const tilt = usePressTilt<HTMLButtonElement>(5)
  return <button type="button" {...tilt}>tile</button>
}

async function frames(ms: number) {
  for (let t = 0; t < ms; t += 16) await act(async () => { vi.advanceTimersByTime(16) })
}
const rotateX = (el: HTMLElement) => parseFloat(el.style.transform.match(/rotateX\((-?[\d.]+)deg\)/)?.[1] ?? '0')

function setup() {
  const view = render(<Card />)
  const el = view.getByRole('button')
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) })
  return { view, el }
}

afterEach(() => { env.reduce = false })

describe('usePressTilt', () => {
  it('tilts toward the finger while pressed and springs back flat on release', async () => {
    const { el, view } = setup()
    fireEvent.pointerDown(el, { clientX: 100, clientY: 0, pointerType: 'touch' })
    await frames(200)
    // Pressed at the top edge: the top sinks by half the max tilt.
    expect(rotateX(el)).toBeCloseTo(2.5, 1)
    fireEvent.pointerUp(el)
    await frames(600)
    expect(Math.abs(rotateX(el))).toBeLessThan(0.05)
    view.unmount()
  })

  it('lets go once the finger travels past 10 px (a scroll, not a press)', async () => {
    const { el, view } = setup()
    fireEvent.pointerDown(el, { clientX: 100, clientY: 0, pointerType: 'touch' })
    await frames(200)
    fireEvent.pointerMove(el, { clientX: 100, clientY: 12, pointerType: 'touch' })
    await frames(600)
    expect(Math.abs(rotateX(el))).toBeLessThan(0.05)
    // Later moves of the same gesture no longer tilt.
    fireEvent.pointerMove(el, { clientX: 100, clientY: 0, pointerType: 'touch' })
    await frames(200)
    expect(Math.abs(rotateX(el))).toBeLessThan(0.05)
    view.unmount()
  })

  it('does nothing under reduced motion', async () => {
    env.reduce = true
    const { el, view } = setup()
    fireEvent.pointerDown(el, { clientX: 0, clientY: 0, pointerType: 'touch' })
    await frames(200)
    expect(el.style.transform).toBe('')
    view.unmount()
  })
})
