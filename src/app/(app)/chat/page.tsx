'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { SessionList } from '@/components/chat/session-list'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { getChatSessions } from '@/lib/api/chat.api'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import type { ChatSession } from '@/types/chat.types'

export default function ChatListPage() {
  useSetGeoScreen('chat_list', {})
  const router = useRouter()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChatSessions()
      .then(setSessions)
      .finally(() => setLoading(false))
  }, [])

  const handleNewChat = () => {
    const newSessionId = crypto.randomUUID()
    router.push(`/chat/${newSessionId}`)
  }

  const handleSelect = (sessionId: string) => {
    router.push(`/chat/${sessionId}`)
  }

  const handleDelete = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId && s.id !== sessionId))
  }

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[22px] font-semibold text-text-primary">Chats</h1>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-accent hover:bg-accent-hover text-white transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <SessionList sessions={sessions} onSelect={handleSelect} onDelete={handleDelete} />
      )}
    </PageWrapper>
  )
}
