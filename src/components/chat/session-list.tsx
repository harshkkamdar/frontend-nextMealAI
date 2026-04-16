'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { MessageCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
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
      <EmptyState
        icon={MessageCircle}
        title="No chats yet"
        description="Start a conversation with Geo"
      />
    )
  }

  return (
    <>
      <div className="space-y-1">
        {sessions.map((session) => {
          const sessionId = session.session_id ?? session.id
          const isEditing = editingId === session.session_id
          const isMenuOpen = menuOpenId === session.session_id
          const displayTitle = titles[session.session_id] ?? session.title ?? 'Chat with Geo'

          return (
            <div
              key={sessionId}
              role="button"
              tabIndex={0}
              onClick={() => !isEditing && onSelect(session.session_id)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isEditing) onSelect(session.session_id) }}
              className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover rounded-xl transition-colors cursor-pointer text-left group"
            >
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitRename(session.session_id)}
                      onKeyDown={(e) => handleKeyDown(e, session.session_id)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={renamingId === session.session_id}
                      className="text-sm font-medium text-text-primary bg-surface border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-accent w-full min-w-0"
                      maxLength={50}
                    />
                  ) : (
                    <>
                      <span className="text-sm font-medium text-text-primary truncate">
                        {displayTitle}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* More menu button */}
                        <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
                          <button
                            onClick={(e) => toggleMenu(e, session.session_id)}
                            className="p-1 rounded hover:bg-surface-hover"
                            aria-label="Chat options"
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-text-tertiary" />
                          </button>

                          {/* Dropdown menu */}
                          {isMenuOpen && (
                            <div
                              className="absolute right-0 top-full mt-1 w-36 bg-surface border border-border rounded-xl shadow-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => startEditing(e, session)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5 text-text-tertiary" />
                                Rename
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(e, session)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-surface-hover transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        <span className="text-[10px] text-text-tertiary whitespace-nowrap">
                          {formatSessionDate(session.updated_at ?? session.created_at)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                {session.last_message && (
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {session.last_message}
                  </p>
                )}
                {session.message_count != null && session.message_count > 0 && (
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    {session.message_count} message{session.message_count !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
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
