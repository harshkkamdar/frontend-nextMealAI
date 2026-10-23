import type { Metadata } from 'next'
import Link from 'next/link'

import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@fiqr.app'

const headingClass = 'text-[28px] font-bold leading-tight tracking-[-0.6px]'
const sectionClass = 'mt-8 text-[17px] font-bold'
const paragraphClass = 'mt-3 text-[15.5px] font-normal leading-[1.5] text-ink-80'
const questionClass = 'mt-5 text-[15.5px] font-bold'
const linkClass = 'font-semibold text-ink underline decoration-ink-35 underline-offset-4'

export const metadata: Metadata = {
  title: 'Support',
}

export default function SupportPage() {
  return (
    <main>
      <h1 className={headingClass}>Need a hand?</h1>
      <p className={paragraphClass}>
        Email us at {SUPPORT_EMAIL} and we&apos;ll reply within two business days.
      </p>
      <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-6 block">
        <SecondaryButton onNavy={false} type="button">Email support</SecondaryButton>
      </a>

      <h2 className={sectionClass}>Common questions</h2>

      <h3 className={questionClass}>Geo logged the wrong thing</h3>
      <p className={paragraphClass}>
        Open the entry in Food, tap the pencil, and fix it. Geo learns your usual servings over time.
      </p>

      <h3 className={questionClass}>Photo estimates look off</h3>
      <p className={paragraphClass}>
        They&apos;re estimates. Tell Geo the portion or the brand and it will correct the numbers.
      </p>

      <h3 className={questionClass}>Notifications aren&apos;t arriving</h3>
      <p className={paragraphClass}>
        Check Settings › Notifications in FIQR and in your phone&apos;s notification settings.
      </p>

      <h2 className={sectionClass}>Delete your account</h2>
      <p className={paragraphClass}>
        <Link href="/delete-account" className={linkClass}>Delete your FIQR account</Link>
      </p>

      <h2 className={sectionClass}>Privacy</h2>
      <p className={paragraphClass}>
        <Link href="/privacy" className={linkClass}>Read the FIQR privacy policy</Link>
      </p>
    </main>
  )
}
