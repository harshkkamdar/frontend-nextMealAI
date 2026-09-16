'use client'

import { useEffect, useRef, useState } from 'react'
import { Ellipsis } from 'lucide-react'

import { ReportSheet } from '@/components/chat/report-sheet'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { safeImageUrl } from '@/lib/utils'
import type { ChatMessage } from '@/types/chat.types'

// Simple inline markdown renderer for Geo's responses
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
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
      parts.push(<code key={key++} className="rounded bg-ink-08 px-1">{match[4]}</code>)
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function GeoMessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let listKey = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-0.5 my-1">
          {listItems}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, i) => {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/)
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/)

    if (headingMatch) {
      flushList()
      const text = headingMatch[2]
      elements.push(
        <p key={i} className="mb-1 mt-2 text-[15.5px] font-semibold text-ink">
          {renderInline(text)}
        </p>,
      )
    } else if (bulletMatch || numberedMatch) {
      const text = (bulletMatch?.[1] ?? numberedMatch?.[1]) ?? ''
      listItems.push(
        <li key={i} className="text-[15.5px] text-ink">{renderInline(text)}</li>
      )
    } else if (line.trim() === '') {
      flushList()
      if (elements.length > 0) {
        elements.push(<div key={`gap-${i}`} className="h-1" />)
      }
    } else {
      flushList()
      elements.push(
        <p key={i} className="text-[15.5px] leading-[1.4] text-ink">
          {renderInline(line)}
        </p>
      )
    }
  })

  flushList()
  return <div className="space-y-0.5">{elements}</div>
}

export function ChatBubble({ message, sessionId }: { message: ChatMessage; sessionId?: string }) {
  const isUser = message.role === 'user'
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [menuOpen])

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  if (isUser) {
    // Strip "[Photo attached]" from content (legacy messages stored it in text)
    const displayContent = message.content.replace(/\s*\[Photo attached\]\s*/g, '').trim()

    // FB-R6-02 — render persisted attachments[] first (signed URLs from BE).
    // Fall back to the local-only `image` blob URL for the optimistic temp
    // message between submit and the next history refetch.
    const persistedAttachments = message.attachments ?? []
    const hasPersisted = persistedAttachments.length > 0

    return (
      <div className="flex flex-col items-end max-w-[85%] ml-auto">
        <div className="rounded-[18px] rounded-br-[6px] bg-ink px-4 py-3 text-[15.5px] leading-[1.4] text-cream">
          {hasPersisted ? (
            <div className={persistedAttachments.length > 1 ? 'grid grid-cols-2 gap-1 mb-2' : 'mb-2'}>
              {persistedAttachments.map((att) => {
                const safe = safeImageUrl(att.signed_url)
                if (!safe) return null
                // FB-R6-UAT-A follow-up — grid items must fit the column,
                // not a fixed 200px width, otherwise two images at 200px +
                // gap (~404px) overflow the ~300px mobile bubble. Single
                // image keeps the 200px cap so it doesn't fill the bubble.
                const isMulti = persistedAttachments.length > 1
                return (
                  <img
                    key={att.id}
                    src={safe}
                    alt="Uploaded"
                    className={
                      isMulti
                        ? 'rounded-xl w-full aspect-square object-cover'
                        : 'rounded-xl max-w-[200px] max-h-[200px] object-cover'
                    }
                  />
                )
              })}
            </div>
          ) : safeImageUrl(message.image) ? (
            <img
              src={safeImageUrl(message.image)!}
              alt="Uploaded food"
              className="rounded-xl max-w-[200px] max-h-[200px] object-cover mb-2"
            />
          ) : null}
          {displayContent && (
            <p className="whitespace-pre-wrap break-words">{displayContent}</p>
          )}
          {formattedTime && (
            <div className="mt-1 text-right text-[11px] text-cream-55">
              {formattedTime}
            </div>
          )}
        </div>
      </div>
    )
  }

  const failures = message.metadata?.actions_failed ?? []
  const hasFailures = message.role === 'assistant' && failures.length > 0

  const describeFailure = (a: { tool: string; error?: string }) => {
    // Friendly per-error overrides — the assistant text usually explains the
    // why, so we keep this short and free of internal codes.
    const errorCopy: Record<string, string> = {
      duplicate_window: 'looks like a duplicate from the last minute',
      not_found: "couldn't find that entry",
      validation: "those numbers didn't look right",
      missing_meal_plan_targets: 'nutrition plan needs daily targets',
      profile_incomplete: 'profile is missing something',
      image_analysis_failed: "couldn't read that image",
    }
    const base =
      a.tool === 'create_log' ? "couldn't save that log" :
      a.tool === 'update_log' ? "couldn't update that entry" :
      a.tool === 'delete_log' ? "couldn't delete that entry" :
      a.tool === 'create_plan' ? "couldn't create that plan" :
      a.tool === 'update_plan' ? "couldn't update that plan" :
      a.tool === 'deactivate_active_plan' ? "couldn't deactivate that plan" :
      `${a.tool} failed`
    if (!a.error || a.error === 'unknown') return base
    const friendly = errorCopy[a.error]
    return friendly ? `${base} — ${friendly}` : base
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setMenuOpen(false)
  }

  return (
    <>
      <div className="flex max-w-[85%] flex-col items-start">
        <div className="flex items-start gap-2">
          <GeoAvatar state="default" size={24} />
          <div className="relative rounded-[18px] rounded-bl-[6px] border border-ink-12 bg-card px-4 py-3 text-[15.5px] leading-[1.4] text-ink">
            <GeoMessageContent content={message.content} />
            {hasFailures && (
              <div className="mt-2 rounded-[12px] border border-accent/30 bg-accent-10 px-3 py-2 text-[13.5px] text-ink">
                <span className="font-semibold">Heads up:</span>{' '}
                {failures.map((a, i) => (
                  <span key={i}>
                    {i > 0 && '; '}
                    {describeFailure(a)}
                  </span>
                ))}
              </div>
            )}
            <div ref={menuRef} className="relative mt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-50 active:bg-ink-08"
                aria-label="Message options"
                aria-expanded={menuOpen}
              >
                <Ellipsis className="h-4 w-4" />
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute bottom-8 right-0 z-20 min-w-28 overflow-hidden rounded-[12px] border border-ink-12 bg-card py-1"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleCopy}
                    className="block h-9 w-full px-3 text-left text-[13.5px] font-semibold text-ink active:bg-ink-08"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      setReportOpen(true)
                    }}
                    className="block h-9 w-full px-3 text-left text-[13.5px] font-semibold text-ink active:bg-ink-08"
                  >
                    Report
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {formattedTime && (
          <span className="ml-8 mt-1 text-[11px] text-ink-50">{formattedTime}</span>
        )}
      </div>
      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        sessionId={sessionId}
        messageId={message.id}
      />
    </>
  )
}
