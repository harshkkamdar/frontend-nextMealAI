'use client'

import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import { deleteChatSession } from '@/lib/api/chat.api'
import { queryKeys } from '@/lib/query-keys'
import type { ChatSession } from '@/types/chat.types'
import { ApiException } from '@/types/api.types'
import { formatDate } from '@/lib/utils'

interface SessionListProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewSession: () => void
}

export function SessionList({ sessions, activeSessionId, onSelectSession, onNewSession }: SessionListProps) {
  const queryClient = useQueryClient()

  async function handleDelete(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation()
    try {
      await deleteChatSession(sessionId)
      queryClient.invalidateQueries({ queryKey: queryKeys.chatSessions() })
      toast.success('Session deleted')
    } catch (err) {
      if (err instanceof ApiException) {
        toast.error(err.message || 'Failed to delete session')
      } else {
        toast.error('Failed to delete session')
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand/10 border border-brand/20 text-brand text-sm font-medium hover:bg-brand/20 transition-colors"
        >
          <Plus size={16} />
          New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8 px-4">
            No conversations yet.<br />Start a new chat!
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.session_id}
              onClick={() => onSelectSession(session.session_id)}
              className={`flex items-center gap-2 px-3 py-3 cursor-pointer hover:bg-bg-secondary group border-b border-border/50 ${
                activeSessionId === session.session_id ? 'bg-bg-secondary' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {session.title ?? 'New conversation'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(session.updated_at)}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, session.session_id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
