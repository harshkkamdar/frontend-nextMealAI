'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Check } from 'lucide-react'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { reportResponse, type ReportReason } from '@/lib/api/feedback.api'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'

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
    <BottomSheet open={open} onClose={onClose} ariaLabel="Report this reply">
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
  // A failed send says so here and keeps the reason and note, so Try again is one tap.
  const [failed, setFailed] = useState(false)

  const handleSend = async () => {
    if (!reason || sending) return

    setSending(true)
    setFailed(false)
    try {
      const trimmedNote = note.trim()
      await reportResponse({
        session_id: sessionId,
        message_id: messageId,
        reason,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      })
      setSending(false)
      toast.success("Thanks. We'll take a look.")
      onClose()
    } catch {
      setSending(false)
      setFailed(true)
    }
  }

  return (
    <div className="flex min-h-0 flex-col overflow-y-auto px-5 pb-5 pt-2">
      <h2 className="font-wide text-[22px] font-bold leading-[1.2] text-ink">Report this reply</h2>
      <p className="mt-1 text-[15px] leading-[1.45] text-ink-65">Tell us what was wrong. It helps Geo get better.</p>
      <div className="mt-4 overflow-hidden rounded-[16px] bg-card shadow-[var(--shadow-card)]">
        {REASONS.map((option) => {
          const selected = reason === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => { void haptic('selection'); setReason(option.value) }}
              className={cn(
                'relative flex min-h-[52px] w-full items-center justify-between gap-3 border-b border-ink-06 px-4 text-left text-[16px] font-medium text-ink last:border-b-0 active:bg-ink-04',
                selected && 'z-[1] rounded-[16px] outline outline-[1.5px] -outline-offset-[1.5px] outline-ink',
              )}
            >
              {option.label}
              <Check aria-hidden="true" strokeWidth={2.25} className={cn('size-[18px] transition-opacity duration-150', selected ? 'opacity-100' : 'opacity-0')} />
            </button>
          )
        })}
      </div>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Anything else? (optional)"
        aria-label="What went wrong (optional)"
        className="mt-3 min-h-24 w-full resize-none rounded-[16px] bg-card p-4 text-[16px] leading-[1.45] text-ink shadow-[var(--shadow-card)] outline-none placeholder:text-ink-65 focus:outline focus:outline-[1.5px] focus:outline-ink"
      />
      {failed ? (
        <p role="alert" className="mt-3 px-1 text-caption leading-[1.4] text-ink">That didn&apos;t send. Check your connection and try again.</p>
      ) : null}
      <PrimaryButton type="button" disabled={!reason || sending} onClick={handleSend} className={failed ? 'mt-3 justify-center' : 'mt-5 justify-center'}>
        {sending ? 'Sending' : failed ? 'Try again' : 'Send report'}
      </PrimaryButton>
      <button type="button" onClick={onClose} className="mt-1 h-11 w-full text-[16px] font-semibold text-ink-65">
        Cancel
      </button>
    </div>
  )
}
