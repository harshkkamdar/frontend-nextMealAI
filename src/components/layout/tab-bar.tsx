'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FoodFill, GeoFill, HomeFill, PlusIcon, TrainFill } from '@/components/ui/fiqr/icons'
import { cn } from '@/lib/utils'
import { reducedFade, spring } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { useUIStore } from '@/stores/ui.store'

export const LOG_SHEET = 'log-sheet'
/** Shared by the orb's surface and the + sheet panel (log-sheet.tsx), so the orb grows into the sheet (motion-feel 3i). */
export const ORB_SURFACE = 'orb-surface'

const TABS = [
  { label: 'Home', href: '/dashboard', icon: HomeFill },
  { label: 'Food', href: '/food', icon: FoodFill },
  { label: 'Train', href: '/train', icon: TrainFill },
  { label: 'Geo', href: '/chat', icon: GeoFill },
] as const

/** Routes that own the whole screen (live workout, an open conversation) hide the bar. */
export function hidesTabBar(pathname: string): boolean {
  // Full-screen task flows (a conversation, a live workout, logging, plan builders) own the whole screen.
  return ['/chat/session', '/train/session', '/logs/new/', '/plans/new', '/plans/edit', '/paywall'].some((prefix) => pathname.startsWith(prefix))
}

/** Shrinks while the page scrolls down, returns on any scroll up or near the top (Q4). */
function useMinimised(): boolean {
  const [minimised, setMinimised] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y < 40) setMinimised(false)
      else if (y > last + 6) setMinimised(true)
      else if (y < last - 6) setMinimised(false)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return minimised
}

/**
 * Floating glass capsule with four tabs and the separate orb that opens the + sheet (C2, D2).
 * Sits under every sheet's dim (z 50). While the + sheet is open the bar rises above it with the capsule hidden, so the orb becomes the sheet's close control.
 */
export function TabBar() {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const minimised = useMinimised()
  const logOpen = useUIStore((state) => state.activeSheet === LOG_SHEET)

  // Full-screen routes slide the bar away instead of unmounting it, so entering and leaving them never pops.
  const hidden = hidesTabBar(pathname)

  const toggleLog = () => {
    void haptic('light')
    const ui = useUIStore.getState()
    if (logOpen) ui.closeSheet()
    else ui.openSheet(LOG_SHEET)
  }

  return (
    <>
    {/* Scroll edge (Liquid Glass "scroll edge effect"): content fades into the page under the bar instead of colliding with it. */}
    <div aria-hidden="true" className={cn('pointer-events-none fixed inset-x-0 bottom-0 z-[45] h-[calc(104px+var(--safe-bottom))] bg-[linear-gradient(to_top,var(--color-cream)_calc(100%-24px),rgba(253,246,236,0))] transition-opacity duration-200', hidden && 'opacity-0')} />
    <div
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className={cn('pointer-events-none fixed inset-x-0 mx-auto flex max-w-md items-end gap-3 px-4 transition-[transform,opacity] duration-300 ease-[cubic-bezier(.22,1,.36,1)]', logOpen ? 'z-[80]' : 'z-[50]', hidden && 'translate-y-[calc(100%+24px)] opacity-0')}
      style={{ bottom: 'calc(12px + var(--safe-bottom))' }}
    >
      <nav
        aria-label="Main"
        className={cn(
          'glass pointer-events-auto flex h-16 flex-1 origin-bottom-left items-stretch rounded-full p-1.5 transition-[transform,opacity] duration-300 ease-[cubic-bezier(.22,1,.36,1)]',
          minimised && !reduce && 'translate-y-1 scale-[.9]',
          logOpen && 'pointer-events-none scale-[.96] opacity-0',
        )}
        aria-hidden={logOpen || undefined}
      >
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              onClick={() => { if (!active) void haptic('light') }}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full transition-transform active:scale-[.94]',
                active ? 'text-ink' : 'text-ink-65',
              )}
            >
              {active ? (
                <motion.span
                  layoutId="tab-pill"
                  transition={reduce ? reducedFade : spring.lens}
                  className="absolute inset-0 rounded-full bg-ink-06"
                />
              ) : null}
              <Icon className="relative size-[22px]" />
              <span className={cn('relative text-[11px] leading-none', active ? 'font-semibold' : 'font-medium')}>{label}</span>
            </Link>
          )
        })}
      </nav>
      <button
        type="button"
        aria-label={logOpen ? 'Close' : 'Log something'}
        aria-expanded={logOpen}
        onClick={toggleLog}
        className="pointer-events-auto relative grid size-16 shrink-0 place-items-center rounded-full text-ink transition-transform duration-300 active:scale-[.94]"
      >
        {/* The orb's surface: while closed it lives here; opening hands it to the sheet panel, which grows out of it. */}
        {logOpen ? (
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-card shadow-[var(--shadow-card)]" />
        ) : (
          <motion.span aria-hidden="true" layoutId={reduce ? undefined : ORB_SURFACE} transition={spring.sheet} style={{ borderRadius: 32 }} className="glass absolute inset-0" />
        )}
        <PlusIcon className={cn('relative size-7 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]', logOpen && 'rotate-45')} />
      </button>
    </div>
    </>
  )
}
