'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType } from 'react'
import { GeoMark } from '@/components/shared/geo-avatar'
import { cn } from '@/lib/utils'
import { haptic } from '@/lib/platform/app'
import { useUIStore } from '@/stores/ui.store'

/** The + sheet (log-sheet.tsx): opened by the Log food action on Home and Food. */
export const LOG_SHEET = 'log-sheet'
/** Shared layout id for the + sheet panel; kept for log-sheet.tsx. */
export const ORB_SURFACE = 'orb-surface'

const stroke = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: 'size-6', 'aria-hidden': true }

function HomeIcon() {
  return <svg {...stroke}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10M9.5 20v-6h5v6" /></svg>
}
function FoodIcon() {
  return <svg {...stroke}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /></svg>
}
function TrainIcon() {
  return <svg {...stroke}><path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12" /></svg>
}
function CheckInIcon() {
  return <svg {...stroke}><path d="M5 19V13M12 19V8M19 19V4" /></svg>
}

const SIDE: { label: string; href: string; icon: ComponentType }[] = [
  { label: 'Home', href: '/dashboard', icon: HomeIcon },
  { label: 'Food', href: '/food', icon: FoodIcon },
  { label: 'Train', href: '/train', icon: TrainIcon },
  { label: 'Check-in', href: '/check-in', icon: CheckInIcon },
]

/** Full-screen task flows (a conversation, a live workout, logging, builders) and pushed pages own the whole screen. */
export function hidesTabBar(pathname: string): boolean {
  if (['/chat/session', '/train/session', '/logs/new/', '/plans/new', '/plans/edit', '/paywall'].some((prefix) => pathname.startsWith(prefix))) return true
  return pathname === '/settings' || pathname.startsWith('/settings/')
}

/**
 * George's nav (DESIGN.md section 6): five columns, Geo raised in the centre as the app icon in miniature; it opens Geo
 * over the current screen, and is the conversation list's tab once you are in it.
 * Solid cream with a hairline; it slides away on full-screen routes rather than unmounting, so nothing pops.
 */
export function TabBar() {
  const pathname = usePathname()
  const hidden = hidesTabBar(pathname)
  const geoWorking = useUIStore((state) => state.geoWorking > 0)
  // Each finished Geo task remounts the mark with `done`, so it turns once.
  const geoDone = useUIStore((state) => state.geoDone)
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const item = ({ label, href, icon: Icon }: (typeof SIDE)[number]) => {
    const active = isActive(href)
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? 'page' : undefined}
        onClick={() => { if (!active) void haptic('light') }}
        className={cn('flex min-h-11 flex-col items-center justify-end gap-[5px] transition-transform active:scale-[.94]', active ? 'text-accent' : 'text-ink-50')}
      >
        <Icon />
        <span className={cn('text-[11px] leading-none', active ? 'font-semibold text-accent-ink' : 'font-medium text-ink-62')}>{label}</span>
      </Link>
    )
  }

  const geo = (
    <>
      <span className="-mt-6 grid size-14 place-items-center rounded-full bg-ink shadow-[var(--shadow-raised)] transition-transform active:scale-[.94]">
        <GeoMark key={geoDone} size={34} tone="cream" working={geoWorking} done={geoDone > 0} />
      </span>
      <span className={cn('mt-[6px] text-[11px] font-semibold leading-none', isActive('/chat') ? 'text-ink' : 'text-ink-62')}>Geo</span>
    </>
  )

  return (
    <nav
      aria-label="Main"
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className={cn(
        'fixed inset-x-0 bottom-0 z-[50] border-t border-ink-10 bg-cream transition-[transform,opacity] duration-300 ease-[cubic-bezier(.25,1,.5,1)]',
        hidden && 'pointer-events-none translate-y-[calc(100%+32px)] opacity-0',
      )}
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-[10px]" style={{ paddingBottom: 'calc(22px + var(--safe-bottom))' }}>
        {item(SIDE[0])}
        {item(SIDE[1])}
        {isActive('/chat') ? (
          <Link href="/chat" aria-current="page" onClick={() => void haptic('light')} className="flex flex-col items-center">{geo}</Link>
        ) : (
          // Elsewhere Geo opens over the screen you are on, so it knows what you are looking at (George: Geo in every screen).
          <button type="button" aria-haspopup="dialog" onClick={() => { void haptic('light'); useUIStore.getState().openSheet('geo-companion') }} className="flex flex-col items-center">{geo}</button>
        )}
        {item(SIDE[2])}
        {item(SIDE[3])}
      </div>
    </nav>
  )
}
