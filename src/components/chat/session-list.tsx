'use client'

import { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Ellipsis, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { sessionTitles } from '@/components/chat/session-titles'
import { renameChatSession, deleteChatSession } from '@/lib/api/chat.api'
import { reducedFade, spring } from '@/lib/motion'
import type { ChatSession } from '@/types/chat.types'

const FALLBACK_TITLE = 'Chat with Geo'
const TITLE_MAX = 50

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
  // Past a year "3 Jan" would read as this January: say the year.
  if (diffDays >= 365) return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

/** One line of plain text from Geo's markdown (last_message is stored as Geo wrote it). */
export function plainPreview(text: string | undefined): string {
  if (!text) return ''
  return text
    .replace(/\[\[choices:[^\]]*\]\]/gi, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*(?:#{1,6}\s+|[-*•+]\s+|\d+[.)]\s+|>\s*)/gm, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s).,!?:;]|$)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim()
}

type SheetMode = 'menu' | 'rename' | 'delete'

/**
 * The Geo tab's conversation list: one white card of rows (title, last line, when), newest first.
 * Row options open one inset sheet that holds Rename and Delete and their own steps, so the keyboard and the
 * confirm never fight the list (mock journey-geo, 26 Oct 2026).
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
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [target, setTarget] = useState<ChatSession | null>(null)
  const [mode, setMode] = useState<SheetMode>('menu')
  const [editValue, setEditValue] = useState('')
  const [busy, setBusy] = useState(false)

  const titleOf = useCallback((session: ChatSession) => titles[session.session_id] ?? (session.title?.trim() || FALLBACK_TITLE), [titles])

  const open = (session: ChatSession) => { setMode('menu'); setTarget(session) }
  const close = () => { if (!busy) setTarget(null) }

  const startRename = () => {
    if (!target) return
    setEditValue(titleOf(target).slice(0, TITLE_MAX))
    setMode('rename')
  }

  const saveRename = async () => {
    const trimmed = editValue.trim()
    if (!target || !trimmed || busy) return
    setBusy(true)
    try {
      await renameChatSession(target.session_id, trimmed)
      setTitles((prev) => ({ ...prev, [target.session_id]: trimmed }))
      sessionTitles.set(target.session_id, trimmed)
      setTarget(null)
      toast.success('Renamed')
    } catch {
      toast.error("I couldn't rename that. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!target || busy) return
    setBusy(true)
    try {
      await deleteChatSession(target.session_id)
      onDelete?.(target.session_id)
      setTarget(null)
      toast.success('Conversation deleted')
    } catch {
      toast.error("I couldn't delete that. Try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ul aria-label="Conversations" className="overflow-hidden rounded-card bg-card shadow-[var(--shadow-card)]">
        {sessions.map((session, index) => {
          const sessionId = session.session_id ?? session.id
          const title = titleOf(session)
          const preview = plainPreview(session.last_message)
          return (
            <motion.li
              key={sessionId}
              initial={entrance ? (reduce ? { opacity: 0 } : { opacity: 0, y: 8 }) : false}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? reducedFade : { ...spring.glide, delay: 0.24 + Math.min(index, 5) * 0.03 }}
              className="flex min-h-row items-center border-b border-ink-06 last:border-b-0"
            >
              <button
                type="button"
                onClick={() => onSelect(session.session_id)}
                className="flex min-h-row min-w-0 flex-1 flex-col justify-center py-2.5 pl-4 text-left transition-transform duration-100 active:scale-[.98]"
              >
                <span className="block w-full truncate text-body font-semibold text-ink">{title}</span>
                <span className="mt-0.5 flex w-full items-baseline gap-3 text-caption text-ink-65">
                  <span className="min-w-0 flex-1 truncate">{preview || 'No messages yet'}</span>
                  <span className="shrink-0 font-medium tabular-nums">{formatSessionDate(session.updated_at ?? session.created_at)}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => open(session)}
                className="mr-1 grid size-11 shrink-0 place-items-center rounded-full text-ink-65 transition-transform active:scale-[.94]"
                aria-label={`Options for ${title.length > 60 ? `${title.slice(0, 60)}…` : title}`}
              >
                <Ellipsis className="size-5" strokeWidth={1.75} />
              </button>
            </motion.li>
          )
        })}
      </ul>

      <BottomSheet open={target !== null} onClose={close} ariaLabel={mode === 'rename' ? 'Rename' : mode === 'delete' ? 'Delete this conversation?' : 'Conversation options'}>
        {target && mode === 'menu' ? (
          <div className="px-4 pb-4 pt-2">
            <p className="truncate px-1 text-body-sm font-semibold text-ink-65">{titleOf(target)}</p>
            <div className="mt-3 overflow-hidden rounded-[16px] bg-card shadow-[var(--shadow-card)]">
              <button type="button" onClick={startRename} className="flex min-h-row w-full items-center gap-3 border-b border-ink-06 px-4 text-left text-body font-medium text-ink active:bg-ink-04">
                <Pencil className="size-[18px] text-ink-65" strokeWidth={1.75} />
                Rename
              </button>
              <button type="button" onClick={() => setMode('delete')} className="flex min-h-row w-full items-center gap-3 px-4 text-left text-body font-medium text-ink active:bg-ink-04">
                <Trash2 className="size-[18px] text-ink-65" strokeWidth={1.75} />
                Delete
              </button>
            </div>
            <button type="button" onClick={close} className="mt-2 h-btn w-full text-body font-semibold text-ink-65">Cancel</button>
          </div>
        ) : null}
        {target && mode === 'rename' ? (
          <form className="px-4 pb-4 pt-2" onSubmit={(event) => { event.preventDefault(); void saveRename() }}>
            <h2 className="text-headline text-ink">Rename</h2>
            <p className="mt-0.5 text-caption text-ink-65">Only you see this name.</p>
            <input
              type="text"
              aria-label="Conversation name"
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              maxLength={TITLE_MAX}
              autoFocus
              enterKeyHint="done"
              className="mt-3 h-field w-full min-w-0 rounded-[16px] bg-card px-4 text-body font-medium text-ink outline outline-[1.5px] -outline-offset-[1.5px] outline-ink"
            />
            <p className="mt-1.5 text-right text-label font-medium text-ink-65 tabular-nums">{editValue.length} of {TITLE_MAX}</p>
            <button type="submit" disabled={!editValue.trim() || busy} className="mt-3 h-btn w-full rounded-full bg-ink text-body font-bold text-cream transition-transform enabled:active:scale-[.97] disabled:bg-ink-08 disabled:text-ink-35">
              {busy ? 'Saving' : 'Save'}
            </button>
            <button type="button" onClick={close} className="mt-1 h-btn w-full text-body font-semibold text-ink-65">Cancel</button>
          </form>
        ) : null}
        {target && mode === 'delete' ? (
          <div className="px-4 pb-4 pt-2">
            <h2 className="text-headline text-ink">Delete this conversation?</h2>
            <p className="mt-1 text-body-sm text-ink-65">Geo&apos;s replies and your messages in it go for good. What Geo logged stays in your diary.</p>
            <button type="button" onClick={() => void confirmDelete()} disabled={busy} className="mt-4 h-btn w-full rounded-full bg-ink text-body font-bold text-cream transition-transform enabled:active:scale-[.97] disabled:opacity-60">
              {busy ? 'Deleting' : 'Delete'}
            </button>
            <button type="button" onClick={close} className="mt-1 h-btn w-full text-body font-semibold text-ink-65">Keep</button>
          </div>
        ) : null}
      </BottomSheet>
    </>
  )
}
