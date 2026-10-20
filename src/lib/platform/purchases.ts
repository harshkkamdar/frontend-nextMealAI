import { isNative, platform } from './index'
import { kvGet, kvSet } from './storage'

export const IOS_PRODUCT_IDS = ['app.fiqr.plus.monthly', 'app.fiqr.plus.yearly'] as const
export const ANDROID_PRODUCT_ID = 'fiqr_plus'

export interface SubscriptionOption {
  id: string
  period: 'monthly' | 'yearly'
  title: string
  price: string
  productId: string
  planIdentifier?: string
  offerToken?: string
}

export async function getSubscriptionOptions(): Promise<SubscriptionOption[]> {
  if (!isNative()) return []
  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases')
    if (platform() === 'ios') {
      const { products } = await NativePurchases.getProducts({
        productIdentifiers: [...IOS_PRODUCT_IDS],
        productType: PURCHASE_TYPE.SUBS,
      })
      return products
        .map((product) => ({
          id: product.identifier,
          period: product.identifier.endsWith('.yearly') ? 'yearly' as const : 'monthly' as const,
          title: product.title,
          price: product.priceString,
          productId: product.identifier,
        }))
        .sort((a, b) => a.period === b.period ? 0 : a.period === 'monthly' ? -1 : 1)
    }

    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [ANDROID_PRODUCT_ID],
      productType: PURCHASE_TYPE.SUBS,
    })
    return products
      .flatMap<SubscriptionOption>((product) => {
        const planIdentifier = product.identifier === 'monthly' || product.identifier === 'yearly'
          ? product.identifier
          : product.planIdentifier
        if (planIdentifier !== 'monthly' && planIdentifier !== 'yearly') return []
        return [{
          id: `${ANDROID_PRODUCT_ID}:${planIdentifier}`,
          period: planIdentifier,
          title: product.title,
          price: product.priceString,
          productId: ANDROID_PRODUCT_ID,
          planIdentifier,
          offerToken: product.offerToken,
        }]
      })
      .sort((a, b) => a.period === b.period ? 0 : a.period === 'monthly' ? -1 : 1)
  } catch {
    return []
  }
}

export async function subscribe(option: SubscriptionOption): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases')
    await NativePurchases.purchaseProduct({
      productIdentifier: option.productId,
      planIdentifier: option.planIdentifier,
      offerToken: option.offerToken,
      productType: PURCHASE_TYPE.SUBS,
      autoAcknowledgePurchases: true,
    })
    return isSubscribed()
  } catch {
    return false
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { NativePurchases } = await import('@capgo/native-purchases')
    await NativePurchases.restorePurchases()
    return isSubscribed()
  } catch {
    return false
  }
}

export async function isSubscribed(): Promise<boolean> {
  if (!isNative()) return false
  let subscribed: boolean
  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases')
    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.SUBS,
      onlyCurrentEntitlements: true,
    })
    const productIds: readonly string[] = [...IOS_PRODUCT_IDS, ANDROID_PRODUCT_ID]
    const activeStates = ['subscribed', 'inGracePeriod', 'inBillingRetryPeriod']
    subscribed = purchases.some((purchase) =>
      productIds.includes(purchase.productIdentifier)
      && (purchase.isActive === true || (purchase.subscriptionState !== undefined && activeStates.includes(purchase.subscriptionState)))
    )
  } catch {
    try {
      return (await kvGet('fiqr:subscribed')) === '1'
    } catch {
      return false
    }
  }
  try {
    await kvSet('fiqr:subscribed', subscribed ? '1' : '0')
  } catch {
    // A cache failure must not hide a verified native entitlement.
  }
  return subscribed
}

export async function manageSubscription(): Promise<void> {
  if (!isNative()) return
  try {
    const { NativePurchases } = await import('@capgo/native-purchases')
    await NativePurchases.manageSubscriptions()
  } catch {
    // Native settings are optional and should not break the Settings screen.
  }
}
