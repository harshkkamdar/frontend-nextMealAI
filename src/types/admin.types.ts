/**
 * FB-R6-S2-v2 · Admin dashboard types.
 *
 * Mirrors the BE spec at:
 * backend-nextMealAI/docs/spec/fb-r6-s2v2-admin-dashboard-contract.md § 2.
 *
 * Keep in lock-step with the spec. Contract changes go through Ved →
 * spec file update → both sides re-aligned.
 */

export interface AdminMetricsSummary {
  users_total: number
  dau_today: number
  wau_this_week: number
  new_signups_7d: number
}

export interface DauPoint {
  day: string // YYYY-MM-DD
  active_users: number
}

export interface SignupPoint {
  day: string // YYYY-MM-DD
  signups: number
}

export interface ToolCallEntry {
  tool_name: string
  call_count: number
}

export interface ActiveUserEntry {
  user_id: string
  last_active: string // YYYY-MM-DD
  food_log_count: number
  workout_session_count: number
  chat_turn_count: number
}

export interface AdminMetricsResponse {
  generated_at: string // ISO 8601
  /**
   * BE-side additive flag (2026-05-21). `true` when the response is the
   * deterministic stub from spec § 2; `false` when from the real view
   * query. FE renders a "STUB DATA" banner when this is true so operators
   * never get fooled by the fake numbers.
   * Optional for backwards-compat with older BE versions that didn't set it.
   */
  is_stub?: boolean
  summary: AdminMetricsSummary
  dau: DauPoint[]
  signups: SignupPoint[]
  tool_calls_7d: ToolCallEntry[]
  active_users_30d: ActiveUserEntry[]
}
