'use client'

import { StatusScreen, statusActionClass } from '@/components/ui/fiqr/status-screen'

// The raw message (chunk paths, stack text) means nothing to a user; it stays in the console.
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <StatusScreen title="Something went wrong" action={<button type="button" onClick={reset} className={statusActionClass}>Try again</button>}>
      This screen didn&apos;t load. Try again, and if it keeps happening, close and reopen the app.
    </StatusScreen>
  )
}
