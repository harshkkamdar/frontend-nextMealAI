'use client'

import { useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from '@/components/ui/fiqr/icons'
import { RoundButton } from '@/components/ui/fiqr/round-button'

const noop = () => () => {}

/** Opened from Settings inside the app there is no browser back, so offer one when there is history. */
export function PublicBack() {
  const router = useRouter()
  const canGoBack = useSyncExternalStore(noop, () => window.history.length > 1, () => false)
  if (!canGoBack) return null
  return <RoundButton flat aria-label="Back" onClick={() => router.back()}><ChevronLeftIcon /></RoundButton>
}
