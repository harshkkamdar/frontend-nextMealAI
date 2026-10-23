'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { GeoLine } from '@/components/ui/fiqr/geo-line'
import { renameChatSession, deleteChatSession } from '@/lib/api/chat.api'
import type { ChatSession } from '@/types/chat.types'

function formatSessionDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function SessionList({
  sessions,
  onSelect,
  onDelete,
}: {
  sessions: ChatSession[]
  onSelect: (sessionId: string) => void
  onDelete?: (sessionId: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpenId) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

  const toggleMenu = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    setMenuOpenId((prev) => (prev === sessionId ? null : sessionId))
  }, [])

  const startEditing = useCallback((e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation()
    const sessionId = session.session_id
    setMenuOpenId(null)
    setEditingId(sessionId)
    setEditValue(titles[sessionId] ?? session.title ?? 'Chat with Geo')
    // Focus the input after it renders
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [titles])

  const commitRename = useCallback(async (sessionId: string) => {
    const trimmed = editValue.trim()
    setEditingId(null)
    if (!trimmed) return

    setRenamingId(sessionId)
    try {
      await renameChatSession(sessionId, trimmed)
      setTitles((prev) => ({ ...prev, [sessionId]: trimmed }))
      toast.success('Chat renamed')
    } catch {
      toast.error('Failed to rename chat')
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

  const handleDeleteClick = useCallback((e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation()
    setMenuOpenId(null)
    setDeleteTarget(session)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return

    try {
      await deleteChatSession(deleteTarget.session_id)
      onDelete?.(deleteTarget.session_id)
      toast.success('Chat deleted')
    } catch {
      toast.error('Failed to delete chat')
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteTarget, onDelete])

  if (sessions.length === 0) {
    return (
      <div className="py-8">
        <GeoLine>Ask me anything about food, training or your week.</GeoLine>
      </div>
    )
  }

  return (
    <>
      <div>
        {sessions.map((session) => {
          const sessionId = session.session_id ?? session.id
          const isEditing = editingId === session.session_id
          const isMenuOpen = menuOpenId === session.session_id
          const displayTitle = titles[session.session_id] ?? session.title ?? 'Chat with Geo'

          return (
            <div
              key={sessionId}
              className="min-h-14 flex items-center justify-between border-b border-ink-09 gap-1"
            >
              {isEditing ? (
                <div className="flex-1 min-w-0">
                  <input
                    ref={inputRef}
                    type="text"
                    aria-label="Chat name"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitRename(session.session_id)}
                    onKeyDown={(e) => handleKeyDown(e, session.session_id)}
                    disabled={renamingId === session.session_id}
                    className="h-11 w-full min-w-0 rounded-[12px] border border-ink-16 bg-card px-3 text-[15.5px] font-semibold text-ink outline-none focus:border-ink"
                    maxLength={50}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(session.session_id)}
                  className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 text-left"
                >
                  <span className="block truncate text-[15.5px] font-semibold text-ink">
                    {displayTitle}
                  </span>
                  <span className="whitespace-nowrap text-[13px] font-medium text-ink-65">
                    {formatSessionDate(session.updated_at ?? session.created_at)}
                  </span>
                </button>
              )}
              {!isEditing ? (
                <div className="flex shrink-0 items-center">
                  <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
                    <button
                      onClick={(e) => toggleMenu(e, session.session_id)}
                      className="-mr-2.5 flex size-11 items-center justify-center rounded-full text-ink-65 active:bg-ink-08"
                      aria-label="Chat options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {isMenuOpen && (
                      <div
                        className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-[12px] border border-ink-12 bg-card py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => startEditing(e, session)}
                          className="flex h-11 w-full items-center gap-2.5 px-3 text-[14px] font-semibold text-ink active:bg-ink-08"
                        >
                          <Pencil className="h-3.5 w-3.5 text-ink-65" />
                          Rename
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, session)}
                          className="flex h-11 w-full items-center gap-2.5 px-3 text-[14px] font-semibold text-ink active:bg-ink-08"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete conversation"
        description="This will permanently delete this conversation and all its messages. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </>
  )
}
