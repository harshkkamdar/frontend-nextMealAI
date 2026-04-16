'use client'

import * as React from 'react'
import { Plus, Trash2, X, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// FB-08 — shared primitives for the manual plan builders (workout + meal).
// Kept deliberately small: labelled text/number/date inputs, a generic
// debounced search picker that works for both foods and exercises, and an
// icon button for add/remove row actions. No combobox library.

// ---------- PlanNameField ----------

export function PlanNameField({
  value,
  onChange,
  placeholder = 'Plan name',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="plan-name">Plan name</Label>
      <Input
        id="plan-name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

// ---------- PlanDateRangeField ----------

export function PlanDateRangeField({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string
  endDate: string
  onChange: (next: { startDate: string; endDate: string }) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="plan-start">Start date</Label>
        <Input
          id="plan-start"
          type="date"
          value={startDate}
          onChange={(e) => onChange({ startDate: e.target.value, endDate })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="plan-end">End date</Label>
        <Input
          id="plan-end"
          type="date"
          value={endDate}
          onChange={(e) => onChange({ startDate, endDate: e.target.value })}
        />
      </div>
    </div>
  )
}

// ---------- NumberField ----------

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  id,
  placeholder,
}: {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  id?: string
  placeholder?: string
}) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>
        {label}
        {suffix ? <span className="text-text-tertiary ml-1">({suffix})</span> : null}
      </Label>
      <Input
        id={inputId}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={value === undefined || Number.isNaN(value) ? '' : value}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') {
            onChange(undefined)
            return
          }
          const parsed = Number(raw)
          if (!Number.isFinite(parsed)) return
          let next = parsed
          if (min !== undefined && next < min) next = min
          if (max !== undefined && next > max) next = max
          onChange(next)
        }}
      />
    </div>
  )
}

// ---------- IconButton ----------

export function IconButton({
  icon,
  label,
  onClick,
  variant = 'ghost',
  type = 'button',
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  variant?: 'ghost' | 'danger' | 'accent'
  type?: 'button' | 'submit'
}) {
  const variantClass =
    variant === 'danger'
      ? 'text-red-500 hover:bg-red-500/10'
      : variant === 'accent'
        ? 'text-accent hover:bg-accent/10'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors',
        variantClass,
      )}
    >
      {icon}
    </button>
  )
}

export function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 font-medium"
    >
      <Plus className="w-4 h-4" />
      {label}
    </button>
  )
}

export function RemoveRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <IconButton icon={<Trash2 className="w-4 h-4" />} label={label} onClick={onClick} variant="danger" />
}

// ---------- SearchablePicker ----------

export interface SearchablePickerProps<T> {
  placeholder?: string
  search: (query: string) => Promise<T[]>
  renderItem: (item: T) => React.ReactNode
  getItemKey: (item: T) => string
  onSelect: (item: T) => void
  value?: string
  onClear?: () => void
  label?: string
  debounceMs?: number
}

export function SearchablePicker<T>({
  placeholder = 'Search…',
  search,
  renderItem,
  getItemKey,
  onSelect,
  value,
  onClear,
  label,
  debounceMs = 300,
}: SearchablePickerProps<T>) {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<T[]>([])
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const reqIdRef = React.useRef(0)

  React.useEffect(() => {
    if (value) return // don't search while a value is selected
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      const myReq = ++reqIdRef.current
      try {
        const r = await search(trimmed)
        if (reqIdRef.current === myReq) {
          setResults(r)
          setOpen(true)
        }
      } catch {
        if (reqIdRef.current === myReq) setResults([])
      } finally {
        if (reqIdRef.current === myReq) setLoading(false)
      }
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [query, search, debounceMs, value])

  if (value) {
    return (
      <div className="space-y-1.5">
        {label ? <Label>{label}</Label> : null}
        <div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-3 h-9 text-sm">
          <span className="flex-1 truncate text-text-primary">{value}</span>
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear selection"
              className="text-text-tertiary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5 relative">
      {label ? <Label>{label}</Label> : null}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
          onFocus={() => {
            if (results.length > 0) setOpen(true)
          }}
        />
      </div>
      {open && (results.length > 0 || loading) ? (
        <ul
          role="listbox"
          className="absolute z-20 left-0 right-0 top-full mt-1 max-h-60 overflow-auto rounded-md border border-border bg-surface shadow-lg"
        >
          {loading ? (
            <li className="px-3 py-2 text-xs text-text-tertiary">Searching…</li>
          ) : (
            results.map((item) => (
              <li key={getItemKey(item)}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item)
                    setQuery('')
                    setResults([])
                    setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover"
                >
                  {renderItem(item)}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
