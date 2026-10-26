/**
 * Slice 6 (Train + live workout session) shots and transitions, loaded by redesign-capture.mjs and
 * redesign-transitions.mjs. Every request goes to route-intercepted fixtures; nothing reaches the real API.
 * The clock is fixed to Thursday 29 Oct 2026, 10:00 Sydney, so the week strip and volume chart have a
 * Monday-to-Wednesday history whatever day the capture runs.
 */
import { chromium } from 'playwright'

const NOW = '2026-10-29T10:00:00+11:00'
const at = (iso) => new Date(iso).toISOString()
const minsAgo = (m) => new Date(new Date(NOW).getTime() - m * 60000).toISOString()

const ex = (name, sets = 3, reps = 10, rest = 90) => ({ name, sets, reps, rest_seconds: rest })
const PLAN_DAYS = [
  { date: '', name: 'Upper A', exercises: [ex('Barbell bench press', 4, 8, 120), ex('Bent-over barbell row', 4, 8, 120), ex('Overhead press'), ex('Lat pulldown'), ex('Triceps rope pushdown', 3, 12, 60)] },
  { date: '', name: 'Lower A', exercises: [ex('Back squat', 4, 6, 150), ex('Romanian deadlift', 3, 8, 120), ex('Walking lunge'), ex('Standing calf raise', 3, 15, 60)] },
  { date: '', name: 'Rest', is_rest_day: true, exercises: [] },
  { date: '', name: 'Upper B', exercises: [ex('Incline dumbbell bench press'), ex('Seated cable row'), ex('Overhead press'), ex('Lateral raise', 3, 15, 60), ex('Triceps rope pushdown', 3, 12, 60)] },
  { date: '', name: 'Lower B', exercises: [ex('Deadlift', 3, 5, 180), ex('Leg press'), ex('Hip thrust'), ex('Hanging leg raise', 3, 12, 60)] },
]
const plan = (position, days = PLAN_DAYS, name = 'Four-day upper lower') => ({ id: 'work-1', user_id: 'capture-user', type: 'workout', status: 'active', is_active: true, current_position: position, content: { name, days }, created_at: at('2026-10-05T00:00:00Z'), updated_at: at('2026-10-05T00:00:00Z') })

const doneSet = (n, kg, reps) => ({ set_number: n, planned_reps: reps, planned_weight_kg: kg, actual_reps: reps, actual_weight_kg: kg, completed: true, completed_at: minsAgo(30), previous_reps: reps, previous_weight_kg: kg - 2.5 })
const openSet = (n, kg, reps) => ({ set_number: n, planned_reps: reps, planned_weight_kg: kg, actual_reps: null, actual_weight_kg: null, completed: false, completed_at: null, previous_reps: reps, previous_weight_kg: kg })
const sx = (name, group, kg, reps, rest, done, total = 3) => ({
  name, muscle_group: group, planned_sets: total, planned_reps: reps, rest_seconds: rest, notes: null,
  instructions: ['Set the bench to about 30 degrees.', 'Lower with control to the upper chest.', 'Press up and slightly back.'],
  status: done === total ? 'completed' : done ? 'in_progress' : 'pending',
  sets: Array.from({ length: total }, (_, i) => (i < done ? doneSet(i + 1, kg, reps) : openSet(i + 1, kg, reps))),
})
const UPPER_B = (done) => [
  sx('Incline dumbbell bench press', 'chest', 26, 10, 90, done[0]),
  sx('Seated cable row', 'lats', 55, 10, 90, done[1]),
  sx('Overhead press', null, 40, 8, 90, done[2]),
  sx('Lateral raise', 'shoulders', 8, 15, 60, done[3]),
  sx('Triceps rope pushdown', 'triceps', 25, 12, 60, done[4]),
]
const live = (exercises, extra = {}) => ({ id: 'sess-1', user_id: 'capture-user', plan_id: 'work-1', plan_day_index: 3, day_name: 'Upper B', status: 'in_progress', started_at: minsAgo(23), completed_at: null, exercises, total_volume_kg: null, duration_minutes: null, notes: null, created_at: minsAgo(23), ...extra })

const past = (id, day, iso, kg, mins, exercises = UPPER_B([3, 3, 3, 3, 3])) => ({ id, user_id: 'capture-user', plan_id: 'work-1', plan_day_index: 0, day_name: day, status: 'completed', started_at: at(iso), completed_at: at(iso), exercises, total_volume_kg: kg, duration_minutes: mins, notes: null, created_at: at(iso) })
const HISTORY = [
  past('h1', 'Upper A', '2026-10-26T08:10:00+11:00', 4820, 52),
  past('h2', 'Lower A', '2026-10-27T18:40:00+11:00', 6140, 61),
  past('h3', 'Lower B', '2026-10-23T07:30:00+11:00', 5310, 48),
  past('h4', 'Upper B', '2026-10-21T18:05:00+11:00', 3980, 44),
  past('h5', 'Lower A', '2026-10-20T07:45:00+11:00', 5870, 57),
]
const LONG_DAY = 'Upper body strength and hypertrophy with paused presses'
const LONG_EX = 'Single-arm half-kneeling landmine press with a two-second pause at the top'

const trainApi = (over = {}) => ({
  plans: [plan(3)],
  '/v1/workout-sessions/in-progress': { session: null },
  '/v1/workout-sessions/history': { sessions: HISTORY },
  ...over,
})
const sessionApi = (session, over = {}) => ({
  '/v1/workout-sessions': session,
  '/v1/workout-sessions/sess-1/complete': { ...session, status: 'completed', completed_at: NOW, duration_minutes: 47, total_volume_kg: 5240, exercises: session.exercises.map((e) => ({ ...e, status: 'completed' })) },
  ...over,
})

// Clock moved to NOW (it keeps running), then reload so the app reads it from its first render.
const fixClock = async (p) => { await p.clock.install({ time: NOW }); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(1000) }
const current = (p) => p.locator('article[aria-current="step"]')

const T = '/train'
const S = '/train/session?id=sess-1'
const MID = UPPER_B([3, 2, 0, 0, 0])
const shots = [
  { name: 'train', url: T, api: trainApi(), act: fixClock },
  { name: 'train-scrolled', url: T, api: trainApi(), act: async (p) => { await fixClock(p); await p.mouse.wheel(0, 700); await p.waitForTimeout(700) } },
  { name: 'train-bottom', url: T, api: trainApi(), act: async (p) => { await fixClock(p); await p.mouse.wheel(0, 4000); await p.waitForTimeout(800) } },
  { name: 'train-day-open', url: T, api: trainApi(), act: async (p) => { await fixClock(p); await p.evaluate(() => { const row = document.querySelectorAll('[data-testid=activity-program-overview] button')[3]; row.click(); row.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90) }); await p.waitForTimeout(800) } },
  { name: 'train-rest-day', url: T, api: trainApi({ plans: [plan(2)] }), act: fixClock },
  { name: 'train-resume', url: T, api: trainApi({ '/v1/workout-sessions/in-progress': { session: live(MID) } }), act: fixClock },
  { name: 'train-no-program', url: T, api: trainApi({ plans: [] }), act: fixClock },
  { name: 'train-first-run', url: T, api: trainApi({ plans: [], '/v1/workout-sessions/history': { sessions: [] } }), act: fixClock },
  { name: 'train-long', url: T, api: trainApi({ plans: [plan(3, PLAN_DAYS.map((d, i) => (i === 3 ? { ...d, name: LONG_DAY, exercises: [ex(LONG_EX), ...d.exercises] } : d)), 'Twelve-week strength block for intermediate lifters')], '/v1/workout-sessions/history': { sessions: [past('hl', LONG_DAY, '2026-10-27T18:40:00+11:00', 12480, 96), ...HISTORY] } }), act: fixClock },
  { name: 'train-loading', url: T, api: trainApi(), hang: ['/v1/plans', '/v1/workout-sessions'] },
  { name: 'train-error', url: T, api: trainApi(), fail: ['/v1/plans', '/v1/workout-sessions'] },
  { name: 'train-offline', url: T, api: trainApi(), act: fixClock, offline: true },
  { name: 'train-calendar', url: T, api: trainApi(), act: async (p) => { await fixClock(p); await p.getByRole('button', { name: /^Tuesday 27 October/ }).click(); await p.waitForTimeout(900) } },

  { name: 'session-first-set', url: S, api: sessionApi(live(UPPER_B([0, 0, 0, 0, 0]), { started_at: minsAgo(1) })), act: fixClock },
  { name: 'session-mid', url: S, api: sessionApi(live(MID)), act: fixClock },
  { name: 'session-mid-scrolled', url: S, api: sessionApi(live(MID)), act: async (p) => { await fixClock(p); await p.mouse.wheel(0, 500); await p.waitForTimeout(700) } },
  { name: 'session-last-exercise', url: S, api: sessionApi(live(UPPER_B([3, 3, 3, 3, 1]))), act: fixClock },
  { name: 'session-rest', url: S, api: sessionApi(live(MID)), act: async (p) => { await fixClock(p); await current(p).getByRole('button', { name: 'Complete set 3' }).click(); await p.waitForTimeout(1600) } },
  { name: 'session-rest-minimised', url: S, api: sessionApi(live(MID)), act: async (p) => { await fixClock(p); await current(p).getByRole('button', { name: 'Complete set 3' }).click(); await p.waitForTimeout(600); await p.getByRole('button', { name: 'Minimise rest timer' }).click(); await p.waitForTimeout(1200) } },
  { name: 'session-active-row', url: S, api: sessionApi(live(MID)), act: async (p) => { await fixClock(p); await current(p).getByRole('button', { name: /^Set 3 .* reps, edit$/ }).click(); await p.waitForTimeout(600) } },
  { name: 'session-next', url: S, api: sessionApi(live(MID)), act: async (p) => { await fixClock(p); await p.getByRole('navigation', { name: 'Workout' }).getByRole('button', { name: /^Next/ }).click(); await p.waitForTimeout(900) } },
  { name: 'session-all-exercises', url: S, api: sessionApi(live(MID)), act: async (p) => { await fixClock(p); await p.getByRole('button', { name: /^Exercise 2 of 5/ }).click(); await p.waitForTimeout(900) } },
  { name: 'session-jump', url: S, api: sessionApi(live(MID)), act: async (p) => { await fixClock(p); await p.getByRole('button', { name: /^Exercise 2 of 5/ }).click(); await p.waitForTimeout(700); await p.getByRole('button', { name: /^Exercise 4: Lateral raise/ }).click(); await p.waitForTimeout(1200) } },
  { name: 'session-options', url: S, api: sessionApi(live(MID)), act: async (p) => { await fixClock(p); await p.getByRole('button', { name: 'Workout options' }).click(); await p.waitForTimeout(900) } },
  { name: 'session-exit-confirm', url: S, api: sessionApi(live(MID)), act: async (p) => { await fixClock(p); await p.getByRole('button', { name: 'Go back' }).click(); await p.waitForTimeout(900) } },
  { name: 'session-finished', url: S, api: sessionApi(live(UPPER_B([3, 3, 3, 3, 3]))), act: async (p) => { await fixClock(p); await p.getByRole('button', { name: 'Finish workout' }).click(); await p.waitForTimeout(1400) } },
  { name: 'session-history', url: '/train/session?id=h4', api: sessionApi(live(MID), { '/v1/workout-sessions': HISTORY[3] }), act: fixClock },
  { name: 'session-history-bottom', url: '/train/session?id=h4', api: sessionApi(live(MID), { '/v1/workout-sessions': HISTORY[3] }), act: async (p) => { await fixClock(p); await p.mouse.wheel(0, 2000); await p.waitForTimeout(700) } },
  { name: 'session-long', url: S, api: sessionApi(live([sx(LONG_EX, null, 22.5, 8, 90, 1), ...MID.slice(1)], { day_name: LONG_DAY })), act: fixClock },
  { name: 'session-loading', url: S, api: sessionApi(live(MID)), hang: ['/v1/workout-sessions'] },
  { name: 'session-error', url: S, api: sessionApi(live(MID)), fail: ['/v1/workout-sessions'] },
  { name: 'session-offline', url: S, api: sessionApi(live(MID)), act: fixClock, offline: true },
]

// ── Transitions ──
// redesign-transitions.mjs only stubs every API call with {} for non-home entries. When it runs this file, the
// page.route call it makes for the API is swapped for this file's fixtures (by transition order). The clock is
// left real here: a Playwright fake clock also drives performance.now and turns framer springs into jumps. The capture script is untouched by this.
const API = process.env.API_URL || 'http://localhost:4010'
const transitions = [
  { name: 'start-session', url: T, warm: S, api: { ...trainApi(), ...sessionApi(live(UPPER_B([0, 0, 0, 0, 0]), { started_at: NOW })) }, act: async (p) => { await p.getByTestId('activity-start-workout-button').click(); await p.waitForURL(/train\/session/, { timeout: 10000 }) } },
  { name: 'set-tick-rest', url: S, api: sessionApi(live(MID)), act: (p) => current(p).getByRole('button', { name: 'Complete set 3' }).click() },
  { name: 'rest-minimise', url: S, api: sessionApi(live(MID)), act: async (p) => { await current(p).getByRole('button', { name: 'Complete set 3' }).click(); await p.waitForTimeout(1500); await p.getByRole('button', { name: 'Minimise rest timer' }).click() } },
  { name: 'next-exercise', url: S, api: sessionApi(live(MID)), act: (p) => p.getByRole('navigation', { name: 'Workout' }).getByRole('button', { name: /^Next/ }).click() },
  { name: 'previous-exercise', url: S, api: sessionApi(live(MID)), act: (p) => p.getByRole('navigation', { name: 'Workout' }).getByRole('button', { name: /^Previous/ }).click() },
  { name: 'all-exercises-jump', url: S, api: sessionApi(live(MID)), act: async (p) => { await p.getByRole('button', { name: /^Exercise 2 of 5/ }).click(); await p.waitForTimeout(900); await p.getByRole('button', { name: /^Exercise 4: Lateral raise/ }).click() } },
  { name: 'finish', url: S, api: sessionApi(live(UPPER_B([3, 3, 3, 3, 3]))), act: (p) => p.getByRole('button', { name: 'Finish workout' }).click() },
  // Warmed so the route is compiled; the painted flag is then cleared so the first-paint entrance plays.
  { name: 'train-first-load', url: '/dashboard', warm: T, api: trainApi(), act: async (p) => { await p.evaluate(() => sessionStorage.removeItem('fiqr:painted:train')); await p.getByRole('link', { name: 'Train' }).click(); await p.waitForURL(/\/train\/?$/, { timeout: 10000 }) } },
]

function fixtureHandler(api) {
  const cors = { 'access-control-allow-origin': process.env.BASE_URL || 'http://localhost:3020', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
  const json = (route, body) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  return (route) => {
    const req = route.request()
    const p = new URL(req.url()).pathname
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    const key = Object.keys(api).filter((k) => k.startsWith('/') && (p === k || p.startsWith(k + '/'))).sort((a, b) => b.length - a.length)[0]
    if (key) return json(route, api[key])
    if (p.startsWith('/v1/plans') && api.plans) return json(route, api.plans)
    if (p === '/v1/profile/onboarding') return json(route, { personal: { complete: true }, fitness: { complete: true }, nutrition: { complete: true } })
    if (p === '/v1/profile') return json(route, { id: 'capture-user', name: 'Sam', ai_consent_at: '2026-10-24T00:00:00Z', health_disclaimer_ack_at: '2026-10-24T00:00:00Z' })
    return json(route, {})
  }
}

if (process.argv[1]?.endsWith('redesign-transitions.mjs')) {
  let index = 0
  const launch = chromium.launch.bind(chromium)
  chromium.launch = async (...args) => {
    const browser = await launch(...args)
    const newContext = browser.newContext.bind(browser)
    browser.newContext = async (...cargs) => {
      const t = transitions[index++]
      const context = await newContext(...cargs)
      const newPage = context.newPage.bind(context)
      context.newPage = async () => {
        const page = await newPage()
        const route = page.route.bind(page)
        page.route = (url, handler) => route(url, url === `${API}/**` && t?.api ? fixtureHandler(t.api) : handler)
        return page
      }
      return context
    }
    return browser
  }
}

const DONE = ['personal', 'fitness', 'nutrition']
const slice6 = { shots: shots.map((shot) => ({ done: DONE, ...shot })), transitions }
export default slice6
