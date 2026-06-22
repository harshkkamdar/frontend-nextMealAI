/**
 * FE-RCA F2 — Companion sheet persistence regression lock.
 *
 * Pre-fix behaviour: each open of the companion sheet called
 *   setMessages([]); setSessionId(null); await startCompanionSession(...)
 * unconditionally. Closing + reopening wiped messages and minted a brand
 * new BE session, orphaning any uploaded images from the prior session.
 *
 * Post-fix: the sheet stores the most-recent companion session id in
 * localStorage with a 30-minute resume window. On open it tries to restore the
 * prior session via getChatSession() before falling back to creating a new one.
 * (The window was 24h originally but that made the sheet "always revert to the
 * last chat" — shortened so a later visit starts fresh; a "New chat" button
 * gives explicit control regardless.)
 *
 * The full component lifecycle (Framer Motion + Zustand store + Next.js
 * router) is awkward to mount in jsdom, so this test exercises the
 * persistence contract by simulating the lifecycle: read → restore →
 * write. The simulation mirrors the actual init effect at
 * geo-companion-sheet.tsx.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const COMPANION_SESSION_LS_KEY = 'nextmealai:companion:current-session-id'
const COMPANION_SESSION_TTL_MS = 30 * 60 * 1000

interface StoredCompanionSession {
  session_id: string
  ts: number
}

function readStored(): StoredCompanionSession | null {
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

function writeStored(session_id: string): void {
  window.localStorage.setItem(
    COMPANION_SESSION_LS_KEY,
    JSON.stringify({ session_id, ts: Date.now() } satisfies StoredCompanionSession),
  )
}

function clearStored(): void {
  window.localStorage.removeItem(COMPANION_SESSION_LS_KEY)
}

/**
 * Mirrors the post-fix init effect at geo-companion-sheet.tsx.
 * Returns the final state the sheet would render.
 */
async function simulateInit({
  startCompanionSession,
  getChatSession,
}: {
  startCompanionSession: () => Promise<{ session_id: string }>
  getChatSession: (id: string) => Promise<{ messages: Array<{ id: string }> }>
}): Promise<{ sessionId: string; messages: Array<{ id: string }> }> {
  const stored = readStored()
  if (stored && Date.now() - stored.ts < COMPANION_SESSION_TTL_MS) {
    try {
      const { messages } = await getChatSession(stored.session_id)
      if (Array.isArray(messages) && messages.length > 0) {
        writeStored(stored.session_id)  // refresh TTL
        return { sessionId: stored.session_id, messages }
      }
    } catch {
      clearStored()
    }
  }
  const res = await startCompanionSession()
  writeStored(res.session_id)
  return { sessionId: res.session_id, messages: [] }
}

describe('FE-RCA F2 — companion session persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useRealTimers()
  })

  it('on a fresh open, creates a new session and persists it', async () => {
    const startCompanionSession = vi.fn(async () => ({ session_id: 'sess-A' }))
    const getChatSession = vi.fn()

    const state = await simulateInit({ startCompanionSession, getChatSession })

    expect(startCompanionSession).toHaveBeenCalledOnce()
    expect(getChatSession).not.toHaveBeenCalled()
    expect(state.sessionId).toBe('sess-A')
    expect(readStored()?.session_id).toBe('sess-A')
  })

  it('on re-open within TTL, restores the prior session and its messages', async () => {
    writeStored('sess-A')
    const priorMessages = [
      { id: 'msg-1' },
      { id: 'msg-2' },
      { id: 'msg-3' },
    ]
    const startCompanionSession = vi.fn(async () => ({ session_id: 'sess-NEW' }))
    const getChatSession = vi.fn(async () => ({ messages: priorMessages }))

    const state = await simulateInit({ startCompanionSession, getChatSession })

    expect(getChatSession).toHaveBeenCalledWith('sess-A')
    expect(startCompanionSession).not.toHaveBeenCalled()
    expect(state.sessionId).toBe('sess-A')
    expect(state.messages).toHaveLength(3)
  })

  it('when the prior session 404s, falls back to creating a new session and clears LS', async () => {
    writeStored('sess-A')
    const startCompanionSession = vi.fn(async () => ({ session_id: 'sess-B' }))
    const getChatSession = vi.fn(async () => { throw new Error('404 — session deleted') })

    const state = await simulateInit({ startCompanionSession, getChatSession })

    expect(state.sessionId).toBe('sess-B')
    expect(readStored()?.session_id).toBe('sess-B')
  })

  it('when the prior session is older than the 30-minute window, mints a new one', async () => {
    const STALE_TS = Date.now() - COMPANION_SESSION_TTL_MS - 1000
    window.localStorage.setItem(
      COMPANION_SESSION_LS_KEY,
      JSON.stringify({ session_id: 'sess-OLD', ts: STALE_TS }),
    )
    const startCompanionSession = vi.fn(async () => ({ session_id: 'sess-FRESH' }))
    const getChatSession = vi.fn()

    const state = await simulateInit({ startCompanionSession, getChatSession })

    expect(getChatSession).not.toHaveBeenCalled()
    expect(state.sessionId).toBe('sess-FRESH')
  })

  it('when the prior session has zero messages, falls back to a new session', async () => {
    // An empty session is structurally indistinguishable from a fresh
    // session — restoring it would show the user a blank thread under an
    // old id. Better to just mint a new one.
    writeStored('sess-EMPTY')
    const startCompanionSession = vi.fn(async () => ({ session_id: 'sess-NEW' }))
    const getChatSession = vi.fn(async () => ({ messages: [] }))

    const state = await simulateInit({ startCompanionSession, getChatSession })

    expect(state.sessionId).toBe('sess-NEW')
  })

  it('on restore, refreshes the timestamp so active users keep their thread', async () => {
    // Use real time and a frozen-into-past timestamp to verify ts updates.
    // Must be inside the 30-minute resume window so restore (not mint) runs.
    const ORIGINAL_TS = Date.now() - 5 * 60 * 1000  // 5m ago
    window.localStorage.setItem(
      COMPANION_SESSION_LS_KEY,
      JSON.stringify({ session_id: 'sess-A', ts: ORIGINAL_TS }),
    )
    const startCompanionSession = vi.fn()
    const getChatSession = vi.fn(async () => ({ messages: [{ id: 'm1' }] }))

    await simulateInit({ startCompanionSession, getChatSession })

    const after = readStored()
    expect(after?.session_id).toBe('sess-A')
    expect(after?.ts).toBeGreaterThan(ORIGINAL_TS)
  })

  it('survives malformed localStorage entries (defense against bad data)', async () => {
    window.localStorage.setItem(COMPANION_SESSION_LS_KEY, 'not-json{{{')
    const startCompanionSession = vi.fn(async () => ({ session_id: 'sess-FRESH' }))
    const getChatSession = vi.fn()

    const state = await simulateInit({ startCompanionSession, getChatSession })
    expect(state.sessionId).toBe('sess-FRESH')
  })

  it('rejects entries missing required fields', async () => {
    window.localStorage.setItem(
      COMPANION_SESSION_LS_KEY,
      JSON.stringify({ session_id: 'sess-A' }),  // no `ts`
    )
    const startCompanionSession = vi.fn(async () => ({ session_id: 'sess-FRESH' }))
    const getChatSession = vi.fn()
    const state = await simulateInit({ startCompanionSession, getChatSession })
    expect(state.sessionId).toBe('sess-FRESH')
  })
})
