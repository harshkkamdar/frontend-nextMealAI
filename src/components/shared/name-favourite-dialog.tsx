'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'

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
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-ink/40" onClick={() => !loading && onClose()} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-fav-title"
        className="relative z-10 w-full max-w-md rounded-t-[22px] bg-cream p-[22px]"
      >
        <h2 id="name-fav-title" className="text-[22px] font-semibold tracking-[-0.4px] text-ink">Save as a meal</h2>
        <p className="mt-1.5 text-[15.5px] text-ink-65">
          {mealType
            ? `Save your ${mealType} as a reusable meal — find it under the Meals tab and log it in one tap next time.`
            : 'Name this meal so you can reuse it later.'}
        </p>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="e.g. Usual Lunch"
          maxLength={60}
          aria-label="Meal name"
          className="mt-4 h-14 w-full rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] text-ink outline-none placeholder:text-ink-35"
        />
        <div className="mt-5 space-y-3">
          <PrimaryButton
            type="button"
            onClick={submit}
            disabled={loading || !name.trim()}
            className="justify-center"
          >
            {loading ? 'Saving…' : 'Save'}
          </PrimaryButton>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full py-2 text-[15.5px] font-semibold text-ink-65 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
