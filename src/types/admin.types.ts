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
  /**
   * FB-R6-S2-v2.5 — BE enriches each row with email + display_name from
   * auth.users so the FE table can identify rows by something a human reads.
   * Email may be '' if the auth.users lookup didn't find the id (rare); FE
   * falls back to a truncated UUID in that case.
   */
  email: string
  display_name: string | null
  last_active: string // YYYY-MM-DD
  food_log_count: number
  workout_session_count: number
  chat_turn_count: number
}

// FB-R6-S2-v2.5 — per-user drilldown response shape.
// Mirrors the BE controller at
// nextmealai/packages/core/src/controllers/admin-user-summary.controller.ts.
export interface AdminUserSummary {
  user: {
    id: string
    email: string
    display_name: string | null
    created_at: string
    last_active: string | null
    timezone: string | null
  }
  profile: {
    dob: string | null
    sex: string | null
    height_cm: number | null
    current_weight_kg: number | null
    target_weight_kg: number | null
    primary_goal: string | null
    activity_level: string | null
    experience_level: string | null
    equipment: string[] | null
    injuries: string[] | null
    dietary_style: string | null
    allergies: string[] | null
    meals_per_day: number | null
    workout_frequency: number | null
    body_fat_pct: number | null
  } | null
  onboarding: {
    personal: boolean
    fitness: boolean
    nutrition: boolean
  }
  targets: {
    calories: number | null
    protein_g: number | null
    carbs_g: number | null
    fat_g: number | null
  } | null
  active_meal_plan: {
    id: string
    name: string | null
    daily_targets: {
      calories: number | null
      protein_g: number | null
      carbs_g: number | null
      fat_g: number | null
    } | null
    days_count: number
    start_date: string | null
  } | null
  active_workout_plan: {
    id: string
    name: string | null
    days_count: number
    current_position: number
    start_date: string | null
  } | null
  in_progress_workout: {
    id: string
    plan_day_index: number | null
    day_name: string | null
    started_at: string
    total_volume_kg: number | null
    exercises_completed: number
    exercises_total: number
  } | null
  recent_logs_7d: Array<{
    id: string
    type: string
    local_date: string | null
    created_at: string
    payload: Record<string, unknown>
  }>
  recent_workout_sessions_7d: Array<{
    id: string
    plan_day_index: number | null
    day_name: string | null
    status: string
    started_at: string
    completed_at: string | null
    duration_minutes: number | null
    total_volume_kg: number | null
    exercises_completed: number
    exercises_total: number
  }>
  recent_chat_7d: Array<{
    id: string
    session_id: string | null
    role: string
    content: string
    created_at: string
    tool_names: string[]
    tokens_used: number | null
  }>
  recent_attachments_7d: Array<{
    id: string
    signed_url: string | null
    mime_type: string
    width: number | null
    height: number | null
    created_at: string
  }>
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
