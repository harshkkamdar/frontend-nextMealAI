'use client'

import { useState, useRef, useCallback } from 'react'
import { MessageCircle, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { renameChatSession } from '@/lib/api/chat.api'
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
}: {
  sessions: ChatSession[]
  onSelect: (sessionId: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = useCallback((e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation()
    const sessionId = session.session_id
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
    <div className="space-y-1">
      {sessions.map((session) => {
        const sessionId = session.session_id ?? session.id
        const isEditing = editingId === session.session_id
        const displayTitle = titles[session.session_id] ?? session.title ?? 'Chat with Geo'

        return (
          <button
            key={sessionId}
            onClick={() => !isEditing && onSelect(session.session_id)}
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
                      <button
                        onClick={(e) => startEditing(e, session)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-surface-hover"
                        aria-label="Rename chat"
                      >
                        <Pencil className="w-3 h-3 text-text-tertiary" />
                      </button>
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
          </button>
        )
      })}
    </div>
  )
}
