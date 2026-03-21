'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { SessionList } from '@/components/chat/session-list'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { getChatSessions, sendMessage } from '@/lib/api/chat.api'
import type { ChatSession } from '@/types/chat.types'

export default function ChatListPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    getChatSessions()
      .then(setSessions)
      .finally(() => setLoading(false))
  }, [])

  const handleNewChat = async () => {
    if (creating) return
    setCreating(true)
    try {
      const res = await sendMessage({ message: 'Hi!' })
      router.push(`/chat/${res.session_id}`)
    } catch {
      const { toast } = await import('sonner')
      toast.error('Failed to start new chat')
    } finally {
      setCreating(false)
    }
  }

  const handleSelect = (sessionId: string) => {
    router.push(`/chat/${sessionId}`)
  }

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[22px] font-semibold text-text-primary">Chats</h1>
        <button
          onClick={handleNewChat}
          disabled={creating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-accent to-accent-hover text-white disabled:opacity-50 transition-opacity"
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
        <SessionList sessions={sessions} onSelect={handleSelect} />
      )}
    </PageWrapper>
  )
}
