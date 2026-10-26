import type { Metadata } from 'next'
import Link from 'next/link'

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@fiqr.app'

export const metadata: Metadata = {
  title: 'Support',
}

const QUESTIONS = [
  { q: 'Geo logged the wrong thing', a: 'Open the entry in Food, tap it, and fix the amount or the food. Geo learns your usual servings over time.' },
  { q: 'Photo estimates look off', a: "They're estimates. Tell Geo the portion or the brand and it corrects the numbers." },
  { q: "Notifications aren't arriving", a: "Check Settings, then Reminders in FIQR, and your phone's notification settings for FIQR." },
]

export default function SupportPage() {
  return (
    <main>
      <h1>Need a hand?</h1>
      <p>Email us and a person replies within two business days.</p>
      <a
        data-action
        href={`mailto:${SUPPORT_EMAIL}`}
        className="mt-5 flex h-btn w-full items-center justify-center rounded-full bg-ink text-body font-bold text-cream transition-transform duration-100 active:scale-[.97]"
      >
        Email {SUPPORT_EMAIL}
      </a>

      <h2>Common questions</h2>
      {QUESTIONS.map(({ q, a }) => (
        <section key={q}>
          <h3>{q}</h3>
          <p>{a}</p>
        </section>
      ))}

      <h2>Your account and data</h2>
      <p>
        <Link href="/delete-account">Delete your FIQR account</Link> or read how we handle your data in the{' '}
        <Link href="/privacy">privacy policy</Link>.
      </p>
    </main>
  )
}
