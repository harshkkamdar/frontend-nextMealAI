'use client'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import type { WorkoutSession } from '@/types/workout-session.types'
import { startedOnText } from './train-data'

/** Start with another workout still open asks first: resume that one, or discard it and start `nextName`. */
export function UnfinishedWorkoutSheet({ open, session, nextName, onClose, onResume, onDiscard }: {
  open: boolean
  /** Kept while the sheet closes, so its words stay through the exit. */
  session: WorkoutSession | null
  nextName: string
  onClose: () => void
  onResume: () => void
  onDiscard: () => void
}) {
  return (
    <BottomSheet open={open && !!session} onClose={onClose} ariaLabel="Unfinished workout">
      {session ? (
        <div className="px-5 pb-5 pt-3">
          <h2 className="text-hero text-ink">{session.day_name} is still open</h2>
          <p className="mt-1 text-body-sm text-ink-65">Unfinished since {startedOnText(session.started_at)}. Pick it up, or discard it and start {nextName}.</p>
          <button type="button" onClick={onResume} className="mt-5 flex h-btn w-full items-center justify-center rounded-[15px] bg-ink text-body font-bold text-cream transition-transform active:scale-[.97]">Resume {session.day_name}</button>
          <button type="button" onClick={onDiscard} className="mt-2 min-h-11 w-full text-body-sm font-semibold text-ink-65">Discard it and start {nextName}</button>
        </div>
      ) : null}
    </BottomSheet>
  )
}
