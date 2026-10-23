'use client'

import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { isNative } from '@/lib/platform'
import { pushPermissionState, registerPush } from '@/lib/platform/notifications'
import { kvGet, kvSet } from '@/lib/platform/storage'

const PROMPTED_KEY = 'fiqr:push-prompted'

export function NotificationsPrompt() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isNative()) return
    let active = true
    void (async () => {
      if (await kvGet(PROMPTED_KEY)) return
      if ((await pushPermissionState()) !== 'prompt') return
      await kvSet(PROMPTED_KEY, 'true')
      if (active) setOpen(true)
    })()
    return () => {
      active = false
    }
  }, [])

  const allowNotifications = async () => {
    await registerPush()
    setOpen(false)
  }

  return (
    <BottomSheet open={open} onClose={() => setOpen(false)} ariaLabel="Notification permission">
      <div className="px-gutter pb-6 pt-4">
        <h2 className="text-[22px] font-semibold leading-tight text-ink">Let Geo nudge you?</h2>
        <p className="mt-3 text-[15.5px] leading-6 text-ink-65">
          Geo can tell you when a check-in is ready or when you&apos;ve gone quiet for a few days.
          No marketing, ever. You can turn this off in Settings.
        </p>
        <PrimaryButton className="mt-6 justify-center" onClick={() => void allowNotifications()}>
          Allow notifications
        </PrimaryButton>
        <button
          type="button"
          className="mt-4 w-full text-center text-[15.5px] font-semibold text-ink-65"
          onClick={() => setOpen(false)}
        >
          Not now
        </button>
      </div>
    </BottomSheet>
  )
}
