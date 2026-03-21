'use client'

import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ChatHeader } from '@/components/chat/chat-header'
import { ChatThread } from '@/components/chat/chat-thread'
import { ChatInput } from '@/components/chat/chat-input'
import { getChatSession, sendMessage } from '@/lib/api/chat.api'
import type { ChatMessage } from '@/types/chat.types'

export default function ActiveChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChatSession(sessionId)
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false))
  }, [sessionId])

  const handleSend = async (message: string) => {
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      const res = await sendMessage({ message, session_id: sessionId })
      const geoMessage: ChatMessage = {
        id: `geo-${Date.now()}`,
        role: res.response.role,
        content: res.response.content,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, geoMessage])
    } catch {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsTyping(false)
    }
  }

  if (loading) {
    return (
      <div className="h-dvh flex flex-col bg-background overflow-hidden">
        <ChatHeader sessionId={sessionId} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <ChatHeader sessionId={sessionId} />
      <ChatThread messages={messages} isTyping={isTyping} />
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  )
}
