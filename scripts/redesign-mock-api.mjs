/**
 * redesign-mock-api.mjs - a local stand-in for the core API so device captures need no test account
 * and never touch the production database.
 * Usage: node scripts/redesign-mock-api.mjs [port]   (default 4011)
 * Run the app against it: NEXT_PUBLIC_CORE_API_URL=http://localhost:4011 npx next dev -p 3021
 * Switch scenario: curl -X POST localhost:4011/__scenario -d '{"done":["personal"],"consent":false,"plans":"full"}'
 */
import http from 'node:http'

const port = Number(process.argv[2] || 4011)
let scenario = { done: [], consent: true, plans: 'full', fail: null }

const PLANS = [
  { id: 'meal-1', type: 'meal', is_active: true, name: 'Lean and steady', content: { daily_targets: { calories: 1950, protein: 140, carbs: 190, fat: 65 }, days: [] } },
  { id: 'work-1', type: 'workout', is_active: true, name: 'Four-day upper lower', content: { days: [{ name: 'Upper A', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower A', exercises: [1, 2, 3, 4] }, { name: 'Upper B', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower B', exercises: [1, 2, 3, 4] }] } },
]

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

http.createServer((req, res) => {
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
    if (p === '/v1/profile/onboarding') return send(res, 200, Object.fromEntries(['personal', 'fitness', 'nutrition'].map((m) => [m, { complete: scenario.done.includes(m) }])), origin)
    if (p === '/v1/profile') return send(res, 200, { id: 'capture-user', name: 'Sam', ai_consent_at: scenario.consent ? '2026-10-24T00:00:00Z' : null, health_disclaimer_ack_at: scenario.consent ? '2026-10-24T00:00:00Z' : null }, origin)
    if (p.startsWith('/v1/plans/generate')) return setTimeout(() => send(res, 200, { success: true, plans: PLANS }, origin), scenario.plans === 'slow' ? 60000 : 400)
    if (p.startsWith('/v1/plans')) return send(res, 200, scenario.plans === 'none' ? [] : PLANS, origin)
    return send(res, 200, {}, origin)
  })
}).listen(port, () => console.log(`mock API on :${port}`))
