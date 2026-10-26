'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { fieldClass } from '@/components/ui/fiqr/field'
import { deleteAccount } from '@/lib/api/account.api'
import { useAuthStore } from '@/stores/auth.store'

interface DeleteAccountSheetProps {
  open: boolean
  onClose: () => void
}

const GONE = ['Profile and targets', 'Every log, photo and check-in', 'Plans and chats with Geo']

export function DeleteAccountSheet({ open, onClose }: DeleteAccountSheetProps) {
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const ready = confirmation === 'DELETE'

  const handleDelete = async () => {
    if (!ready || deleting) return

    setDeleting(true)
    try {
      await deleteAccount()
      useAuthStore.getState().clearSession()
      window.location.replace('/login')
    } catch {
      toast.error("Couldn't delete your account. Email support and we'll do it for you.")
      setDeleting(false)
    }
  }

  const handleClose = () => {
    setConfirmation('')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={handleClose} dismissible={!deleting} ariaLabel="Delete your account">
      <div className="min-h-0 overflow-y-auto px-6 pb-4 pt-3">
        <h2 className="font-wide text-[22px] font-bold leading-tight text-ink">Delete your account</h2>
        <p className="mt-2 text-[15.5px] leading-[1.45] text-ink-65">This is permanent and can&apos;t be undone. It removes:</p>
        <ul className="mt-3 overflow-hidden rounded-[16px] bg-card">
          {GONE.map((item, index) => (
            <li key={item} className={`flex min-h-11 items-center gap-3 px-4 text-[15.5px] text-ink ${index > 0 ? 'border-t border-ink-06' : ''}`}>
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-ink" />
              {item}
            </li>
          ))}
        </ul>

        <label htmlFor="delete-account-confirmation" className="mt-5 block text-[14px] font-semibold text-ink">
          Type DELETE to confirm
        </label>
        <input
          id="delete-account-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={deleting}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className={`${fieldClass} mt-2 tracking-[1px] disabled:text-ink-65`}
        />

        {/* Destructive actions are ink, never orange (D2 convention); the typed word is the confirm. */}
        <button
          type="button"
          disabled={!ready || deleting}
          onClick={handleDelete}
          className="mt-5 h-14 w-full rounded-[18px] bg-ink text-[17px] font-bold text-cream transition-[transform,opacity] duration-150 enabled:active:scale-[.97] disabled:opacity-35"
        >
          {deleting ? 'Deleting…' : 'Delete account'}
        </button>
        <button
          type="button"
          onClick={handleClose}
          disabled={deleting}
          className="mt-1 h-12 w-full text-[16px] font-semibold text-ink disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </BottomSheet>
  )
}
