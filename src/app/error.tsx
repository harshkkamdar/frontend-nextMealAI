'use client'

import { toast } from 'sonner'
import { StatusCard, statusActionClass, statusSecondaryClass } from '@/components/settings/status-card'

// The raw message (chunk paths, stack text) means nothing to a user; it stays in the console. The code is for support.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const code = error.digest ?? error.name
  const copy = () => {
    void navigator.clipboard?.writeText(code).then(() => toast('Error code copied'), () => toast.error("Couldn't copy the code"))
  }
  return (
    <StatusCard
      title="Something went wrong"
      action={<button type="button" onClick={reset} className={statusActionClass}>Try again</button>}
      secondary={<button type="button" onClick={copy} className={statusSecondaryClass}>Copy error code</button>}
    >
      This screen didn&apos;t load. Try again, and if it keeps happening, close and reopen the app. Everything you&apos;ve logged is safe.
    </StatusCard>
  )
}
