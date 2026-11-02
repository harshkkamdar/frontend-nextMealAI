import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TabBar, hidesTabBar } from '../tab-bar'

const route = vi.hoisted(() => ({ pathname: '/dashboard' }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))
vi.mock('@/lib/platform/app', () => ({ haptic: () => Promise.resolve() }))

describe('TabBar (George nav)', () => {
  afterEach(() => { route.pathname = '/dashboard' })

  it('has five slots in order, with Geo in the centre leading to the conversation list', () => {
    render(<TabBar />)
    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['Home', 'Food', 'Geo', 'Train', 'Check-in'])
    expect(screen.getByRole('link', { name: 'Geo' })).toHaveAttribute('href', '/chat')
    expect(screen.getByRole('link', { name: 'Check-in' })).toHaveAttribute('href', '/check-in')
  })

  it('marks the open tab, and Check-in is a tab of its own', () => {
    route.pathname = '/check-in'
    render(<TabBar />)
    expect(screen.getByRole('link', { name: 'Check-in' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('slides away on full-screen flows', () => {
    route.pathname = '/chat/session'
    render(<TabBar />)
    expect(screen.getByRole('navigation', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('hidesTabBar', () => {
  it('hides on pushed full-screen flows that dock their own actions', () => {
    for (const path of ['/settings', '/settings/profile', '/plans/new/meal', '/plans/edit', '/chat/session', '/train/session', '/paywall']) {
      expect(hidesTabBar(path), path).toBe(true)
    }
  })

  it('keeps the bar on tabs, the plans list and plan detail', () => {
    for (const path of ['/dashboard', '/food', '/train', '/chat', '/check-in', '/plans', '/plans/view', '/settingsx']) {
      expect(hidesTabBar(path), path).toBe(false)
    }
  })
})
