'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Ellipsis, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { sessionTitles } from '@/components/chat/session-titles'
import { renameChatSession, deleteChatSession } from '@/lib/api/chat.api'
import { reducedFade, spring } from '@/lib/motion'
import type { ChatSession } from '@/types/chat.types'

const FALLBACK_TITLE = 'Chat with Geo'

export function formatSessionDate(dateStr: string | undefined, now = new Date()): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today.getTime() - msgDate.getTime()) / 86400000)

  if (diffDays === 0) return date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays > 1 && diffDays < 7) return date.toLocaleDateString('en-AU', { weekday: 'short' })
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

/**
 * The Geo tab's conversation list: one white card of rows (title, last line, when), newest first.
 * Row actions open an inset sheet (rename, delete); rename edits the title in place.
 */
export function SessionList({
  sessions,
  onSelect,
  onDelete,
  entrance = false,
}: {
  sessions: ChatSession[]
  onSelect: (sessionId: string) => void
  onDelete?: (sessionId: string) => void
  /** First paint of the tab in this session: rows rise in, 30 ms apart (motion-feel 3e). */
  entrance?: boolean
}) {
  const reduce = useReducedMotion()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [actionsFor, setActionsFor] = useState<ChatSession | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const titleOf = useCallback((session: ChatSession) => titles[session.session_id] ?? session.title ?? FALLBACK_TITLE, [titles])

  const startEditing = useCallback((session: ChatSession) => {
    setActionsFor(null)
    setEditingId(session.session_id)
    setEditValue(titleOf(session))
    // Focus once the sheet has let go of focus and the input has rendered.
    setTimeout(() => inputRef.current?.focus(), 350)
  }, [titleOf])

  const commitRename = useCallback(async (sessionId: string) => {
    const trimmed = editValue.trim()
    setEditingId(null)
    if (!trimmed) return

    setRenamingId(sessionId)
    try {
      await renameChatSession(sessionId, trimmed)
      setTitles((prev) => ({ ...prev, [sessionId]: trimmed }))
      sessionTitles.set(sessionId, trimmed)
      toast.success('Renamed')
    } catch {
      toast.error("I couldn't rename that. Try again.")
    } finally {
      setRenamingId(null)
    }
  }, [editValue])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitRename(sessionId)
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }, [commitRename])

  const askDelete = useCallback((session: ChatSession) => {
    setActionsFor(null)
    setDeleteTarget(session)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return

    try {
      await deleteChatSession(deleteTarget.session_id)
      onDelete?.(deleteTarget.session_id)
      toast.success('Conversation deleted')
    } catch {
      toast.error("I couldn't delete that. Try again.")
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteTarget, onDelete])

  return (
    <>
      <ul aria-label="Conversations" className="overflow-hidden rounded-[24px] bg-card shadow-[var(--shadow-card)]">
        {sessions.map((session, index) => {
          const sessionId = session.session_id ?? session.id
          const isEditing = editingId === session.session_id
          const preview = session.last_message?.replace(/\s+/g, ' ').trim()

          return (
            <motion.li
              key={sessionId}
              initial={entrance ? (reduce ? { opacity: 0 } : { opacity: 0, y: 8 }) : false}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? reducedFade : { ...spring.glide, delay: 0.24 + Math.min(index, 5) * 0.03 }}
              className="flex min-h-[72px] items-center border-b border-ink-06 last:border-b-0"
            >
              {isEditing ? (
                <div className="min-w-0 flex-1 px-4 py-3">
                  <input
                    ref={inputRef}
                    type="text"
                    aria-label="Conversation name"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitRename(session.session_id)}
                    onKeyDown={(e) => handleKeyDown(e, session.session_id)}
                    disabled={renamingId === session.session_id}
                    enterKeyHint="done"
                    className="h-11 w-full min-w-0 rounded-[14px] bg-ink-04 px-3 text-[16px] font-semibold text-ink outline outline-[1.5px] -outline-offset-[1.5px] outline-ink"
                    maxLength={50}
                  />
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelect(session.session_id)}
                    className="flex min-h-[72px] min-w-0 flex-1 items-center gap-3 py-3 pl-5 text-left transition-transform duration-100 active:scale-[.98]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-3">
                        <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-ink">{titleOf(session)}</span>
                        <span className="shrink-0 text-[13px] font-medium text-ink-65 tabular-nums">
                          {formatSessionDate(session.updated_at ?? session.created_at)}
                        </span>
                      </span>
                      {preview ? <span className="mt-0.5 block truncate text-[14px] text-ink-65">{preview}</span> : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionsFor(session)}
                    className="grid size-11 shrink-0 place-items-center rounded-full text-ink-65 transition-transform active:scale-[.94]"
                    aria-label={`Options for ${titleOf(session)}`}
                  >
                    <Ellipsis className="size-5" strokeWidth={1.75} />
                  </button>
                  <span className="w-2" aria-hidden="true" />
                </>
              )}
            </motion.li>
          )
        })}
      </ul>

      <BottomSheet open={actionsFor !== null} onClose={() => setActionsFor(null)} ariaLabel="Conversation options">
        {actionsFor ? (
          <div className="px-5 pb-5 pt-2">
            <p className="truncate px-1 text-[15px] font-semibold text-ink-65">{titleOf(actionsFor)}</p>
            <div className="mt-3 overflow-hidden rounded-[16px] bg-card shadow-[var(--shadow-card)]">
              <button type="button" onClick={() => startEditing(actionsFor)} className="flex min-h-[52px] w-full items-center gap-3 border-b border-ink-06 px-4 text-left text-[16px] font-medium text-ink active:bg-ink-04">
                <Pencil className="size-[18px] text-ink-65" strokeWidth={1.75} />
                <span className="flex-1">Rename</span>
                <ChevronRightIcon className="size-4 text-ink-35" />
              </button>
              <button type="button" onClick={() => askDelete(actionsFor)} className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left text-[16px] font-medium text-ink active:bg-ink-04">
                <Trash2 className="size-[18px] text-ink-65" strokeWidth={1.75} />
                <span className="flex-1">Delete</span>
              </button>
            </div>
            <button type="button" onClick={() => setActionsFor(null)} className="mt-2 h-11 w-full text-[16px] font-semibold text-ink-65">
              Cancel
            </button>
          </div>
        ) : null}
      </BottomSheet>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete this conversation?"
        description="Geo's replies and your messages in it go for good."
        confirmLabel="Delete"
        cancelLabel="Keep"
        variant="danger"
      />
    </>
  )
}
