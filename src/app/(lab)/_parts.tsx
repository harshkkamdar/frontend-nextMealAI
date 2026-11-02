'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Wordmark } from '@/components/ui/fiqr/wordmark'
import { cn } from '@/lib/utils'

/**
 * Shell for /brand and /lab: the system documents itself with the app's own components, so a change to a component
 * shows here first. Wide on a desktop (for review), one column on a phone.
 */
export function LabShell({ eyebrow, title, lede, children }: { eyebrow: string; title: string; lede: ReactNode; children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-cream text-ink">
      <nav className="sticky top-0 z-[30] border-b border-ink-09 bg-cream" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-6 px-gutter">
          <Link href="/brand" aria-label="FIQR brand"><Wordmark size={22} /></Link>
          <div className="ml-auto flex gap-1">
            {[['/brand', 'Brand'], ['/mascot', 'Mascot'], ['/geo', 'Geo'], ['/lab', 'Components']].map(([href, label]) => (
              <Link key={href} href={href} className={cn('flex h-11 items-center rounded-full px-3.5 text-[15px] font-semibold', pathname === href ? 'text-ink' : 'text-ink-62')}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-[1180px] px-gutter pb-32">
        <header className="pb-6 pt-16">
          <p className="text-[12px] font-medium uppercase tracking-[1.4px] text-ink-62">{eyebrow}</p>
          <h1 className="mt-2 max-w-[18ch] text-pretty text-[clamp(36px,6vw,56px)] font-bold leading-[1.05] tracking-[-1.2px]">{title}</h1>
          <div className="mt-5 max-w-[60ch] text-pretty text-[17px] leading-[1.5] text-ink-80">{lede}</div>
        </header>
        {children}
      </main>
    </div>
  )
}

/** A numbered chapter: a hairline, the number and name in the section style, then the body. */
export function Chapter({ n, id, title, intro, children }: { n: string; id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="mt-16 scroll-mt-20 border-t border-ink-12 pt-10">
      <div className="flex flex-wrap gap-x-10 gap-y-5">
        <div className="w-[240px] shrink-0">
          <p className="text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62 tabular-nums">{n}</p>
          <h2 id={`${id}-h`} className="mt-1.5 text-[24px] font-bold tracking-[-0.5px]">{title}</h2>
          {intro ? <div className="mt-2 max-w-[44ch] text-[15px] leading-[1.5] text-ink-65">{intro}</div> : null}
        </div>
        <div className="min-w-0 flex-1 basis-[560px]">{children}</div>
      </div>
    </section>
  )
}

/**
 * One component on its page: name, source file and where it is used, then the live component on a phone-width
 * cream panel. `fixedInside`: the panel is a containing block, so the component's fixed bars sit inside it.
 */
export function Specimen({ name, file, use, children, height, fixedInside = false, dark = false, className }: {
  name: string
  file: string
  use: string
  children: ReactNode
  height?: number
  fixedInside?: boolean
  dark?: boolean
  className?: string
}) {
  return (
    <figure className={cn('min-w-0', className)}>
      <div
        className={cn('relative w-full max-w-[390px] overflow-hidden rounded-[20px] border border-ink-12', dark ? 'bg-ink' : 'bg-cream')}
        style={{ height, transform: fixedInside ? 'translateZ(0)' : undefined }}
      >
        <div className={cn(!fixedInside && 'px-gutter py-5')}>{children}</div>
      </div>
      <figcaption className="mt-3 max-w-[390px]">
        <p className="text-[15px] font-semibold">{name}</p>
        <p className="mt-0.5 text-[13px] text-ink-65">{use}</p>
        <p className="mt-1 font-mono text-[12px] text-ink-62">{file}</p>
      </figcaption>
    </figure>
  )
}

/** A small caption above a state inside a specimen. */
export function StateLabel({ children, onNavy = false }: { children: ReactNode; onNavy?: boolean }) {
  return <p className={cn('mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[1.4px] first:mt-0', onNavy ? 'text-cream-55' : 'text-ink-62')}>{children}</p>
}
