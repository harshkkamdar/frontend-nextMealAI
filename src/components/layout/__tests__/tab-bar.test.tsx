import { Profiler } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { TabBar, hidesTabBar } from '../tab-bar'

const route = vi.hoisted(() => ({ pathname: '/dashboard' }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))
vi.mock('@/lib/platform/app', () => ({ haptic: () => Promise.resolve() }))

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
    vi.runAllTimers()
  })
}

describe('TabBar minimise on scroll', () => {
  afterEach(() => { vi.useRealTimers(); route.pathname = '/dashboard' })

  it('treats the scroll restore after a pop as a new anchor, not as a scroll down', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'queueMicrotask'] })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, configurable: true })
    route.pathname = '/foods'
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    const view = render(<TabBar />)
    // Back to /food: the route frame restores its scroll position (600) before the bar sees the route change.
    route.pathname = '/food'
    Object.defineProperty(window, 'scrollY', { value: 600, configurable: true })
    view.rerender(<TabBar />)
    scrollTo(600)
    expect(screen.queryByRole('button', { name: 'Show tabs, Food' })).toBeNull()
    // A real scroll down from there still collapses.
    scrollTo(640)
    expect(screen.getByRole('button', { name: 'Show tabs, Food' })).toBeTruthy()
  })

  it('re-renders only when the bar flips, not on every scrolled frame', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'queueMicrotask'] })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, configurable: true })
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    let renders = 0
    render(<Profiler id="bar" onRender={() => { renders++ }}><TabBar /></Profiler>)
    scrollTo(10)
    const before = renders
    for (const y of [20, 30, 40]) scrollTo(y)
    expect(renders).toBe(before)
  })

  it('collapses into one button named for the open tab, and tapping it expands without navigating', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'queueMicrotask'] })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, configurable: true })
    render(<TabBar />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(screen.queryByRole('button', { name: 'Show tabs, Home' })).toBeNull()

    scrollTo(60)
    scrollTo(200)
    const restore = screen.getByRole('button', { name: 'Show tabs, Home' })
    // The nav landmark stays; its links are inert while collapsed, the + orb is untouched.
    expect(nav.contains(restore)).toBe(true)
    expect(screen.getByRole('link', { name: 'Food', hidden: true }).closest('[inert]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Log something' })).toBeTruthy()

    act(() => {
      fireEvent.click(restore)
      vi.runAllTimers()
    })
    expect(screen.queryByRole('button', { name: 'Show tabs, Home' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Food' }).closest('[inert]')).toBeNull()

    // Any scroll up expands too.
    scrollTo(400)
    expect(screen.getByRole('button', { name: 'Show tabs, Home' })).toBeTruthy()
    scrollTo(380)
    expect(screen.queryByRole('button', { name: 'Show tabs, Home' })).toBeNull()

    // Keyboard activation (click detail 0) hands focus to the open tab, since the circle unmounts.
    scrollTo(600)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Show tabs, Home' }), { detail: 0 })
      vi.runAllTimers()
    })
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Home' }))
  })
})

describe('hidesTabBar', () => {
  it('hides on pushed full-screen flows that dock their own actions', () => {
    for (const path of ['/settings', '/settings/profile', '/check-in', '/plans/new/meal', '/plans/edit', '/chat/session']) {
      expect(hidesTabBar(path), path).toBe(true)
    }
  })

  it('keeps the bar on tabs, the plans list and plan detail', () => {
    for (const path of ['/dashboard', '/food', '/train', '/chat', '/plans', '/plans/view', '/settingsx']) {
      expect(hidesTabBar(path), path).toBe(false)
    }
  })
})
