'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import { PushedHeader } from '@/components/layout/screen-header'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { OfflineBand } from '@/components/shared/offline-band'
import { CameraFill, ChartFill, GeoFill, StepsFill } from '@/components/ui/fiqr/icons'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { reducedFade, spring } from '@/lib/motion'
import { platform } from '@/lib/platform'
import {
  getSubscriptionOptions,
  isSubscribed,
  manageSubscription,
  restorePurchases,
  subscribe,
  type SubscriptionOption,
} from '@/lib/platform/purchases'
import { cn } from '@/lib/utils'

// shortcut: placeholder benefits until the client decides what sits behind the paywall (SOW §4.6, week 6).
const BENEFITS = [
  { icon: GeoFill, title: 'Unlimited Geo coaching', sub: 'Ask anything about food and training, any time' },
  { icon: CameraFill, title: 'Photo and menu logging', sub: 'Snap a meal or a menu and Geo does the maths' },
  { icon: ChartFill, title: 'Weekly check-in', sub: 'Targets that adjust to your real progress' },
  { icon: StepsFill, title: 'Apple Health and Health Connect', sub: 'Steps, sleep, weight and workouts in one place' },
]

const APPLE_EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'

const CARD = 'rounded-[24px] bg-card shadow-[var(--shadow-card)]'

export default function PaywallPage() {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [options, setOptions] = useState<SubscriptionOption[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const os = platform()
  const store = os === 'android' ? 'Google Play' : 'the App Store'

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
    setFailed(false)
    const ok = await subscribe(option)
    setBusy(false)
    if (ok) {
      toast.success('Welcome to FIQR Plus')
      router.replace('/dashboard')
    } else {
      setFailed(true)
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
    <div className="mx-auto w-full max-w-md px-4">
      <PushedHeader title="FIQR Plus" onBack={() => router.back()} />
      <div className="-mx-4 mb-4 [&:empty]:hidden"><OfflineBand /></div>

      <div className="enter-rows mt-1 flex flex-col gap-5">
        <header className="flex items-start gap-3 px-1">
          <GeoAvatar size={32} />
          <h1 className="font-wide text-[24px] font-bold leading-[1.15] tracking-[-0.4px] text-ink">Coaching that keeps up with what you actually do</h1>
        </header>

        <ul aria-label="What you get" className={cn(CARD, 'overflow-hidden')}>
          {BENEFITS.map(({ icon: Icon, title, sub }, index) => (
            <li key={title} className={cn('flex items-center gap-3 px-4 py-3', index > 0 && 'border-t border-ink-06')}>
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-06 text-ink"><Icon className="size-[18px]" /></span>
              <span className="min-w-0">
                <span className="block text-[15.5px] font-semibold text-ink">{title}</span>
                <span className="block text-[13.5px] leading-snug text-ink-65">{sub}</span>
              </span>
            </li>
          ))}
        </ul>

        {subscribed ? (
          <section className={cn(CARD, 'p-5')} aria-label="Your plan">
            <p className="font-wide text-[19px] font-bold text-ink">You&apos;re on FIQR Plus</p>
            <p className="mt-1 text-[14px] text-ink-65">Change or cancel it any time in {store}.</p>
            <button
              type="button"
              onClick={() => void manageSubscription()}
              className="mt-4 h-12 w-full rounded-[14px] bg-ink text-[16px] font-semibold text-cream transition-transform duration-100 active:scale-[.97]"
            >
              Manage subscription
            </button>
          </section>
        ) : options === null ? (
          <div role="status" aria-busy="true" aria-label="Loading plans" className="grid grid-cols-2 gap-[10px]">
            {[0, 1].map((key) => <div key={key} className="h-[112px] animate-[pulse_1.2s_ease-in-out_infinite] rounded-[22px] bg-card shadow-[var(--shadow-card)]" />)}
          </div>
        ) : options.length === 0 ? (
          <p className={cn(CARD, 'px-5 py-4 text-[15.5px] leading-[1.45] text-ink')}>
            FIQR Plus is sold in the FIQR app on iPhone and Android. Open it there to subscribe.
          </p>
        ) : (
          <section aria-label="Choose a plan">
            <div role="radiogroup" aria-label="Plan" className="grid grid-cols-2 gap-[10px]">
              {options.map((o) => {
                const on = o.id === selected
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={busy}
                    onClick={() => { setSelected(o.id); setFailed(false) }}
                    className="relative flex min-h-[112px] flex-col rounded-[22px] bg-card p-4 text-left shadow-[var(--shadow-card)] transition-transform duration-100 active:scale-[.98]"
                  >
                    {/* One ring travels between the plans (shared layout), never an orange fill. */}
                    {on ? (
                      <motion.span
                        layoutId="plan-ring"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-[22px] border-[1.5px] border-ink"
                        transition={reduce ? reducedFade : spring.lens}
                      />
                    ) : null}
                    <span className="flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-ink-65">{o.period === 'yearly' ? 'Yearly' : 'Monthly'}</span>
                      <span aria-hidden="true" className="relative size-[22px] rounded-full border-[1.5px] border-ink-20">
                        <span className={cn('absolute -inset-[1.5px] grid place-items-center rounded-full bg-ink transition-opacity duration-150', on ? 'opacity-100' : 'opacity-0')}>
                          <span className="size-2 rounded-full bg-cream" />
                        </span>
                      </span>
                    </span>
                    <span className="font-wide mt-auto block pt-3 text-[24px] font-bold leading-none tracking-[-0.4px] text-ink tabular-nums">{o.price}</span>
                    <span className="mt-1 block text-[13px] font-medium text-ink-65">per {o.period === 'yearly' ? 'year' : 'month'}</span>
                  </button>
                )
              })}
            </div>

            {failed ? (
              <p role="alert" className="mt-4 px-1 text-[14px] leading-[1.45] text-ink">
                That didn&apos;t go through, and you haven&apos;t been charged. Try again, or restore if you&apos;ve subscribed before.
              </p>
            ) : null}

            <PrimaryButton className="mt-5 justify-center" disabled={busy || !selected} onClick={() => void start()}>
              {busy ? `Waiting for ${store}…` : 'Start FIQR Plus'}
            </PrimaryButton>
          </section>
        )}

        <div>
          {!subscribed ? (
            <button type="button" disabled={busy} onClick={() => void restore()} className="min-h-11 w-full text-center text-[15.5px] font-semibold text-ink disabled:text-ink-65">
              Restore purchases
            </button>
          ) : null}

          <p className="mt-3 px-1 text-[12.5px] leading-[1.5] text-ink-65">
            Payment is charged to your {os === 'android' ? 'Google Play account' : 'Apple ID'} when you confirm. The subscription renews
            automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel any time in your
            account settings.
          </p>
          <p className="mt-1 flex gap-4 px-1 text-[12.5px]">
            <Link href="/privacy" className="inline-flex min-h-11 items-center font-semibold text-ink-65 underline underline-offset-4">Privacy policy</Link>
            <a href={APPLE_EULA} className="inline-flex min-h-11 items-center font-semibold text-ink-65 underline underline-offset-4">Terms of use</a>
          </p>
        </div>
      </div>
    </div>
  )
}
