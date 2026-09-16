'use client'

import { useEffect, useRef } from 'react'
import { ChatBubble } from '@/components/chat/chat-bubble'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import type { ChatMessage } from '@/types/chat.types'

export function ChatThread({
  messages,
  isTyping,
  sessionId,
}: {
  messages: ChatMessage[]
  isTyping?: boolean
  sessionId?: string
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-gutter py-4">
      {messages.map((message, index) => (
        <ChatBubble key={message.id ?? index} message={message} sessionId={sessionId} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
