'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChartLine, SparkleIcon } from '@/components/dashboard/home-icons'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { isNative } from '@/lib/platform'
import { pushPermissionState, registerPush } from '@/lib/platform/notifications'
import { kvGet, kvSet } from '@/lib/platform/storage'

const PROMPTED_KEY = 'fiqr:push-prompted'

/**
 * Asked once on a native first launch while permission is still "prompt". It names the only two things Geo sends.
 * If permission was denied before, it says where to turn it on instead of asking again.
 */
export function NotificationsPrompt() {
  const router = useRouter()
  const [mode, setMode] = useState<'ask' | 'off' | null>(null)

  useEffect(() => {
    if (!isNative()) return
    let active = true
    void (async () => {
      if (await kvGet(PROMPTED_KEY)) return
      const state = await pushPermissionState()
      if (state !== 'prompt' && state !== 'denied') return
      await kvSet(PROMPTED_KEY, 'true')
      if (active) setMode(state === 'prompt' ? 'ask' : 'off')
    })()
    return () => {
      active = false
    }
  }, [])

  const close = () => setMode(null)
  const allowNotifications = async () => {
    await registerPush()
    close()
  }

  return (
    <BottomSheet open={mode !== null} onClose={close} ariaLabel="Notification permission">
      <div className="flex flex-col gap-4 px-5 pb-5 pt-2">
        {mode === 'off' ? (
          <>
            <h2 className="font-display text-[22px] font-extrabold leading-tight text-ink">Notifications are off</h2>
            <p className="text-body-sm text-ink-65">Turn them on in your phone&apos;s Settings, under FIQR, to hear when your weekly check-in is ready.</p>
            <PrimaryButton className="bg-ink text-cream text-[16px]" onClick={() => { close(); router.push('/settings') }}>Open Settings</PrimaryButton>
          </>
        ) : (
          <>
            <h2 className="font-display text-[22px] font-extrabold leading-tight text-ink">Let Geo nudge you?</h2>
            <p className="text-body-sm text-ink-65">
              Geo can tell you when a check-in is ready or when you&apos;ve gone quiet for a few days. No marketing, ever. You can
              turn this off in Settings.
            </p>
            <ul className="flex flex-col">
              <li className="flex min-h-11 items-center gap-3 text-body-sm text-ink"><ChartLine className="size-5 shrink-0 text-ink-65" />Your weekly check-in is ready</li>
              <li className="flex min-h-11 items-center gap-3 text-body-sm text-ink"><SparkleIcon className="size-5 shrink-0 text-ink-65" />You&apos;ve gone quiet for three days</li>
            </ul>
            <PrimaryButton onClick={() => void allowNotifications()}>Allow notifications</PrimaryButton>
          </>
        )}
        <button type="button" className="-mt-2 min-h-11 w-full text-center text-body-sm font-bold text-ink" onClick={close}>
          Not now
        </button>
      </div>
    </BottomSheet>
  )
}
