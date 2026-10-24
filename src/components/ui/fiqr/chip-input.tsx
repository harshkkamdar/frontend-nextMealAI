'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ChipInputProps {
  label: string
  placeholder: string
  value: string[]
  onChange: (value: string[]) => void
  /** Tap-to-add suggestions shown under the field. */
  suggestions?: string[]
}

/** Free-text list: type and press Add (or Enter); suggestions add with one tap. */
export function ChipInput({ label, placeholder, value, onChange, suggestions = [] }: ChipInputProps) {
  const [text, setText] = useState('')

  function add(item: string) {
    const trimmed = item.trim()
    if (trimmed && !value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) onChange([...value, trimmed])
    setText('')
  }

  const remaining = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))

  return (
    <div>
      <div className="flex h-14 items-center gap-2 rounded-[var(--radius-row)] bg-card pl-4 pr-1.5 outline outline-1 -outline-offset-1 outline-ink-08">
        <input
          aria-label={label}
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(text) } }}
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-ink-65"
        />
        <button type="button" onClick={() => add(text)} disabled={!text.trim()} className="h-11 rounded-[12px] px-4 text-[15px] font-semibold text-ink disabled:text-ink-35">
          Add
        </button>
      </div>
      {value.length > 0 ? (
        <ul aria-label={`${label} added`} className="mt-3 flex flex-wrap gap-2">
          {value.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== item))}
                aria-label={`Remove ${item}`}
                className="flex h-11 items-center gap-2 rounded-full bg-ink pl-4 pr-3 text-[15px] font-semibold text-cream"
              >
                {item}
                <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {remaining.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {remaining.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className={cn('h-11 rounded-full bg-ink-06 px-4 text-[15px] font-semibold text-ink')}>
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
