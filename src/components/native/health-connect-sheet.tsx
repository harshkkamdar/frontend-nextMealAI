'use client'

import { useState } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { connectHealth, healthLabel } from '@/lib/platform/health'

export function HealthConnectSheet({
  open,
  onClose,
  onConnected,
}: {
  open: boolean
  onClose: () => void
  onConnected: () => void
}) {
  const [failed, setFailed] = useState(false)
  const label = healthLabel()

  const connect = async () => {
    if (await connectHealth()) {
      onConnected()
      onClose()
      return
    }
    setFailed(true)
  }

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel={`Connect ${label}`}>
      <div className="px-gutter pb-6 pt-4">
        <h2 className="text-[22px] font-semibold leading-tight text-ink">Connect {label}</h2>
        <p className="mt-3 text-[15.5px] leading-6 text-ink-65">
          FIQR reads your steps, active energy, weight, sleep and workouts so Geo and your weekly
          check-in can use them. Workouts you finish in FIQR are saved back. Nothing is shared with
          anyone else, and you can disconnect in Settings.
        </p>
        <PrimaryButton className="mt-6 justify-center" onClick={() => void connect()}>
          Continue
        </PrimaryButton>
        {failed ? (
          <p className="mt-3 text-[13.5px] text-ink-65">
            Couldn&apos;t connect. Check permissions in {label}.
          </p>
        ) : null}
        <button
          type="button"
          className="mt-4 w-full text-center text-[15.5px] font-semibold text-ink-65"
          onClick={onClose}
        >
          Not now
        </button>
      </div>
    </BottomSheet>
  )
}
