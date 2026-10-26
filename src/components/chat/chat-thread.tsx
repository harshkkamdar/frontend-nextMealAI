'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChatBubble } from '@/components/chat/chat-bubble'
import { SuggestedReplies, replyLayoutId } from '@/components/chat/suggested-replies'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import type { ChatMessage } from '@/types/chat.types'

/**
 * The running conversation (Q25), shared by the Geo tab and the companion sheet. Scroll-agnostic: it ends at a
 * marker that is scrolled into view, so it works in the page scroll and inside a sheet body.
 */
export function ChatThread({
  messages,
  isTyping,
  sessionId,
  onReply,
  freshFrom = Infinity,
  chipSent = null,
}: {
  messages: ChatMessage[]
  isTyping?: boolean
  sessionId?: string
  /** Sends an option chip's text. Without it no chips are shown. */
  onReply?: (text: string) => void
  /** Messages from this index on arrived while the screen was open and play their entrance. */
  freshFrom?: number
  /** Text of the chip the user just tapped: its pill takes over the chip's shared-element id. */
  chipSent?: string | null
}) {
  const reduce = useReducedMotion()
  const bottomRef = useRef<HTMLDivElement>(null)
  const painted = useRef(false)

  useEffect(() => {
    // History jumps to its end on first paint; later turns glide into view.
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: painted.current && !reduce ? 'smooth' : 'auto' })
    if (messages.length > 0) painted.current = true
  }, [messages, isTyping, reduce])

  // Photos load after the text: if the end was in view, keep it in view as they grow the thread.
  const onImageLoad = (event: React.SyntheticEvent) => {
    const end = bottomRef.current
    if (!end || !(event.target instanceof HTMLImageElement)) return
    const overflow = end.getBoundingClientRect().top - window.innerHeight
    if (overflow < event.target.offsetHeight + 160) end.scrollIntoView({ block: 'end', behavior: 'auto' })
  }

  const last = messages[messages.length - 1]
  // R6-10: chips for the latest assistant message; live `suggestedReplies` or persisted `metadata.suggested_replies`.
  const chips = onReply && !isTyping && last?.role === 'assistant' ? last.suggestedReplies ?? last.metadata?.suggested_replies ?? [] : []
  // Not findLastIndex: the low-end Android WebView is Chrome 91.
  const lastUser = messages.map((message) => message.role).lastIndexOf('user')

  return (
    <div className="flex flex-col gap-6" onLoadCapture={onImageLoad}>
      {messages.map((message, index) => (
        <ChatBubble
          key={message.id ?? index}
          message={message}
          sessionId={sessionId}
          clusterStart={messages[index - 1]?.role !== 'assistant'}
          showTime={messages[index + 1]?.role !== 'assistant'}
          fresh={index >= freshFrom}
          layoutId={chipSent && index === lastUser && index >= freshFrom && message.content === chipSent ? replyLayoutId(chipSent) : undefined}
        />
      ))}
      {isTyping ? <TypingIndicator anchor={last?.role !== 'assistant'} /> : null}
      {/* Untapped chips fade out as the turn moves on; a tapped one glides into its pill (layoutId). */}
      <AnimatePresence>
        {chips.length > 0 && onReply ? (
          <motion.div key={last?.id ?? messages.length} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            <SuggestedReplies options={chips} onSelect={onReply} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* The page sets --chat-end-gap to the floating composer's height, so the last line lands above it. */}
      <div ref={bottomRef} aria-hidden="true" className="scroll-mb-[var(--chat-end-gap,16px)]" />
    </div>
  )
}
