/**
 * FB-R6-S2-v2 — Test fixture mirroring the STUB constant from
 * backend-nextMealAI/docs/spec/fb-r6-s2v2-admin-dashboard-contract.md § 2.
 *
 * Keep this in lock-step with the BE STUB. Tests assert against these exact
 * values; live UAT against the BE stub endpoint must return the same shape.
 */

import type { AdminMetricsResponse } from '@/types/admin.types'

export const ADMIN_METRICS_STUB: AdminMetricsResponse = {
  generated_at: '2026-05-21T20:35:00.000Z',
  summary: { users_total: 47, dau_today: 12, wau_this_week: 28, new_signups_7d: 5 },
  dau: [
    { day: '2026-05-15', active_users: 10 },
    { day: '2026-05-16', active_users: 11 },
    { day: '2026-05-17', active_users: 9 },
    { day: '2026-05-18', active_users: 14 },
    { day: '2026-05-19', active_users: 13 },
    { day: '2026-05-20', active_users: 15 },
    { day: '2026-05-21', active_users: 12 },
  ],
  signups: [
    { day: '2026-05-15', signups: 1 },
    { day: '2026-05-16', signups: 0 },
    { day: '2026-05-17', signups: 2 },
    { day: '2026-05-18', signups: 1 },
    { day: '2026-05-19', signups: 0 },
    { day: '2026-05-20', signups: 1 },
    { day: '2026-05-21', signups: 0 },
  ],
  tool_calls_7d: [
    { tool_name: 'create_log', call_count: 84 },
    { tool_name: 'get_today_summary', call_count: 52 },
    { tool_name: 'analyze_image', call_count: 31 },
    { tool_name: 'search_foods', call_count: 28 },
    { tool_name: 'create_plan', call_count: 14 },
  ],
  active_users_30d: [
    {
      user_id: 'stub-user-1',
      last_active: '2026-05-21',
      food_log_count: 42,
      workout_session_count: 8,
      chat_turn_count: 67,
    },
    {
      user_id: 'stub-user-2',
      last_active: '2026-05-21',
      food_log_count: 28,
      workout_session_count: 12,
      chat_turn_count: 41,
    },
    {
      user_id: 'stub-user-3',
      last_active: '2026-05-20',
      food_log_count: 19,
      workout_session_count: 3,
      chat_turn_count: 22,
    },
  ],
}
