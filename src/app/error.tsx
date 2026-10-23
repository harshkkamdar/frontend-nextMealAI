'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <PageWrapper>
      <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Something went wrong</h1>
      {/* The raw message (chunk paths, stack text) means nothing to a user; it stays in the console. */}
      <p className="mt-1 text-[15.5px] text-ink-65">This screen didn&apos;t load. Try again, or restart the app if it keeps happening.</p>
      <button type="button" onClick={reset} className="mt-5 h-14 w-full rounded-[15px] bg-ink text-cream font-bold text-[18px]">Try again</button>
    </PageWrapper>
  )
}
