'use client'

import { useEffect, useState } from 'react'
import { detectIanaTimezone } from '@/lib/timezone'
import { getProfile } from '@/lib/api/profile.api'

/**
 * Resolves the user's IANA timezone with this priority:
 *   1. profile.timezone (synced by the FB-12 effect in app/(app)/layout.tsx)
 *   2. browser-detected tz (Intl.DateTimeFormat)
 *   3. 'UTC' (last resort, inside todayLocalISO)
 *
 * Returns the device tz immediately so the first paint isn't UTC, then
 * upgrades to the profile tz on resolve. Both are typically the same.
 */
export function useUserTimezone(): string {
  const [tz, setTz] = useState<string>(() => detectIanaTimezone())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const profile = await getProfile()
        if (!cancelled && profile.timezone) setTz(profile.timezone)
      } catch {
        // keep device tz
      }
    })()
    return () => { cancelled = true }
  }, [])

  return tz
}
