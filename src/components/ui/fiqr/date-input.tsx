'use client'

import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

/** "26 Oct 2026" for a YYYY-MM-DD value, read as a local date so it never shifts a day. */
export function formatDateValue(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return ''
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * A date shown as an app row (value text in the house face); the native input sits invisibly on top, so a tap
 * still opens the platform date picker and the value stays a plain YYYY-MM-DD string.
 */
export function DateInput({ id, value, onChange, ariaLabel, placeholder = 'Choose', className }: { id?: string; value: string; onChange: (value: string) => void; ariaLabel?: string; placeholder?: string; className?: string }) {
  const shown = formatDateValue(value)
  return (
    <div className={cn('relative flex items-center rounded-[14px] px-4 focus-within:outline-2 focus-within:outline-ink', className)}>
      <span aria-hidden="true" className={cn('min-w-0 flex-1 truncate tabular-nums', shown ? 'text-ink' : 'text-ink-65')}>{shown || placeholder}</span>
      <Calendar aria-hidden="true" className="size-[18px] shrink-0 text-ink-65" strokeWidth={1.75} />
      <input
        id={id} type="date" aria-label={ariaLabel} value={value}
        onChange={(e) => onChange(e.target.value)}
        // Desktop browsers only open the picker from their own icon; ask for it on any click.
        onClick={(e) => { try { e.currentTarget.showPicker?.() } catch { /* not allowed here; native focus still works */ } }}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </div>
  )
}
