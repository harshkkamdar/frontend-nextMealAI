'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeftIcon } from '@/components/ui/fiqr/icons'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { useTitleDrift } from '@/components/ui/fiqr/scroll-drift'
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
 * Fixed top bar: actions float as round glass buttons; once the page title scrolls away the bar fills with
 * cream glass (blur and saturation, fading out at its lower edge, as in the Spatial mock) and shows the title inline
 * (17/600). Only the opacity animates; the blur itself never does.
 */
function TopBar({ title, filled, titleVisible = filled, leading, actions }: { title: ReactNode; filled: boolean; titleVisible?: boolean; leading?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[40]" style={{ paddingTop: 'var(--safe-top)' }}>
      <div aria-hidden="true" className={cn('glass-bar absolute inset-x-0 top-0 -bottom-4 transition-opacity duration-200', filled ? 'opacity-100' : 'opacity-0')} />
      <div className="relative mx-auto flex h-[60px] max-w-md items-center gap-2 px-4">
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
  subtitle?: ReactNode
  /** Round glass buttons (or a glass pill) shown top right. */
  actions?: ReactNode
  /** Under the title, e.g. the week strip on Food and Train. */
  children?: ReactNode
}

/** Main tabs (Home, Food, Train, Geo): large left title and subtitle, round glass actions top right (Q19). */
export function LargeTitleHeader({ title, subtitle, actions, children }: LargeTitleHeaderProps) {
  const { ref, past } = useScrolledPast<HTMLDivElement>()
  const drift = useTitleDrift<HTMLDivElement>()
  return (
    <>
      <TopBar title={title} filled={past} actions={actions} />
      <header className="pt-[calc(8px+var(--safe-top))]">
        {/* The title drifts and fades a little as the page scrolls under the bar (Spatial Depth). */}
        <div ref={drift} className="origin-top-left">
          <h1 className="font-display pr-28 text-title text-ink">{title}</h1>
          {/* One line; with header buttons it stops short of them, like the title. */}
          {subtitle ? <p className={cn('mt-1 truncate text-body-sm text-ink-65', actions && 'pr-28')}>{subtitle}</p> : null}
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

/** The large title block: drifts and fades a little as the page scrolls under the bar (Spatial Depth). */
function LargeTitle({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  const drift = useTitleDrift<HTMLDivElement>()
  return (
    <div ref={drift} className="origin-top-left px-1 pt-1">
      {/* Whole-pixel line heights keep everything below on whole pixels, so layout glides settle without a 1 px text snap. */}
      <h1 className="font-display break-words text-title leading-8 text-ink [overflow-wrap:anywhere]">{title}</h1>
      {subtitle ? <p className="mt-1.5 text-body-sm leading-5 text-ink-65 tabular-nums">{subtitle}</p> : null}
    </div>
  )
}

/**
 * Pushed screens: round glass back button, the bar fills with glass on scroll (Q19). Default: centred bar title.
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
        leading={<RoundButton aria-label={backLabel} onClick={onBack}><ChevronLeftIcon /></RoundButton>}
        actions={actions}
      />
      {large ? (
        <>
          <div aria-hidden="true" className="h-[calc(60px+var(--safe-top))]" />
          <LargeTitle title={title} subtitle={subtitle} />
          <div ref={ref} aria-hidden="true" />
        </>
      ) : (
        <div ref={ref} aria-hidden="true" className="h-[calc(60px+var(--safe-top))]" />
      )}
    </>
  )
}
