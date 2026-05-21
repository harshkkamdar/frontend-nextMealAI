'use client'

import { use, useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ChatHeader } from '@/components/chat/chat-header'
import { ChatThread } from '@/components/chat/chat-thread'
import { ChatInput } from '@/components/chat/chat-input'
import { getChatSession, getChatSessions, sendMessage } from '@/lib/api/chat.api'
import { extractWorkoutProgram, isLikelyWorkoutProgramPrompt } from '@/lib/api/vision.api'
import { WorkoutProgramPreviewCard } from '@/components/plans/workout-program-preview-card'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import type { AttachedImage, ChatMessage } from '@/types/chat.types'
import type { WorkoutProgramContent } from '@/types/plans.types'

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
    onPrefill(searchParams.get('prefill') ?? '')
  }, [searchParams, onPrefill])
  return null
}

export default function ActiveChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()
  const [prefill, setPrefill] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionTitle, setSessionTitle] = useState<string | undefined>()
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  // FB-15: preview card for an extracted workout program. One at a time.
  const [programPreview, setProgramPreview] = useState<
    { program: WorkoutProgramContent; confidence: number } | null
  >(null)

  useSetGeoScreen('chat', { sessionId })

  useEffect(() => {
    let cancelled = false
    const fetchSession = () =>
      Promise.all([
        getChatSession(sessionId).catch(() => ({ messages: [] as ChatMessage[] })),
        getChatSessions().catch(() => []),
      ]).then(([sessionData, sessions]) => {
        if (cancelled) return
        setMessages(sessionData.messages ?? [])
        const match = sessions.find((s) => s.session_id === sessionId || s.id === sessionId)
        if (match?.title) setSessionTitle(match.title)
      })

    fetchSession().finally(() => { if (!cancelled) setLoading(false) })

    // If coming from companion sheet mid-response, re-fetch after a delay
    // to pick up the Geo reply that was still in-flight
    const timer = setTimeout(() => {
      if (!cancelled) fetchSession()
    }, 4000)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [sessionId])

  const handleSend = async (message: string, attachments?: AttachedImage[]) => {
    // FB-R6-02 — optimistic local user bubble uses the blob preview URL.
    // After the next chat-session refetch the message comes back from BE with
    // attachments[] (signed URLs), which ChatBubble prefers over `image`.
    const firstPreview = attachments?.[0]?.preview_url
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      image: firstPreview,
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
      setMessages((prev) => [...prev, geoMessage])

      // Notify if Geo created or updated a plan
      const planTools = (res.tools_used ?? []).filter(t => t === 'create_plan' || t === 'update_plan')
      if (planTools.length > 0) {
        toast.success('Plan saved!', {
          description: 'Your plan is ready to view.',
          action: { label: 'View Plans', onClick: () => router.push('/plans') },
        })
      }
    } catch {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsTyping(false)
    }
  }

  if (loading) {
    return (
      <div className="h-dvh flex flex-col bg-background overflow-hidden">
        <ChatHeader sessionId={sessionId} title={sessionTitle} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <Suspense fallback={null}>
        <PrefillReader onPrefill={setPrefill} />
      </Suspense>
      <ChatHeader sessionId={sessionId} title={sessionTitle} />
      {programPreview && (
        <div className="px-4 pt-3">
          <WorkoutProgramPreviewCard
            program={programPreview.program}
            confidence={programPreview.confidence}
            onAccept={() => setProgramPreview(null)}
            onDiscard={() => setProgramPreview(null)}
          />
        </div>
      )}
      <ChatThread messages={messages} isTyping={isTyping} />
      <ChatInput onSend={handleSend} disabled={isTyping} showCamera defaultValue={prefill} />
    </div>
  )
}
