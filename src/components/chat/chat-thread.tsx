'use client'

import { useEffect, useRef } from 'react'
import { ChatBubble } from '@/components/chat/chat-bubble'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import type { ChatMessage } from '@/types/chat.types'

export function ChatThread({
  messages,
  isTyping,
}: {
  messages: ChatMessage[]
  isTyping?: boolean
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((message, index) => (
        <ChatBubble key={message.id ?? index} message={message} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
