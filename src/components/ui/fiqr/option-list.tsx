'use client'

import type { CSSProperties, ReactNode } from 'react'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'

export interface Option<T extends string> {
  value: T
  label: string
  hint?: string
  icon?: ReactNode
}

interface Common<T extends string> {
  options: Option<T>[]
  label: string
  className?: string
}

type Single<T extends string> = Common<T> & { multi?: false; value: T | null; onChange: (value: T) => void }
/** `exclusive` (e.g. "None") clears the others when picked and is cleared when another is picked. */
type Multi<T extends string> = Common<T> & { multi: true; value: T[]; onChange: (value: T[]) => void; exclusive?: T }

/** Large option cards, one per row. Selected = ink outline and filled mark; never an orange fill. */
export function OptionList<T extends string>(props: Single<T> | Multi<T>) {
  const { options, label, className } = props

  function toggle(value: T) {
    void haptic('light')
    if (!props.multi) return props.onChange(value)
    const { exclusive } = props
    const current = props.value
    if (current.includes(value)) return props.onChange(current.filter((v) => v !== value))
    if (value === exclusive) return props.onChange([value])
    props.onChange([...current.filter((v) => v !== exclusive), value])
  }

  return (
    <div role={props.multi ? 'group' : 'radiogroup'} aria-label={label} className={cn('flex flex-col gap-2.5', className)}>
      {options.map((option, i) => {
        const selected = props.multi ? props.value.includes(option.value) : props.value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role={props.multi ? 'checkbox' : 'radio'}
            aria-checked={selected}
            onClick={() => toggle(option.value)}
            style={{ '--i': i + 2 } as CSSProperties}
            className={cn(
              'rise flex min-h-row w-full items-start gap-3.5 rounded-[var(--radius-row)] bg-card px-4 py-3 text-left transition-[transform,outline-color,box-shadow] duration-200 active:scale-[.97] active:duration-75',
              'outline -outline-offset-1',
              selected ? 'outline-2 outline-ink shadow-[0_6px_18px_-8px_rgba(17,28,53,.25)]' : 'outline-1 outline-ink-08',
            )}
          >
            {option.icon ? <span className="grid size-10 shrink-0 self-center place-items-center rounded-full bg-ink-06 text-ink [&_svg]:size-5">{option.icon}</span> : null}
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold text-ink">{option.label}</span>
              {option.hint ? <span className="mt-0.5 block text-caption text-ink-80">{option.hint}</span> : null}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'mt-px grid size-[22px] shrink-0 place-items-center border-[1.5px] transition-colors',
                props.multi ? 'rounded-[6px]' : 'rounded-full',
                selected ? 'border-ink' : 'border-ink-35',
                selected && props.multi ? 'bg-ink text-cream' : '',
              )}
            >
              {selected && !props.multi ? <span className="pop size-2.5 rounded-full bg-ink" /> : null}
              {selected && props.multi ? (
                <svg viewBox="0 0 16 16" className="pop size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
