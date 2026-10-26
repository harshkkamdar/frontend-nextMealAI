'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeftIcon } from '@/components/ui/fiqr/icons'
import { RoundButton } from '@/components/ui/fiqr/round-button'
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
 * cream glass and shows the title inline (17/600). Opacity and transform only.
 */
function TopBar({ title, filled, titleVisible = filled, leading, actions }: { title: ReactNode; filled: boolean; titleVisible?: boolean; leading?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[40]" style={{ paddingTop: 'var(--safe-top)' }}>
      <div aria-hidden="true" className={cn('glass-cream absolute inset-0 rounded-none shadow-none transition-opacity duration-200', filled ? 'opacity-100' : 'opacity-0')} />
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
  return (
    <>
      <TopBar title={title} filled={past} actions={actions} />
      <header className="pt-[calc(8px+var(--safe-top))]">
        <h1 className="font-wide pr-28 text-[30px] font-bold leading-[1.1] tracking-[-0.5px] text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-[15px] text-ink-65">{subtitle}</p> : null}
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
}

/** Pushed screens: centred title with a round glass back button; the bar fills with glass on scroll (Q19). */
export function PushedHeader({ title, onBack, backLabel = 'Back', actions }: PushedHeaderProps) {
  const { ref, past } = useScrolledPast<HTMLDivElement>()
  return (
    <>
      <TopBar
        title={title}
        filled={past}
        titleVisible
        leading={<RoundButton aria-label={backLabel} onClick={onBack}><ChevronLeftIcon /></RoundButton>}
        actions={actions}
      />
      <div ref={ref} aria-hidden="true" className="h-[calc(60px+var(--safe-top))]" />
    </>
  )
}
