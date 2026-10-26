'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { reducedFade, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * iOS grouped list (settings idiom): a sentence-case header, one white card of 44 pt rows with inset hairlines,
 * and an optional footer note under the card.
 */
export function SettingsSection({ title, footer, children }: { title?: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title}>
      {title ? <h2 className="mb-2 px-4 text-[13px] font-semibold text-ink-65">{title}</h2> : null}
      <div className="overflow-hidden rounded-[24px] bg-card shadow-[var(--shadow-card)] [&>*+*]:border-t [&>*+*]:border-ink-06">
        {children}
      </div>
      {footer ? <p className="mt-2 px-4 text-[13px] leading-[1.45] text-ink-65">{footer}</p> : null}
    </section>
  )
}

const ROW = 'flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-[16px]'
const PRESS = 'active:bg-ink-04'

interface SettingsRowProps {
  label: ReactNode
  /** Right-aligned value in ink-65; long values truncate. */
  value?: ReactNode
  onClick?: () => void
  href?: string
  disabled?: boolean
  /** Accessory on the right (switch, time field, spinner). Replaces the value and chevron. */
  children?: ReactNode
}

export function SettingsRow({ label, value, onClick, href, disabled, children }: SettingsRowProps) {
  const pressable = Boolean(onClick || href)
  const content = (
    <>
      <span className="shrink-0 font-medium text-ink">{label}</span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
        {children ?? (
          <>
            {value !== undefined ? <span className="min-w-0 truncate text-[15px] text-ink-65">{value}</span> : null}
            {pressable ? <ChevronRightIcon className="size-4 shrink-0 text-ink-35" /> : null}
          </>
        )}
      </span>
    </>
  )
  if (href) return <Link href={href} className={cn(ROW, PRESS)}>{content}</Link>
  if (onClick) {
    return <button type="button" onClick={onClick} disabled={disabled} className={cn(ROW, PRESS, 'disabled:opacity-60')}>{content}</button>
  }
  return <div className={ROW}>{content}</div>
}

/** iOS switch: ink when on (orange stays for the screen's one action). 44 pt tall hit area around a 51 x 31 track. */
export function SettingsSwitch({ label, checked, disabled = false, onChange }: {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  const reduce = useReducedMotion()
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="-my-2.5 grid h-11 w-[51px] shrink-0 place-items-center disabled:opacity-50"
    >
      <span className="relative block h-[31px] w-[51px] overflow-hidden rounded-full bg-ink-12">
        {/* The on colour is a second layer that fades, so only opacity and transform animate. */}
        <span aria-hidden="true" className={cn('absolute inset-0 bg-ink transition-opacity duration-200', checked ? 'opacity-100' : 'opacity-0')} />
        <motion.span
          aria-hidden="true"
          className="absolute left-[2px] top-[2px] block size-[27px] rounded-full bg-card shadow-[0_2px_6px_rgba(17,28,53,.18)]"
          initial={false}
          animate={{ x: checked ? 20 : 0 }}
          transition={reduce ? reducedFade : spring.tap}
        />
      </span>
    </button>
  )
}

/**
 * A row whose value is a native picker (the iOS wheel on device). The select covers the whole row, so the
 * 44 pt row is the tap target and the label stays readable.
 */
export function SettingsSelect<T extends string | number>({ label, value, options, onChange }: {
  label: string
  value: T | null | undefined
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const current = options.find((option) => option.value === value)
  return (
    <div className={cn(ROW, PRESS, 'relative')}>
      <span aria-hidden="true" className="shrink-0 font-medium text-ink">{label}</span>
      <span aria-hidden="true" className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
        <span className="truncate text-[15px] text-ink-65">{current?.label ?? 'Choose'}</span>
        <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-ink-35" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m8 9 4-4 4 4M8 15l4 4 4-4" /></svg>
      </span>
      <select
        aria-label={label}
        value={current ? String(current.value) : ''}
        onChange={(event) => {
          const next = options.find((option) => String(option.value) === event.target.value)
          if (next) onChange(next.value)
        }}
        className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
      >
        {current ? null : <option value="" disabled>Choose</option>}
        {options.map((option) => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}
      </select>
    </div>
  )
}

/** Loading placeholder with the final group sizes, so content swaps in without a shift (motion-feel 3h). */
export function SettingsSkeleton({ groups = [1, 3, 5, 2], label = 'Loading settings' }: { groups?: number[]; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="flex flex-col gap-7">
      {groups.map((rows, index) => (
        <div key={index}>
          {index > 0 ? <div className="mb-2 ml-4 h-[13px] w-24 rounded-full bg-ink-06" /> : null}
          <div className="overflow-hidden rounded-[24px] bg-card shadow-[var(--shadow-card)]">
            {Array.from({ length: rows }, (_, row) => (
              <div key={row} className={cn('flex items-center px-4', index === 0 ? 'h-[76px]' : 'h-11', row > 0 && 'border-t border-ink-06')}>
                <span className="h-3 w-28 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-ink-06" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
