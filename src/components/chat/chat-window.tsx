'use client'

import { useEffect, useRef } from 'react'
import { ChatMessage } from './chat-message'
import { TypingIndicator } from './typing-indicator'
import { EmptyState } from '@/components/shared/empty-state'
import type { ChatMessage as ChatMsg } from '@/types/chat.types'

interface ChatWindowProps {
  messages: ChatMsg[]
  isTyping: boolean
  actionsForLastMessage?: string[]
}

export function ChatWindow({ messages, isTyping, actionsForLastMessage }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          title="Chat with Geo"
          description="Ask about nutrition, workouts, or request a new plan"
        />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.map((msg, i) => (
        <ChatMessage
          key={msg.id ?? i}
          message={msg}
          actionsTaken={i === messages.length - 1 ? actionsForLastMessage : undefined}
        />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
