'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

import { useRouter } from 'next/navigation'
import { ResizableSheet } from '@/components/ui/resizable-sheet'
import { SquarePen } from 'lucide-react'
import { motion } from 'framer-motion'
import { CloseIcon } from '@/components/ui/fiqr/icons'
import { toast } from 'sonner'
import { useUIStore } from '@/stores/ui.store'
import { useGeoScreenContext } from '@/contexts/geo-screen-context'
import { useOnline } from '@/lib/platform/network'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { ChatInput } from '@/components/chat/chat-input'
import { ChatThread } from '@/components/chat/chat-thread'
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
  // Replies that arrive while the sheet is open play their entrance; a restored thread paints at rest.
  const [freshFrom, setFreshFrom] = useState(0)
  const [chipSent, setChipSent] = useState<string | null>(null)
  const messageCountRef = useRef(0)
  const initializingRef = useRef(false)

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
      setFreshFrom(0)
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
                setFreshFrom(priorMessages.length)
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
        toast.error("I couldn't connect. Check your connection and try again.")
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
      toast.error("That didn't send. Check your connection and try again.")
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

  const reply = (text: string) => {
    setChipSent(text)
    void handleSend(text)
  }
  const send = (message: string, attachments?: AttachedImage[]) => {
    setChipSent(null)
    void handleSend(message, attachments)
  }

  return (
    <ResizableSheet open={isOpen} onClose={handleClose} ariaLabel="Geo" levels={[0.55, 0.94]} defaultLevelIndex={1}>
      <div className="flex shrink-0 items-center gap-3 px-5 pb-3">
        <GeoAvatar variant="face" state="happy" size={36} />
        <div className="min-w-0 flex-1">
          <p className="font-wide text-[19px] font-bold leading-tight text-ink">Geo</p>
          <p className="text-[13px] font-medium text-ink-65">{online ? 'Here to help' : "You're offline"}</p>
        </div>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={handleStartNewChat}
            disabled={initializing}
            className="grid size-11 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.94] disabled:text-ink-35"
            aria-label="Start a new conversation"
          >
            <SquarePen className="size-5" strokeWidth={1.75} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleClose}
          className="grid size-11 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.94]"
          aria-label="Close"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      {/* The conversation scrolls inside the sheet; the composer stays pinned to the sheet's bottom edge. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-2">
        {initializing ? (
          <div role="status" aria-label="Connecting to Geo" className="flex flex-col gap-2.5 pt-1">
            {[88, 64].map((w) => <span key={w} className="block h-4 rounded-full bg-ink-06" style={{ width: `${w}%` }} />)}
          </div>
        ) : (
          // Crossfades in where the skeleton lines were (motion-feel 3h).
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
            {messages.length === 0 && !isTyping ? (
              <p className="text-[16px] leading-[1.5] text-ink">What can I help with? I can log a meal, suggest what to eat, or look at your week.</p>
            ) : (
              <ChatThread messages={messages} isTyping={isTyping} sessionId={sessionId ?? undefined} onReply={reply} freshFrom={freshFrom} chipSent={chipSent} />
            )}
          </motion.div>
        )}
      </div>

      <div className="shrink-0 px-3 pb-3">
        <div className="flex justify-center gap-1 pb-1">
          <button type="button" onClick={handleOpenFullChat} className="h-11 rounded-full px-3 text-[14px] font-semibold text-ink-65 active:bg-ink-06">
            Open full screen
          </button>
          <button
            type="button"
            onClick={() => { handleClose(); setTimeout(() => router.push('/chat'), 50) }}
            className="h-11 rounded-full px-3 text-[14px] font-semibold text-ink-65 active:bg-ink-06"
          >
            All conversations
          </button>
        </div>
        {/* FB-R6-FE-D: passes sessionId so the composer draft survives the navigation to the full chat. */}
        <ChatInput
          onSend={send}
          disabled={isTyping || initializing || !sessionId}
          showCamera
          sessionId={sessionId ?? undefined}
          variant="inline"
        />
      </div>
    </ResizableSheet>
  )
}
