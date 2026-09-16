'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { deleteAccount } from '@/lib/api/account.api'
import { useAuthStore } from '@/stores/auth.store'

interface DeleteAccountSheetProps {
  open: boolean
  onClose: () => void
}

export function DeleteAccountSheet({ open, onClose }: DeleteAccountSheetProps) {
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirmation !== 'DELETE' || deleting) return

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
    <BottomSheet
      open={open}
      onClose={handleClose}
      dismissible={!deleting}
      ariaLabel="Delete your account"
    >
      <div className="px-gutter pb-6 pt-3">
        <h2 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">Delete your account</h2>
        <p className="mt-3 text-[15.5px] leading-[1.45] text-ink-62">
          This removes your profile, logs, plans, check-ins, photos and chats permanently. It cannot be undone.
        </p>

        <div className="mt-5">
          <label htmlFor="delete-account-confirmation" className="mb-2 block text-[13.5px] font-semibold text-ink">
            Type DELETE to confirm
          </label>
          <input
            id="delete-account-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={deleting}
            autoComplete="off"
            className="h-14 w-full rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] text-ink outline-none focus:border-accent disabled:text-ink-35"
          />
        </div>

        <div className="mt-5">
          <PrimaryButton
            type="button"
            disabled={confirmation !== 'DELETE' || deleting}
            onClick={handleDelete}
          >
            Delete account
          </PrimaryButton>
        </div>

        <button
          type="button"
          onClick={handleClose}
          disabled={deleting}
          className="mx-auto mt-4 block text-[15.5px] font-semibold text-ink-60"
        >
          Cancel
        </button>
      </div>
    </BottomSheet>
  )
}
