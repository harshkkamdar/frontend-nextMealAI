'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useUIStore } from '@/stores/ui.store'
import { useGeoScreenContext } from '@/contexts/geo-screen-context'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { ChatBubble } from '@/components/chat/chat-bubble'
import { ChatInput } from '@/components/chat/chat-input'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import {
  startCompanionSession,
  sendMessage,
  extractSessionMemories,
} from '@/lib/api/chat.api'
import type { ChatMessage } from '@/types/chat.types'

export function GeoCompanionSheet() {
  const activeSheet = useUIStore((s) => s.activeSheet)
  const closeSheet = useUIStore((s) => s.closeSheet)
  const getScreenContext = useGeoScreenContext()
  const router = useRouter()

  const isOpen = activeSheet === 'geo-companion'
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messageCountRef = useRef(0)
  const initializingRef = useRef(false)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Initialize companion session when sheet opens
  useEffect(() => {
    if (!isOpen) return

    const init = async () => {
      if (initializingRef.current) return
      initializingRef.current = true

      setInitializing(true)
      setMessages([])
      setSessionId(null)
      messageCountRef.current = 0

      try {
        const { screen, context } = getScreenContext()
        const res = await startCompanionSession(screen, context)
        setSessionId(res.session_id)
      } catch {
        toast.error('Failed to connect to Geo')
        closeSheet()
      } finally {
        setInitializing(false)
        initializingRef.current = false
      }
    }

    init()
  }, [isOpen, getScreenContext, closeSheet])

  // Extract memories when sheet closes
  const handleClose = useCallback(() => {
    if (sessionId && messageCountRef.current >= 2) {
      extractSessionMemories(sessionId).catch(() => {})
    }
    closeSheet()
  }, [sessionId, closeSheet])

  const handleSend = async (message: string, image?: string) => {
    if (!sessionId) return

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: image ? `${message} [Photo attached]` : message,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    messageCountRef.current += 1
    setIsTyping(true)

    try {
      const res = await sendMessage({ message, session_id: sessionId, image })
      const geoMsg: ChatMessage = {
        id: `geo-${Date.now()}`,
        role: res.response.role,
        content: res.response.content,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, geoMsg])
      messageCountRef.current += 1

      // Notify workout page if session exercises were updated
      if ((res.tools_used ?? []).includes('update_today_workout')) {
        window.dispatchEvent(new CustomEvent('workout:session-updated'))
      }
    } catch {
      toast.error('Failed to send message')
    } finally {
      setIsTyping(false)
    }
  }

  const handleOpenFullChat = () => {
    handleClose()
    if (sessionId) {
      router.push(`/chat/${sessionId}`)
    } else {
      router.push('/chat')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="companion-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            key="companion-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl flex flex-col"
            style={{ maxHeight: '70vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <GeoAvatar state="default" size={32} />
                <div>
                  <span className="text-sm font-semibold text-text-primary">Geo</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span className="text-[10px] text-success">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              {initializing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 && !isTyping ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <GeoAvatar state="happy" size={48} />
                  <p className="text-sm text-text-secondary text-center">
                    Hey! What can I help you with?
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <ChatBubble key={msg.id ?? i} message={msg} />
                  ))}
                  {isTyping && <TypingIndicator />}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Open full chat link */}
            <div className="px-4 pt-1 flex items-center gap-3">
              <button
                onClick={handleOpenFullChat}
                className="flex items-center gap-1 text-xs text-accent hover:underline"
              >
                Open full chat
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => { handleClose(); setTimeout(() => router.push('/chat'), 50) }}
                className="flex items-center gap-1 text-xs text-text-secondary hover:underline"
              >
                All chats
              </button>
            </div>

            {/* Input */}
            <ChatInput onSend={handleSend} disabled={isTyping || initializing || !sessionId} showCamera />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
