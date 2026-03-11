import { formatTime } from '@/lib/utils'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import type { ChatMessage as ChatMsg } from '@/types/chat.types'

interface ChatMessageProps {
  message: ChatMsg
  actionsTaken?: string[]
}

const planActions = ['plan_created', 'plan_updated']

export function ChatMessage({ message, actionsTaken }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const hasAction = actionsTaken?.some((a) => planActions.includes(a))
  const timestamp = message.timestamp ? formatTime(message.timestamp) : ''

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%]">
          <div className="bg-bg-secondary text-foreground rounded-2xl rounded-br-none px-4 py-2.5">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          {timestamp && <p className="text-xs text-muted-foreground text-right mt-1">{timestamp}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2 mb-4">
      <GeoAvatar size="sm" />
      <div className="max-w-[75%]">
        <div className="bg-background border border-border rounded-2xl rounded-bl-none px-4 py-2.5">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {timestamp && <p className="text-xs text-muted-foreground">{timestamp}</p>}
          {hasAction && (
            <span className="text-xs bg-brand/10 text-brand border border-brand/20 rounded-full px-2 py-0.5">
              Plan updated
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
