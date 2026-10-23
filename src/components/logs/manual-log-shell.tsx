'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { GeoLine } from '@/components/ui/fiqr/geo-line'
import { PageHeader } from '@/components/ui/fiqr/page-header'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { OfflineBand } from '@/components/shared/offline-band'

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
    <div>
      <PageHeader title={title} onBack={() => router.back()} className="mb-2" />
      <div className="-mx-gutter [&:not(:empty)]:mb-4"><OfflineBand /></div>
      <GeoLine>{prompt}</GeoLine>
      <div className="mt-4">{children}</div>
      <PrimaryButton type="button" onClick={onSave} disabled={saving} className="mt-6 justify-center">
        {saving ? savingLabel : actionLabel}
      </PrimaryButton>
    </div>
  )
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
    <label className="block">
      <span className="mb-2 block text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-65">Notes</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-24 w-full resize-none rounded-[15px] border border-ink-16 bg-card p-3 text-[15.5px] text-ink outline-none placeholder:text-ink-65 focus:border-ink"
      />
    </label>
  )
}

export function RatingPills({
  rating,
  onChange,
  label,
}: {
  rating: number
  onChange: (rating: number) => void
  label: string
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <SectionLabel>{label}</SectionLabel>
        <p className="text-[28px] font-bold tracking-[-0.6px] text-ink tabular-nums" aria-live="polite">
          {rating ? rating : '–'}<span className="text-[15.5px] font-semibold text-ink-65">/10</span>
        </p>
      </div>
      <div className="grid grid-cols-5 gap-2" role="group" aria-label={label}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            type="button"
            onClick={() => onChange(number)}
            aria-pressed={rating === number}
            className={`h-11 w-full rounded-full text-[15.5px] font-semibold ${
              rating === number ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'
            }`}
          >
            {number}
          </button>
        ))}
      </div>
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
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <input
        aria-label={label}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : '')}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        className="h-14 w-full rounded-[15px] border border-ink-16 bg-card px-12 text-center text-[28px] font-bold tracking-[-0.6px] text-ink outline-none placeholder:text-ink-65 focus:border-ink"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-medium text-ink-65">{suffix}</span>
    </label>
  )
}
