import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { cn } from '@/lib/utils'

export const GROUP_CARD = 'overflow-hidden rounded-card tile'
export const HAIRLINES = "[&>*+*]:relative [&>*+*]:before:pointer-events-none [&>*+*]:before:absolute [&>*+*]:before:inset-x-0 [&>*+*]:before:left-[18px] [&>*+*]:before:top-0 [&>*+*]:before:h-px [&>*+*]:before:bg-ink-08 [&>*+*]:before:content-['']"
export const ROW = 'flex min-h-row w-full items-center gap-2.5 pl-[18px] pr-4 text-left text-body'
export const PRESS = 'transition-colors duration-150 active:bg-ink-04'
export const GLYPH = 'size-4 shrink-0 text-ink-35'

export function GroupedList({ title, footer, children, label }: { title?: string; footer?: ReactNode; children: ReactNode; label?: string }) {
  return (
    <section aria-label={title ?? label}>
      {title ? <h2 className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62">{title}</h2> : null}
      <div className={cn(GROUP_CARD, HAIRLINES)}>{children}</div>
      {footer ? <div className="mt-[7px] px-4 text-caption leading-[1.45] text-ink-65">{footer}</div> : null}
    </section>
  )
}

interface GroupedRowProps {
  label: ReactNode
  value?: ReactNode
  onClick?: () => void
  href?: string
  disabled?: boolean
  action?: boolean
  children?: ReactNode
}

export function GroupedRow({ label, value, onClick, href, disabled, action, children }: GroupedRowProps) {
  const pressable = Boolean(onClick || href)
  const trailing = children !== undefined || value !== undefined || (pressable && !action)
  const content = (
    <>
      <span className={cn('min-w-0 font-medium text-ink', trailing ? 'shrink-0' : 'flex-1 py-3')}>{label}</span>
      {trailing ? (
        <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
          {children ?? (
            <>
              {value !== undefined ? <span className="min-w-0 truncate text-ink-65 tabular-nums">{value}</span> : null}
              {pressable ? <ChevronRightIcon className={GLYPH} /> : value !== undefined ? <span aria-hidden="true" className={GLYPH} /> : null}
            </>
          )}
        </span>
      ) : null}
    </>
  )
  if (href) return <Link href={href} className={cn(ROW, PRESS)}>{content}</Link>
  if (onClick) return <button type="button" onClick={onClick} disabled={disabled} className={cn(ROW, PRESS, 'disabled:opacity-60')}>{content}</button>
  return <div className={ROW}>{content}</div>
}
