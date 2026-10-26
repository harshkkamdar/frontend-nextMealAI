import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  options: [] as { id: string; period: 'monthly' | 'yearly'; title: string; price: string; productId: string }[],
  subscribed: false,
  subscribe: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: mocks.replace }) }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))
vi.mock('@/lib/platform', () => ({ platform: () => 'ios', isNative: () => true }))
vi.mock('@/lib/platform/purchases', () => ({
  getSubscriptionOptions: () => Promise.resolve(mocks.options),
  isSubscribed: () => Promise.resolve(mocks.subscribed),
  subscribe: (...args: unknown[]) => mocks.subscribe(...args),
  restorePurchases: vi.fn().mockResolvedValue(false),
  manageSubscription: vi.fn(),
}))

import PaywallPage from '@/app/(app)/paywall/page'

const MONTHLY = { id: 'm', period: 'monthly' as const, title: 'Monthly', price: '$14.99', productId: 'app.fiqr.plus.monthly' }
const YEARLY = { id: 'y', period: 'yearly' as const, title: 'Yearly', price: '$99.99', productId: 'app.fiqr.plus.yearly' }

beforeEach(() => {
  mocks.options = [MONTHLY, YEARLY]
  mocks.subscribed = false
  mocks.subscribe.mockReset()
  mocks.replace.mockReset()
})

describe('PaywallPage', () => {
  it('selects yearly by default and moves the selection when monthly is tapped', async () => {
    render(<PaywallPage />)
    const yearly = await screen.findByRole('radio', { name: /Yearly/ })
    const monthly = screen.getByRole('radio', { name: /Monthly/ })
    expect(yearly).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(monthly)
    expect(monthly).toHaveAttribute('aria-checked', 'true')
    expect(yearly).toHaveAttribute('aria-checked', 'false')
  })

  it('says the purchase did not go through when the store returns no entitlement', async () => {
    mocks.subscribe.mockResolvedValue(false)
    render(<PaywallPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Start FIQR Plus' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("haven't been charged")
    expect(mocks.subscribe).toHaveBeenCalledWith(YEARLY)
    expect(mocks.replace).not.toHaveBeenCalled()
  })

  it('shows the waiting label while the store sheet is open', async () => {
    mocks.subscribe.mockReturnValue(new Promise(() => {}))
    render(<PaywallPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Start FIQR Plus' }))
    expect(await screen.findByRole('button', { name: 'Waiting for the App Store…' })).toBeDisabled()
  })

  it('shows the current plan instead of the choice for a subscriber', async () => {
    mocks.subscribed = true
    render(<PaywallPage />)
    expect(await screen.findByText("You're on FIQR Plus")).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restore purchases' })).not.toBeInTheDocument()
  })
})
