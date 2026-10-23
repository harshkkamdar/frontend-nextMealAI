'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

import { useRouter } from 'next/navigation'
import { ResizableSheet } from '@/components/ui/resizable-sheet'
import { X, ExternalLink, SquarePen } from 'lucide-react'
import { toast } from 'sonner'
import { useUIStore } from '@/stores/ui.store'
import { useGeoScreenContext } from '@/contexts/geo-screen-context'
import { useOnline } from '@/lib/platform/network'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { ChatBubble } from '@/components/chat/chat-bubble'
import { ChatInput } from '@/components/chat/chat-input'
import { SuggestedReplies } from '@/components/chat/suggested-replies'
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
// stash the most-recent companion session id in localStorage and restore it on
// open. Closing the sheet only unmounts UI — the BE row remains, and reopening
// rehydrates from the server's signed-URL refresh.
//
// 2026-06-22 (Harsh: "geo chat always reverts to the last chat instead of
// starting a new one") — the resume window was 24h, so opening the sheet hours
// later dropped you back into a stale thread. Shortened to 30min: long enough to
// survive an accidental click-out + reopen (the original image bug), short enough
// that a later visit starts fresh. A visible "New chat" button gives explicit
// control regardless of the window.
const COMPANION_SESSION_LS_KEY = 'nextmealai:companion:current-session-id'
const COMPANION_SESSION_TTL_MS = 30 * 60 * 1000

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

  const online = useOnline()
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

  // Initialize a companion session. FE-RCA F2 — when forceNew is false, try to
  // restore a recent prior session from localStorage before creating a new one
  // (survives accidental click-out + reopen). When forceNew is true ("New chat"),
  // skip restore and always mint a fresh BE session.
  const initCompanion = useCallback(
    async (forceNew: boolean) => {
      if (initializingRef.current) return
      initializingRef.current = true

      setInitializing(true)
      setMessages([])
      setSessionId(null)
      messageCountRef.current = 0

      try {
        if (forceNew) {
          clearStoredCompanionSession()
        } else {
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
    },
    [getScreenContext, closeSheet],
  )

  // Initialize companion session when the sheet opens (restore if recent).
  useEffect(() => {
    if (!isOpen) return
    initCompanion(false)
  }, [isOpen, initCompanion])

  // Explicit "New chat" — extract memories from the current thread (if any),
  // then mint a brand-new session immediately so the user sees a blank thread.
  const handleStartNewChat = useCallback(() => {
    if (initializingRef.current) return
    if (sessionId && messageCountRef.current >= 2) {
      extractSessionMemories(sessionId).catch(() => {})
    }
    initCompanion(true)
  }, [sessionId, initCompanion])

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
        id: res.response.id ?? `geo-${Date.now()}`,
        role: res.response.role,
        content: res.response.content,
        timestamp: new Date().toISOString(),
        metadata: {
          tools_used: res.tools_used,
          actions_taken: res.actions_taken,
          actions_failed: res.actions_failed,
        },
        // R6-10 — option chips (top-level or in persisted metadata).
        suggestedReplies: res.suggested_replies ?? res.response.metadata?.suggested_replies,
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
      router.push(`/chat/session?id=${encodeURIComponent(targetSessionId)}&t=${Date.now()}`)
    } else {
      router.push('/chat')
    }
  }

  return (
    <ResizableSheet open={isOpen} onClose={handleClose} ariaLabel="Geo chat" levels={[0.55, 0.94]} defaultLevelIndex={1}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-10 px-gutter pb-3">
              <div className="flex items-center gap-2.5">
                <GeoAvatar variant="face" state="happy" size={32} />
                <div>
                  <span className="text-[17px] font-bold text-ink">Geo</span>
                  {/* Status follows the device connection; teal is reserved for carbs, so the dot is ink. */}
                  <div className="flex items-center gap-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-ink' : 'bg-ink-35'}`} />
                    <span className="text-[12px] font-medium text-ink-65">{online ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 ? <button
                  onClick={handleStartNewChat}
                  disabled={initializing}
                  className="flex h-11 items-center gap-1 rounded-full px-3 text-[14px] font-semibold text-ink active:bg-ink-08 disabled:pointer-events-none disabled:text-ink-35"
                  aria-label="Start a new chat"
                >
                  <SquarePen className="w-3.5 h-3.5" />
                  New
                </button> : null}
                <button
                  onClick={handleClose}
                  className="-mr-2.5 flex size-11 items-center justify-center rounded-full text-ink-65 active:bg-ink-08"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat area */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-gutter py-3">
              {initializing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 && !isTyping ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <GeoAvatar variant="face" state="happy" size={48} />
                  <p className="text-center text-[15.5px] text-ink-65">
                    Hey! What can I help you with?
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <ChatBubble key={msg.id ?? i} message={msg} sessionId={sessionId ?? undefined} />
                  ))}
                  {isTyping && <TypingIndicator />}
                  {/* R6-10 — chips for the latest assistant message only. */}
                  {(() => {
                    const last = messages[messages.length - 1]
                    const chips = !isTyping && last?.role === 'assistant'
                      ? last.suggestedReplies ?? last.metadata?.suggested_replies ?? []
                      : []
                    return chips.length > 0 ? (
                      <SuggestedReplies options={chips} onSelect={handleSend} />
                    ) : null
                  })()}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Open full chat link */}
            <div className="flex items-center gap-3 px-gutter pt-1">
              <button
                onClick={handleOpenFullChat}
                className="flex items-center gap-1 text-[13.5px] font-semibold text-ink-65"
              >
                Open full chat
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => { handleClose(); setTimeout(() => router.push('/chat'), 50) }}
                className="flex items-center gap-1 text-[13.5px] font-semibold text-ink-65"
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
    </ResizableSheet>
  )
}
