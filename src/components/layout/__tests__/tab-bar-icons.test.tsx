/**
 * jsdom has no layout, so framer shared-layout projection never runs here: this guards the opacity animations only.
 * The shared-layout case (an icon left at opacity 0 after the open tab changes) is checked in a real browser by
 * scripts/redesign-tabbar-icons.mjs.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { TabBar } from '../tab-bar'

const route = vi.hoisted(() => ({ pathname: '/dashboard', reduce: false }))
vi.mock('framer-motion', async (original) => ({ ...(await original<typeof import('framer-motion')>()), useReducedMotion: () => route.reduce }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))
vi.mock('@/lib/platform/app', () => ({ haptic: () => Promise.resolve() }))

const LABELS = ['Home', 'Food', 'Train', 'Geo']

async function settle() {
  // Small act steps: one long act starves framer's frame loop in jsdom.
  for (let i = 0; i < 9; i++) await act(async () => { await new Promise((r) => setTimeout(r, 50)) })
}

async function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  act(() => { window.dispatchEvent(new Event('scroll')) })
  await settle()
}

/** An icon is visible when neither it nor any wrapper up to its tab link sits at opacity 0. */
function iconVisible(label: string): boolean {
  const link = screen.getByRole('link', { name: label })
  const svg = link.querySelector('svg')
  if (!svg) return false
  for (let el: Element | null = svg; el && el !== link.parentElement; el = el.parentElement) {
    if (getComputedStyle(el).opacity === '0' || (el as HTMLElement).style.opacity === '0') return false
  }
  return true
}

function expectAllIconsVisible(step: string) {
  for (const label of LABELS) expect(iconVisible(label), `${label} icon after ${step}`).toBe(true)
}

describe('TabBar icons stay visible whenever the bar is expanded', () => {
  beforeAll(() => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 5000, configurable: true })
  })
  afterEach(() => { route.pathname = '/dashboard' })

  for (const reduced of [false, true]) {
    it(`after tab switches, collapse, tap and scroll expand, push and pop${reduced ? ' (reduced motion)' : ''}`, async () => {
      route.reduce = reduced
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
      const view = render(<TabBar />)
      await settle()
      expectAllIconsVisible('first render')

      const go = async (path: string) => { route.pathname = path; view.rerender(<TabBar />); await settle() }
      for (const path of ['/food', '/dashboard']) {
        await go(path)
        expectAllIconsVisible(`switch to ${path}`)
        // Collapse, then expand by tapping the circle.
        await scrollTo(60); await scrollTo(400)
        act(() => { screen.getByRole('button', { name: /^Show tabs/ }).click() })
        await settle()
        expectAllIconsVisible(`tap expand on ${path}`)
        // Collapse, then expand by scrolling up.
        await scrollTo(700); await scrollTo(600)
        expectAllIconsVisible(`scroll expand on ${path}`)
        await scrollTo(0)
      }
      // Push a pushed page and pop back while collapsed.
      await scrollTo(60); await scrollTo(400)
      await go('/plans')
      expectAllIconsVisible('push to /plans')
      await go('/food')
      expectAllIconsVisible('pop to /food')
      view.unmount()
    }, 60_000)
  }
})
