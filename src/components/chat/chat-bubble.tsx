'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import { ActionCard } from '@/components/chat/action-card'
import { parseLoggedFoods } from '@/components/chat/logged-foods'
import type { ActionCardModel } from '@/components/chat/thread-actions'
import { ReportSheet } from '@/components/chat/report-sheet'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { reducedFade, spring } from '@/lib/motion'
import { cn, safeImageUrl } from '@/lib/utils'
import type { ChatMessage } from '@/types/chat.types'

// Simple inline markdown renderer for Geo's responses
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  // Process **bold**, *italic*, `code` inline patterns
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[0].startsWith('**')) {
      parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>)
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={key++}>{match[3]}</em>)
    } else {
      parts.push(<code key={key++} className="rounded-[6px] bg-ink-06 px-1 text-[15px]">{match[4]}</code>)
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

/** Geo speaks in plain text on the page (Q25): no bubble, 16/1.5 ink, light markdown. */
function GeoText({ content }: { content: string }) {
  const elements: ReactNode[] = []
  let list: { ordered: boolean; items: ReactNode[] } | null = null
  let key = 0

  const flush = () => {
    if (!list) return
    const Tag = list.ordered ? 'ol' : 'ul'
    elements.push(
      <Tag key={`list-${key++}`} className={cn('space-y-1 pl-5 marker:text-ink-65', list.ordered ? 'list-decimal' : 'list-disc')}>
        {list.items}
      </Tag>,
    )
    list = null
  }

  content.split('\n').forEach((line, i) => {
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    const bullet = line.match(/^[-*•]\s+(.+)$/)
    const numbered = line.match(/^\d+\.\s+(.+)$/)
    if (heading) {
      flush()
      elements.push(<p key={i} className="pt-1 font-semibold">{renderInline(heading[2])}</p>)
    } else if (bullet || numbered) {
      const ordered = Boolean(numbered)
      if (list && list.ordered !== ordered) flush()
      list ??= { ordered, items: [] }
      list.items.push(<li key={i} className="pl-0.5">{renderInline((bullet?.[1] ?? numbered?.[1]) ?? '')}</li>)
    } else if (line.trim() === '') {
      flush()
    } else {
      flush()
      elements.push(<p key={i}>{renderInline(line)}</p>)
    }
  })
  flush()
  return <div className="space-y-2.5 break-words text-[16px] leading-[1.5] text-ink">{elements}</div>
}

function describeFailure(a: { tool: string; error?: string }) {
  // Friendly per-error overrides: Geo's text usually explains the why, so this stays short and free of internal codes.
  const errorCopy: Record<string, string> = {
    duplicate_window: 'it looks like a duplicate from the last minute',
    not_found: "I couldn't find that entry",
    validation: "those numbers didn't look right",
    missing_meal_plan_targets: 'your nutrition plan needs daily targets',
    profile_incomplete: 'your profile is missing something',
    image_analysis_failed: "I couldn't read that image",
  }
  const base =
    a.tool === 'create_log' ? "I couldn't save that log" :
    a.tool === 'update_log' ? "I couldn't update that entry" :
    a.tool === 'delete_log' ? "I couldn't delete that entry" :
    a.tool === 'create_plan' ? "I couldn't create that plan" :
    a.tool === 'update_plan' ? "I couldn't update that plan" :
    a.tool === 'deactivate_active_plan' ? "I couldn't switch off that plan" :
    "Something I tried didn't go through"
  if (!a.error || a.error === 'unknown') return base
  const friendly = errorCopy[a.error]
  return friendly ? `${base}: ${friendly}` : base
}

/** Opens a run of Geo's turns, so its plain text reads as a reply, not an unsent draft. Shared with the typing dots. */
export function GeoAnchor() {
  return (
    <div className="flex h-5 items-center gap-2">
      <GeoAvatar variant="face" size={20} />
      <span aria-hidden="true" className="text-[13px] font-semibold text-ink">Geo</span>
    </div>
  )
}

interface ChatBubbleProps {
  message: ChatMessage
  sessionId?: string
  /** True for a message that arrived while the screen was open; history paints at rest (motion-feel N8). */
  fresh?: boolean
  /** Shared-element id: a tapped option chip glides into this pill. */
  layoutId?: string
  /** First of a run of Geo's turns: carries the Geo anchor. */
  clusterStart?: boolean
  /** Last of a run of Geo's turns: carries the timestamp. */
  showTime?: boolean
  /** What Geo did in this reply, as one card (pick A2). */
  card?: ActionCardModel | null
  /** Sends a card button's text as the next turn. */
  onAction?: (text: string) => void
  /** The user's message did not reach Geo: "Didn't send. Retry" sits under it. */
  failed?: boolean
  onRetry?: () => void
}

/** One turn of the running conversation: the user's ink-tint pill, or Geo's plain text with logged-food rows. */
export function ChatBubble({ message, sessionId, fresh = false, layoutId, clusterStart = false, showTime = true, card = null, onAction, failed = false, onRetry }: ChatBubbleProps) {
  const reduce = useReducedMotion()
  const isUser = message.role === 'user'
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const press = useRef<{ x: number; y: number; timer: number } | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const closeMenu = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeMenu)
    return () => document.removeEventListener('pointerdown', closeMenu)
  }, [menuOpen])

  const formattedTime = showTime && message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
    : null

  if (isUser) {
    // Strip "[Photo attached]" from content (legacy messages stored it in text)
    const displayContent = message.content.replace(/\s*\[Photo attached\]\s*/g, '').trim()

    // FB-R6-02: persisted attachments[] first (signed URLs from the backend), then the local-only `image` blob URL
    // for the optimistic message between submit and the next history refetch.
    const persistedAttachments = message.attachments ?? []
    const isMulti = persistedAttachments.length > 1
    const legacy = persistedAttachments.length === 0 ? safeImageUrl(message.image) : null

    return (
      <motion.div
        initial={fresh && !layoutId ? (reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }) : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduce ? reducedFade : spring.tap}
        className="ml-auto flex max-w-[82%] origin-bottom-right flex-col items-end gap-1.5"
      >
        {persistedAttachments.length > 0 ? (
          // FB-R6-UAT-A: grid items fit the column (two fixed 200 px images overflow a phone); one image keeps its 200 px cap.
          <div className={isMulti ? 'grid w-[232px] max-w-full grid-cols-2 gap-1.5' : ''}>
            {persistedAttachments.map((att) => {
              const safe = safeImageUrl(att.signed_url)
              if (!safe) return null
              return (
                <img
                  key={att.id}
                  src={safe}
                  alt="Your photo"
                  className={isMulti ? 'aspect-square w-full rounded-[18px] bg-ink-06 object-cover' : 'max-h-[200px] max-w-[200px] rounded-[22px] bg-ink-06 object-cover'}
                />
              )
            })}
          </div>
        ) : legacy ? (
          <img src={legacy} alt="Your photo" className="max-h-[200px] max-w-[200px] rounded-[22px] bg-ink-06 object-cover" />
        ) : null}
        {displayContent ? (
          <motion.p
            layoutId={reduce ? undefined : layoutId}
            transition={spring.glide}
            className="whitespace-pre-wrap break-words rounded-[22px] bg-ink-08 px-4 py-2.5 text-[16px] leading-[1.45] text-ink"
          >
            {displayContent}
          </motion.p>
        ) : null}
        {failed ? (
          <p role="alert" className="-my-2 flex items-center text-caption font-medium text-ink-65">
            Didn&apos;t send.
            <button type="button" onClick={onRetry} className="h-11 px-2 font-semibold text-ink underline underline-offset-4">Retry</button>
          </p>
        ) : null}
      </motion.div>
    )
  }

  const failures = message.metadata?.actions_failed ?? []
  // Receipt lines become the card's rows; the rest is Geo's text.
  const { text } = card?.kind === 'logged' ? parseLoggedFoods(message.content) : { text: message.content }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setMenuOpen(false)
  }

  // Long-press (or right-click) the reply for Copy and Report; the timestamp is the quiet, focusable way in.
  const cancelPress = () => { if (press.current) window.clearTimeout(press.current.timer); press.current = null }
  const longPress = {
    onPointerDown: (e: React.PointerEvent) => {
      cancelPress()
      press.current = { x: e.clientX, y: e.clientY, timer: window.setTimeout(() => { press.current = null; setMenuOpen(true) }, 450) }
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (press.current && Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > 10) cancelPress()
    },
    onPointerUp: cancelPress,
    onPointerCancel: cancelPress,
    onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); cancelPress(); setMenuOpen(true) },
  }

  return (
    <>
      <motion.div
        initial={fresh ? (reduce ? { opacity: 0 } : { opacity: 0, y: 6 }) : false}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? reducedFade : { opacity: { duration: 0.18, ease: 'easeOut' }, y: spring.glide }}
        className="flex select-none flex-col gap-3 [-webkit-touch-callout:none]"
        {...longPress}
      >
        {clusterStart ? <GeoAnchor /> : null}
        {/* What Geo did leads, as one card; Geo's line about it follows. A draft plan's description sits on its card. */}
        {card?.kind === 'draft' ? (
          // Once saved, the draft's "nothing changes until you say so" line no longer holds.
          <ActionCard card={card} body={text ? <GeoText content={card.accepted ? text.replace(/[^.\n]*\buntil you say\b[^.\n]*\.?/gi, '').trim() : text} /> : null} onAction={onAction} />
        ) : card ? (
          <ActionCard card={card} onAction={onAction} />
        ) : null}
        {text && card?.kind !== 'draft' ? <GeoText content={text} /> : null}
        {failures.length > 0 ? (
          <p className="rounded-[16px] bg-ink-04 px-4 py-3 text-[14px] leading-[1.45] text-ink">
            <span className="font-semibold">Heads up.</span>{' '}
            {failures.map((a) => describeFailure(a)).join('. ')}.
          </p>
        ) : null}
        {/* The time sits 4 pt under the reply; its 44 pt target hangs into the gap before the next turn. */}
        <div ref={menuRef} className={cn('relative -ml-3 flex', formattedTime ? '-mb-5 -mt-2' : '-my-2')}>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className={formattedTime ? 'flex h-11 items-start rounded-full px-3 leading-4 text-[12px] font-medium text-ink-65 transition-transform active:scale-[.96]' : 'sr-only focus:not-sr-only'}
            aria-label="Message options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {formattedTime ? <span aria-hidden="true">{formattedTime}</span> : null}
          </button>
          {menuOpen ? (
            <motion.div
              role="menu"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={reduce ? reducedFade : spring.tap}
              className="absolute bottom-11 left-2 z-20 w-44 bg-card shadow-[var(--shadow-glass)] origin-bottom-left overflow-hidden rounded-[18px] py-1"
            >
              <button type="button" role="menuitem" onClick={handleCopy} className="block h-11 w-full px-4 text-left text-[15px] font-medium text-ink active:bg-ink-06">
                Copy
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); setReportOpen(true) }}
                className="block h-11 w-full border-t border-ink-06 px-4 text-left text-[15px] font-medium text-ink active:bg-ink-06"
              >
                Report
              </button>
            </motion.div>
          ) : null}
        </div>
      </motion.div>
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} sessionId={sessionId} messageId={message.id} />
    </>
  )
}
