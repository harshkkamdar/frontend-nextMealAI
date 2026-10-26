import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { TabBar } from '../tab-bar'

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }))
vi.mock('@/lib/platform/app', () => ({ haptic: () => Promise.resolve() }))

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
    vi.runAllTimers()
  })
}

describe('TabBar minimise on scroll', () => {
  afterEach(() => vi.useRealTimers())

  it('collapses into one button named for the open tab, and tapping it expands without navigating', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
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
