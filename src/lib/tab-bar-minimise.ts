/**
 * Tab bar minimise-on-scroll state (iOS 26 `tabBarMinimizeBehavior(.onScrollDown)`, motion-feel.md 3j).
 * Pure so the thresholds are unit-tested; tab-bar.tsx feeds it rAF-throttled scroll positions.
 *
 * Hysteresis: the bar collapses only after the page has travelled COLLAPSE_DELTA px down from the lowest point
 * since it last expanded (and is past COLLAPSE_MIN_Y), and expands after EXPAND_DELTA px up from the deepest point
 * since it collapsed, or whenever the page is within TOP_Y of the top. Small back-and-forth never flips it.
 */
export const TOP_Y = 48
export const COLLAPSE_MIN_Y = 96
export const COLLAPSE_DELTA = 24
export const EXPAND_DELTA = 12

export interface MinimiseState {
  minimised: boolean
  /** Lowest y since expanding (while expanded) or highest y since collapsing (while minimised). */
  anchor: number
}

export type MinimiseEvent = { type: 'scroll'; y: number } | { type: 'tap'; y: number }

export const initialMinimise: MinimiseState = { minimised: false, anchor: 0 }

export function minimiseStep(state: MinimiseState, event: MinimiseEvent): MinimiseState {
  const { y } = event
  // Tapping the collapsed tab expands it; a fresh anchor means the next collapse needs a full COLLAPSE_DELTA again.
  if (event.type === 'tap' || y <= TOP_Y) return state.minimised || state.anchor !== y ? { minimised: false, anchor: y } : state
  if (state.minimised) {
    if (state.anchor - y >= EXPAND_DELTA) return { minimised: false, anchor: y }
    return y > state.anchor ? { minimised: true, anchor: y } : state
  }
  if (y >= COLLAPSE_MIN_Y && y - state.anchor >= COLLAPSE_DELTA) return { minimised: true, anchor: y }
  return y < state.anchor ? { minimised: false, anchor: y } : state
}
