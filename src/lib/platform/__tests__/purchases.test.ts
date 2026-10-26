import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  native: false,
  currentPlatform: 'web' as 'ios' | 'android' | 'web',
  getProducts: vi.fn(),
  getPurchases: vi.fn(),
  kvSet: vi.fn(),
}))

vi.mock('@/lib/platform', () => ({
  isNative: () => mocks.native,
  platform: () => mocks.currentPlatform,
}))

vi.mock('@/lib/platform/storage', () => ({
  kvGet: vi.fn().mockResolvedValue(null),
  kvSet: mocks.kvSet,
}))

vi.mock('@capgo/native-purchases', () => ({
  PURCHASE_TYPE: { SUBS: 'subs' },
  NativePurchases: {
    getProducts: mocks.getProducts,
    getPurchases: mocks.getPurchases,
  },
}))

import { getActiveSubscription, getSubscriptionOptions, isSubscribed } from '@/lib/platform/purchases'

describe('purchase platform adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.native = false
    mocks.currentPlatform = 'web'
  })

  it('returns no products or entitlement on the web', async () => {
    await expect(getSubscriptionOptions()).resolves.toEqual([])
    await expect(isSubscribed()).resolves.toBe(false)
  })

  it('recognises an active FIQR iOS subscription', async () => {
    mocks.native = true
    mocks.currentPlatform = 'ios'
    mocks.getPurchases.mockResolvedValue({
      purchases: [{ productIdentifier: 'app.fiqr.plus.monthly', isActive: true }],
    })

    await expect(isSubscribed()).resolves.toBe(true)
    expect(mocks.kvSet).toHaveBeenCalledWith('fiqr:subscribed', '1')
  })

  it('does not recognise a revoked iOS subscription', async () => {
    mocks.native = true
    mocks.currentPlatform = 'ios'
    mocks.getPurchases.mockResolvedValue({
      purchases: [{
        productIdentifier: 'app.fiqr.plus.yearly',
        isActive: false,
        subscriptionState: 'revoked',
      }],
    })

    await expect(isSubscribed()).resolves.toBe(false)
    expect(mocks.kvSet).toHaveBeenCalledWith('fiqr:subscribed', '0')
  })

  it('maps Android base plans to subscription options', async () => {
    mocks.native = true
    mocks.currentPlatform = 'android'
    mocks.getProducts.mockResolvedValue({
      products: [
        { identifier: 'yearly', title: 'Yearly', price: 49.99, priceString: '$49.99', currencyCode: 'AUD', offerToken: 'year-offer' },
        { identifier: 'monthly', title: 'Monthly', price: 4.99, priceString: '$4.99', currencyCode: 'AUD', offerToken: 'month-offer' },
      ],
    })

    await expect(getSubscriptionOptions()).resolves.toEqual([
      {
        id: 'fiqr_plus:monthly',
        period: 'monthly',
        title: 'Monthly',
        price: '$4.99',
        amount: 4.99,
        currency: 'AUD',
        productId: 'fiqr_plus',
        planIdentifier: 'monthly',
        offerToken: 'month-offer',
      },
      {
        id: 'fiqr_plus:yearly',
        period: 'yearly',
        title: 'Yearly',
        price: '$49.99',
        amount: 49.99,
        currency: 'AUD',
        productId: 'fiqr_plus',
        planIdentifier: 'yearly',
        offerToken: 'year-offer',
      },
    ])
  })

  it('reads the active iOS plan, renewal date and cancel flag from the entitlement', async () => {
    mocks.native = true
    mocks.currentPlatform = 'ios'
    mocks.getPurchases.mockResolvedValue({
      purchases: [
        { productIdentifier: 'other.app.product', isActive: true, willCancel: null },
        { productIdentifier: 'app.fiqr.plus.yearly', isActive: true, expirationDate: '2027-10-27T00:00:00Z', willCancel: false },
      ],
    })
    await expect(getActiveSubscription()).resolves.toEqual({ productId: 'app.fiqr.plus.yearly', period: 'yearly', renewsAt: '2027-10-27T00:00:00Z', willCancel: false })
  })

  it('has no period or renewal date on Android, where the plugin does not return them', async () => {
    mocks.native = true
    mocks.currentPlatform = 'android'
    mocks.getPurchases.mockResolvedValue({ purchases: [{ productIdentifier: 'fiqr_plus', subscriptionState: 'subscribed', willCancel: true }] })
    await expect(getActiveSubscription()).resolves.toEqual({ productId: 'fiqr_plus', period: null, renewsAt: null, willCancel: true })
  })

  it('returns null with no active entitlement, on failure, and on the web', async () => {
    mocks.native = true
    mocks.getPurchases.mockResolvedValue({ purchases: [{ productIdentifier: 'app.fiqr.plus.monthly', isActive: false, willCancel: null }] })
    await expect(getActiveSubscription()).resolves.toBeNull()
    mocks.getPurchases.mockRejectedValue(new Error('store down'))
    await expect(getActiveSubscription()).resolves.toBeNull()
    mocks.native = false
    await expect(getActiveSubscription()).resolves.toBeNull()
  })
})
