'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GeoLine } from '@/components/ui/fiqr/geo-line'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { StepIndicator } from '@/components/onboarding/step-indicator'
import { updateProfile } from '@/lib/api/profile.api'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboarding.store'

function ConsentCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: React.ReactNode
}) {
  return (
    <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[12px] text-[15.5px] font-semibold text-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex size-[22px] shrink-0 items-center justify-center rounded-[6px]',
          checked ? 'bg-ink' : 'border border-ink-16 bg-card'
        )}
      >
        {checked ? (
          <svg viewBox="0 0 16 16" className="size-4 text-cream" fill="none">
            <path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      {children}
    </label>
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
      router.push(next?.startsWith('/') && !next.startsWith('//') ? next : '/onboarding/generating')
    } catch {
      toast.error("Couldn't save. Try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <StepIndicator currentStep={4} />
      <h1 className="mt-6 text-[22px] font-semibold tracking-[-0.4px] text-ink">Before Geo starts</h1>
      <GeoLine>Two things I need you to know, then we build your plan.</GeoLine>

      <section className="mt-4 rounded-[16px] border border-ink-12 bg-card p-[14px]">
        <SectionLabel>How your data is used</SectionLabel>
        <p className="mt-2 text-[15.5px] font-normal leading-[1.45] text-ink-80">
          To coach you, FIQR sends what you log — food, photos, weight and body measurements, workouts and your messages to Geo — to the AI model providers listed in our privacy policy. They process it to generate your plan and Geo&apos;s replies. We never sell your data or use it for advertising.
        </p>
        <Link href="/privacy" className="mt-3 inline-block min-h-11 py-3 font-semibold text-ink underline decoration-ink-35 underline-offset-4">
          Read the privacy policy
        </Link>
        <ConsentCheckbox checked={aiConsent} onChange={setAiConsent}>
          I understand and agree
        </ConsentCheckbox>
      </section>

      <section className="mt-4 rounded-[16px] border border-ink-12 bg-card p-[14px]">
        <SectionLabel>Not medical advice</SectionLabel>
        <p className="mt-2 text-[15.5px] font-normal leading-[1.45] text-ink-80">
          FIQR is a wellness and fitness coaching app, not a medical device. Geo doesn&apos;t diagnose or treat conditions or advise on medication. If you&apos;re pregnant, under 18, or managing a health condition or eating disorder, check any plan with your doctor first.
        </p>
        <ConsentCheckbox checked={healthDisclaimerAck} onChange={setHealthDisclaimerAck}>
          I understand
        </ConsentCheckbox>
      </section>

      <PrimaryButton
        type="button"
        disabled={!aiConsent || !healthDisclaimerAck || isSaving}
        onClick={handleContinue}
        className="mt-5 justify-center"
      >
        Agree and continue
      </PrimaryButton>
    </div>
  )
}
