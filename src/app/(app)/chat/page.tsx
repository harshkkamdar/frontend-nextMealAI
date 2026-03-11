'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { ChatWindow } from '@/components/chat/chat-window'
import { ChatInput } from '@/components/chat/chat-input'
import { SessionList } from '@/components/chat/session-list'
import { getChatSessions, getChatSession, sendMessage } from '@/lib/api/chat.api'
import { queryKeys } from '@/lib/query-keys'
import { ApiException } from '@/types/api.types'
import type { ChatMessage } from '@/types/chat.types'

export default function ChatPage() {
  const queryClient = useQueryClient()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [lastActionsForMessage, setLastActionsForMessage] = useState<string[]>([])
  const [showSidebar, setShowSidebar] = useState(false)

  const { data: sessions = [] } = useQuery({
    queryKey: queryKeys.chatSessions(),
    queryFn: getChatSessions,
  })

  const loadSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId)
    setShowSidebar(false)
    try {
      const data = await getChatSession(sessionId)
      setMessages(data.messages ?? [])
    } catch {
      toast.error('Failed to load conversation')
    }
  }, [])

  function newSession() {
    setActiveSessionId(uuidv4())
    setMessages([])
    setLastActionsForMessage([])
    setShowSidebar(false)
  }

  async function handleSend(text: string) {
    let sessionId = activeSessionId
    if (!sessionId) {
      sessionId = uuidv4()
      setActiveSessionId(sessionId)
    }

    // Optimistically add user message
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    try {
      const result = await sendMessage({ message: text, session_id: sessionId })
      const geoMsg: ChatMessage = {
        role: 'assistant',
        content: result.response.content,
        timestamp: new Date().toISOString(),
        tokens_used: result.response.tokens_used,
      }
      setMessages((prev) => [...prev, geoMsg])
      setLastActionsForMessage(result.actions_taken ?? [])

      // Invalidate sessions list to update titles/timestamps
      queryClient.invalidateQueries({ queryKey: queryKeys.chatSessions() })

      // Invalidate plans if Geo updated them
      const planActions = ['plan_created', 'plan_updated']
      if (result.actions_taken?.some((a) => planActions.includes(a))) {
        queryClient.invalidateQueries({ queryKey: queryKeys.plans() })
        toast.success('Geo updated your plan')
      }
    } catch (err) {
      // Remove the optimistic user message on failure
      setMessages((prev) => prev.slice(0, -1))
      if (err instanceof ApiException) {
        toast.error(err.message || "Geo couldn't respond — try again")
      } else {
        toast.error("Geo couldn't respond — try again")
      }
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-60px)] bg-bg-primary">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-background border-r border-border shadow-xl md:hidden"
          >
            <SessionList
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={loadSession}
              onNewSession={newSession}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-[280px] border-r border-border bg-background flex-col">
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={loadSession}
          onNewSession={newSession}
        />
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Chat header (mobile only) */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border md:hidden">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
          >
            {showSidebar ? <X size={20} /> : <Menu size={20} />}
          </button>
          <p className="font-semibold text-foreground text-sm">
            {activeSessionId ? 'Conversation' : 'New Chat'}
          </p>
        </div>

        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          actionsForLastMessage={lastActionsForMessage}
        />

        <ChatInput onSend={handleSend} disabled={isTyping} />
      </div>

      {/* Mobile sidebar backdrop */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
}
