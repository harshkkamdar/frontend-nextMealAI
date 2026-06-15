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
  getChatSession,
} from '@/lib/api/chat.api'
import { handleGeoToolResults } from '@/lib/sync/dispatch-from-chat'
import type { AttachedImage, ChatMessage } from '@/types/chat.types'

// FE-RCA F2 — Companion sheet persistence.
// Previously, each open of the sheet called setMessages([])+setSessionId(null)
// and synthesised a fresh BE session, so prior images/messages vanished
// (Harsh, 2026-05-12: "images disappear in chat after clicking out"). We now
// stash the most-recent companion session id in localStorage with a 24h TTL
// and restore it on open. Closing the sheet only unmounts UI — the BE row
// remains, and reopening rehydrates from the server's signed-URL refresh.
const COMPANION_SESSION_LS_KEY = 'nextmealai:companion:current-session-id'
const COMPANION_SESSION_TTL_MS = 24 * 60 * 60 * 1000

interface StoredCompanionSession {
  session_id: string
  ts: number
}

function readStoredCompanionSession(): StoredCompanionSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(COMPANION_SESSION_LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredCompanionSession>
    if (!parsed || typeof parsed.session_id !== 'string' || typeof parsed.ts !== 'number') {
      return null
    }
    return { session_id: parsed.session_id, ts: parsed.ts }
  } catch {
    return null
  }
}

function writeStoredCompanionSession(session_id: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      COMPANION_SESSION_LS_KEY,
      JSON.stringify({ session_id, ts: Date.now() } satisfies StoredCompanionSession),
    )
  } catch {
    // private mode / quota — silent
  }
}

function clearStoredCompanionSession(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(COMPANION_SESSION_LS_KEY)
  } catch {
    // silent
  }
}

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

  // Initialize companion session when sheet opens.
  // FE-RCA F2 — try to restore prior session from localStorage before
  // creating a new one. If a stored session is fresh (<24h) and the BE
  // returns its messages, hydrate; otherwise fall through to a new session.
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
        const stored = readStoredCompanionSession()
        if (stored && Date.now() - stored.ts < COMPANION_SESSION_TTL_MS) {
          try {
            const { messages: priorMessages } = await getChatSession(stored.session_id)
            if (Array.isArray(priorMessages) && priorMessages.length > 0) {
              setSessionId(stored.session_id)
              setMessages(priorMessages)
              messageCountRef.current = priorMessages.length
              // Refresh the timestamp so an active user keeps their thread.
              writeStoredCompanionSession(stored.session_id)
              return
            }
          } catch {
            // BE rejected (session deleted, 404, etc.) — fall through to new
            clearStoredCompanionSession()
          }
        }

        const { screen, context } = getScreenContext()
        const res = await startCompanionSession(screen, context)
        setSessionId(res.session_id)
        writeStoredCompanionSession(res.session_id)
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

  // Explicit "new chat" — clears the persisted session id so the next open
  // starts fresh. Kept as a local handler in case future UI surfaces wire it.
  const handleStartNewChat = useCallback(() => {
    clearStoredCompanionSession()
    setMessages([])
    setSessionId(null)
    messageCountRef.current = 0
  }, [])
  // Touch the handler so dead-code lint doesn't flag it; can be wired to a
  // visible "+ New chat" button in a follow-up UI iteration.
  void handleStartNewChat

  // Extract memories when sheet closes
  const handleClose = useCallback(() => {
    if (sessionId && messageCountRef.current >= 2) {
      extractSessionMemories(sessionId).catch(() => {})
    }
    closeSheet()
  }, [sessionId, closeSheet])

  const handleSend = async (message: string, attachments?: AttachedImage[]) => {
    if (!sessionId) return

    // FB-R6-UAT-A — populate attachments[] with every AttachedImage so the
    // multi-image optimistic bubble renders all images, not just the first.
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      attachments: attachments?.map((a, i) => ({
        id: `temp-att-${i}`,
        signed_url: a.preview_url,
        mime_type: a.file.type,
        width: a.width ?? null,
        height: a.height ?? null,
      })),
    }

    setMessages((prev) => [...prev, userMsg])
    messageCountRef.current += 1
    setIsTyping(true)

    try {
      const image_paths = attachments?.map((a) => a.storage_path)
      const res = await sendMessage({ message, session_id: sessionId, image_paths })
      const geoMsg: ChatMessage = {
        id: `geo-${Date.now()}`,
        role: res.response.role,
        content: res.response.content,
        timestamp: new Date().toISOString(),
        metadata: {
          tools_used: res.tools_used,
          actions_taken: res.actions_taken,
          actions_failed: res.actions_failed,
        },
      }
      setMessages((prev) => [...prev, geoMsg])
      messageCountRef.current += 1

      // FB-R6.7 Build B — centralized chat→UI sync (emits syncBus topics
      // and bridges legacy DOM events). The actions_failed cross-reference
      // means failed tools no longer trigger a phantom refetch.
      handleGeoToolResults(res)
    } catch {
      toast.error('Failed to send message')
    } finally {
      setIsTyping(false)
    }
  }

  const handleOpenFullChat = () => {
    // Navigate first without closing — let any in-flight API call finish
    // The full chat page will re-fetch messages from the server
    const targetSessionId = sessionId
    closeSheet() // close sheet UI without extracting memories mid-conversation
    if (targetSessionId) {
      router.push(`/chat/${targetSessionId}?t=${Date.now()}`)
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

            {/* Input — FB-R6-FE-D: passes sessionId so the composer draft
                survives the navigation to /chat/[sessionId]. */}
            <ChatInput
              onSend={handleSend}
              disabled={isTyping || initializing || !sessionId}
              showCamera
              sessionId={sessionId ?? undefined}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
