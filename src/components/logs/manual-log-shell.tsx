'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { PushedHeader } from '@/components/layout/screen-header'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { OfflineBand } from '@/components/shared/offline-band'
import { cn } from '@/lib/utils'
import { FIELD } from './log-ui'

/**
 * Pushed log screen: centred title with a round glass back (Q19), Geo's question as the hero line,
 * the inputs, and the one orange Save under them. Save stays in the flow so the tab bar never covers it.
 */
export function ManualLogShell({
  title,
  prompt,
  saving,
  onSave,
  actionLabel = 'Save',
  savingLabel = 'Saving…',
  children,
}: {
  title: string
  prompt: string
  saving: boolean
  onSave: () => void
  actionLabel?: string
  savingLabel?: string
  children: ReactNode
}) {
  const router = useRouter()

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-6">
      <PushedHeader title={title} onBack={() => router.back()} />
      <div className="-mx-4 [&:not(:empty)]:mb-2"><OfflineBand /></div>
      <p className="font-wide mt-3 px-1 text-[28px] font-bold leading-[1.15] tracking-[-0.5px] text-ink">{prompt}</p>
      <div className="mt-6">{children}</div>
      <PrimaryButton type="button" onClick={onSave} disabled={saving} aria-busy={saving} className="mt-8 justify-center">
        {saving ? savingLabel : actionLabel}
      </PrimaryButton>
    </div>
  )
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  const className = 'mb-2 block px-1 text-[13px] font-semibold text-ink-65'
  return htmlFor ? <label htmlFor={htmlFor} className={className}>{children}</label> : <p className={className}>{children}</p>
}

export function NotesField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div>
      <FieldLabel htmlFor="log-notes">Notes</FieldLabel>
      <textarea
        id="log-notes"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(FIELD, 'field-sizing-content min-h-24 resize-none py-3.5 text-[16px] leading-[1.45]')}
      />
    </div>
  )
}

export function NumericSuffixInput({
  value,
  onChange,
  suffix,
  placeholder,
  step,
  min,
  max,
  label,
}: {
  value: number | ''
  onChange: (value: number | '') => void
  suffix: string
  placeholder: string
  step?: string
  min?: number
  max?: number
  label: string
}) {
  return (
    <label className="flex h-[72px] items-center gap-2 rounded-[22px] bg-card px-5 shadow-[var(--shadow-card)] focus-within:outline focus-within:outline-[1.5px] focus-within:outline-ink">
      <span className="sr-only">{label}</span>
      <input
        aria-label={label}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : '')}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        className="font-wide h-full min-w-0 flex-1 bg-transparent text-[32px] font-bold tracking-[-0.6px] text-ink outline-none placeholder:text-ink-35 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="text-[17px] font-semibold text-ink-65">{suffix}</span>
    </label>
  )
}
