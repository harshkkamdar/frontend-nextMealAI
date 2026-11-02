'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { GLYPH, GROUP_CARD, HAIRLINES, PRESS, ROW } from '@/components/ui/fiqr/grouped-list'
import { reducedFade, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

export { GROUP_CARD, GLYPH }
export { GroupedList as SettingsSection, GroupedRow as SettingsRow } from '@/components/ui/fiqr/grouped-list'

/** iOS switch, ink when on (orange stays for the screen's one action). 44 pt tall hit area. */
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
          className="absolute left-[2px] top-[2px] block size-[27px] rounded-full bg-card shadow-[0_2px_6px_rgba(17,28,53,.25)]"
          initial={false}
          animate={{ x: checked ? 20 : 0 }}
          transition={reduce ? reducedFade : spring.tap}
        />
      </span>
    </button>
  )
}

export interface MenuOption<T> {
  value: T
  label: string
  /** What the choice does, shown under its label in the menu (a sample line, a date). */
  detail?: string
}

const MENU_W = 264
const UpDown = () => (
  <svg viewBox="0 0 24 24" className={GLYPH} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 9 4-4 4 4M8 15l4 4 4-4" /></svg>
)

/**
 * A row whose value opens a glass menu anchored to it (iOS pull-down menu, mock "Grouped list"): each choice can say
 * what it does under its label. Picking saves at once; Escape, a tap outside or a scroll closes it and focus returns to the row.
 */
export function SettingsMenu<T extends string | number>({ label, value, options, onChange }: {
  label: string
  value: T | null | undefined
  options: readonly MenuOption<T>[]
  onChange: (value: T) => void
}) {
  const reduce = useReducedMotion()
  const id = useId()
  const rowRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState<{ top: number; left: number; up: boolean } | null>(null)
  const current = options.find((option) => option.value === value)

  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) rowRef.current?.focus({ preventScroll: true })
  }

  // Placed before paint: under the row, or above it when the screen has no room below.
  useLayoutEffect(() => {
    if (!open || !rowRef.current || !menuRef.current) return
    const row = rowRef.current.getBoundingClientRect()
    const h = menuRef.current.offsetHeight
    const width = Math.min(MENU_W, window.innerWidth - 32)
    const below = row.bottom + 4
    const up = below + h > window.innerHeight - 14
    setPlace({ top: Math.max(56, up ? row.top - h - 4 : below), left: Math.max(16, row.right - width), up })
  }, [open])

  useEffect(() => {
    if (!open) return
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role=menuitemradio]') ?? [])]
    ;(items.find((el) => el.getAttribute('aria-checked') === 'true') ?? items[0])?.focus({ preventScroll: true })
    // The page moving under an anchored menu would leave it floating loose, so a scroll dismisses it (iOS does the same).
    const dismiss = () => setOpen(false)
    window.addEventListener('scroll', dismiss, { passive: true })
    window.addEventListener('resize', dismiss)
    return () => { window.removeEventListener('scroll', dismiss); window.removeEventListener('resize', dismiss) }
  }, [open])

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role=menuitemradio]') ?? [])]
    const at = items.indexOf(document.activeElement as HTMLButtonElement)
    const go = (i: number) => { event.preventDefault(); items[(i + items.length) % items.length]?.focus() }
    if (event.key === 'Escape') { event.preventDefault(); close() }
    else if (event.key === 'Tab') close(false)
    else if (event.key === 'ArrowDown') go(at + 1)
    else if (event.key === 'ArrowUp') go(at - 1)
    else if (event.key === 'Home') go(0)
    else if (event.key === 'End') go(items.length - 1)
  }

  return (
    <>
      <button
        ref={rowRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(true)}
        className={cn(ROW, PRESS)}
      >
        <span className="shrink-0 font-medium text-ink">{label}</span>
        <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
          <span className="min-w-0 truncate text-ink-65 tabular-nums">{current?.label ?? 'Choose'}</span>
          <UpDown />
        </span>
      </button>
      {typeof document === 'undefined' ? null : createPortal(
        <AnimatePresence onExitComplete={() => setPlace(null)}>
          {open ? (
            <div key="menu" className="fixed inset-0 z-[70]">
              <div aria-hidden="true" className="absolute inset-0" onPointerDown={(event) => { event.preventDefault(); close() }} />
              <motion.div
                ref={menuRef}
                id={id}
                role="menu"
                aria-label={label}
                onKeyDown={onKey}
                className="tile absolute rounded-card p-1.5 shadow-[0_8px_24px_rgba(17,28,53,.12)]"
                style={{
                  top: place?.top ?? 0,
                  left: place?.left ?? 0,
                  width: `min(${MENU_W}px, calc(100vw - 32px))`,
                  visibility: place ? 'visible' : 'hidden',
                  transformOrigin: place?.up ? '90% 100%' : '90% 0',
                }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1, transition: reduce ? reducedFade : { scale: spring.lens, opacity: { duration: 0.16, ease: 'easeOut' } } }}
                exit={reduce ? { opacity: 0, transition: reducedFade } : { opacity: 0, scale: 0.8, transition: { duration: 0.16, ease: 'easeOut' } }}
              >
                {options.map((option) => {
                  const on = option.value === value
                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      role="menuitemradio"
                      aria-checked={on}
                      onClick={() => { close(); if (!on) onChange(option.value) }}
                      className="grid min-h-[46px] w-full grid-cols-[20px_1fr] items-center gap-x-2 gap-y-0.5 rounded-[15px] px-3 py-[9px] text-left text-body font-semibold text-ink outline-none transition-colors duration-150 focus-visible:bg-ink-06 active:bg-ink-06"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('size-4 text-ink', on ? 'opacity-100' : 'opacity-0')} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                      <span>{option.label}</span>
                      {option.detail ? <span className="col-start-2 text-caption font-normal leading-[1.35] text-ink-65">{option.detail}</span> : null}
                    </button>
                  )
                })}
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

/** Loading placeholder with the final group sizes, so content swaps in without a shift (motion-feel 3h). */
export function SettingsSkeleton({ groups = [1, 2, 3, 2], label = 'Loading settings' }: { groups?: number[]; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="flex flex-col gap-[22px]">
      {groups.map((rows, index) => (
        <div key={index}>
          {index > 0 ? <div className="mb-[7px] ml-4 h-4 w-24 rounded-full bg-ink-06" /> : null}
          <div className={cn(GROUP_CARD, HAIRLINES)}>
            {Array.from({ length: rows }, (_, row) => (
              <div key={row} className={cn('flex items-center pl-[18px]', index === 0 ? 'h-[72px]' : 'h-row')}>
                <span className="h-3 w-28 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-ink-06" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
