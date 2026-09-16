'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <PageWrapper>
      <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Something went wrong.</h1>
      <p className="text-text-secondary text-sm">{error.message}</p>
      <button onClick={reset} className="mt-4 h-14 w-full rounded-[15px] bg-text-primary text-background font-bold text-[18px]">Try again</button>
    </PageWrapper>
  )
}
