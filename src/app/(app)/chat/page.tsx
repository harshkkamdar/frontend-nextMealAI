'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { SquarePen } from 'lucide-react'
import { SessionList } from '@/components/chat/session-list'
import { sessionTitles } from '@/components/chat/session-titles'
import { LargeTitleHeader } from '@/components/layout/screen-header'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { OfflineBand } from '@/components/shared/offline-band'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { ArrowUpIcon } from '@/components/ui/fiqr/icons'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { getChatSessions } from '@/lib/api/chat.api'
import { haptic } from '@/lib/platform/app'
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
      className="overflow-hidden rounded-[24px] bg-card shadow-[var(--shadow-card)]"
    >
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex min-h-[72px] flex-col justify-center gap-2 border-b border-ink-06 px-5 last:border-b-0">
          <motion.span
            className="block h-4 rounded-full bg-ink-06"
            style={{ width: `${[62, 48, 70, 54][index]}%` }}
            animate={reduce ? undefined : { opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }}
          />
          <span className="block h-3 w-[80%] rounded-full bg-ink-04" />
        </div>
      ))}
    </motion.div>
  )
}

export default function ChatListPage() {
  useSetGeoScreen('chat_list', {})
  const router = useRouter()
  const [draft, setDraft] = useState('')
  const [removed, setRemoved] = useState<string[]>([])
  const [entrance] = useState(() => !listShown)

  const fetchSessions = useCallback(() => getChatSessions(), [])
  const { data, loading, error, refetch } = useCachedQuery<ChatSession[]>('chat-sessions', fetchSessions, [])
  const sessions = (data ?? []).filter((s) => !removed.includes(s.session_id) && !removed.includes(s.id))
  useEffect(() => {
    if (!data) return
    listShown = true
    for (const s of data) if (s.title) sessionTitles.set(s.session_id, s.title)
  }, [data])

  const ask = () => {
    const message = draft.trim()
    if (!message) return
    void haptic('light')
    setDraft('')
    router.push(newSessionUrl(message))
  }

  return (
    <div className="mx-auto w-full max-w-md px-4">
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
        className="mt-4 flex h-14 items-center gap-1.5 rounded-full bg-card pl-5 pr-1.5 shadow-[var(--shadow-card)]"
        onSubmit={(event) => { event.preventDefault(); ask() }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask Geo anything"
          aria-label="Ask Geo anything"
          enterKeyHint="send"
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-ink-65"
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

      <section className="mt-7" aria-labelledby="conversations-label">
        <h2 id="conversations-label" className="mb-2 px-1 text-[13px] font-semibold text-ink-65">Conversations</h2>
        {!data && loading ? (
          <ListSkeleton />
        ) : !data && error ? (
          <ErrorState onRetry={() => void refetch()}>I couldn&apos;t load your conversations. Check your connection and try again.</ErrorState>
        ) : sessions.length === 0 ? (
          <div className="flex items-start gap-3 rounded-[24px] border-[1.5px] border-dashed border-ink-20 px-5 py-5">
            <GeoAvatar variant="face" state="happy" size={32} />
            <p className="min-w-0 flex-1 text-[15px] leading-[1.45] text-ink-65">
              Nothing here yet. Tell me what you ate, ask what to eat next, or how your week is going. Our conversations land here.
            </p>
          </div>
        ) : (
          <SessionList
            sessions={sessions}
            entrance={entrance}
            onSelect={(id) => router.push(`/chat/session?id=${id}`)}
            onDelete={(id) => setRemoved((ids) => [...ids, id])}
          />
        )}
      </section>
    </div>
  )
}
