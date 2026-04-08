'use client'

import { GeoAvatar } from '@/components/shared/geo-avatar'
import type { ChatMessage } from '@/types/chat.types'

// Simple inline markdown renderer for Geo's responses
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Process **bold**, *italic*, `code` inline patterns
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[0].startsWith('**')) {
      parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>)
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={key++}>{match[3]}</em>)
    } else {
      parts.push(<code key={key++} className="bg-surface-hover rounded px-1 py-0.5 text-xs font-mono">{match[4]}</code>)
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function GeoMessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let listKey = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-0.5 my-1">
          {listItems}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, i) => {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/)
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/)

    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      const text = headingMatch[2]
      const className = level === 1
        ? 'text-sm font-bold text-text-primary mt-2 mb-1'
        : level === 2
        ? 'text-sm font-semibold text-text-primary mt-1.5 mb-0.5'
        : 'text-xs font-semibold text-text-secondary mt-1'
      elements.push(<p key={i} className={className}>{renderInline(text)}</p>)
    } else if (bulletMatch || numberedMatch) {
      const text = (bulletMatch?.[1] ?? numberedMatch?.[1]) ?? ''
      listItems.push(
        <li key={i} className="text-sm text-text-primary">{renderInline(text)}</li>
      )
    } else if (line.trim() === '') {
      flushList()
      if (elements.length > 0) {
        elements.push(<div key={`gap-${i}`} className="h-1" />)
      }
    } else {
      flushList()
      elements.push(
        <p key={i} className="text-sm text-text-primary leading-relaxed">
          {renderInline(line)}
        </p>
      )
    }
  })

  flushList()
  return <div className="space-y-0.5">{elements}</div>
}

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  if (isUser) {
    // Strip "[Photo attached]" from content (legacy messages stored it in text)
    const displayContent = message.content.replace(/\s*\[Photo attached\]\s*/g, '').trim()

    return (
      <div className="flex flex-col items-end max-w-[85%] ml-auto">
        <div className="bg-accent hover:bg-accent-hover text-white rounded-2xl rounded-br-sm px-4 py-2.5">
          {message.image && (
            <img
              src={message.image}
              alt="Uploaded food"
              className="rounded-xl max-w-[200px] max-h-[200px] object-cover mb-2"
            />
          )}
          {displayContent && (
            <p className="text-sm whitespace-pre-wrap break-words">{displayContent}</p>
          )}
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
          <GeoMessageContent content={message.content} />
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
