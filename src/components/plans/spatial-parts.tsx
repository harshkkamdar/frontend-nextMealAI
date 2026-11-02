'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { hidesTabBar } from '@/components/layout/tab-bar'
import { cn } from '@/lib/utils'

/**
 * Spatial pieces shared by the check-in and plans screens (mocks/journey-plans.html). Slice-local: the check-in and
 * plans slice owns both folders.
 */

/** Card surface: George's tile, white with a 1 pt ink-12 border (DESIGN.md section 4). */
export const CARD = 'rounded-card tile'
/** Navy solid: a committing action that is not the screen's next step (Keep current targets, Done). */
export const INK_BUTTON = 'flex h-btn w-full items-center justify-center gap-2 rounded-[15px] bg-ink px-5 text-[18px] font-bold text-cream transition-transform enabled:active:scale-[.98] disabled:opacity-45'
/**
 * The screen's one orange action, as a plain class string (buttons and the busy state in the dock share it).
 * Cream label at 19 pt bold: large text, so it passes AA on orange (owner decision, 2 Nov 2026).
 */
export const ORANGE_BUTTON = 'flex h-btn w-full items-center justify-center gap-2 rounded-[18px] bg-accent px-5 text-[19px] font-bold text-cream shadow-[var(--shadow-action)] transition-transform enabled:active:scale-[.98] disabled:opacity-45 aria-busy:opacity-100'
/** Secondary: cream with a 1 pt ink-16 edge. */
export const SOFT_BUTTON = 'flex h-btn w-full items-center justify-center gap-2 rounded-[15px] border border-ink-16 bg-cream px-5 text-[18px] font-bold text-ink transition-transform enabled:active:scale-[.98] disabled:opacity-45'

/** Section label (George): 11.5 / 600, uppercase, tracked, 20 above and 10 below. */
export function SectionHeading({ children, id, className }: { children: ReactNode; id?: string; className?: string }) {
  // Plain strings, not cn(): tailwind-merge reads custom size tokens as colours and drops one.
  return <h2 id={id} className={`mb-2.5 mt-5 text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62 ${className ?? ''}`}>{children}</h2>
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
  // Above the nav and the 24 pt the raised Geo button rises over it.
  return hidesTabBar(pathname) ? '0px' : 'calc(96px + var(--safe-bottom))'
}

/** Space the scroll content leaves at its end so the dock never covers it at rest. */
export function DockSpacer({ tall }: { tall?: boolean }) {
  const pathname = usePathname() ?? ''
  const base = hidesTabBar(pathname) ? 96 : 192
  return <div aria-hidden="true" style={{ height: `calc(${base + (tall ? 40 : 0)}px + var(--safe-bottom))` }} />
}

/** The screen's action, pinned above the nav on a solid cream band with a hairline, so it is always in view. */
export function Dock({ children, className }: { children: ReactNode; className?: string }) {
  const bottom = useDockBottom()
  const pathname = usePathname() ?? ''
  return (
    <div className="fixed inset-x-0 z-[46] border-t border-ink-09 bg-cream" style={{ bottom }}>
      <div className={cn('mx-auto grid max-w-md gap-1 px-gutter pt-3', className)} style={{ paddingBottom: hidesTabBar(pathname) ? 'calc(12px + var(--safe-bottom))' : '12px' }}>{children}</div>
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

