'use client'

import { GeoAvatar } from '@/components/shared/geo-avatar'
import type { ChatMessage } from '@/types/chat.types'

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  if (isUser) {
    return (
      <div className="flex flex-col items-end max-w-[85%] ml-auto">
        <div className="bg-gradient-to-r from-accent to-accent-hover text-white rounded-2xl rounded-br-sm px-4 py-2.5">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        {formattedTime && (
          <span className="text-[10px] text-text-tertiary mt-1 mr-1">
            {formattedTime}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start max-w-[85%]">
      <div className="flex items-end gap-2">
        <GeoAvatar state="default" size={28} />
        <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-2.5">
          <p className="text-sm text-text-primary whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
      {formattedTime && (
        <span className="text-[10px] text-text-tertiary mt-1 ml-10">
          {formattedTime}
        </span>
      )}
    </div>
  )
}
