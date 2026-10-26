'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PushedHeader } from '@/components/layout/screen-header'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { OfflineBand } from '@/components/shared/offline-band'
import { createLogWithStatus } from '@/lib/api/logs.api'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import type { CreateLogInput } from '@/types/logs.types'
import { CARD, FIELD } from './log-ui'

/**
 * Pushed log screen (journey-log M): centred title with a round glass back (Q19), Geo's question as the large title
 * with a context line under it, the inputs, and the one orange Save floating at the bottom (the tab bar is hidden on
 * /logs/new/*). A failed save shows the reason above the inputs' end and Save becomes Try again.
 */
export function ManualLogShell({
  title,
  prompt,
  sub,
  saving,
  failed = false,
  onSave,
  actionLabel = 'Save',
  savingLabel = 'Saving…',
  children,
}: {
  title: string
  prompt: string
  sub?: ReactNode
  saving: boolean
  failed?: boolean
  onSave: () => void
  actionLabel?: string
  savingLabel?: string
  children: ReactNode
}) {
  const router = useRouter()

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-[calc(112px+var(--safe-bottom))]">
      <PushedHeader title={title} onBack={() => router.back()} />
      <div className="-mx-4 [&:not(:empty)]:mb-2"><OfflineBand queuesSaves /></div>
      <h1 className="font-display mt-2 px-0.5 text-title text-ink">{prompt}</h1>
      {sub ? <p className="mt-1.5 px-0.5 text-caption text-ink-65 tabular-nums">{sub}</p> : null}
      <div className="mt-5">{children}</div>
      {failed ? (
        <p role="alert" className="mt-4 rounded-[16px] bg-macro-ochre/15 px-4 py-3 text-body-sm text-ink">Couldn&apos;t save. Check your connection and try again.</p>
      ) : null}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 pb-[calc(16px+var(--safe-bottom))] pt-3">
        {/* No band behind Save: the app's tinted backdrop shows through, and the page pads its end clear of it. */}
        <div className="pointer-events-auto mx-auto w-full max-w-md px-4">
          <PrimaryButton type="button" onClick={onSave} disabled={saving} aria-busy={saving}>
            {saving ? savingLabel : failed ? 'Try again' : actionLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

/**
 * Saves one manual log. Offline it queues on the phone and says so; a server error returns false so the screen can
 * show its failed state. Success leaves the screen.
 */
export async function saveManualLog(input: CreateLogInput, done: string, leave: () => void): Promise<boolean> {
  try {
    const result = await createLogWithStatus(input)
    void haptic('success')
    toast.success(result.queued ? `${done}. Saved on your phone, sends when you are back online` : done)
    leave()
    return true
  } catch {
    return false
  }
}

/** One card: − value + on 56 pt round buttons (water glasses, sleep hours). */
export function InlineStepper({ value, unit, onLess, onMore, lessLabel, moreLabel, lessDisabled, moreDisabled, children }: {
  value: ReactNode
  unit: string
  onLess: () => void
  onMore: () => void
  lessLabel: string
  moreLabel: string
  lessDisabled?: boolean
  moreDisabled?: boolean
  children?: ReactNode
}) {
  const button = 'grid size-14 shrink-0 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.92] disabled:opacity-40'
  const step = (fn: () => void) => () => { void haptic('selection'); fn() }
  return (
    <div className={cn(CARD, 'px-4 py-4')}>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={lessLabel} disabled={lessDisabled} onClick={step(onLess)} className={button}><Minus className="size-5" /></button>
        <div className="min-w-0 flex-1 text-center" aria-live="polite">
          <p className="font-display text-hero text-ink tabular-nums">{value}</p>
          <p className="mt-0.5 text-label font-medium text-ink-65">{unit}</p>
        </div>
        <button type="button" aria-label={moreLabel} disabled={moreDisabled} onClick={step(onMore)} className={button}><Plus className="size-5" /></button>
      </div>
      {children}
    </div>
  )
}

/** The words under the two ends of a 1 to 10 scale. */
export function ScaleEnds({ low, high }: { low: string; high: string }) {
  return <p className="mt-1.5 flex justify-between px-0.5 text-caption text-ink-65"><span>{low}</span><span>{high}</span></p>
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
    <label className="flex h-[72px] items-center gap-2 rounded-[22px] bg-[var(--surface-card)] px-5 shadow-[var(--shadow-card)] focus-within:outline focus-within:outline-[1.5px] focus-within:outline-ink">
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
