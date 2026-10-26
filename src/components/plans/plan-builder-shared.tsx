'use client'

import * as React from 'react'
import { Calendar, Plus, Search, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const fieldClass = 'h-14 w-full rounded-[14px] bg-card px-4 text-[17px] text-ink outline outline-1 -outline-offset-1 outline-ink-08 placeholder:text-ink-65 transition-[outline-color] focus:outline-2 focus:outline-ink'
export const labelClass = 'block text-[15px] font-semibold text-ink'

export function PlanNameField({ value, onChange, placeholder = 'Plan name' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="space-y-2"><label className={labelClass} htmlFor="plan-name">Plan name</label><input id="plan-name" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={fieldClass} /></div>
}

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

const dateRowClass = 'h-14 bg-card text-[16px] outline outline-1 -outline-offset-1 outline-ink-08'

export function PlanDateRangeField({ startDate, endDate, onChange }: { startDate: string; endDate: string; onChange: (next: { startDate: string; endDate: string }) => void }) {
  return <div className="grid grid-cols-2 gap-[10px]">
    <div className="space-y-2"><label className={labelClass} htmlFor="plan-start">Start date</label><DateInput id="plan-start" value={startDate} onChange={(v) => onChange({ startDate: v, endDate })} className={dateRowClass} /></div>
    <div className="space-y-2"><label className={labelClass} htmlFor="plan-end">End date</label><DateInput id="plan-end" value={endDate} onChange={(v) => onChange({ startDate, endDate: v })} className={dateRowClass} /></div>
  </div>
}

export function NumberField({ label, value, onChange, min, max, step, suffix, id, placeholder }: { label: string; value: number | undefined; onChange: (value: number | undefined) => void; min?: number; max?: number; step?: number; suffix?: string; id?: string; placeholder?: string }) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  return <div className="space-y-1.5">
    <label className="block truncate text-[13px] font-semibold text-ink-65" htmlFor={inputId}>{label}{suffix ? <span className="ml-1">({suffix})</span> : null}</label>
    <input id={inputId} type="number" inputMode="decimal" min={min} max={max} step={step} placeholder={placeholder} value={value === undefined || Number.isNaN(value) ? '' : value} onChange={(e) => { const raw = e.target.value; if (raw === '') return onChange(undefined); const parsed = Number(raw); if (!Number.isFinite(parsed)) return; let next = parsed; if (min !== undefined && next < min) next = min; if (max !== undefined && next > max) next = max; onChange(next) }} className="h-12 w-full rounded-[14px] bg-ink-04 px-2 text-center text-[17px] font-semibold text-ink tabular-nums outline outline-0 -outline-offset-1 outline-ink placeholder:text-ink-65 focus:outline-2" />
  </div>
}

export function IconButton({ icon, label, onClick, variant: _variant = 'ghost', type = 'button' }: { icon: React.ReactNode; label: string; onClick?: () => void; variant?: 'ghost' | 'danger' | 'accent'; type?: 'button' | 'submit' }) {
  return <button type={type} onClick={onClick} aria-label={label} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-65 transition-transform active:scale-[.94] [&_svg]:size-5">{icon}</button>
}

export function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-[16px] border-[1.5px] border-dashed border-ink-20 text-[15px] font-semibold text-ink transition-transform active:scale-[.98]"><Plus className="size-4" strokeWidth={2} aria-hidden="true" />{label}</button>
}

export function RemoveRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <IconButton icon={<Trash2 />} label={label} onClick={onClick} variant="danger" />
}

export interface SearchablePickerProps<T> { placeholder?: string; search: (query: string) => Promise<T[]>; renderItem: (item: T) => React.ReactNode; getItemKey: (item: T) => string; onSelect: (item: T) => void; value?: string; onClear?: () => void; label?: string; debounceMs?: number }

export function SearchablePicker<T>({ placeholder = 'Search…', search, renderItem, getItemKey, onSelect, value, onClear, label, debounceMs = 300 }: SearchablePickerProps<T>) {
  const inputId = React.useId()
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<T[]>([])
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const reqIdRef = React.useRef(0)
  React.useEffect(() => {
    if (value) return
    const trimmed = query.trim()
    if (!trimmed) { setResults([]); setLoading(false); return }
    setLoading(true)
    const timer = setTimeout(async () => { const myReq = ++reqIdRef.current; try { const found = await search(trimmed); if (reqIdRef.current === myReq) { setResults(found); setOpen(true) } } catch { if (reqIdRef.current === myReq) setResults([]) } finally { if (reqIdRef.current === myReq) setLoading(false) } }, debounceMs)
    return () => clearTimeout(timer)
  }, [query, search, debounceMs, value])
  if (value) return <div className="min-w-0 space-y-1.5">{label ? <div className={labelClass}>{label}</div> : null}<div className="flex h-12 max-w-full items-center gap-2 rounded-full bg-ink pl-4 text-[15px] font-semibold text-cream"><span className="min-w-0 flex-1 truncate">{value}</span>{onClear ? <button type="button" onClick={onClear} aria-label="Clear selection" className="flex size-11 shrink-0 items-center justify-center rounded-full"><X className="size-4" aria-hidden="true" /></button> : null}</div></div>
  return <div className="relative space-y-1.5">
    {label ? <label className={labelClass} htmlFor={inputId}>{label}</label> : null}
    <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-65" strokeWidth={1.75} aria-hidden="true" /><input id={inputId} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} onFocus={() => results.length > 0 && setOpen(true)} className={cn(fieldClass, 'pl-11')} /></div>
    {open && (results.length > 0 || loading) ? <ul aria-label="Search results" className="absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-[16px] bg-card py-1 shadow-[0_12px_32px_rgba(17,28,53,.14)]">{loading ? <li className="flex min-h-12 items-center px-4 text-[14px] text-ink-65">Searching…</li> : results.map((item) => <li key={getItemKey(item)}><button type="button" onClick={() => { onSelect(item); setQuery(''); setResults([]); setOpen(false) }} className="min-h-12 w-full px-4 py-2 text-left text-[15.5px] text-ink active:bg-ink-04">{renderItem(item)}</button></li>)}</ul> : null}
  </div>
}
