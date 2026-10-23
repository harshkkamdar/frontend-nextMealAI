'use client'

import * as React from 'react'
import { Plus, Search, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const fieldClass = 'h-14 w-full rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] text-ink placeholder:text-ink-65 outline-none focus:border-ink'
// Dates use a smaller face so dd/mm/yyyy and the picker icon fit two-up at 360px.
const dateClass = 'h-14 w-full rounded-[15px] border border-ink-16 bg-card px-3 text-[15.5px] text-ink outline-none focus:border-ink'
const labelClass = 'block text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-65'

export function PlanNameField({ value, onChange, placeholder = 'Plan name' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="space-y-1.5"><label className={labelClass} htmlFor="plan-name">Plan name</label><input id="plan-name" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={fieldClass} /></div>
}

export function PlanDateRangeField({ startDate, endDate, onChange }: { startDate: string; endDate: string; onChange: (next: { startDate: string; endDate: string }) => void }) {
  return <div className="grid grid-cols-2 gap-[10px]">
    <div className="space-y-1.5"><label className={labelClass} htmlFor="plan-start">Start date</label><input id="plan-start" type="date" value={startDate} onChange={(e) => onChange({ startDate: e.target.value, endDate })} className={dateClass} /></div>
    <div className="space-y-1.5"><label className={labelClass} htmlFor="plan-end">End date</label><input id="plan-end" type="date" value={endDate} onChange={(e) => onChange({ startDate, endDate: e.target.value })} className={dateClass} /></div>
  </div>
}

export function NumberField({ label, value, onChange, min, max, step, suffix, id, placeholder }: { label: string; value: number | undefined; onChange: (value: number | undefined) => void; min?: number; max?: number; step?: number; suffix?: string; id?: string; placeholder?: string }) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  return <div className="space-y-1.5">
    <label className="block text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-65" htmlFor={inputId}>{label}{suffix ? <span className="ml-1">({suffix})</span> : null}</label>
    <input id={inputId} type="number" inputMode="decimal" min={min} max={max} step={step} placeholder={placeholder} value={value === undefined || Number.isNaN(value) ? '' : value} onChange={(e) => { const raw = e.target.value; if (raw === '') return onChange(undefined); const parsed = Number(raw); if (!Number.isFinite(parsed)) return; let next = parsed; if (min !== undefined && next < min) next = min; if (max !== undefined && next > max) next = max; onChange(next) }} className="h-11 w-full rounded-[12px] border-0 bg-ink-08 px-2 text-center text-[15.5px] font-semibold text-ink outline-none placeholder:text-ink-65" />
  </div>
}

export function IconButton({ icon, label, onClick, variant: _variant = 'ghost', type = 'button' }: { icon: React.ReactNode; label: string; onClick?: () => void; variant?: 'ghost' | 'danger' | 'accent'; type?: 'button' | 'submit' }) {
  return <button type={type} onClick={onClick} aria-label={label} className="inline-flex size-11 items-center justify-center text-ink-65 [&_svg]:h-6 [&_svg]:w-6">{icon}</button>
}

export function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-65"><Plus className="h-4 w-4" />{label}</button>
}

export function RemoveRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <IconButton icon={<Trash2 />} label={label} onClick={onClick} variant="danger" />
}

export interface SearchablePickerProps<T> { placeholder?: string; search: (query: string) => Promise<T[]>; renderItem: (item: T) => React.ReactNode; getItemKey: (item: T) => string; onSelect: (item: T) => void; value?: string; onClear?: () => void; label?: string; debounceMs?: number }

export function SearchablePicker<T>({ placeholder = 'Search…', search, renderItem, getItemKey, onSelect, value, onClear, label, debounceMs = 300 }: SearchablePickerProps<T>) {
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
  if (value) return <div className="min-w-0 space-y-1.5">{label ? <div className={labelClass}>{label}</div> : null}<div className="inline-flex h-9 max-w-full items-center gap-2 rounded-full bg-ink px-3 text-[13.5px] font-semibold text-cream"><span className="truncate">{value}</span>{onClear ? <button type="button" onClick={onClear} aria-label="Clear selection" className="-my-3 -mr-3 flex size-11 shrink-0 items-center justify-center"><X className="h-4 w-4" /></button> : null}</div></div>
  return <div className="relative space-y-1.5">
    {label ? <label className={labelClass}>{label}</label> : null}
    <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-65" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} onFocus={() => results.length > 0 && setOpen(true)} className={cn(fieldClass, 'pl-11')} /></div>
    {open && (results.length > 0 || loading) ? <ul role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-[16px] border border-ink-12 bg-card shadow-none">{loading ? <li className="flex min-h-12 items-center px-[14px] text-[13.5px] text-ink-65">Searching…</li> : results.map((item) => <li key={getItemKey(item)}><button type="button" onClick={() => { onSelect(item); setQuery(''); setResults([]); setOpen(false) }} className="min-h-12 w-full px-[14px] text-left text-[15.5px] text-ink hover:bg-ink-08">{renderItem(item)}</button></li>)}</ul> : null}
  </div>
}
