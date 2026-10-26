'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { SearchFill } from '@/components/ui/fiqr/icons'

/** Debounced search with the last request winning; empty query clears. */
function useSearch<T>(query: string, search: (query: string) => Promise<T[]>, debounceMs = 300) {
  const [state, setState] = useState<{ query: string; results: T[]; failed: boolean }>({ query: '', results: [], failed: false })
  const req = useRef(0)
  const trimmed = query.trim()
  useEffect(() => {
    if (!trimmed) return
    const mine = ++req.current
    const timer = setTimeout(() => {
      search(trimmed)
        .then((results) => { if (req.current === mine) setState({ query: trimmed, results, failed: false }) })
        .catch(() => { if (req.current === mine) setState({ query: trimmed, results: [], failed: true }) })
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [trimmed, search, debounceMs])
  const settled = !!trimmed && state.query === trimmed
  return { results: settled ? state.results : [], loading: !!trimmed && !settled, failed: settled && state.failed, settled }
}

/**
 * Add-from-search sheet (C1 food search, W1 exercise search): floats forward over the builder with the day still in
 * view behind it. Optional chips above the field (meal type); results as rows; picking one adds it and closes.
 */
export function SearchSheet<T>({ open, onClose, title, label, placeholder, search, getKey, renderItem, onPick, onPickTyped, chips, footnote }: {
  open: boolean
  onClose: () => void
  title: string
  label: string
  placeholder: string
  search: (query: string) => Promise<T[]>
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  onPick: (item: T) => void
  /** When set, the typed text can be added as it is (no match, or a food you know the numbers of). */
  onPickTyped?: (text: string) => void
  chips?: ReactNode
  footnote?: ReactNode
}) {
  const [query, setQuery] = useState('')
  const { results, loading, failed, settled } = useSearch(query, search)
  const close = () => { setQuery(''); onClose() }
  const pick = (item: T) => { onPick(item); close() }
  return (
    <BottomSheet open={open} onClose={close} ariaLabel={title}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3.5 pb-4">
        <h2 className="font-display px-1 pb-2.5 pt-1 text-hero font-[800] text-ink">{title}</h2>
        {chips}
        <label className="relative block">
          <span className="sr-only">{label}</span>
          <SearchFill aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-65" />
          {/* The sheet exists to search, so the keyboard comes up with it. */}
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className="h-field w-full rounded-[16px] bg-card pl-12 pr-4 text-body font-semibold text-ink shadow-[inset_0_0_0_2px_var(--color-ink)] outline-none placeholder:font-medium placeholder:text-ink-65" />
        </label>
        {query.trim() ? (
          <div className="mt-2.5 overflow-hidden rounded-card bg-[var(--surface-card,var(--color-card))] px-2.5" aria-live="polite">
            {loading ? <p className="flex min-h-12 items-center px-1.5 text-body-sm text-ink-65">Searching</p> : null}
            {failed ? <p className="flex min-h-12 items-center px-1.5 text-body-sm text-ink-65">Search didn&apos;t load. Check your connection.</p> : null}
            {settled && !failed && results.length === 0 ? <p className="flex min-h-12 items-center px-1.5 text-body-sm text-ink-65">No matches</p> : null}
            {results.map((item) => (
              <button key={getKey(item)} type="button" onClick={() => pick(item)} className="flex min-h-14 w-full items-center gap-3 border-b border-ink-06 px-1.5 py-2 text-left last:border-b-0 active:opacity-60">
                {renderItem(item)}
              </button>
            ))}
            {onPickTyped && settled ? (
              <button type="button" onClick={() => { onPickTyped(query.trim()); close() }} className="flex min-h-12 w-full items-center px-1.5 text-left text-body-sm font-semibold text-ink active:opacity-60">
                Add &ldquo;{query.trim()}&rdquo; and fill in the numbers
              </button>
            ) : null}
          </div>
        ) : null}
        {footnote ? <p className="mx-1.5 mt-2.5 text-caption text-ink-65">{footnote}</p> : null}
      </div>
    </BottomSheet>
  )
}
