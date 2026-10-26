'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { depthTo, leaveAurora } from '@/components/onboarding/depth-nav'
import { toast } from 'sonner'
import { OnboardingStep } from '@/components/onboarding/onboarding-step'
import { updateProfile } from '@/lib/api/profile.api'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboarding.store'

function ConsentCard({ title, checked, onChange, agree, i, children }: { title: string; checked: boolean; onChange: (checked: boolean) => void; agree: string; i: number; children: React.ReactNode }) {
  return (
    <section style={{ '--i': i } as React.CSSProperties} className="rise rounded-[var(--radius-card)] card-glass p-5">
      <h2 className="text-[17px] font-bold text-ink">{title}</h2>
      <div className="mt-2 text-[15.5px] leading-[1.5] text-ink-80">{children}</div>
      <label className="relative -mx-2 mt-3 flex min-h-12 cursor-pointer items-center gap-3 rounded-[12px] px-2 text-[16px] font-semibold text-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink">
        <input type="checkbox" checked={checked} onChange={(e) => { void haptic('light'); onChange(e.target.checked) }} className="sr-only" />
        <span aria-hidden="true" className={cn('grid size-6 shrink-0 place-items-center rounded-[7px] border-[1.5px] transition-colors', checked ? 'border-ink bg-ink text-cream' : 'border-ink-20')}>
          {checked ? <svg viewBox="0 0 16 16" className="pop size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg> : null}
        </span>
        {agree}
      </label>
    </section>
  )
}

export default function ConsentPage() {
  const router = useRouter()
  const [aiConsent, setAiConsent] = useState(false)
  const [healthDisclaimerAck, setHealthDisclaimerAck] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleContinue() {
    setIsSaving(true)
    try {
      await updateProfile({
        ai_consent: true,
        health_disclaimer_ack: true,
      } as unknown as Parameters<typeof updateProfile>[0])
      useOnboardingStore.getState().setConsent(true)
      // Existing users sent here by AuthGate already have plans; return them to the app.
      const next = new URLSearchParams(window.location.search).get('next')
      if (next?.startsWith('/') && !next.startsWith('//')) leaveAurora(() => router.push(next))
      else depthTo(() => router.push('/onboarding/generating'))
    } catch {
      toast.error("That didn't save. Check your connection and try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <OnboardingStep
      stepKey="consent"
      progress={1}
      question="Before Geo starts"
      why="Two things you should know, then Geo builds your plan."
      cta="I agree"
      canContinue={aiConsent && healthDisclaimerAck}
      busy={isSaving}
      onContinue={handleContinue}
    >
      <div className="flex flex-col gap-3">
        <ConsentCard i={2} title="How your data is used" checked={aiConsent} onChange={setAiConsent} agree="I understand and agree">
          <p>
            To coach you, FIQR sends what you log (food, photos, weight and body measurements, workouts and your messages to Geo) to the AI model providers listed in our privacy policy. They process it to generate your plan and Geo&apos;s replies. We never sell your data or use it for advertising.
          </p>
          <Link href="/privacy" className="mt-1 inline-flex min-h-11 items-center font-semibold text-ink underline decoration-ink-35 underline-offset-4">
            Read the privacy policy
          </Link>
        </ConsentCard>
        <ConsentCard i={3} title="Not medical advice" checked={healthDisclaimerAck} onChange={setHealthDisclaimerAck} agree="I understand">
          <p>
            FIQR is a wellness and fitness coaching app, not a medical device. Geo doesn&apos;t diagnose or treat conditions or advise on medication. If you&apos;re pregnant, under 18, or managing a health condition or eating disorder, check any plan with your doctor first.
          </p>
        </ConsentCard>
      </div>
    </OnboardingStep>
  )
}
