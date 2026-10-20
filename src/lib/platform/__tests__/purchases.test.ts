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

import { getSubscriptionOptions, isSubscribed } from '@/lib/platform/purchases'

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
        { identifier: 'yearly', title: 'Yearly', priceString: '$49.99', offerToken: 'year-offer' },
        { identifier: 'monthly', title: 'Monthly', priceString: '$4.99', offerToken: 'month-offer' },
      ],
    })

    await expect(getSubscriptionOptions()).resolves.toEqual([
      {
        id: 'fiqr_plus:monthly',
        period: 'monthly',
        title: 'Monthly',
        price: '$4.99',
        productId: 'fiqr_plus',
        planIdentifier: 'monthly',
        offerToken: 'month-offer',
      },
      {
        id: 'fiqr_plus:yearly',
        period: 'yearly',
        title: 'Yearly',
        price: '$49.99',
        productId: 'fiqr_plus',
        planIdentifier: 'yearly',
        offerToken: 'year-offer',
      },
    ])
  })
})
