#!/usr/bin/env node
/**
 * Live check against the real backend. Run before every fiqr-app deploy:
 *   LIVE_CHECK_EMAIL=... LIVE_CHECK_PASSWORD=... npm run live-check
 * Unit tests fake the backend; this signs in as the test account, reads what the main screens read, writes one food
 * log through the same calls the diary makes and deletes it again. It fails on any error status, on a field the
 * screens read that the backend doesn't send, and on numbers that can't be right (the bugs George found that tests
 * passed over). Optional: LIVE_CHECK_API (defaults to production), LIVE_CHECK_TZ.
 */
const API = (process.env.LIVE_CHECK_API ?? 'https://backend-nextmealai.vercel.app').replace(/\/$/, '')
const EMAIL = process.env.LIVE_CHECK_EMAIL
const PASSWORD = process.env.LIVE_CHECK_PASSWORD
const TZ = process.env.LIVE_CHECK_TZ ?? 'Australia/Sydney'
if (!EMAIL || !PASSWORD) {
  console.error('Set LIVE_CHECK_EMAIL and LIVE_CHECK_PASSWORD (the test account).')
  process.exit(2)
}

const failures = []
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `: ${detail}`}`)
  if (!ok) failures.push(name)
}

const login = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})
const session = await login.json().catch(() => ({}))
const token = session.access_token ?? session.session?.access_token
if (!token) {
  console.error(`FAIL  sign in: ${login.status}`)
  process.exit(1)
}

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json', 'X-Timezone': TZ },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = res.status === 204 ? null : await res.json().catch(() => null)
  return { status: res.status, json }
}

async function read(name, path, test) {
  const { status, json } = await call('GET', path)
  if (status !== 200) return check(name, false, `${path} answered ${status}`)
  const problem = test(json)
  check(name, !problem, problem || '')
  return json
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

await read('profile', '/v1/profile', (p) =>
  !p?.id ? 'no id' : !Array.isArray(p.allergies ?? []) ? 'allergies is not a list' : '')
await read('settings', '/v1/settings', (s) => (s && typeof s === 'object' ? '' : 'no settings object'))
await read('plans', '/v1/plans', (r) => (Array.isArray(r?.plans ?? r) ? '' : 'no plans list'))

const logs = await read('logs: 30 days, one page', '/v1/logs?days=30&limit=100', (r) => {
  if (!Array.isArray(r?.logs)) return 'no logs list'
  if (typeof r.pagination?.hasMore !== 'boolean') return 'no pagination.hasMore (the diary pages on it)'
  const bad = r.logs.find((l) => !l.id || !l.type || !l.created_at || !l.local_date || !l.payload)
  return bad ? `log ${bad.id} lacks id/type/created_at/local_date/payload` : ''
})
check('logs: no food at 0 kcal by mistake', !(logs?.logs ?? []).some((l) =>
  l.type === 'food' && (l.payload?.quantity_g ?? 0) > 20 && l.payload?.est_macros?.calories === 0
  && ((l.payload?.est_macros?.protein ?? 0) + (l.payload?.est_macros?.carbs ?? 0) + (l.payload?.est_macros?.fat ?? 0)) > 2))
await read('logs summary', '/v1/logs/summary?period=week', (s) => (s && typeof s === 'object' ? '' : 'no summary'))
await read('check-in status', '/v1/check-in/status', (s) => (typeof s?.state === 'string' ? '' : 'no state'))

await read('workout history', '/v1/workout-sessions/history?limit=50', (r) => {
  if (!Array.isArray(r?.sessions)) return 'no sessions list'
  const backwards = r.sessions.find((s) => s.completed_at && new Date(s.started_at) > new Date(s.completed_at))
  return backwards ? `workout ${backwards.id} starts after it finished` : ''
})
await read('workout in progress', '/v1/workout-sessions/in-progress', (r) => (r && 'session' in r ? '' : 'no session field'))
await read('chat conversations', '/v1/chat/sessions?limit=20&offset=0', (r) =>
  !Array.isArray(r?.sessions) ? 'no sessions list' : typeof r.pagination?.hasMore !== 'boolean' ? 'no pagination.hasMore' : '')
await read('favourites', '/v1/favourites', (r) => (Array.isArray(r?.favourites ?? r) ? '' : 'no favourites list'))

await read('food search numbers', '/v1/foods/search?q=cheddar%20cheese', (r) => {
  const results = r?.results ?? r?.foods ?? r
  if (!Array.isArray(results) || results.length === 0) return 'no results'
  for (const f of results) {
    const kcal = f.macros_per_serving?.calories
    const grams = f.serving_size_g
    if (!isNum(kcal) || !isNum(grams) || grams <= 0) return `${f.name}: no calories or serving size`
    // Fat is 9 kcal a gram, so nothing has more than 900 kcal per 100 g; cheese is never 0.
    if (kcal / grams * 100 > 950) return `${f.name}: ${kcal} kcal per ${grams} g`
    if (kcal === 0) return `${f.name}: 0 kcal`
  }
  return ''
})

// One write round trip through the diary's calls, always cleaned up.
const created = await call('POST', '/v1/logs', {
  type: 'food',
  payload: {
    food_name: 'Live check apple', quantity_g: 182, servings: 1, serving_label: 'apple', serving_size_g: 182,
    est_macros: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  },
})
const logId = created.json?.id ?? created.json?.log?.id
check('log a food', created.status === 201 || created.status === 200, `answered ${created.status}`)
if (logId) {
  try {
    const listed = await call('GET', '/v1/logs?type=food&days=1&limit=100')
    check('logged food shows in the diary', (listed.json?.logs ?? []).some((l) => l.id === logId))
    const patched = await call('PATCH', `/v1/logs/${logId}`, { payload: { quantity_g: 150, servings: null, serving_label: null } })
    const payload = patched.json?.payload ?? patched.json?.log?.payload
    check('switching to grams clears servings', patched.status === 200 && payload?.quantity_g === 150 && payload?.servings == null,
      `answered ${patched.status}, servings ${payload?.servings}`)
  } finally {
    const removed = await call('DELETE', `/v1/logs/${logId}`)
    check('delete the food', removed.status === 200 || removed.status === 204, `answered ${removed.status}`)
  }
}

console.log(failures.length ? `\n${failures.length} failed` : '\nAll passed')
process.exit(failures.length ? 1 : 0)
