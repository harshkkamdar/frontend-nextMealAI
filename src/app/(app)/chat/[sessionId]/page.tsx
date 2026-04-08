'use client'

import { use, useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ChatHeader } from '@/components/chat/chat-header'
import { ChatThread } from '@/components/chat/chat-thread'
import { ChatInput } from '@/components/chat/chat-input'
import { getChatSession, getChatSessions, sendMessage } from '@/lib/api/chat.api'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import type { ChatMessage } from '@/types/chat.types'

function PrefillReader({ onPrefill }: { onPrefill: (v: string) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    onPrefill(searchParams.get('prefill') ?? '')
  }, [searchParams, onPrefill])
  return null
}

export default function ActiveChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()
  const [prefill, setPrefill] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionTitle, setSessionTitle] = useState<string | undefined>()
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(true)

  useSetGeoScreen('chat', { sessionId })

  useEffect(() => {
    let cancelled = false
    const fetchSession = () =>
      Promise.all([
        getChatSession(sessionId).catch(() => ({ messages: [] as ChatMessage[] })),
        getChatSessions().catch(() => []),
      ]).then(([sessionData, sessions]) => {
        if (cancelled) return
        setMessages(sessionData.messages ?? [])
        const match = sessions.find((s) => s.session_id === sessionId || s.id === sessionId)
        if (match?.title) setSessionTitle(match.title)
      })

    fetchSession().finally(() => { if (!cancelled) setLoading(false) })

    // If coming from companion sheet mid-response, re-fetch after a delay
    // to pick up the Geo reply that was still in-flight
    const timer = setTimeout(() => {
      if (!cancelled) fetchSession()
    }, 4000)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [sessionId])

  const handleSend = async (message: string, image?: string) => {
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      image: image ? `data:image/jpeg;base64,${image}` : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      const res = await sendMessage({ message, session_id: sessionId, image })
      const geoMessage: ChatMessage = {
        id: `geo-${Date.now()}`,
        role: res.response.role,
        content: res.response.content,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, geoMessage])

      // Notify if Geo created or updated a plan
      const planTools = (res.tools_used ?? []).filter(t => t === 'create_plan' || t === 'update_plan')
      if (planTools.length > 0) {
        toast.success('Plan saved!', {
          description: 'Your plan is ready to view.',
          action: { label: 'View Plans', onClick: () => router.push('/plans') },
        })
      }
    } catch {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsTyping(false)
    }
  }

  if (loading) {
    return (
      <div className="h-dvh flex flex-col bg-background overflow-hidden">
        <ChatHeader sessionId={sessionId} title={sessionTitle} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <Suspense fallback={null}>
        <PrefillReader onPrefill={setPrefill} />
      </Suspense>
      <ChatHeader sessionId={sessionId} title={sessionTitle} />
      <ChatThread messages={messages} isTyping={isTyping} />
      <ChatInput onSend={handleSend} disabled={isTyping} showCamera defaultValue={prefill} />
    </div>
  )
}
