'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { GeoLine } from '@/components/ui/fiqr/geo-line'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { platform } from '@/lib/platform'
import {
  getSubscriptionOptions,
  isSubscribed,
  manageSubscription,
  restorePurchases,
  subscribe,
  type SubscriptionOption,
} from '@/lib/platform/purchases'

// shortcut: placeholder benefits until George decides what sits behind the paywall (SOW §4.6, week 6).
const BENEFITS = [
  { title: 'Unlimited Geo coaching', sub: 'Ask anything, any time, about food and training' },
  { title: 'Photo and menu logging', sub: 'Snap a meal or a menu and Geo does the maths' },
  { title: 'Weekly check-in', sub: 'Targets that adjust to your real progress' },
  { title: 'Apple Health and Health Connect', sub: 'Steps, sleep, weight and workouts in one place' },
]

const APPLE_EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'

export default function PaywallPage() {
  const router = useRouter()
  const [options, setOptions] = useState<SubscriptionOption[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const os = platform()

  useEffect(() => {
    let active = true
    void (async () => {
      const [opts, entitled] = await Promise.all([getSubscriptionOptions(), isSubscribed()])
      if (!active) return
      setOptions(opts)
      setSelected(opts.find((o) => o.period === 'yearly')?.id ?? opts[0]?.id ?? null)
      setSubscribed(entitled)
    })()
    return () => { active = false }
  }, [])

  const start = async () => {
    const option = options?.find((o) => o.id === selected)
    if (!option) return
    setBusy(true)
    const ok = await subscribe(option)
    setBusy(false)
    if (ok) {
      toast.success('Welcome to FIQR Plus')
      router.replace('/dashboard')
    }
  }

  const restore = async () => {
    setBusy(true)
    const ok = await restorePurchases()
    setBusy(false)
    if (ok) {
      toast.success('Subscription restored')
      router.replace('/dashboard')
    } else {
      toast('No active subscription found')
    }
  }

  return (
    <PageWrapper className="pb-10">
      <button type="button" aria-label="Back" onClick={() => router.back()} className="-ml-1 h-10 w-10 text-ink">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
      </button>

      <h1 className="mt-2 text-[28px] font-bold leading-[1.1] tracking-[-0.6px] text-ink">FIQR Plus</h1>
      <GeoLine>Coaching that adapts to what you <em className="not-italic font-semibold text-ink underline decoration-accent decoration-2 underline-offset-[3px]">actually</em> do.</GeoLine>

      <SectionLabel className="mt-2">What you get</SectionLabel>
      <ul className="mt-2 divide-y divide-ink-09 rounded-[16px] border border-ink-12 bg-card">
        {BENEFITS.map((b) => (
          <li key={b.title} className="flex items-start gap-3 px-[14px] py-3">
            <svg viewBox="0 0 24 24" className="mt-[2px] h-5 w-5 shrink-0 text-ink" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            <div>
              <div className="text-[15.5px] font-semibold text-ink">{b.title}</div>
              <div className="text-[13px] text-ink-65">{b.sub}</div>
            </div>
          </li>
        ))}
      </ul>

      {subscribed ? (
        <div className="mt-6 rounded-[16px] bg-ink-08 p-[14px]">
          <div className="text-[15.5px] font-semibold text-ink">You&apos;re on FIQR Plus</div>
          <button type="button" onClick={() => void manageSubscription()} className="mt-1 text-[13.5px] font-semibold text-ink-65">
            Manage subscription
          </button>
        </div>
      ) : options === null ? (
        <div className="mt-6 h-[136px] animate-pulse rounded-[16px] bg-ink-08" aria-busy="true" />
      ) : options.length === 0 ? (
        <p className="mt-6 rounded-[16px] bg-ink-08 p-[14px] text-[15.5px] text-ink-80">
          Subscriptions are available in the FIQR app on iPhone and Android.
        </p>
      ) : (
        <>
          <SectionLabel className="mt-6">Choose a plan</SectionLabel>
          <div role="radiogroup" aria-label="Plan" className="mt-2 grid gap-[10px]">
            {options.map((o) => {
              const on = o.id === selected
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSelected(o.id)}
                  className={`flex items-center gap-3 rounded-[16px] bg-card px-[14px] py-[13px] text-left ${on ? 'border-2 border-ink' : 'border border-ink-12'}`}
                >
                  <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${on ? 'bg-ink' : 'border border-ink-16'}`}>
                    {on && <span className="h-2 w-2 rounded-full bg-cream" />}
                  </span>
                  <span className="flex-1 text-[15.5px] font-semibold text-ink">{o.period === 'yearly' ? 'Yearly' : 'Monthly'}</span>
                  <span className="text-[15.5px] font-semibold text-ink">{o.price}</span>
                  <span className="text-[13px] text-ink-65">/ {o.period === 'yearly' ? 'year' : 'month'}</span>
                </button>
              )
            })}
          </div>

          <PrimaryButton className="mt-6 justify-center" disabled={busy || !selected} onClick={() => void start()}>
            {busy ? 'Working…' : 'Start FIQR Plus'}
          </PrimaryButton>
        </>
      )}

      {!subscribed && (
        <button type="button" disabled={busy} onClick={() => void restore()} className="mt-4 w-full text-center text-[15.5px] font-semibold text-ink-65">
          Restore purchases
        </button>
      )}

      <p className="mt-6 text-[12px] leading-[1.5] text-ink-65">
        Payment is charged to your {os === 'android' ? 'Google Play account' : 'Apple ID'} when you confirm. The subscription renews
        automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel any time in your
        account settings.{' '}
        <Link href="/privacy" className="font-semibold text-ink-65 underline">Privacy policy</Link>
        {' · '}
        <a href={APPLE_EULA} className="font-semibold text-ink-65 underline">Terms of use</a>
      </p>
    </PageWrapper>
  )
}
