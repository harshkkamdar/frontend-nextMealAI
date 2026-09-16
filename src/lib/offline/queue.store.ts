import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createPlatformStorage } from '@/lib/platform/storage'
import type { QueueItem } from '@/types/offline.types'

type NewQueueItem = Omit<QueueItem, 'id' | 'createdAt' | 'attempts'>

interface OfflineQueueState {
  items: QueueItem[]
  dead: QueueItem[]
  enqueue: (item: NewQueueItem) => QueueItem
  remove: (id: string) => void
  bump: (id: string, error: string) => void
  clear: () => void
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set) => ({
      items: [],
      dead: [],
      enqueue: (input) => {
        const item: QueueItem = {
          ...input,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          attempts: 0,
        }
        set((state) => ({ items: [...state.items, item] }))
        return item
      },
      remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      bump: (id, error) => set((state) => ({
        items: state.items.map((item) => (
          item.id === id
            ? { ...item, attempts: item.attempts + 1, lastError: error }
            : item
        )),
      })),
      clear: () => set({ items: [], dead: [] }),
    }),
    {
      name: 'fiqr-offline-queue',
      storage: createJSONStorage(() => createPlatformStorage()),
      partialize: (state) => ({ items: state.items, dead: state.dead }),
    },
  ),
)

export const pendingCount = (state: OfflineQueueState): number => state.items.length

export function enqueueWithId(input: NewQueueItem, id: string): QueueItem {
  const item: QueueItem = {
    ...input,
    id,
    createdAt: new Date().toISOString(),
    attempts: 0,
  }
  useOfflineQueue.setState((state) => ({ items: [...state.items, item] }))
  return item
}

export function moveToDead(id: string): void {
  useOfflineQueue.setState((state) => {
    const item = state.items.find((candidate) => candidate.id === id)
    if (!item) return state
    return {
      items: state.items.filter((candidate) => candidate.id !== id),
      dead: [...state.dead, item],
    }
  })
}
