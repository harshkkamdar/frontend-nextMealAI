'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { toast } from 'sonner'
import { PushedHeader } from '@/components/layout/screen-header'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { OfflineBand } from '@/components/shared/offline-band'
import { GROUP_CARD } from '@/components/settings/settings-section'
import { per, renewalLine } from '@/components/settings/paywall-copy'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { reducedFade, spring } from '@/lib/motion'
import { goBack } from '@/lib/navigation'
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

// shortcut: placeholder benefits until the client decides what sits behind the paywall (SOW 4.6, week 6).
const BENEFITS = [
  { title: 'Unlimited Geo coaching', sub: 'Ask anything about food and training, any time' },
  { title: 'Photo and menu logging', sub: 'Snap a meal or a menu and Geo does the maths' },
  { title: 'Weekly check-in', sub: 'Targets that adjust to your real progress' },
  { title: 'Apple Health and Health Connect', sub: 'Steps, sleep, weight and workouts in one place' },
]

const APPLE_EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'

/**
 * One plan of the depth stack (mock "Depth stack"): the chosen plan sits in front with its price large; the other
 * steps back 60 pt behind it, smaller and lighter, with its name and radio peeking over the top, and comes forward on
 * tap. The pair trade places half way, where both cards are the same size, so the swap never shows.
 */
function PlanCard({ option, on, busy, onPick }: { option: SubscriptionOption; on: boolean; busy: boolean; onPick: () => void }) {
  const reduce = useReducedMotion()
  const front = useMotionValue(on ? 1 : 0)
  useEffect(() => {
    const run = animate(front, on ? 1 : 0, reduce ? reducedFade : spring.sheet)
    return () => run.stop()
  }, [on, front, reduce])
  const y = useTransform(front, [0, 1], [-60, 0])
  const scale = useTransform(front, [0, 1], [0.92, 1])
  const opacity = useTransform(front, [0, 1], [0.78, 1])
  const zIndex = useTransform(front, (v) => (v > 0.5 ? 2 : 1))
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={on}
      disabled={busy}
      onClick={onPick}
      style={{ y, scale, opacity, zIndex }}
      className="absolute inset-x-0 bottom-0 flex h-[180px] origin-top flex-col rounded-card bg-card p-4 text-left shadow-[0_1px_2px_rgba(17,28,53,.04)]"
    >
      {/* Ring and lift shadow of the front card: their own layer, faded, so no shadow value animates. */}
      <motion.span aria-hidden="true" style={{ opacity: front }} className="pointer-events-none absolute inset-0 rounded-card shadow-[0_0_0_1.5px_#111C35,0_22px_34px_-18px_rgba(17,28,53,.45)]" />
      <span className="flex w-full items-center gap-2">
        <span className="min-w-0 flex-1 text-caption font-semibold text-ink">{option.period === 'yearly' ? 'Yearly' : 'Monthly'}</span>
        <span aria-hidden="true" className="relative size-[22px] shrink-0 rounded-full shadow-[inset_0_0_0_1.5px_rgba(17,28,53,.22)]">
          <span className={cn('absolute inset-0 rounded-full shadow-[inset_0_0_0_7px_#111C35] transition-opacity duration-150', on ? 'opacity-100' : 'opacity-0')} />
        </span>
      </span>
      <span className="mt-auto block text-[30px] font-extrabold leading-none tracking-[-0.02em] text-ink tabular-nums [font-stretch:106%]">{option.price}</span>
      <span className="mt-1 block text-caption leading-[1.35] text-ink-65">{per(option)}</span>
    </motion.button>
  )
}

export default function PaywallPage() {
  const router = useRouter()
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

  const chosen = options?.find((o) => o.id === selected)

  const start = async () => {
    if (!chosen) return
    setBusy(true)
    setFailed(false)
    const ok = await subscribe(chosen)
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
    <div className="mx-auto w-full max-w-md px-gutter pb-[calc(var(--safe-bottom)+32px)]">
      <PushedHeader title="FIQR Plus" onBack={() => goBack(router, '/settings')} />
      <div className="-mx-gutter mb-2.5 [&:empty]:hidden"><OfflineBand /></div>

      <div className="enter-rows mt-0.5 flex flex-col">
        <header className="mx-1 flex items-start gap-2.5">
          <GeoAvatar size={28} />
          <h1 className="text-hero leading-[1.15] text-balance text-ink">Coaching that keeps up with you</h1>
        </header>

        {subscribed ? (
          <section className={cn(GROUP_CARD, 'mt-4 p-4')} aria-label="Your plan">
            <p className="text-headline text-ink">You&apos;re on FIQR Plus</p>
            <p className="mt-1 text-body-sm text-ink-65">Change or cancel it any time in {store}.</p>
            <button
              type="button"
              onClick={() => void manageSubscription()}
              className="mt-4 h-btn w-full rounded-full bg-ink text-body font-bold text-cream transition-transform duration-100 active:scale-[.97]"
            >
              Manage subscription
            </button>
          </section>
        ) : options === null ? (
          <div role="status" aria-busy="true" aria-label="Loading plans" className="mt-4 grid grid-cols-2 gap-2.5">
            {[0, 1].map((key) => (
              <div key={key} className={cn(GROUP_CARD, 'flex h-[128px] flex-col justify-between p-4')}>
                <span className="h-3 w-16 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-ink-06" />
                <span className="h-5 w-24 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-ink-06" />
              </div>
            ))}
          </div>
        ) : options.length === 0 ? (
          <p className={`${GROUP_CARD} mt-4 px-4 py-3.5 text-body leading-[1.45] text-ink`}>
            FIQR Plus is sold in the FIQR app on iPhone and Android. Open it there to subscribe.
          </p>
        ) : (
          <section aria-label="Choose a plan">
            <div role="radiogroup" aria-label="Plan" className="relative mt-1 h-[244px]">
              {options.map((o) => (
                <PlanCard key={o.id} option={o} on={o.id === selected} busy={busy} onPick={() => { setSelected(o.id); setFailed(false) }} />
              ))}
            </div>

            {failed ? (
              <p role="alert" className="mx-1 mt-3 text-body-sm leading-[1.45] text-ink">
                <b className="font-bold">That didn&apos;t go through, and you haven&apos;t been charged.</b> Try again, or restore if you&apos;ve subscribed before.
              </p>
            ) : null}
            {chosen ? <p className="mx-1 mt-3 text-caption leading-[1.45] text-ink-65">{renewalLine(chosen)}</p> : null}

            <PrimaryButton className="mt-4 justify-center" disabled={busy || !chosen} onClick={() => void start()}>
              {busy ? `Waiting for ${store}…` : chosen ? `Start FIQR Plus, ${chosen.price} ${per(chosen)}` : 'Start FIQR Plus'}
            </PrimaryButton>
          </section>
        )}

        <h2 className="mb-[7px] mt-[22px] px-4 text-caption font-semibold text-ink-65">What you get</h2>
        <ul aria-label="What you get" className={GROUP_CARD}>
          {BENEFITS.map(({ title, sub }, index) => (
            <li key={title} className={cn('relative py-3 pl-[18px] pr-4', index > 0 && "before:absolute before:left-4 before:right-0 before:top-0 before:h-px before:bg-ink-08 before:content-['']")}>
              <span className="block text-body font-semibold text-ink-65">{title}</span>
              <span className="mt-px block text-[13.5px] leading-[1.4] text-ink-65">{sub}</span>
            </li>
          ))}
        </ul>

        {!subscribed && options?.length !== 0 ? (
          <button type="button" disabled={busy} onClick={() => void restore()} className="mt-3 min-h-11 w-full text-center text-body font-bold text-ink disabled:text-ink-65">
            Restore purchases
          </button>
        ) : null}

        <p className="mx-1 mt-3 text-[12.5px] leading-[1.5] text-ink-65">
          Payment is charged to your {os === 'android' ? 'Google Play account' : 'Apple ID'} when you confirm. The subscription renews
          automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel any time in your
          account settings.
        </p>
        <p className="mx-1 mt-1 flex gap-4 text-[14px]">
          <Link href="/privacy" className="inline-flex min-h-11 items-center font-semibold text-ink-65 underline underline-offset-4">Privacy policy</Link>
          <a href={APPLE_EULA} className="inline-flex min-h-11 items-center font-semibold text-ink-65 underline underline-offset-4">Terms of use</a>
        </p>
      </div>
    </div>
  )
}
