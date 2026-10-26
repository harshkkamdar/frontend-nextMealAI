/** App navigation: the four tabs, how a route change is classified for motion, and in-app history. */

/** The tab bar's tabs, in order. The single source for which routes are tab roots. */
export const TAB_ROUTES = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Food', href: '/food' },
  { label: 'Train', href: '/train' },
  { label: 'Geo', href: '/chat' },
] as const

export const TAB_ROOTS: ReadonlySet<string> = new Set(TAB_ROUTES.map((tab) => tab.href))

export type NavKind = 'none' | 'push' | 'pop' | 'tab'

/**
 * Decides how a route change animates. `stack` holds the routes still mounted, root first, current last.
 * A route already in the stack below the top is a pop to it (back, hardware back, swipe, tapping the current
 * tab again). Tab root to tab root is always the tab crossfade, whatever caused it (tab bar, browser or hardware
 * back). Other browser back/forward outside the stack goes by the history index. Another tab chosen from a pushed page fades.
 */
export function classifyNav(stack: readonly string[], to: string, popstate: 'back' | 'forward' | null): { kind: NavKind; index: number } {
  const from = stack[stack.length - 1]
  if (from === to) return { kind: 'none', index: stack.length - 1 }
  const index = stack.lastIndexOf(to)
  if (index >= 0) return { kind: 'pop', index }
  if (TAB_ROOTS.has(from) && TAB_ROOTS.has(to)) return { kind: 'tab', index: -1 }
  if (popstate) return { kind: popstate === 'forward' ? 'push' : 'pop', index: -1 }
  if (TAB_ROOTS.has(to)) return { kind: 'tab', index: -1 }
  return { kind: 'push', index: -1 }
}

/**
 * Module-level history state, shared by the route frame and goBack.
 * - `backPending`: set by the popstate listener below, cleared by the route frame when the route commits.
 * - `index`: the in-app history index of the current entry, written by stampHistory (route frame, every commit).
 * - `swipeCommitted`: set by the route frame's swipe-back once the page has slid off, cleared on the next commit
 *   or by the swipe's no-history fallback.
 */
export const navHistory = {
  backPending: null as 'back' | 'forward' | null,
  index: 0,
  swipeCommitted: false,
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (e) => {
    const index = (e.state as { fiqrIndex?: unknown } | null)?.fiqrIndex
    // An entry without a stamp (lost to a replace) counts as back.
    navHistory.backPending = typeof index === 'number' && index > navHistory.index ? 'forward' : 'back'
  })
}

/** Stamps the current history entry (new entries get the next index), so a later popstate knows its direction. */
export function stampHistory() {
  const state = (window.history.state ?? {}) as { fiqrIndex?: unknown }
  if (typeof state.fiqrIndex === 'number') navHistory.index = state.fiqrIndex
  else window.history.replaceState({ ...state, fiqrIndex: ++navHistory.index }, '')
}

/** Back to where the user came from; a screen opened directly (deep link, reload) goes to `fallback` instead. */
export function goBack(router: { back: () => void; push: (href: string) => void }, fallback: string): void {
  if (typeof window !== 'undefined' && window.history.length > 1) router.back()
  else router.push(fallback)
}
