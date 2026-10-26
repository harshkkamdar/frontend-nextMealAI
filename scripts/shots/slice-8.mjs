/**
 * Slice 8 (weekly check-in) captures. Loaded by scripts/redesign-capture.mjs and scripts/redesign-transitions.mjs.
 * Shots: route interception on the dev server (:3020), fixtures below.
 * Transitions need a dev server whose API is this file's fixture API (the shared mock has no proposal or trend):
 *   node scripts/shots/slice-8.mjs 4018
 *   NEXT_PUBLIC_CORE_API_URL=http://localhost:4018 npx next dev -p 3028   (in a worktree of the slice commit)
 *   BASE_URL=http://localhost:3028 API_URL=http://localhost:4018 node scripts/redesign-transitions.mjs slice-8
 */
import http from 'node:http'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const DAY_MS = 86400000
const isoDay = (offset) => new Date(Date.now() - offset * DAY_MS).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
const lg = (type, offset, payload, hour = 8) => ({ id: `${type}-${offset}-${hour}`, user_id: 'capture-user', type, payload, source: 'manual', local_date: isoDay(offset), created_at: `${isoDay(offset)}T0${hour % 10}:00:00.000Z`, updated_at: `${isoDay(offset)}T0${hour % 10}:00:00.000Z` })

const PROFILE = { id: 'capture-user', full_name: 'Sam Rivera', ai_consent_at: '2026-10-24T00:00:00Z', health_disclaimer_ack_at: '2026-10-24T00:00:00Z', current_weight_kg: 78.2, daily_calorie_target: 1950, daily_protein_g: 140, daily_carbs_g: 190, daily_fat_g: 65, daily_targets_missing_fields: [] }
const PLANS = [
  { id: 'meal-1', type: 'meal', is_active: true, name: 'Lean and steady', content: { daily_targets: { calories: 1950, protein: 140, carbs: 190, fat: 65 }, days: [] } },
  { id: 'work-1', type: 'workout', is_active: true, name: 'Four-day upper lower', content: { days: [{ name: 'Upper A', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower A', exercises: [1, 2, 3, 4] }, { name: 'Upper B', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower B', exercises: [1, 2, 3, 4] }] } },
]
const LOGS = [
  lg('food', 0, { food_name: 'Greek yoghurt and berries', meal_type: 'breakfast', calories: 310, protein_g: 24 }, 1),
  lg('food', 0, { food_name: 'Chicken burrito bowl', meal_type: 'lunch', calories: 640 }, 3),
  lg('water', 0, { glasses: 5 }, 4),
  lg('steps', 0, { steps: 8214 }, 6),
  lg('sleep', 0, { hours: 7.2, quality_rating: 7 }, 7),
  ...[0, 2, 4, 7].map((o, i) => lg('weight', o, { weight_kg: [78.2, 78.5, 78.6, 79.0][i] }, 9)),
]
const weeks = (kgs) => kgs.map((kg, i) => ({ week_end: isoDay((kgs.length - 1 - i) * 7), kg }))

const BASE_STATUS = {
  week: { start: isoDay(6), end: isoDay(0), label: '20 – 26 Oct', number: 3 },
  days_logged: 6,
  days_needed: 4,
  next_check_in_date: isoDay(-7),
  days_to_go: 0,
  weight: { current_kg: 78.2, delta_week_kg: -0.8, points: weeks([79.6, 79.4, 79.5, 79.0, 78.9, 78.2]) },
  week_so_far: { avg_calories: 1880, avg_protein_g: 121, sessions_done: 3, sessions_planned: 4, sleep_avg_h: 7.1, sleep_nights: 6 },
  targets: { calories: 1950, protein_g: 140 },
}
export const STATUS = {
  due: { ...BASE_STATUS, state: 'due', verdict: "You lost 0.8 kg and trained three times. That's a little faster than we planned, so I'm adding some food back.", proposal: { new_calories: 2050, new_protein_g: 150, calorie_change_pct: 5, direction: 'up' } },
  hold: { ...BASE_STATUS, state: 'due', weight: { ...BASE_STATUS.weight, delta_week_kg: -0.4 }, verdict: 'Down 0.4 kg, right on pace. Your targets stay as they are.', proposal: { new_calories: 1950, new_protein_g: 140, calorie_change_pct: 0, direction: 'hold' } },
  dueNoTrend: { ...BASE_STATUS, state: 'due', weight: { current_kg: null, delta_week_kg: null, points: [] }, week_so_far: { ...BASE_STATUS.week_so_far, sleep_avg_h: null, sleep_nights: 0 }, verdict: "You ate close to target all week and trained three times. Log a weigh-in and I can tell you whether it's working.", proposal: { new_calories: 1950, new_protein_g: 150, calorie_change_pct: 0, direction: 'up' } },
  long: { ...BASE_STATUS, state: 'due', week: { ...BASE_STATUS.week, label: '28 Sep – 4 Oct', number: 52 }, weight: { current_kg: 112.4, delta_week_kg: -2.6, points: weeks([121.8, 119.9, 118.0, 116.2, 115.0, 112.4]) }, week_so_far: { avg_calories: 12480, avg_protein_g: 1238, sessions_done: 14, sessions_planned: 14, sleep_avg_h: 10.4, sleep_nights: 7 }, targets: { calories: 12950, protein_g: 1240 }, verdict: 'You dropped 2.6 kg in a week while training every day, which is faster than is safe to keep up. I am raising your calories so you keep the muscle you are building, and protein stays high to protect recovery.', proposal: { new_calories: 13450, new_protein_g: 1240, calorie_change_pct: 4, direction: 'up' } },
  mid: { ...BASE_STATUS, state: 'mid_week', week: { start: isoDay(3), end: isoDay(-3), label: '27 Oct – 2 Nov', number: 4 }, days_logged: 3, days_to_go: 3, next_check_in_date: isoDay(-3), verdict: null, proposal: null },
  midBehind: { ...BASE_STATUS, state: 'mid_week', week: { start: isoDay(4), end: isoDay(-2), label: '27 Oct – 2 Nov', number: 4 }, days_logged: 1, days_to_go: 2, next_check_in_date: isoDay(-2), weight: { current_kg: 78.2, delta_week_kg: null, points: [] }, week_so_far: { avg_calories: null, avg_protein_g: null, sessions_done: 0, sessions_planned: 4, sleep_avg_h: null, sleep_nights: 0 }, verdict: null, proposal: null },
  insufficient: { ...BASE_STATUS, state: 'insufficient', days_logged: 2, weight: { ...BASE_STATUS.weight, delta_week_kg: -0.3 }, week_so_far: { ...BASE_STATUS.week_so_far, sessions_done: 2, sleep_avg_h: 6.8, sleep_nights: 4 }, verdict: "Two days logged isn't enough to tell whether your targets are right, so I'm leaving them alone.", proposal: null },
  firstWeek: { ...BASE_STATUS, state: 'insufficient', week: { ...BASE_STATUS.week, number: 1 }, days_logged: 0, weight: { current_kg: null, delta_week_kg: null, points: [] }, week_so_far: { avg_calories: null, avg_protein_g: null, sessions_done: 0, sessions_planned: 4, sleep_avg_h: null, sleep_nights: 0 }, verdict: 'Nothing logged yet this week, so there is nothing for me to adjust. Log a few days and I will have a real answer next week.', proposal: null },
}

export const api = (status, over = {}) => ({
  '/v1/logs/summary': { period: 'day', summary: { total_logs: 9 }, daily_breakdown: [{ date: isoDay(0), calories: 1090, protein: 62, carbs: 118, fat: 41 }] },
  '/v1/logs': { logs: LOGS },
  '/v1/dashboard/check-in': { check_in: { days: [], takeaway: 'Protein is 78 g short today. Greek yoghurt now or chicken at dinner closes it.', generated_at: new Date().toISOString(), v: 2 } },
  '/v1/check-in/status': status,
  '/v1/check-in': { applied: true },
  '/v1/suggestions': [],
  '/v1/profile': PROFILE,
  plans: PLANS,
  ...over,
})

const cors = (origin) => ({ 'access-control-allow-origin': origin || '*', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' })
/** Apply in a shot: hold the POST open (saving) or fail it; later routes win over the capture script's mock. */
const onApply = (p, how) => p.route((url) => url.pathname === '/v1/check-in', (route) => {
  if (route.request().method() !== 'POST') return route.fallback()
  if (how === 'hang') return new Promise(() => {})
  return route.fulfill({ status: 500, headers: { ...cors(route.request().headers().origin), 'content-type': 'application/json' }, body: JSON.stringify({ error: true, code: 'INTERNAL', message: 'Server error' }) })
})
const apply = async (p, name = 'Apply new targets') => { await p.getByRole('button', { name }).click(); await p.waitForTimeout(900) }
const toEnd = async (p) => { await p.mouse.wheel(0, 2000); await p.waitForTimeout(700) }

const shots = [
  { name: 'due', url: '/check-in', api: api(STATUS.due) },
  { name: 'due-end', url: '/check-in', api: api(STATUS.due), act: toEnd },
  { name: 'due-saving', url: '/check-in', api: api(STATUS.due), act: async (p) => { await onApply(p, 'hang'); await apply(p) } },
  { name: 'due-applied', url: '/check-in', api: api(STATUS.due), act: (p) => apply(p) },
  { name: 'due-apply-error', url: '/check-in', api: api(STATUS.due), act: async (p) => { await onApply(p, 'fail'); await apply(p) } },
  { name: 'due-hold-end', url: '/check-in', api: api(STATUS.hold), act: toEnd },
  { name: 'due-no-trend', url: '/check-in', api: api(STATUS.dueNoTrend) },
  { name: 'due-long', url: '/check-in', api: api(STATUS.long) },
  { name: 'due-long-end', url: '/check-in', api: api(STATUS.long), act: toEnd },
  { name: 'mid-week', url: '/check-in', api: api(STATUS.mid) },
  { name: 'mid-week-end', url: '/check-in', api: api(STATUS.mid), act: toEnd },
  { name: 'mid-week-behind', url: '/check-in', api: api(STATUS.midBehind) },
  { name: 'insufficient', url: '/check-in', api: api(STATUS.insufficient) },
  { name: 'insufficient-end', url: '/check-in', api: api(STATUS.insufficient), act: toEnd },
  { name: 'first-week', url: '/check-in', api: api(STATUS.firstWeek) },
  { name: 'loading', url: '/check-in', api: api(STATUS.due), hang: ['/v1/check-in'] },
  { name: 'error', url: '/check-in', api: api(STATUS.due), fail: ['/v1/check-in'] },
  { name: 'offline', url: '/check-in', api: api(STATUS.due), offline: true },
  { name: 'ask-geo', url: '/check-in', api: api(STATUS.due), act: async (p) => { await toEnd(p); await p.getByRole('button', { name: 'Ask Geo about this' }).click(); await p.waitForTimeout(900) } },
]

// Transitions run against the fixture API below (`home` names the scenario), so nothing is stubbed in the page.
const wheel = async (p, px) => { await p.mouse.move(195, 420); for (let i = 0; i < px / 20; i++) { await p.mouse.wheel(0, 20); await p.waitForTimeout(16) } }
const transitions = [
  // Home's "Your week is ready" card pushes the check-in: page spring from 40 px right, headline counts, trend draws.
  { name: 'home-card-to-checkin', url: '/dashboard', home: 'due', act: (p) => p.getByRole('button', { name: 'See your week' }).click() },
  // Home's "This week" button when nothing is due: the mid-week screen and its muted trend draw.
  { name: 'this-week-to-checkin', url: '/dashboard', home: 'mid', act: (p) => p.getByRole('button', { name: 'This week' }).click() },
  // Apply: saving label, then the old values and arrows fade, the heading and button crossfade in place.
  { name: 'apply', url: '/check-in', home: 'due', act: async (p) => { await wheel(p, 900); await p.waitForTimeout(500); await p.getByRole('button', { name: 'Apply new targets' }).click() } },
]

const slice8 = { shots, transitions }
export default slice8

/** Fixture API for transitions: `node scripts/shots/slice-8.mjs [port]`. POST /__scenario {"home":"due"|"mid"}. */
function serve(port) {
  let scenario = 'due'
  let applied = false
  http.createServer((req, res) => {
    const send = (r, status, body) => { r.writeHead(status, { ...cors(req.headers.origin), 'content-type': 'application/json' }); r.end(JSON.stringify(body)) }
    const p = new URL(req.url, 'http://x').pathname
    if (req.method === 'OPTIONS') return send(res, 204, {})
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => {
      if (p === '/__scenario') { scenario = JSON.parse(raw || '{}').home ?? 'due'; applied = false; return send(res, 200, { scenario }) }
      if (p === '/auth/login' || p === '/auth/refresh') return send(res, 200, { user: { id: 'capture-user', email: 'capture@example.com' }, session: { access_token: 'capture-token', refresh_token: 'capture-refresh' } })
      if (p === '/v1/profile/onboarding') return send(res, 200, { personal: { complete: true }, fitness: { complete: true }, nutrition: { complete: true } })
      // Apply answers after 500 ms so the saving state is visible; the next read is the new week.
      if (p === '/v1/check-in' && req.method === 'POST') return setTimeout(() => { applied = true; send(res, 200, { applied: true }) }, 500)
      const table = api(applied ? STATUS.mid : STATUS[scenario] ?? STATUS.due)
      const key = Object.keys(table).filter((k) => k.startsWith('/') && (p === k || p.startsWith(k + '/'))).sort((a, b) => b.length - a.length)[0]
      if (key) return send(res, 200, table[key])
      if (p.startsWith('/v1/plans')) return send(res, 200, PLANS)
      return send(res, 200, {})
    })
  }).listen(port, () => console.log(`slice-8 fixture API on :${port}`))
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) serve(Number(process.argv[2] || 4018))
