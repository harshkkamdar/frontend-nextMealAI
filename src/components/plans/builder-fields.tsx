'use client'

import { useId, type ReactNode } from 'react'
import { DateInput } from '@/components/ui/fiqr/date-input'
import { haptic } from '@/lib/platform/app'
import { CARD, HueDot } from '@/components/plans/spatial-parts'

/** Builder controls in the C1 Focused steps look (mocks/journey-plans.html): fields 60, steppers 56, cells 44. */

const FIELD = 'h-field w-full rounded-[16px] bg-[var(--surface-card)] px-4 text-body font-semibold text-ink shadow-[inset_0_0_0_1px_rgba(17,28,53,.1)] outline-none placeholder:font-medium placeholder:text-ink-65 focus:shadow-[inset_0_0_0_2px_var(--color-ink)]'
const LABEL = 'mb-2 block px-1 text-label text-ink-65'

export function TextField({ label, value, onChange, placeholder, id }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; id?: string }) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <div>
      <label htmlFor={inputId} className={LABEL}>{label}</label>
      <input id={inputId} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={FIELD} />
    </div>
  )
}

export function NotesField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label htmlFor="plan-notes" className={LABEL}>Notes</label>
      <textarea id="plan-notes" value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} className={`${FIELD} h-auto min-h-[76px] resize-none py-3.5 leading-[1.4]`} />
    </div>
  )
}

/** Start and end side by side; the end is optional. */
export function DateFields({ startDate, endDate, onChange }: { startDate: string; endDate: string; onChange: (next: { startDate: string; endDate: string }) => void }) {
  const box = 'h-field bg-[var(--surface-card)] text-body font-semibold shadow-[inset_0_0_0_1px_rgba(17,28,53,.1)] rounded-[16px]'
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div><label className={LABEL} htmlFor="plan-start">Start</label><DateInput id="plan-start" value={startDate} onChange={(v) => onChange({ startDate: v, endDate })} placeholder="Optional" className={box} /></div>
      <div><label className={LABEL} htmlFor="plan-end">End</label><DateInput id="plan-end" value={endDate} onChange={(v) => onChange({ startDate, endDate: v })} placeholder="Optional" className={box} /></div>
    </div>
  )
}

/** Name, dates and notes: the first question of every builder. */
export function NameStep({ name, onName, placeholder, startDate, endDate, onDates, notes, onNotes, notesPlaceholder }: {
  name: string
  onName: (value: string) => void
  placeholder: string
  startDate: string
  endDate: string
  onDates: (next: { startDate: string; endDate: string }) => void
  notes: string
  onNotes: (value: string) => void
  notesPlaceholder: string
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <TextField id="plan-name" label="Plan name" value={name} onChange={onName} placeholder={placeholder} />
      <DateFields startDate={startDate} endDate={endDate} onChange={onDates} />
      <NotesField value={notes} onChange={onNotes} placeholder={notesPlaceholder} />
    </div>
  )
}

function Round({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={() => { void haptic('selection'); onClick() }} className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-06 text-[20px] font-semibold text-ink transition-transform active:scale-[.92]">
      {children}
    </button>
  )
}

/** One daily target: minus, the value (typeable for an exact number), plus. */
export function TargetStepper({ label, macro, unit, value, step, onChange }: {
  label: string
  macro: 'calories' | 'protein' | 'carbs' | 'fat'
  unit: string
  value: number | undefined
  step: number
  onChange: (value: number | undefined) => void
}) {
  const id = useId()
  const nudge = (delta: number) => onChange(Math.max(0, (value ?? 0) + delta))
  return (
    <div className="grid min-h-stepper grid-cols-[44px_1fr_44px] items-center rounded-[18px] bg-[var(--surface-card,var(--color-card))] p-1.5 shadow-[0_1px_2px_rgba(17,28,53,.04)]">
      <Round label={`Less ${label.toLowerCase()}`} onClick={() => nudge(-step)}>−</Round>
      <div className="flex flex-col items-center">
        <label htmlFor={id} className="flex items-center gap-1.5 text-label text-ink-65"><HueDot macro={macro} />{label}</label>
        <span className="flex items-baseline justify-center gap-1">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={0}
            value={value === undefined || Number.isNaN(value) ? '' : value}
            onChange={(e) => { const raw = e.target.value; if (raw === '') return onChange(undefined); const n = Number(raw); if (Number.isFinite(n)) onChange(Math.max(0, n)) }}
            className="-my-2 h-11 w-[5.5ch] bg-transparent text-right font-display text-[20px] font-[800] text-ink tabular-nums outline-none [appearance:textfield] focus:underline [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-caption font-semibold text-ink-65">{unit}</span>
        </span>
      </div>
      <Round label={`More ${label.toLowerCase()}`} onClick={() => nudge(step)}>+</Round>
    </div>
  )
}

/** A labelled number cell (Sets, Reps, kg; kcal and macros on a meal): 44 pt, tinted, typeable. */
export function NumberCell({ label, value, onChange, ariaLabel, min = 0 }: { label: string; value: number | undefined; onChange: (value: number | undefined) => void; ariaLabel: string; min?: number }) {
  return (
    <label className="relative flex min-h-11 items-center rounded-[14px] bg-ink-04 px-3 focus-within:shadow-[inset_0_0_0_2px_var(--color-ink)]">
      <span aria-hidden="true" className="text-caption text-ink-65">{label}</span>
      <input
        aria-label={ariaLabel}
        type="number"
        inputMode="decimal"
        min={min}
        value={value === undefined || Number.isNaN(value) ? '' : value}
        onChange={(e) => { const raw = e.target.value; if (raw === '') return onChange(undefined); const n = Number(raw); if (Number.isFinite(n)) onChange(Math.max(min, n)) }}
        className="absolute inset-0 size-full rounded-[14px] bg-transparent pl-10 pr-3 text-right text-body font-bold text-ink tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
    </label>
  )
}

/** Dashed add row (Add meal, Add exercise, Add day). */
export function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-[16px] border-[1.5px] border-dashed border-ink-20 text-body-sm font-semibold text-ink transition-transform active:scale-[.98]">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      {children}
    </button>
  )
}

/** "Make it my active plan": a switch row in its own card, ink when on. */
export function ActiveSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => { void haptic('selection'); onChange(!checked) }}
      className={`${CARD} flex min-h-[60px] w-full items-center gap-3 px-4 py-2 text-left`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-body font-bold text-ink">Make it my active plan</span>
        <span className="block text-caption text-ink-65">Replaces the one you follow now</span>
      </span>
      <span aria-hidden="true" className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-ink' : 'bg-ink-20'}`}>
        <span className={`absolute left-[3px] top-[3px] size-6 rounded-full bg-card shadow-[0_1px_3px_rgba(17,28,53,.25)] transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${checked ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  )
}

export function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-ink transition-transform active:scale-[.92]">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 7l10 10M17 7 7 17" /></svg>
    </button>
  )
}
