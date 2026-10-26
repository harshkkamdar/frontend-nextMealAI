/**
 * redesign-mock-api.mjs - a local stand-in for the core API so device captures need no test account
 * and never touch the production database.
 * Usage: node scripts/redesign-mock-api.mjs [port]   (default 4011)
 * Run the app against it: NEXT_PUBLIC_CORE_API_URL=http://localhost:4011 npx next dev -p 3021
 * Switch scenario: curl -X POST localhost:4011/__scenario -d '{"done":["personal"],"consent":false,"plans":"full"}'
 * Slice 2 Home: -d '{"home":"returning"}' (or "first-run", "due"); fixtures copied from redesign-capture.mjs.
 */
import http from 'node:http'
import { pathToFileURL } from 'node:url'

const port = Number(process.argv[2] || 4011)
let scenario = { done: [], consent: true, plans: 'full', fail: null }

const PLANS = [
  { id: 'meal-1', type: 'meal', is_active: true, name: 'Lean and steady', content: { daily_targets: { calories: 1950, protein: 140, carbs: 190, fat: 65 }, days: [] } },
  { id: 'work-1', type: 'workout', is_active: true, name: 'Four-day upper lower', content: { days: [{ name: 'Upper A', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower A', exercises: [1, 2, 3, 4] }, { name: 'Upper B', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower B', exercises: [1, 2, 3, 4] }] } },
]

// Slice 2 fixtures (same data as redesign-capture.mjs homeApi / FIRST_RUN_API), built per request so dates stay "today".
const DAY_MS = 86400000
const isoDay = (offset) => new Date(Date.now() - offset * DAY_MS).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
const lg = (type, offset, payload, hour = 8) => ({ id: `${type}-${offset}-${hour}`, user_id: 'capture-user', type, payload, source: 'manual', local_date: isoDay(offset), created_at: `${isoDay(offset)}T0${hour % 10}:00:00.000Z`, updated_at: `${isoDay(offset)}T0${hour % 10}:00:00.000Z` })
export function homeApi(kind) {
  const logs = [
    lg('food', 0, { food_name: 'Greek yoghurt and berries', meal_type: 'breakfast', calories: 310, est_macros: { calories: 310, protein: 24 } }, 1),
    lg('food', 0, { food_name: 'Oat flat white', meal_type: 'breakfast', calories: 140, est_macros: { calories: 140 } }, 2),
    lg('food', 0, { food_name: 'Chicken burrito bowl', meal_type: 'lunch', calories: 640, est_macros: { calories: 640 } }, 3),
    lg('water', 0, { glasses: 3 }, 4), lg('water', 0, { glasses: 2 }, 5),
    lg('steps', 0, { steps: 8214 }, 6),
    lg('sleep', 0, { hours: 7.2, quality_rating: 7 }, 7),
    ...[1, 2, 3, 4, 5, 6].map((o) => lg('sleep', o, { hours: [6.5, 7.8, 5.9, 7.1, 8.2, 6.8][o - 1] })),
    ...[0, 2, 4, 7].map((o, i) => lg('weight', o, { weight_kg: [78.2, 78.5, 78.6, 79.0][i] }, 9)),
  ]
  const profile = { id: 'capture-user', full_name: 'Sam Rivera', ai_consent_at: '2026-10-24T00:00:00Z', health_disclaimer_ack_at: '2026-10-24T00:00:00Z', current_weight_kg: 78.2, daily_calorie_target: 1950, daily_protein_g: 140, daily_carbs_g: 190, daily_fat_g: 65, daily_targets_missing_fields: [] }
  const status = (state) => ({ state, week: { start: isoDay(6), end: isoDay(0), label: 'Week 3 · 20 to 26 Oct', number: 3 }, days_logged: state === 'insufficient' ? 2 : 6, days_needed: 4, next_check_in_date: isoDay(-3), days_to_go: 3, weight: { current_kg: 78.2, delta_week_kg: -0.8, points: [] }, week_so_far: { avg_calories: 1880, avg_protein_g: 121, sessions_done: 2, sessions_planned: 4, sleep_avg_h: 7.1, sleep_nights: 6 }, targets: { calories: 1950, protein_g: 140 }, verdict: null, proposal: null })
  const api = {
    '/v1/logs/summary': { period: 'day', summary: { total_logs: 9, avg_daily_calories: 1090, avg_daily_protein: 62, workout_count: 0, avg_sleep_hours: 7.2, avg_energy_rating: 0 }, daily_breakdown: [{ date: isoDay(0), calories: 1090, protein: 62, carbs: 118, fat: 41 }] },
    '/v1/logs': { logs },
    '/v1/dashboard/check-in': { check_in: { days: [], takeaway: 'Protein is 78 g short today. Greek yoghurt now or chicken at dinner closes it.', generated_at: new Date().toISOString(), v: 2 } },
    '/v1/check-in/status': status(kind === 'due' ? 'due' : 'mid_week'),
    '/v1/suggestions': [],
    '/v1/profile': profile,
  }
  if (kind === 'first-run') Object.assign(api, {
    '/v1/logs/summary': { period: 'day', summary: { total_logs: 0 }, daily_breakdown: [] },
    '/v1/logs': { logs: [] },
    '/v1/dashboard/check-in': { check_in: null },
    '/v1/check-in/status': status('insufficient'),
    '/v1/profile': { ...profile, current_weight_kg: null },
    plans: [],
  })
  return api
}

function send(res, status, body, origin) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': origin || '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': '*',
  })
  res.end(JSON.stringify(body))
}

// Imported by redesign-device-mock.mjs for homeApi; only listen when run directly.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) http.createServer((req, res) => {
  const origin = req.headers.origin
  const p = new URL(req.url, 'http://x').pathname
  if (req.method === 'OPTIONS') return send(res, 204, {}, origin)
  let raw = ''
  req.on('data', (c) => { raw += c })
  req.on('end', () => {
    if (p === '/__scenario') {
      scenario = { ...scenario, ...JSON.parse(raw || '{}') }
      return send(res, 200, scenario, origin)
    }
    if (scenario.fail && p.startsWith(scenario.fail)) return send(res, 500, { error: true, code: 'INTERNAL', message: "We couldn't save that. Check your connection and try again." }, origin)
    if (p === '/auth/login' || p === '/auth/refresh') return send(res, 200, { user: { id: 'capture-user', email: 'capture@example.com' }, session: { access_token: 'capture-token', refresh_token: 'capture-refresh' } }, origin)
    if (scenario.home && p !== '/v1/profile/onboarding') {
      const api = homeApi(scenario.home)
      // Same longest-prefix match as redesign-capture.mjs mockApi; /v1/logs must not swallow /v1/logs/summary.
      const key = Object.keys(api).filter((k) => k.startsWith('/') && (p === k || p.startsWith(k + '/'))).sort((a, b) => b.length - a.length)[0]
      if (key) return send(res, 200, api[key], origin)
      if (p.startsWith('/v1/plans') && api.plans) return send(res, 200, api.plans, origin)
    }
    if (p === '/v1/profile/onboarding') return send(res, 200, Object.fromEntries(['personal', 'fitness', 'nutrition'].map((m) => [m, { complete: scenario.done.includes(m) }])), origin)
    if (p === '/v1/profile') return send(res, 200, { id: 'capture-user', name: 'Sam', ai_consent_at: scenario.consent ? '2026-10-24T00:00:00Z' : null, health_disclaimer_ack_at: scenario.consent ? '2026-10-24T00:00:00Z' : null }, origin)
    if (p.startsWith('/v1/plans/generate')) return setTimeout(() => send(res, 200, { success: true, plans: PLANS }, origin), scenario.plans === 'slow' ? 60000 : 400)
    if (p.startsWith('/v1/plans')) return send(res, 200, scenario.plans === 'none' ? [] : PLANS, origin)
    return send(res, 200, {}, origin)
  })
}).listen(port, () => console.log(`mock API on :${port}`))
