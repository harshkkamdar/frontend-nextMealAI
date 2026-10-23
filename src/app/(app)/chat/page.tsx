'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { SessionList } from '@/components/chat/session-list'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
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
    router.push(`/chat/session?id=${newSessionId}`)
  }

  const handleSelect = (sessionId: string) => {
    router.push(`/chat/session?id=${sessionId}`)
  }

  const handleDelete = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId && s.id !== sessionId))
  }

  return (
    <PageWrapper>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-ink">Chats</h1>
        <PrimaryButton
          onClick={handleNewChat}
          icon={<Plus className="h-4 w-4" />}
          className="w-auto px-4 py-2"
        >
          New chat
        </PrimaryButton>
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
