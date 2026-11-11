import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { TabBar, hidesTabBar } from '../tab-bar'
import { useUIStore } from '@/stores/ui.store'

const route = vi.hoisted(() => ({ pathname: '/dashboard' }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))
vi.mock('@/lib/platform/app', () => ({ haptic: () => Promise.resolve() }))

describe('TabBar (George nav)', () => {
  afterEach(() => { route.pathname = '/dashboard' })

  it('has five slots in order, with Geo in the centre opening over the current screen', () => {
    render(<TabBar />)
    const slots = screen.getByRole('navigation').querySelectorAll('a, button')
    expect([...slots].map((slot) => slot.textContent)).toEqual(['Home', 'Food', 'Geo', 'Train', 'Check-in'])
    act(() => screen.getByRole('button', { name: 'Geo' }).click())
    expect(useUIStore.getState().activeSheet).toBe('geo-companion')
    expect(screen.getByRole('link', { name: 'Check-in' })).toHaveAttribute('href', '/check-in')
  })

  it('is the conversation list tab while you are in Geo', () => {
    route.pathname = '/chat'
    render(<TabBar />)
    expect(screen.getByRole('link', { name: 'Geo' })).toHaveAttribute('href', '/chat')
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

describe('Geo working', () => {
  it('orbits the nav mark while a Geo reply is in flight, and settles when the last one lands', async () => {
    const { useUIStore } = await import('@/stores/ui.store')
    const { container, rerender } = render(<TabBar />)
    const mark = () => container.querySelector('button[aria-haspopup="dialog"] svg')
    expect(mark()).not.toHaveClass('geo-working')
    act(() => { useUIStore.getState().geoStart(); useUIStore.getState().geoStart() })
    rerender(<TabBar />)
    expect(mark()).toHaveClass('geo-working')
    act(() => { useUIStore.getState().geoEnd() })
    rerender(<TabBar />)
    expect(mark()).toHaveClass('geo-working')
    act(() => { useUIStore.getState().geoEnd(); useUIStore.getState().geoEnd() })
    rerender(<TabBar />)
    expect(mark()).not.toHaveClass('geo-working')
    expect(useUIStore.getState().geoWorking).toBe(0)
  })
})
