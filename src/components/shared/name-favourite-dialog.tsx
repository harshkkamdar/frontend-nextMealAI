'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface NameFavouriteDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (name: string) => void | Promise<void>
  defaultName?: string
  /** The meal being saved (e.g. "Lunch") — used in the helper copy. */
  mealType?: string
}

/**
 * Custom in-app dialog for naming a favourite — replaces the native
 * window.prompt() (browser chrome, off-brand, not testable). Matches the
 * ConfirmDialog pattern: backdrop, Escape-to-close, body-scroll-lock, accent
 * action. Submits the trimmed name (Enter or Save).
 */
export function NameFavouriteDialog({ open, onClose, onSubmit, defaultName = '', mealType }: NameFavouriteDialogProps) {
  const [name, setName] = useState(defaultName)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) setName(defaultName) }, [open, defaultName])

  useEffect(() => {
    if (!open) return
    const focusT = setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 50)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(focusT)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, loading])

  const submit = useCallback(async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      await onSubmit(trimmed)
    } finally {
      setLoading(false)
    }
  }, [name, onSubmit])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => !loading && onClose()} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-fav-title"
        className="relative z-10 w-[90%] max-w-sm bg-surface border border-border rounded-2xl p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150"
      >
        <h2 id="name-fav-title" className="text-base font-semibold text-text-primary">Save as favourite</h2>
        <p className="text-sm text-text-secondary mt-1.5">
          {mealType
            ? `Save your ${mealType} as a reusable meal — log it in one tap next time.`
            : 'Name this favourite meal.'}
        </p>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="e.g. Usual Lunch"
          maxLength={60}
          aria-label="Favourite name"
          className="mt-4 w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <div className="flex items-center justify-end gap-2.5 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading || !name.trim()}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
