'use client'

import { useState } from 'react'
import { AlertIcon, SleepLine, StepsLine, TrainLine, WeightLine } from '@/components/dashboard/home-icons'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { connectHealth, healthLabel } from '@/lib/platform/health'
import { useOnline } from '@/lib/platform/network'

const READS = [
  { icon: StepsLine, text: 'Steps and active energy' },
  { icon: WeightLine, text: 'Weight' },
  { icon: SleepLine, text: 'Sleep' },
  { icon: TrainLine, text: 'Workouts, and the ones you finish in FIQR are saved back' },
]

/** Honest pre-permission screen (Q32): what FIQR reads and writes back, that nothing is shared, where to disconnect. */
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
  const [waiting, setWaiting] = useState(false)
  const online = useOnline()
  const label = healthLabel() ?? 'Health'

  const connect = async () => {
    setWaiting(true)
    setFailed(false)
    const ok = await connectHealth().catch(() => false)
    setWaiting(false)
    if (ok) {
      onConnected()
      onClose()
      return
    }
    setFailed(true)
  }

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel={`Connect ${label}`}>
      <div className="flex flex-col gap-4 px-5 pb-5 pt-2">
        <h2 className="font-display text-[22px] font-extrabold leading-tight text-ink">Connect {label}</h2>
        <p className="text-body-sm text-ink-65">
          FIQR reads these so Geo and your weekly check-in can use them. Nothing is shared with anyone else, and you can
          disconnect in Settings.
        </p>
        <ul className="flex flex-col">
          {READS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex min-h-11 items-center gap-3 text-body-sm text-ink">
              <Icon className="size-5 shrink-0 text-ink-65" />{text}
            </li>
          ))}
        </ul>
        {failed ? <p role="alert" className="flex items-start gap-1.5 text-caption font-semibold text-ink"><AlertIcon className="mt-px size-4 shrink-0 text-accent" />Couldn&apos;t connect. Check FIQR&apos;s permissions in {label}.</p> : null}
        {!online ? <p className="text-caption text-ink-65">You&apos;re offline. Connect once you&apos;re back online.</p> : null}
        <PrimaryButton disabled={waiting || !online} onClick={() => void connect()}>
          {waiting ? `Waiting for ${label}…` : failed ? 'Try again' : 'Continue'}
        </PrimaryButton>
        <button type="button" className="-mt-2 min-h-11 w-full text-center text-body-sm font-bold text-ink" onClick={onClose}>
          Not now
        </button>
      </div>
    </BottomSheet>
  )
}
