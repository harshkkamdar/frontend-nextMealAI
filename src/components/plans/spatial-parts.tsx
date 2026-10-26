'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { hidesTabBar } from '@/components/layout/tab-bar'
import { ChevronLeftIcon } from '@/components/ui/fiqr/icons'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { useTitleDrift } from '@/components/ui/fiqr/scroll-drift'
import { cn } from '@/lib/utils'

/**
 * Spatial pieces shared by the check-in and plans screens (mocks/journey-plans.html). Slice-local: the check-in and
 * plans slice owns both folders.
 */

/** Card surface: the shared --surface-card token (translucent over the Spatial backdrop) once it lands, white until then. */
export const CARD_BG = 'bg-[var(--surface-card,var(--color-card))]'
export const CARD = 'rounded-card bg-[var(--surface-card,var(--color-card))] shadow-[var(--shadow-card)]'
export const INK_BUTTON = 'flex h-btn w-full items-center justify-center gap-2 rounded-full bg-ink px-5 text-body font-bold text-cream transition-transform enabled:active:scale-[.97] disabled:opacity-45'
/**
 * The screen's one orange action, as a plain class string (buttons and the busy state in the dock share it).
 * Ink label (owner decision, 27 Oct 2026): cream on orange fails AA.
 */
export const ORANGE_BUTTON = 'flex h-btn w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-body font-bold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,.35)] transition-transform enabled:active:scale-[.97] disabled:opacity-45 aria-busy:opacity-100'
export const SOFT_BUTTON = 'flex h-btn w-full items-center justify-center gap-2 rounded-full bg-ink-06 px-5 text-body font-bold text-ink transition-transform enabled:active:scale-[.97] disabled:opacity-45'

/** Section heading: 18 / 750, a little wide, 28 above and 10 below (the mock's `.sec`). */
export function SectionHeading({ children, id, className }: { children: ReactNode; id?: string; className?: string }) {
  // Plain strings, not cn(): tailwind-merge reads the custom size tokens (text-headline) as colours and drops one.
  return <h2 id={id} className={`font-display mx-1 mb-2.5 mt-7 text-headline font-[750] tracking-[-0.01em] text-ink ${className ?? ''}`}>{children}</h2>
}

/** Macro hue dot: calories orange, protein ink, carbs teal, fat ochre. */
export const MACRO_HUE = { calories: 'var(--color-accent)', protein: 'var(--color-ink)', carbs: 'var(--color-macro-teal)', fat: 'var(--color-macro-ochre)' } as const
export function HueDot({ macro }: { macro: keyof typeof MACRO_HUE }) {
  return <span aria-hidden="true" className="inline-block size-2 shrink-0 rounded-full" style={{ background: MACRO_HUE[macro] }} />
}

/** Quiet text action (Ask Geo, Try again): 44 pt tall, centred. */
export function TextButton({ children, onClick, ink, className }: { children: ReactNode; onClick: () => void; ink?: boolean; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`mx-auto flex min-h-11 items-center justify-center px-3.5 text-body-sm font-semibold transition-transform active:scale-[.97] ${ink ? 'text-ink' : 'text-ink-65'} ${className ?? ''}`}>
      {children}
    </button>
  )
}

function AlertIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5.5M12 16.2v.1" />
    </svg>
  )
}

/** A load failure kept inside one card: what failed, what is still true, one way to retry. */
export function FailCard({ title, children, onRetry }: { title: string; children: ReactNode; onRetry?: () => void }) {
  return (
    <section role="alert" className={cn(CARD, 'p-4')}>
      <div className="flex items-center gap-2 text-ink"><AlertIcon /><b className="text-body font-bold">{title}</b></div>
      <p className="mt-3 text-pretty text-body leading-[1.45] text-ink-65">{children}</p>
      {onRetry ? <button type="button" onClick={onRetry} className="-ml-3.5 mt-2 flex min-h-11 items-center px-3.5 text-body-sm font-semibold text-ink active:opacity-60">Try again</button> : null}
    </section>
  )
}

/** Bottom offset of the dock: above the tab bar where it shows, else near the edge. */
function useDockBottom(): string {
  const pathname = usePathname() ?? ''
  return hidesTabBar(pathname) ? 'calc(12px + var(--safe-bottom))' : 'calc(74px + var(--safe-bottom))'
}

/** Space the scroll content leaves at its end so the dock never covers it at rest. */
export function DockSpacer({ tall }: { tall?: boolean }) {
  const pathname = usePathname() ?? ''
  const base = hidesTabBar(pathname) ? 84 : 146
  return <div aria-hidden="true" style={{ height: `calc(${base + (tall ? 40 : 0)}px + var(--safe-bottom))` }} />
}

/** The floating glass dock that holds a screen's action (the mock's `.dock`): always in view, glass on the control layer. */
export function Dock({ children, className }: { children: ReactNode; className?: string }) {
  const bottom = useDockBottom()
  return (
    <div className="pointer-events-none fixed inset-x-0 z-[46] mx-auto max-w-md px-4" style={{ bottom }}>
      <div className={cn('glass pointer-events-auto grid gap-1 rounded-[32px] p-1.5', className)}>{children}</div>
    </div>
  )
}

/** Busy action label with a small spinner (transform only). */
export function Busy({ children }: { children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      {children}
    </>
  )
}

/**
 * Pushed screen with a large title (Plans, a plan view): round glass back button, actions on the right; the bar shows
 * the title and fills with glass only once the large title has scrolled under it. The large title drifts on scroll.
 * Local wrapper: PushedHeader always shows its bar title (shared-file request in the slice report).
 */
export function PushedLargeHeader({ title, barTitle = title, sub, onBack, backLabel = 'Back', actions }: {
  title: string
  barTitle?: string
  sub?: ReactNode
  onBack: () => void
  backLabel?: string
  actions?: ReactNode
}) {
  const marker = useRef<HTMLDivElement>(null)
  const drift = useTitleDrift<HTMLDivElement>()
  const [past, setPast] = useState(false)
  useEffect(() => {
    const node = marker.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setPast(!entry.isIntersecting), { rootMargin: '-60px 0px 0px 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[40]" style={{ paddingTop: 'var(--safe-top)' }}>
        <div aria-hidden="true" className={cn('glass-cream absolute inset-0 rounded-none shadow-none transition-opacity duration-200', past ? 'opacity-100' : 'opacity-0')} />
        <div className="relative mx-auto flex h-[60px] max-w-md items-center gap-2 px-4">
          <div className="pointer-events-auto flex min-w-11 items-center"><RoundButton aria-label={backLabel} onClick={onBack}><ChevronLeftIcon /></RoundButton></div>
          <p aria-hidden="true" className={cn('min-w-0 flex-1 truncate text-center text-[17px] font-semibold text-ink transition-[opacity,transform] duration-200', past ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0')}>{barTitle}</p>
          <div className="pointer-events-auto flex min-w-11 items-center justify-end gap-2">{actions}</div>
        </div>
      </div>
      <div aria-hidden="true" className="h-[calc(60px+var(--safe-top))]" />
      <div ref={drift} className="origin-top-left px-1 pt-1">
        <h1 className="font-display break-words text-title text-ink [overflow-wrap:anywhere]">{title}</h1>
        {sub ? <p className="mt-1.5 text-body-sm text-ink-65 tabular-nums">{sub}</p> : null}
      </div>
      <div ref={marker} aria-hidden="true" />
    </>
  )
}
