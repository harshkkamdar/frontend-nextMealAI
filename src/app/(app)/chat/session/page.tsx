'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import { ChatThread } from '@/components/chat/chat-thread'
import { ChatInput } from '@/components/chat/chat-input'
import { sessionTitles } from '@/components/chat/session-titles'
import { PushedHeader } from '@/components/layout/screen-header'
import { OfflineBand } from '@/components/shared/offline-band'
import { getChatSession, getChatSessions, sendMessage } from '@/lib/api/chat.api'
import { extractWorkoutProgram, isLikelyWorkoutProgramPrompt } from '@/lib/api/vision.api'
import { WorkoutProgramPreviewCard } from '@/components/plans/workout-program-preview-card'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { handleGeoToolResults } from '@/lib/sync/dispatch-from-chat'
import type { AttachedImage, ChatMessage } from '@/types/chat.types'
import type { WorkoutProgramContent } from '@/types/plans.types'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { ApiException } from '@/types/api.types'
import { goBack } from '@/components/plans/plan-format'

// FB-R6-02 — FB-15 (program extraction) still wants a base64 payload. The
// chat-input no longer keeps base64 around (it has a File + storage_path
// instead), so we convert on demand only when FB-15 fires.
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsDataURL(file)
  })
}

function PrefillReader({ onPrefill }: { onPrefill: (v: string) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    // send=1 (from the + sheet) sends the text instead of leaving it in the composer.
    onPrefill(searchParams.get('send') === '1' ? '' : searchParams.get('prefill') ?? '')
  }, [searchParams, onPrefill])
  return null
}

export default function ActiveChatPage() {
  return <Suspense fallback={null}><ActiveChatRoute /></Suspense>
}

function ActiveChatRoute() {
  const params = useSearchParams()
  const sessionId = params.get('id') ?? ''
  if (!sessionId) return <p className="px-5 pt-[calc(24px+var(--safe-top))] text-[16px] text-ink-65">No conversation picked. <Link href="/chat" className="font-semibold text-ink underline">See your conversations</Link></p>
  return <ActiveChatSession sessionId={sessionId} autoSend={params.get('send') === '1' ? params.get('prefill') : null} />
}

function ActiveChatSession({ sessionId, autoSend }: { sessionId: string; autoSend?: string | null }) {
  const router = useRouter()
  const autoSent = useRef(false)
  const [prefill, setPrefill] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionTitle, setSessionTitle] = useState<string | undefined>(() => sessionTitles.get(sessionId))
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const [historyFailed, setHistoryFailed] = useState(false)
  // Messages from this index on arrived while the screen was open and play their entrance; history paints at rest.
  const [freshFrom, setFreshFrom] = useState(Infinity)
  // The option chip just tapped, so its pill can take over the chip's shared-element id.
  const [chipSent, setChipSent] = useState<string | null>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const [composerH, setComposerH] = useState(88)
  // Only flips at the threshold, so scrolling never renders per frame.
  const [scrolled, setScrolled] = useState(false)
  // FB-15: preview card for an extracted workout program. One at a time.
  const [programPreview, setProgramPreview] = useState<
    { program: WorkoutProgramContent; confidence: number } | null
  >(null)

  useSetGeoScreen('chat', { sessionId })

  useEffect(() => {
    let cancelled = false
    const fetchSession = () =>
      Promise.all([
        // A new chat id has no history yet (404); any other failure is shown, not treated as an empty chat.
        getChatSession(sessionId).catch((error: unknown) => {
          if (!(error instanceof ApiException && error.statusCode === 404)) setHistoryFailed(true)
          return { messages: [] as ChatMessage[] }
        }),
        getChatSessions().catch(() => []),
      ]).then(([sessionData, sessions]) => {
        if (cancelled) return
        const history = sessionData.messages ?? []
        setFreshFrom((current) => (current === Infinity ? history.length : current))
        setMessages(history)
        const match = sessions.find((s) => s.session_id === sessionId || s.id === sessionId)
        if (match?.title) setSessionTitle(match.title)
      })

    fetchSession().finally(() => {
      if (cancelled) return
      setLoading(false)
      setFreshFrom((current) => (current === Infinity ? 0 : current))
    })

    // If coming from companion sheet mid-response, re-fetch after a delay
    // to pick up the Geo reply that was still in-flight
    const timer = setTimeout(() => {
      if (!cancelled) fetchSession()
    }, 4000)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [sessionId])

  const handleSend = async (message: string, attachments?: AttachedImage[]) => {
    // FB-R6-UAT-A — hand the optimistic bubble the FULL attachment set so
    // multi-image messages render every image before the BE refetch swaps
    // in signed URLs. `preview_url` is a blob URL — works as <img src> just
    // like a signed https URL.
    const userMessage: ChatMessage = {
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

    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    // FB-15: if the user attached an image with a workout-programmy message,
    // try to extract a program first and show the preview card. Failures
    // fall through to Geo's normal flow silently.
    if (attachments?.length && isLikelyWorkoutProgramPrompt(message)) {
      try {
        const base64 = await fileToBase64(attachments[0].file)
        const extracted = await extractWorkoutProgram(base64)
        if (extracted?.program?.days?.length) {
          setProgramPreview(extracted)
        }
      } catch {
        // swallow — normal chat flow continues below
      }
    }

    try {
      const image_paths = attachments?.map((a) => a.storage_path)
      const res = await sendMessage({ message, session_id: sessionId, image_paths })
      const geoMessage: ChatMessage = {
        id: res.response.id ?? `geo-${Date.now()}`,
        role: res.response.role,
        content: res.response.content,
        timestamp: new Date().toISOString(),
        metadata: {
          tools_used: res.tools_used,
          actions_taken: res.actions_taken,
          actions_failed: res.actions_failed,
        },
        // R6-10 — tappable option chips (top-level or persisted metadata).
        suggestedReplies: res.suggested_replies ?? res.response.metadata?.suggested_replies,
      }
      setMessages((prev) => [...prev, geoMessage])

      // FB-R6.7 Build B — centralized chat→UI sync. Emits invalidation
      // topics on syncBus (consuming pages refetch automatically) and
      // bridges the legacy DOM CustomEvents during the rollout.
      const { topics, anyFailed } = handleGeoToolResults(res)

      // Suppress the success toast if any tool failed — actions_failed
      // already surfaces inline in the chat bubble (chat-bubble.tsx:153).
      const planToolsFired =
        topics.includes('plans:created') || topics.includes('plans:updated')
      if (planToolsFired && !anyFailed) {
        toast.success('Plan saved', {
          description: "It's ready in Plans.",
          action: { label: 'View', onClick: () => router.push('/plans') },
        })
      }
    } catch {
      toast.error("That didn't send. Check your connection and try again.")
    } finally {
      setIsTyping(false)
    }
  }

  // The + sheet's "Tell Geo" sends once the (empty) history has loaded; the URL drops send=1 so a reload never resends.
  useEffect(() => {
    if (loading || !autoSend || autoSent.current) return
    autoSent.current = true
    router.replace(`/chat/session?id=${sessionId}`)
    void handleSend(autoSend)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once when loading settles
  }, [loading, autoSend])

  // The composer floats over the thread; the thread ends above it whatever its height (photos, long drafts).
  useEffect(() => {
    const node = composerRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    // Border box: the safe-area padding under the capsule counts too.
    const observer = new ResizeObserver(() => setComposerH(Math.round(node.getBoundingClientRect().height)))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const reply = (text: string) => {
    setChipSent(text)
    void handleSend(text)
  }
  const send = (message: string, attachments?: AttachedImage[]) => {
    setChipSent(null)
    void handleSend(message, attachments)
  }

  return (
    // The thread scrolls in its own box, not the window: during the push the route frame is transformed, and a
    // window scroll would carry the fixed header and composer away with it until the transform clears.
    <div className="h-dvh overflow-y-auto overscroll-contain" onScroll={(e) => { const past = e.currentTarget.scrollTop > 4; if (past !== scrolled) setScrolled(past) }}>
    <div
      className="mx-auto w-full max-w-md px-5"
      style={{ paddingBottom: composerH + 24, ['--chat-end-gap' as string]: `${composerH + 20}px` }}
    >
      {loading ? null : (
        <Suspense fallback={null}>
          <PrefillReader onPrefill={setPrefill} />
        </Suspense>
      )}
      <PushedHeader title={sessionTitle ?? 'Geo'} onBack={() => goBack(router, '/chat')} backLabel="Back to conversations" />
      {/* Scroll edge under the header (same idea as the tab bar's): the thread fades into the paper, never sliced. */}
      <div aria-hidden="true" className={`pointer-events-none fixed inset-x-0 top-0 z-[39] h-[calc(var(--safe-top)+88px)] transition-opacity duration-200 ${scrolled ? 'opacity-100' : 'opacity-0'} bg-[linear-gradient(to_bottom,var(--color-cream)_calc(100%-28px),rgba(253,246,236,0))]`} />
      <div className="-mx-5">
        <OfflineBand />
      </div>
      {programPreview && (
        <div className="pt-3">
          <WorkoutProgramPreviewCard
            program={programPreview.program}
            confidence={programPreview.confidence}
            onAccept={() => setProgramPreview(null)}
            onDiscard={() => setProgramPreview(null)}
          />
        </div>
      )}
      <div className="pt-4">
        {loading ? (
          <ThreadSkeleton />
        ) : (
          // History crossfades in over the skeleton's place; its blocks never move (motion-feel 3h).
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
            {historyFailed && messages.length === 0 ? (
              <div className="mb-6"><ErrorState>I couldn&apos;t load this conversation. You can still send a message, or go back and try again.</ErrorState></div>
            ) : messages.length === 0 && !isTyping && !autoSend ? (
              <NewChatIntro />
            ) : null}
            <ChatThread messages={messages} isTyping={isTyping} sessionId={sessionId} onReply={reply} freshFrom={freshFrom} chipSent={chipSent} />
          </motion.div>
        )}
      </div>
      {/* Floating glass composer (Q25): the only glass on this screen; the thread under it stays solid. */}
      <div ref={composerRef} className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] mx-auto max-w-md px-3" style={{ paddingBottom: 'calc(10px + var(--safe-bottom))' }}>
        {/* Scroll edge: text fades into the page under the composer instead of colliding with it. */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 top-[-24px] bg-[linear-gradient(to_top,var(--color-cream)_calc(100%-36px),rgba(253,246,236,0))]" />
        {/* FB-R6-FE-D: pass sessionId so a draft started in the companion sheet survives the navigation here. */}
        <div className="pointer-events-auto relative">
          <ChatInput onSend={send} disabled={isTyping || loading} showCamera defaultValue={prefill} sessionId={sessionId} />
        </div>
      </div>
    </div>
    </div>
  )
}

/** A new conversation: Geo opens in its own plain-text voice, where its first reply will sit. */
function NewChatIntro() {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <GeoAvatar variant="face" state="happy" size={36} />
      <p className="text-[16px] leading-[1.5] text-ink">
        Hi, I&apos;m Geo. Tell me what you ate, ask what to eat next, or ask how your week is going. A photo works too.
      </p>
    </div>
  )
}

/** History on its way: one pill and Geo's lines, the shapes they become. Appears only after 150 ms. */
function ThreadSkeleton() {
  const reduce = useReducedMotion()
  const pulse = reduce ? undefined : { opacity: [1, 0.6, 1] }
  const loop = { duration: 1.2, repeat: Infinity, delay: 0.6, ease: 'easeInOut' as const }
  return (
    <motion.div role="status" aria-label="Loading conversation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12, delay: 0.15 }} className="flex flex-col gap-6">
      <motion.span animate={pulse} transition={loop} className="ml-auto block h-11 w-[58%] rounded-[22px] bg-ink-06" />
      <div className="flex flex-col gap-2.5">
        {[92, 84, 60].map((w) => <motion.span key={w} animate={pulse} transition={loop} className="block h-4 rounded-full bg-ink-06" style={{ width: `${w}%` }} />)}
      </div>
      <motion.span animate={pulse} transition={loop} className="ml-auto block h-11 w-[40%] rounded-[22px] bg-ink-06" />
    </motion.div>
  )
}
