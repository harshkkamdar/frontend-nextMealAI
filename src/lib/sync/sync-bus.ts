/**
 * FB-R6.7 Build B — Chat → UI sync bus.
 *
 * A typed in-tab pub/sub for "Geo just mutated server state, the affected UI
 * surfaces should refetch." Decoupled from React so any module (chat dispatch,
 * page listener, future BroadcastChannel bridge) can produce or consume.
 *
 * Why not React Query / SWR / Zustand?
 *   - React Query is an architectural swap; out of scope for this round.
 *   - Zustand is for shared *state*; we need a *signal-and-refetch* primitive.
 *     Pages still own their own fetch logic; we just tell them when to re-run.
 *   - Context forces a Provider tree and re-renders for unrelated consumers.
 *
 * Wildcard semantics: subscribing to `plans:*` receives every topic whose
 * prefix (before the colon) matches `plans`. Same for `logs:*` and `workout:*`.
 *
 * Multi-tab is out of scope. The bus is per-tab. A future BroadcastChannel
 * bridge can re-emit cross-tab without changing this surface.
 */

export type SyncTopic =
  | 'plans:created'
  | 'plans:updated'
  | 'plans:deactivated'
  | 'logs:created'
  | 'logs:updated'
  | 'logs:deleted'
  | 'workout:session-updated'
  | 'workout:advanced'

export type SyncWildcard = 'plans:*' | 'logs:*' | 'workout:*'

export type SyncTopicOrWildcard = SyncTopic | SyncWildcard

type Handler = (topic: SyncTopic, payload?: unknown) => void

class SyncBus {
  private exact = new Map<SyncTopic, Set<Handler>>()
  private wildcard = new Map<string, Set<Handler>>() // key = prefix before ':*'

  emit(topic: SyncTopic, payload?: unknown): void {
    // FB-R6.7 /review follow-up - isolate handler failures. A single page
    // listener that throws shouldn't take down every other listener on the
    // same topic. Log to console so the bad observer is still visible.
    for (const h of this.exact.get(topic) ?? []) {
      try {
        h(topic, payload)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('syncBus handler threw', { topic, err })
      }
    }
    const prefix = topic.split(':')[0]
    for (const h of this.wildcard.get(prefix) ?? []) {
      try {
        h(topic, payload)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('syncBus wildcard handler threw', { topic, prefix, err })
      }
    }
  }

  on(topic: SyncTopicOrWildcard, handler: Handler): () => void {
    if (topic.endsWith(':*')) {
      const prefix = topic.slice(0, -2)
      let set = this.wildcard.get(prefix)
      if (!set) {
        set = new Set()
        this.wildcard.set(prefix, set)
      }
      set.add(handler)
      return () => {
        set!.delete(handler)
        if (set!.size === 0) this.wildcard.delete(prefix)
      }
    }
    const exact = topic as SyncTopic
    let set = this.exact.get(exact)
    if (!set) {
      set = new Set()
      this.exact.set(exact, set)
    }
    set.add(handler)
    return () => {
      set!.delete(handler)
      if (set!.size === 0) this.exact.delete(exact)
    }
  }

  onMany(topics: SyncTopicOrWildcard[], handler: Handler): () => void {
    const unsubs = topics.map((t) => this.on(t, handler))
    return () => unsubs.forEach((u) => u())
  }

  /** Test-only: drop all subscriptions. */
  __resetForTests(): void {
    this.exact.clear()
    this.wildcard.clear()
  }
}

export const syncBus = new SyncBus()
