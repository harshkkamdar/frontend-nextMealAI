'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { reportResponse, type ReportReason } from '@/lib/api/feedback.api'

const REASONS: Array<{ label: string; value: ReportReason }> = [
  { label: 'Wrong or misleading', value: 'wrong' },
  { label: 'Unsafe advice', value: 'unsafe' },
  { label: 'Offensive', value: 'offensive' },
  { label: 'Something else', value: 'other' },
]

export function ReportSheet({
  open,
  onClose,
  sessionId,
  messageId,
}: {
  open: boolean
  onClose: () => void
  sessionId?: string
  messageId?: string
}) {
  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Report this response">
      {open ? (
        <ReportForm onClose={onClose} sessionId={sessionId} messageId={messageId} />
      ) : null}
    </BottomSheet>
  )
}

function ReportForm({
  onClose,
  sessionId,
  messageId,
}: {
  onClose: () => void
  sessionId?: string
  messageId?: string
}) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!reason || sending) return

    setSending(true)
    try {
      const trimmedNote = note.trim()
      await reportResponse({
        session_id: sessionId,
        message_id: messageId,
        reason,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      })
      setSending(false)
      toast.success("Thanks — we'll look at it.")
      onClose()
    } catch {
      setSending(false)
    }
  }

  return (
    <div className="px-gutter pb-5 pt-3">
      <h2 className="text-[22px] font-semibold text-ink">Report this response</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {REASONS.map((option) => {
          const selected = reason === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setReason(option.value)}
              className={`h-9 rounded-full px-3 text-[13.5px] font-semibold ${
                selected ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="What went wrong? (optional)"
        className="mt-4 min-h-24 w-full resize-none rounded-[15px] border border-ink-16 bg-card p-3 text-[15.5px] text-ink outline-none placeholder:text-ink-50 focus:border-ink"
      />
      <PrimaryButton
        type="button"
        disabled={!reason || sending}
        onClick={handleSend}
        className="mt-4 justify-center"
      >
        Send report
      </PrimaryButton>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 h-10 w-full text-[15.5px] font-semibold text-ink-60"
      >
        Cancel
      </button>
    </div>
  )
}
