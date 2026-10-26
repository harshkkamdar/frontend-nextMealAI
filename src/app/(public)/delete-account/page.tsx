'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'

import { fieldClass } from '@/components/ui/fiqr/field'
import { API_BASE } from '@/lib/api/client'

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@fiqr.app'

const labelClass = 'block text-[15px] font-semibold text-ink'

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
      <h1>Delete your FIQR account</h1>
      <p>
        The fastest way is inside the app: Settings, then Delete account. It removes your profile, logs, plans, check-ins, photos and chats straight away, for good.
      </p>

      <h2>Can&apos;t open the app?</h2>

      {submissionState === 'success' ? (
        <div role="status" className="mt-4 rounded-[24px] bg-card px-5 py-4 shadow-[var(--shadow-card)]">
          <p className="mt-0! text-ink!">Request received. We&apos;ll confirm by email within two business days.</p>
        </div>
      ) : (
        <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
          <p>Send us the email on your account and we&apos;ll delete it for you.</p>
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
              className={`${fieldClass} h-auto min-h-28 py-4`}
            />
          </div>

          {/* A deletion is destructive, so its action is ink, not orange (D2 convention). */}
          <button
            type="submit"
            disabled={submissionState === 'submitting'}
            className="flex h-btn w-full items-center justify-center rounded-full bg-ink text-body font-bold text-cream transition-transform duration-100 enabled:active:scale-[.97] disabled:opacity-60"
          >
            Request deletion
          </button>

          {submissionState === 'error' ? (
            <p role="alert" className="text-ink!">
              Something went wrong. Email {SUPPORT_EMAIL} instead.
            </p>
          ) : null}
        </form>
      )}

      <h2>What goes</h2>
      <p>
        Deleting your account removes all the personal data listed in our{' '}
        <Link href="/privacy">privacy policy</Link>. Anonymous, combined statistics aren&apos;t personal data and stay.
      </p>
    </main>
  )
}
