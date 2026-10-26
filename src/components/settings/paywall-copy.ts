import type { SubscriptionOption } from '@/lib/platform/purchases'

/** "a year" / "a month": the period after a store price. */
export const per = (option: Pick<SubscriptionOption, 'period'>) => (option.period === 'yearly' ? 'a year' : 'a month')

/** The date a plan bought `now` first renews: one period later (a month-end start lands on the next month's last day). */
export function renewsOn(option: Pick<SubscriptionOption, 'period'>, now = new Date()): Date {
  const next = new Date(now)
  if (option.period === 'yearly') next.setFullYear(next.getFullYear() + 1)
  else next.setMonth(next.getMonth() + 1, Math.min(now.getDate(), new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate()))
  return next
}

/** The auto-renew disclosure under the plans; the price is the store's own string, never a hardcoded one. */
export function renewalLine(option: Pick<SubscriptionOption, 'period' | 'price'>, now = new Date()): string {
  const date = renewsOn(option, now).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  return `Renews ${date} at ${option.price} unless you cancel at least 24 hours before.`
}
