'use client'

import { MessageCircle } from 'lucide-react'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { EmptyState } from '@/components/shared/empty-state'
import type { ChatSession } from '@/types/chat.types'

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'

  return new Date(dateStr).toLocaleDateString(undefined, {
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
      {sessions.map((session) => (
        <button
          key={session.id}
          onClick={() => onSelect(session.session_id)}
          className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover rounded-xl transition-colors cursor-pointer text-left"
        >
          <GeoAvatar state="default" size={40} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-text-primary truncate">
                {session.title ?? 'Chat with Geo'}
              </span>
              <span className="text-[10px] text-text-tertiary whitespace-nowrap shrink-0">
                {formatRelativeTime(session.updated_at)}
              </span>
            </div>
            {session.last_message && (
              <p className="text-xs text-text-secondary truncate mt-0.5">
                {session.last_message}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
