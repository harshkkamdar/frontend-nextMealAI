'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeftIcon } from '@/components/ui/fiqr/icons'
import { cn } from '@/lib/utils'

/** True once `ref` has scrolled under the top bar. */
function useScrolledPast<T extends Element>() {
  const ref = useRef<T>(null)
  const [past, setPast] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setPast(!entry.isIntersecting),
      { rootMargin: '-60px 0px 0px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return { ref, past }
}

/**
 * Fixed top bar: actions sit top right; once the page title scrolls away the bar fills with solid cream and a hairline
 * (DESIGN.md component 1) and shows the title inline (17/600). Only opacity animates.
 */
function TopBar({ title, filled, titleVisible = filled, leading, actions }: { title: ReactNode; filled: boolean; titleVisible?: boolean; leading?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[40]" style={{ paddingTop: 'var(--safe-top)' }}>
      <div aria-hidden="true" className={cn('topbar-fill absolute inset-0 transition-opacity duration-200', filled ? 'opacity-100' : 'opacity-0')} />
      {/* 64 tall at the gutter: header buttons sit 10 pt down on every screen, level with Home's (DESIGN.md component 1). */}
      <div className="relative mx-auto flex h-[64px] max-w-md items-center gap-2 px-gutter">
        <div className="pointer-events-auto flex min-w-11 items-center">{leading}</div>
        <p
          aria-hidden={!titleVisible}
          className={cn(
            'min-w-0 flex-1 truncate text-center text-[17px] font-semibold text-ink transition-[opacity,transform] duration-200',
            titleVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
          )}
        >
          {title}
        </p>
        <div className="pointer-events-auto flex min-w-11 items-center justify-end gap-2">{actions}</div>
      </div>
    </div>
  )
}

interface LargeTitleHeaderProps {
  title: string
  /** The eyebrow line above the title: a date, a week range or a plan name (George's header). */
  subtitle?: ReactNode
  /** Round buttons shown top right. */
  actions?: ReactNode
  /** Under the title, e.g. the week strip on Food and Train. */
  children?: ReactNode
  /** The condensed bar's title when it differs from the large one (Home: "Today"). */
  barTitle?: string
}

/** Every tab root, Home included: an uppercase eyebrow over a 24 pt title, buttons top right. */
export function LargeTitleHeader({ title, subtitle, actions, children, barTitle = title }: LargeTitleHeaderProps) {
  const { ref, past } = useScrolledPast<HTMLDivElement>()
  return (
    <>
      <TopBar title={barTitle} filled={past} actions={actions} />
      <header className="pt-[calc(10px+var(--safe-top))]">
        <div className={cn('min-h-11', actions && 'pr-28')}>
          {subtitle ? <p className="truncate text-[12px] font-medium uppercase tracking-[1.4px] text-ink-62">{subtitle}</p> : null}
          <h1 className="mt-[5px] text-title text-ink">{title}</h1>
        </div>
        {/* The bar condenses once the line under the title passes under it. */}
        <div ref={ref} aria-hidden="true" />
        {children}
      </header>
    </>
  )
}

interface PushedHeaderProps {
  title: string
  onBack: () => void
  backLabel?: string
  actions?: ReactNode
  /** Large left title under the bar (Plans, a plan, Today's week pages); the bar title appears once it scrolls under. */
  large?: boolean
  /** Large only: a line under the title. */
  subtitle?: ReactNode
  /** Large only: the condensed bar's title when it differs from the large one. */
  barTitle?: string
}

/** The large title block under a pushed bar. */
function LargeTitle({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="pt-1">
      {/* Whole-pixel line heights keep everything below on whole pixels, so layout glides settle without a 1 px text snap. */}
      <h1 className="break-words text-title leading-7 text-ink [overflow-wrap:anywhere]">{title}</h1>
      {subtitle ? <p className="mt-1.5 text-body-sm leading-5 text-ink-65 tabular-nums">{subtitle}</p> : null}
    </div>
  )
}

/** A plain back chevron with a 44 pt target (DESIGN.md component 1). */
function BackButton({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onBack} className="-ml-[10px] grid size-11 place-items-center rounded-full text-ink transition-transform active:scale-[.94] [&_svg]:size-6">
      <ChevronLeftIcon />
    </button>
  )
}

/**
 * Pushed screens: a plain back chevron; the bar fills with cream on scroll. Default: centred bar title.
 * `large`: a large left title under the bar, and the bar shows `barTitle` only once that title has scrolled under it.
 */
export function PushedHeader({ title, onBack, backLabel = 'Back', actions, large = false, subtitle, barTitle = title }: PushedHeaderProps) {
  const { ref, past } = useScrolledPast<HTMLDivElement>()
  return (
    <>
      <TopBar
        title={large ? barTitle : title}
        filled={past}
        titleVisible={large ? past : true}
        leading={<BackButton label={backLabel} onBack={onBack} />}
        actions={actions}
      />
      {large ? (
        <>
          <div aria-hidden="true" className="h-[calc(64px+var(--safe-top))]" />
          <LargeTitle title={title} subtitle={subtitle} />
          <div ref={ref} aria-hidden="true" />
        </>
      ) : (
        <div ref={ref} aria-hidden="true" className="h-[calc(64px+var(--safe-top))]" />
      )}
    </>
  )
}
