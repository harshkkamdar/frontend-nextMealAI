'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
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
 * Custom in-app sheet for naming a favourite — replaces the native
 * window.prompt() (browser chrome, off-brand, not testable). Submits the
 * trimmed name (Enter or Save); can't be dismissed while saving.
 */
export function NameFavouriteDialog({ open, onClose, onSubmit, defaultName = '', mealType }: NameFavouriteDialogProps) {
  const [name, setName] = useState(defaultName)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) setName(defaultName) }, [open, defaultName])

  useEffect(() => {
    if (!open) return
    // After the sheet's arrival, so the keyboard does not push a half-open sheet.
    const focusT = setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 350)
    return () => clearTimeout(focusT)
  }, [open])

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

  return (
    <BottomSheet open={open} onClose={() => { if (!loading) onClose() }} dismissible={!loading} ariaLabel="Save as a meal">
      <div className="px-5 pb-5 pt-2">
        <h2 id="name-fav-title" className="text-[22px] font-bold tracking-[-0.3px] text-ink">Save as a meal</h2>
        <p className="mt-1 text-[15px] leading-[1.45] text-ink-65">
          {mealType
            ? `Name your ${mealType.toLowerCase()}. It shows under Meals when you add food, ready in one tap.`
            : 'Name this meal so you can reuse it later.'}
        </p>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="Usual lunch"
          maxLength={60}
          aria-label="Meal name"
          className="mt-4 h-14 w-full rounded-[14px] bg-card px-4 text-[17px] text-ink shadow-[var(--shadow-card)] outline-none placeholder:text-ink-65 focus-visible:outline-[1.5px] focus-visible:outline-ink"
        />
        <PrimaryButton
          type="button"
          onClick={submit}
          disabled={loading || !name.trim()}
          className="mt-5 justify-center"
        >
          {loading ? 'Saving' : 'Save meal'}
        </PrimaryButton>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="mt-2 h-11 w-full text-[15px] font-semibold text-ink-65 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </BottomSheet>
  )
}
