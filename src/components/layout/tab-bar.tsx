'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FoodFill, GeoFill, HomeFill, PlusIcon, TrainFill } from '@/components/ui/fiqr/icons'
import { cn } from '@/lib/utils'
import { reducedFade, spring } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { initialMinimise, minimiseStep } from '@/lib/tab-bar-minimise'
import { TAB_ROUTES } from '@/lib/navigation'
import { useUIStore } from '@/stores/ui.store'

export const LOG_SHEET = 'log-sheet'
/** Shared by the orb's surface and the + sheet panel (log-sheet.tsx), so the orb grows into the sheet (motion-feel 3i). */
export const ORB_SURFACE = 'orb-surface'

const ICONS = { '/dashboard': HomeFill, '/food': FoodFill, '/train': TrainFill, '/chat': GeoFill }
const TABS = TAB_ROUTES.map((tab) => ({ ...tab, icon: ICONS[tab.href] }))

/** Routes that own the whole screen (live workout, an open conversation) hide the bar. */
export function hidesTabBar(pathname: string): boolean {
  // Full-screen task flows (a conversation, a live workout, logging, plan builders) own the whole screen.
  return ['/chat/session', '/train/session', '/logs/new/', '/plans/new', '/plans/edit', '/paywall'].some((prefix) => pathname.startsWith(prefix))
}

/**
 * iOS 26 tab bar minimise (motion-feel 3j): collapses on scroll down, expands on scroll up, near the top, on tap,
 * and on every route change. Passive listener, at most one state step per frame.
 */
function useMinimised(): [boolean, () => void] {
  const pathname = usePathname()
  // The anchor moves every frame while scrolling; only the boolean is state, so the bar re-renders (and framer re-measures) only on a flip.
  const step = useRef(initialMinimise)
  const [minimised, setMinimised] = useState(false)
  const [path, setPath] = useState(pathname)
  if (path !== pathname) {
    setPath(pathname)
    setMinimised(false)
  }
  useEffect(() => {
    // Anchor where the page now is: the route frame has already restored a popped page's scroll, and the scroll event
    // that restore fires must not read as a scroll down from 0.
    step.current = { ...initialMinimise, anchor: window.scrollY }
  }, [pathname])
  useEffect(() => {
    let frame = 0
    const read = () => {
      frame = 0
      // Clamp to the real scroll range so iOS's bottom rubber band (scrollY past the end, then back) never reads as a scroll up.
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      const was = step.current.minimised
      step.current = minimiseStep(step.current, { type: 'scroll', y: Math.min(window.scrollY, max) })
      // Commit only a flip, and after the frame callback (motion-feel M11: no setState inside rAF).
      if (step.current.minimised !== was) queueMicrotask(() => setMinimised(step.current.minimised))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [])
  const expand = useCallback(() => {
    step.current = minimiseStep(step.current, { type: 'tap', y: window.scrollY })
    setMinimised(false)
  }, [])
  return [minimised, expand]
}

/**
 * Floating glass capsule with four tabs and the separate orb that opens the + sheet (C2, D2).
 * Sits under every sheet's dim (z 50). While the + sheet is open the bar rises above it with the capsule hidden, so the orb becomes the sheet's close control.
 */
export function TabBar() {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const [minimised, expand] = useMinimised()
  const navRef = useRef<HTMLElement>(null)
  const logOpen = useUIStore((state) => state.activeSheet === LOG_SHEET)

  // Full-screen routes slide the bar away instead of unmounting it, so entering and leaving them never pops.
  const hidden = hidesTabBar(pathname)
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const activeTab = TABS.find((tab) => isActive(tab.href))
  // Like iOS, the bar minimises into the open tab, so a screen outside the four tabs keeps the full bar.
  const collapsed = minimised && activeTab !== undefined
  // Collapse: items leave fast while the glass shrinks. Expand: items arrive just behind the growing glass.
  const fade = collapsed ? { duration: 0.12 } : { duration: 0.18, delay: 0.12 }
  // The morph is scroll-driven, not a flick release, so it settles critically damped (glide) rather than with the lens overshoot.
  const itemTransition = reduce ? reducedFade : { ...spring.glide, opacity: fade }
  // Transform string, not the scale shorthand, so the scale runs on the compositor while the page scrolls.
  const item = { opacity: collapsed ? 0 : 1, transform: collapsed && !reduce ? 'scale(0.8)' : 'scale(1)' }
  // Collapsed, the bar is one button that shows the open tab and expands the bar rather than navigating (iOS 26).
  const restore = collapsed && activeTab ? (
    <motion.button
      key="show-tabs"
      type="button"
      aria-label={`Show tabs, ${activeTab.label}`}
      onClick={(event) => {
        void haptic('light')
        expand()
        // Keyboard or screen reader activation (detail 0): the button is about to unmount, so hand focus to the open tab.
        if (event.detail === 0) requestAnimationFrame(() => navRef.current?.querySelector<HTMLElement>('a[aria-current="page"]')?.focus())
      }}
      initial={reduce ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reducedFade}
      className={cn('absolute left-0 top-0 grid size-[52px] place-items-center rounded-full text-ink transition-transform active:scale-[.94]', !logOpen && 'pointer-events-auto')}
    >
      <motion.span layoutId={reduce ? undefined : `tab-icon-${activeTab.href}`} transition={spring.glide}><activeTab.icon className="size-[22px]" /></motion.span>
    </motion.button>
  ) : null

  const toggleLog = () => {
    void haptic('light')
    const ui = useUIStore.getState()
    if (logOpen) ui.closeSheet()
    else ui.openSheet(LOG_SHEET)
  }

  return (
    <>
    {/* Scroll edge (Liquid Glass "scroll edge effect"): content fades into the page under the bar instead of colliding with it. */}
    <div aria-hidden="true" className={cn('pointer-events-none fixed inset-x-0 bottom-0 z-[45] h-[calc(90px+var(--safe-bottom))] bg-[linear-gradient(to_top,var(--color-cream)_calc(100%-24px),rgba(253,246,236,0))] transition-opacity duration-200', hidden && 'opacity-0')} />
    <div
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className={cn('pointer-events-none fixed inset-x-0 mx-auto flex max-w-md items-end gap-3 px-4 transition-[transform,opacity] duration-300 ease-[cubic-bezier(.22,1,.36,1)]', logOpen ? 'z-[80]' : 'z-[50]', hidden && 'translate-y-[calc(100%+24px)] opacity-0')}
      style={{ bottom: 'calc(10px + var(--safe-bottom))' }}
    >
      <nav
        ref={navRef}
        aria-label="Main"
        className={cn(
          'pointer-events-none relative h-[52px] flex-1 origin-bottom-left transition-[transform,opacity] duration-300 ease-[cubic-bezier(.22,1,.36,1)]',
          logOpen && 'scale-[.96] opacity-0',
        )}
        aria-hidden={logOpen || undefined}
      >
        {/* The glass surface: one element that shrinks from the capsule into the circle (framer layout projection, transforms only). Reduced motion crossfades two still surfaces instead. */}
        {reduce ? (
          <>
            <motion.span aria-hidden="true" animate={{ opacity: collapsed ? 0 : 1 }} transition={reducedFade} className="glass absolute inset-0 rounded-full" />
            <motion.span aria-hidden="true" initial={false} animate={{ opacity: collapsed ? 1 : 0 }} transition={reducedFade} className="glass absolute inset-y-0 left-0 w-[52px] rounded-full" />
          </>
        ) : (
          <motion.span aria-hidden="true" layout transition={spring.glide} style={{ borderRadius: 26 }} className={cn('glass absolute inset-y-0 left-0', collapsed ? 'w-[52px]' : 'w-full')} />
        )}
        <div inert={collapsed || undefined} className={cn('relative flex h-full items-stretch p-1', !collapsed && !logOpen && 'pointer-events-auto')}>
          {TABS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
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
                    animate={{ opacity: collapsed ? 0 : 1 }}
                    transition={reduce ? reducedFade : { ...spring.lens, opacity: fade }}
                    className="absolute inset-0 rounded-full bg-ink-06"
                  />
                ) : null}
                {/* Each role has its own key: a motion element reused across roles keeps stale shared-layout or animation
                    state and can stay at opacity 0 after the open tab changes (seen on iOS, 26 Oct 2026). */}
                {active && !reduce ? (
                  // The open tab's icon travels into the collapsed circle (shared layoutId with the circle's icon), one id per
                  // tab so switching tabs never flies an icon across the bar.
                  collapsed ? <span key="gap" className="size-5" /> : <motion.span key="travel" layoutId={`tab-icon-${href}`} transition={spring.glide} className="relative"><Icon className="size-5" /></motion.span>
                ) : active ? (
                  <motion.span key="open" initial={false} animate={{ opacity: collapsed ? 0 : 1 }} transition={itemTransition} className="relative"><Icon className="size-5" /></motion.span>
                ) : (
                  <motion.span key="still" initial={false} animate={item} transition={itemTransition} className="relative will-change-transform"><Icon className="size-5" /></motion.span>
                )}
                {/* will-change keeps the labels on their own layer, so they do not re-rasterise (a 1 px text shift) when the scale hands back from the compositor. */}
                <motion.span initial={false} animate={item} transition={itemTransition} className={cn('relative text-[11px] leading-none will-change-transform', active ? 'font-semibold' : 'font-medium')}>{label}</motion.span>
              </Link>
            )
          })}
        </div>
        {/* Reduced motion fades the circle out; otherwise it hands its icon straight back to the open tab (layoutId), so it must leave at once. */}
        {reduce ? <AnimatePresence initial={false}>{restore}</AnimatePresence> : restore}
      </nav>
      <button
        type="button"
        aria-label={logOpen ? 'Close' : 'Log something'}
        aria-expanded={logOpen}
        onClick={toggleLog}
        className="pointer-events-auto relative grid size-[52px] shrink-0 place-items-center rounded-full text-ink transition-transform duration-300 active:scale-[.94]"
      >
        {/* The orb's surface: while closed it lives here; opening hands it to the sheet panel, which grows out of it. */}
        {logOpen ? (
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-card shadow-[var(--shadow-card)]" />
        ) : (
          <motion.span aria-hidden="true" layoutId={reduce ? undefined : ORB_SURFACE} transition={spring.sheet} style={{ borderRadius: 26 }} className="glass absolute inset-0" />
        )}
        <PlusIcon className={cn('relative size-6 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]', logOpen && 'rotate-45')} />
      </button>
    </div>
    </>
  )
}
