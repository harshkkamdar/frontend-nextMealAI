'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'

import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { API_BASE } from '@/lib/api/client'

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@fiqr.app'

const headingClass = 'text-[28px] font-bold leading-tight tracking-[-0.6px]'
const sectionClass = 'mt-8 text-[17px] font-bold'
const paragraphClass = 'mt-3 text-[15.5px] font-normal leading-[1.5] text-ink-80'
const labelClass = 'text-[15.5px] font-semibold text-ink'
const fieldClass = 'h-14 rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] w-full text-ink outline-none focus:border-ink'

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error'

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmissionState('submitting')

    try {
      const response = await fetch(`${API_BASE}/v1/account/deletion-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, note }),
      })

      setSubmissionState(response.status === 202 ? 'success' : 'error')
    } catch {
      setSubmissionState('error')
    }
  }

  return (
    <main>
      <h1 className={headingClass}>Delete your FIQR account</h1>
      <p className={paragraphClass}>
        The fastest way is inside the app: Settings › Delete account. It removes your profile, logs, plans, check-ins, photos and chats immediately and permanently.
      </p>

      <h2 className={sectionClass}>Can&apos;t open the app?</h2>

      {submissionState === 'success' ? (
        <p className={paragraphClass}>
          Request received. We&apos;ll confirm by email within two business days.
        </p>
      ) : (
        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="deletion-email" className={labelClass}>Email</label>
            <input
              id="deletion-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="deletion-note" className={labelClass}>Note (optional)</label>
            <textarea
              id="deletion-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={`${fieldClass} min-h-28 py-4`}
            />
          </div>

          <PrimaryButton type="submit" disabled={submissionState === 'submitting'} className="justify-center">
            Request deletion
          </PrimaryButton>

          {submissionState === 'error' ? (
            <p className={paragraphClass}>
              Something went wrong. Email {SUPPORT_EMAIL} instead.
            </p>
          ) : null}
        </form>
      )}

      <p className={paragraphClass}>
        Deleting your account removes all personal data listed in our{' '}
        <Link href="/privacy" className="font-semibold text-ink underline decoration-ink-35 underline-offset-4">privacy policy</Link>. Anonymous, aggregated statistics are not personal data and are not affected.
      </p>
    </main>
  )
}
