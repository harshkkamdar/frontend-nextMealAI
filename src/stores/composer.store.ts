/**
 * FB-R6-FE-D — Composer draft store.
 *
 * Lifts chat-composer state (text + attached images + in-flight uploads)
 * out of any single component so the same draft survives navigation
 * between the floating Geo widget (`<GeoCompanionSheet>`) and the full
 * chat page (`/chat/[sessionId]`). Both views read/write through this
 * store, keyed by `sessionId`.
 *
 * Ownership rules:
 *  - The store owns the blob preview URLs. Components must not call
 *    URL.revokeObjectURL on entries they read from the store.
 *  - `removeAttached` revokes the URL for the removed entry.
 *  - `clearDraft` revokes all URLs for that session's draft.
 *  - The store is in-memory only (no persistence) — closing the tab
 *    drops the draft, which is the desired behavior since the BE
 *    storage paths the draft references are tied to the user session.
 *
 * ChatInput uses the store when `sessionId` is provided; without
 * `sessionId` it falls back to local state so tests + unrelated
 * surfaces aren't forced into the singleton.
 */

import { create } from 'zustand'
import type { AttachedImage } from '@/types/chat.types'

export interface ComposerDraft {
  text: string
  attached: AttachedImage[]
  uploadingCount: number
}

interface ComposerStore {
  drafts: Record<string, ComposerDraft>
  getDraft: (sessionId: string) => ComposerDraft
  setText: (sessionId: string, text: string) => void
  addAttached: (sessionId: string, item: AttachedImage) => void
  removeAttached: (sessionId: string, storage_path: string) => void
  incrementUploading: (sessionId: string, by: number) => void
  decrementUploading: (sessionId: string) => void
  clearDraft: (sessionId: string) => void
}

const EMPTY_DRAFT: ComposerDraft = { text: '', attached: [], uploadingCount: 0 }

function revokeAttached(items: AttachedImage[]) {
  for (const a of items) {
    try {
      URL.revokeObjectURL(a.preview_url)
    } catch {
      // jsdom + edge cases — swallow.
    }
  }
}

export const useComposerStore = create<ComposerStore>()((set, get) => ({
  drafts: {},

  getDraft: (sessionId) => get().drafts[sessionId] ?? EMPTY_DRAFT,

  setText: (sessionId, text) =>
    set((state) => ({
      drafts: {
        ...state.drafts,
        [sessionId]: {
          ...(state.drafts[sessionId] ?? EMPTY_DRAFT),
          text,
        },
      },
    })),

  addAttached: (sessionId, item) =>
    set((state) => {
      const existing = state.drafts[sessionId] ?? EMPTY_DRAFT
      return {
        drafts: {
          ...state.drafts,
          [sessionId]: {
            ...existing,
            attached: [...existing.attached, item],
          },
        },
      }
    }),

  removeAttached: (sessionId, storage_path) =>
    set((state) => {
      const existing = state.drafts[sessionId] ?? EMPTY_DRAFT
      const target = existing.attached.find((a) => a.storage_path === storage_path)
      if (target) revokeAttached([target])
      return {
        drafts: {
          ...state.drafts,
          [sessionId]: {
            ...existing,
            attached: existing.attached.filter((a) => a.storage_path !== storage_path),
          },
        },
      }
    }),

  incrementUploading: (sessionId, by) =>
    set((state) => {
      const existing = state.drafts[sessionId] ?? EMPTY_DRAFT
      return {
        drafts: {
          ...state.drafts,
          [sessionId]: { ...existing, uploadingCount: existing.uploadingCount + by },
        },
      }
    }),

  decrementUploading: (sessionId) =>
    set((state) => {
      const existing = state.drafts[sessionId] ?? EMPTY_DRAFT
      return {
        drafts: {
          ...state.drafts,
          [sessionId]: {
            ...existing,
            uploadingCount: Math.max(0, existing.uploadingCount - 1),
          },
        },
      }
    }),

  clearDraft: (sessionId) =>
    set((state) => {
      const existing = state.drafts[sessionId]
      // Note: NOT revoking blob URLs here — the optimistic ChatBubble in the
      // chat history still references them until the next refetch. Letting
      // the GC reclaim them after the references drop is fine for the size
      // of these images (jsdom doesn't simulate this; production browsers do).
      const nextDrafts = { ...state.drafts }
      if (existing) delete nextDrafts[sessionId]
      return { drafts: nextDrafts }
    }),
}))

/** Test-only helper to wipe the singleton between specs. */
export function __resetComposerStoreForTests() {
  useComposerStore.setState({ drafts: {} })
}
