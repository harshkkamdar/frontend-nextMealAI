'use client'

import { forwardRef, useState, type CSSProperties, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  /** Stagger index for the step entrance (`.rise`). */
  i?: number
}

/** Label, large input, and an inline error that names the fix. Password fields get a Show/Hide toggle. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({ id, label, error, i = 2, type = 'text', className, ...props }, ref) {
  const [shown, setShown] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="rise" style={{ '--i': i } as CSSProperties}>
      <label htmlFor={id} className="mb-2 block text-[15px] font-semibold text-ink">{label}</label>
      <div className={cn('flex h-field items-center rounded-[var(--radius-row)] bg-card outline -outline-offset-1 transition-[outline-color] focus-within:outline-2 focus-within:outline-ink', error ? 'outline-2 outline-ink' : 'outline-1 outline-ink-08')}>
        <input
          ref={ref}
          id={id}
          type={isPassword && shown ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn('h-full min-w-0 flex-1 bg-transparent px-4 text-body text-ink outline-none placeholder:text-ink-65', className)}
          {...props}
        />
        {isPassword ? (
          <button type="button" onClick={() => setShown((s) => !s)} aria-pressed={shown} className="mr-1.5 h-11 shrink-0 rounded-[12px] px-3 text-[15px] font-semibold text-ink-65">
            {shown ? 'Hide' : 'Show'}
          </button>
        ) : null}
      </div>
      {error ? <p id={`${id}-error`} role="alert" className="rise mt-2 text-[14.5px] font-semibold text-ink" style={{ '--i': 0, '--rise-delay': '0ms' } as CSSProperties}>{error}</p> : null}
    </div>
  )
})
