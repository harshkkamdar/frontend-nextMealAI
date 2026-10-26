'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { SquarePen } from 'lucide-react'
import { SessionList } from '@/components/chat/session-list'
import { sessionTitles } from '@/components/chat/session-titles'
import { appendPage, getSessionsPage } from '@/components/chat/sessions-page'
import { LargeTitleHeader } from '@/components/layout/screen-header'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { OfflineBand } from '@/components/shared/offline-band'
import { ArrowUpIcon } from '@/components/ui/fiqr/icons'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { haptic } from '@/lib/platform/app'
import { toast } from 'sonner'
import type { ChatSession } from '@/types/chat.types'

// Rows rise in on the tab's first paint in a session only; revisits paint at rest (motion-feel 3e, N8).
let listShown = false

const newSessionUrl = (prefill?: string) =>
  `/chat/session?id=${crypto.randomUUID()}${prefill ? `&prefill=${encodeURIComponent(prefill)}&send=1` : ''}`

/** Same box sizes as the rows it stands in for, so content swaps in without a shift (motion-feel 3h). */
function ListSkeleton() {
  const reduce = useReducedMotion()
  return (
    <motion.div
      role="status"
      aria-label="Loading conversations"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12, delay: 0.15 }}
      className="overflow-hidden rounded-card bg-card shadow-[var(--shadow-card)]"
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <div key={index} className="flex min-h-row flex-col justify-center gap-2 border-b border-ink-06 px-4 last:border-b-0">
          <motion.span
            className="block h-4 rounded-full bg-ink-06"
            style={{ width: `${[62, 48, 70, 54, 58][index]}%` }}
            animate={reduce ? undefined : { opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }}
          />
          <span className="block h-3 w-[80%] rounded-full bg-ink-04" />
        </div>
      ))}
    </motion.div>
  )
}

const EXAMPLES = ['Had a flat white and a croissant', 'What should I eat before training?', 'How am I tracking this week?']

export default function ChatListPage() {
  useSetGeoScreen('chat_list', {})
  const router = useRouter()
  const [draft, setDraft] = useState('')
  const askRef = useRef<HTMLInputElement>(null)
  const [removed, setRemoved] = useState<string[]>([])
  const [entrance] = useState(() => !listShown)
  // Pages after the first: "Show older conversations" fetches the next 20 (the API pages with limit and offset).
  const [older, setOlder] = useState<{ sessions: ChatSession[]; hasMore: boolean } | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)

  const fetchSessions = useCallback(() => getSessionsPage(0), [])
  const { data, loading, error, refetch } = useCachedQuery<{ sessions: ChatSession[]; hasMore: boolean }>('chat-sessions-page', fetchSessions, [])
  const shown = older ? appendPage(data?.sessions ?? [], older.sessions) : data?.sessions ?? []
  const sessions = shown.filter((s) => !removed.includes(s.session_id) && !removed.includes(s.id))
  const hasMore = older ? older.hasMore : Boolean(data?.hasMore)
  useEffect(() => {
    if (!data) return
    listShown = true
    for (const s of data.sessions) if (s.title) sessionTitles.set(s.session_id, s.title)
  }, [data])

  const showOlder = async () => {
    if (loadingOlder) return
    setLoadingOlder(true)
    try {
      // Offset counts rows the server has, deleted ones included until the next refetch.
      const page = await getSessionsPage(shown.length)
      for (const s of page.sessions) if (s.title) sessionTitles.set(s.session_id, s.title)
      setOlder((prev) => ({ sessions: appendPage(prev?.sessions ?? [], page.sessions), hasMore: page.hasMore }))
    } catch {
      toast.error("I couldn't load older conversations. Try again.")
    } finally {
      setLoadingOlder(false)
    }
  }

  const ask = () => {
    const message = draft.trim()
    if (!message) return
    void haptic('light')
    setDraft('')
    router.push(newSessionUrl(message))
  }

  return (
    <div className="mx-auto w-full max-w-md px-gutter pb-6">
      <LargeTitleHeader
        title="Geo"
        subtitle="Food, training and your week"
        actions={(
          <RoundButton aria-label="New conversation" onClick={() => router.push(newSessionUrl())}>
            <SquarePen strokeWidth={1.75} />
          </RoundButton>
        )}
      />

      <div className="-mx-4 mt-3">
        <OfflineBand />
      </div>

      {/* Two taps to talk (J3): the Geo tab, then this field. */}
      <form
        className="mt-3 flex h-field items-center gap-1.5 rounded-full bg-card pl-5 pr-2 shadow-[var(--shadow-card)]"
        onSubmit={(event) => { event.preventDefault(); ask() }}
      >
        <input
          ref={askRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask Geo anything"
          aria-label="Ask Geo anything"
          enterKeyHint="send"
          className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-65"
        />
        <button
          type="submit"
          aria-label="Send to Geo"
          disabled={!draft.trim()}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-cream transition-transform active:scale-[.94] disabled:bg-ink-06 disabled:text-ink-35"
        >
          <ArrowUpIcon className="size-5" />
        </button>
      </form>

      <section className="mt-6" aria-labelledby="conversations-label">
        <h2 id="conversations-label" className="mb-2 px-1 text-label text-ink-65">Conversations</h2>
        {!data && loading ? (
          <ListSkeleton />
        ) : !data && error ? (
          // The error sits in the list's own frame, so the page keeps its shape.
          <div role="alert" className="rounded-card bg-card px-4 py-3 shadow-[var(--shadow-card)]">
            <p className="py-1 text-body-sm leading-[1.4] text-ink">I couldn&apos;t load your conversations. Check your connection and try again.</p>
            <button type="button" onClick={() => void refetch()} className="-ml-2 h-11 px-2 text-body-sm font-semibold text-ink underline underline-offset-4">Try again</button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-card bg-card p-4 shadow-[var(--shadow-card)]">
            <GeoAvatar variant="face" state="happy" size={32} />
            <p className="mt-3 text-body-sm leading-[1.4] text-ink">Our conversations land here. Tell me what you ate, or try one of these.</p>
            <div className="mt-3 flex flex-col gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => { setDraft(example); askRef.current?.focus() }}
                  className="min-h-11 rounded-[14px] bg-cream px-3 text-left text-body-sm font-semibold text-ink transition-transform active:scale-[.98]"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <SessionList
              sessions={sessions}
              entrance={entrance}
              onSelect={(id) => router.push(`/chat/session?id=${id}`)}
              onDelete={(id) => setRemoved((ids) => [...ids, id])}
            />
            {hasMore ? (
              <button
                type="button"
                onClick={() => void showOlder()}
                disabled={loadingOlder}
                className="mt-2 h-btn w-full rounded-full text-body-sm font-semibold text-ink transition-transform active:scale-[.98] disabled:text-ink-65"
              >
                {loadingOlder ? 'Loading older conversations' : 'Show older conversations'}
              </button>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
