/**
 * FB-R6-S2-v2 · useIsAdmin — probe `/v1/admin/metrics` once per session to
 * determine whether the current user is an admin (on `ADMIN_EMAILS` BE
 * env list). Result is cached in a module-level singleton so the probe
 * fires at most once per page load.
 *
 * Returns:
 *   - `null` while the probe is in flight (caller can render nothing)
 *   - `true`  if the probe returns 200 (admin)
 *   - `false` if the probe returns 403 or any other failure
 *
 * Trade-off vs a new `/v1/me/roles` endpoint: one extra HTTP request per
 * session for every authenticated user. Acceptable for Phase 2; move to
 * a `profiles.is_admin` column later if it becomes a hotspot.
 */

'use client'

import { useEffect, useState } from 'react'
import { getAdminMetrics } from '@/lib/api/admin.api'

let cachedResult: boolean | null = null
let inflight: Promise<boolean> | null = null

async function probe(): Promise<boolean> {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      await getAdminMetrics()
      cachedResult = true
    } catch {
      cachedResult = false
    } finally {
      inflight = null
    }
    return cachedResult ?? false
  })()
  return inflight
}

export function useIsAdmin(): boolean | null {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(cachedResult)

  useEffect(() => {
    if (cachedResult !== null) {
      setIsAdmin(cachedResult)
      return
    }
    let cancelled = false
    probe().then((result) => {
      if (!cancelled) setIsAdmin(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return isAdmin
}

/**
 * Test-only: reset the module-level cache so individual tests can probe
 * independently. NOT exported from the barrel — internal to tests.
 */
export function __resetAdminProbeForTests() {
  cachedResult = null
  inflight = null
}
