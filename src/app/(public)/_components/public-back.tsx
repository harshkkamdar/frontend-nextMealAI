'use client'

import { usePathname, useRouter } from 'next/navigation'
import { PushedHeader } from '@/components/layout/screen-header'

const TITLES: Record<string, string> = { '/privacy': 'Privacy policy', '/support': 'Support', '/delete-account': 'fiqr.app' }

/**
 * The public pages wear the app's pushed header (centred title, round glass back), so opening them from Settings reads
 * as one more screen. Opened cold in a browser there is no history, so back goes to the FIQR home page instead.
 */
export function PublicHeader() {
  const router = useRouter()
  const pathname = usePathname().replace(/\/$/, '')
  return <PushedHeader title={TITLES[pathname] ?? 'FIQR'} onBack={() => (window.history.length > 1 ? router.back() : router.push('/'))} />
}
