import { toast } from 'sonner'
import { createLogWithStatus, deleteLog } from '@/lib/api/logs.api'
import { haptic } from '@/lib/platform/app'
import type { CreateLogInput } from '@/types/logs.types'

const UNDO_STYLE = { minHeight: 44, minWidth: 64, padding: '0 14px', borderRadius: 22, background: '#111C35', color: '#FDF6EC', fontSize: 14, fontWeight: 700 }

/**
 * Logs one thing with an Undo that deletes the created row (the existing DELETE /v1/logs/:id).
 * A log queued offline has no server id yet, so the toast says so instead of offering Undo.
 */
export async function logWithUndo(input: CreateLogInput, message: string, after: () => void, undone: () => void): Promise<boolean> {
  try {
    const result = await createLogWithStatus(input)
    void haptic('success')
    if (result.queued) {
      toast.success(`${message}. Saved on your phone, syncs when you're back online`)
    } else {
      toast.success(message, {
        // Sonner's default action is 24 pt tall; Undo is a real target (>= 44 pt).
        actionButtonStyle: UNDO_STYLE,
        action: {
          label: 'Undo',
          onClick: () => {
            undone()
            deleteLog(result.data.id).then(after, () => { toast.error("Couldn't undo that. Try again from Food."); after() })
          },
        },
      })
    }
    after()
    return true
  } catch {
    toast.error("Couldn't log that. Check your connection and try again.")
    return false
  }
}
