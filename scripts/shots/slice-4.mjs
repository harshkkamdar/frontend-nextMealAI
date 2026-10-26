/**
 * Slice 4 (Geo tab): /chat, /chat/session, the companion sheet, the report sheet and conversation actions.
 * Loaded by scripts/redesign-capture.mjs and scripts/redesign-transitions.mjs:
 *   node scripts/redesign-capture.mjs slice-4
 *   node scripts/redesign-transitions.mjs slice-4 && python3 scripts/redesign-framediff.py docs/redesign/screens/slice-4/transitions
 * Everything is mocked; nothing reaches the local API or the production database (F3).
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const API = process.env.API_URL || 'http://localhost:4010'
const BASE = process.env.BASE_URL || 'http://localhost:3020'
const PHOTO_HOST = 'https://photos.capture.test'
const PHOTO = fs.readFileSync(path.resolve('scripts/shots/slice-4-photo.jpg'))

// ── Fixtures ──
const MIN = 60000
const ago = (minutes) => new Date(Date.now() - minutes * MIN).toISOString()
const session = (id, title, last, minutes) => ({ id, session_id: id, user_id: 'capture-user', title, last_message: last, message_count: 6, created_at: ago(minutes + 30), updated_at: ago(minutes) })
const LONG_TITLE = 'Rebuilding my four-day upper lower split around a sore left shoulder and less time on Fridays'
const SESSIONS = [
  session('s-1', 'Breakfast and lunch today', "That leaves 1,534 kcal for the day. Protein's off to a good start.", 25),
  session('s-2', 'Dinner ideas under 600 kcal', 'Salmon, rice and greens lands at 560 kcal with 42 g protein.', 60 * 20),
  session('s-3', 'Why is my weight up this week?', 'Mostly water from the extra salt on Saturday. The trend is still down.', 60 * 50),
  session('s-4', 'Swap squats for something knee friendly', 'Try box squats to a high box, or leg press with a short range.', 60 * 24 * 4),
  session('s-5', 'Sleep and training', 'Seven hours or more on training days helps recovery the most.', 60 * 24 * 12),
]
const LONG_SESSIONS = [session('s-long', LONG_TITLE, 'Here is a version that keeps pressing light and moves the heavy day to Monday so the shoulder gets two days between sessions.', 12), ...SESSIONS.slice(1)]

const msg = (id, role, content, minutes, extra = {}) => ({ id, role, content, timestamp: ago(minutes), ...extra })
const HISTORY = [
  msg('m-1', 'user', '2 eggs and toast with butter for breakfast', 40),
  msg('m-2', 'assistant', "Logged 2 eggs to breakfast · 156 cal · 13g P · 1g C · 11g F\nLogged sourdough toast with butter to breakfast · 260 cal · 6g P · 30g C · 12g F\n\nThat's 416 kcal for breakfast, leaving 1,534 for the day. Protein's off to a good start.", 39, { metadata: { actions_taken: [{ type: 'log_created', details: { logType: 'food' } }, { type: 'log_created', details: { logType: 'food' } }] } }),
  msg('m-3', 'user', 'Lunch was salmon with a cup of rice, greens and half an avocado', 26),
  msg('m-4', 'assistant', 'Sounds good. Which salmon was it?', 25, { metadata: { suggested_replies: ['Grilled fillet, about 150 g', 'Smoked salmon', 'Not sure'] } }),
]
// The user's photo turn gets its own shot, so the main conversation is not judged on a stand-in image.
const PHOTO_HISTORY = [
  ...HISTORY.slice(0, 2),
  msg('p-3', 'user', 'This was lunch, about a cup of rice', 26, { attachments: [{ id: 'a-1', signed_url: `${PHOTO_HOST}/bowl.jpg`, mime_type: 'image/jpeg', width: 480, height: 480 }] }),
  msg('p-4', 'assistant', 'Salmon, rice, greens and avocado. Which salmon was it?', 25, { metadata: { suggested_replies: ['Grilled fillet, about 150 g', 'Smoked salmon', 'Not sure'] } }),
]
const LONG_HISTORY = [
  msg('l-1', 'user', "I've been training four days a week but my left shoulder gets sore after pressing, especially overhead. I still want to keep upper body strength and I only have 45 minutes on Fridays. Can you rebuild the week so it works around that?", 30),
  msg('l-2', 'assistant', "Yes. Here's a week that keeps your pressing but takes load off the shoulder.\n\n**Monday, upper A**\n- Incline dumbbell press, 3 x 8, stop two reps short\n- Chest-supported row, 4 x 10\n- Landmine press, 3 x 10 each side\n\n**Wednesday, lower A**\n- Box squat, 4 x 6\n- Romanian deadlift, 3 x 8\n\n**Friday, 45 minutes**\n- Push-ups to a bench, 3 sets\n- Cable row, 3 x 12\n- Face pulls, 3 x 15\n\nSkip overhead pressing for two weeks. If the shoulder stays quiet, bring it back light. Want me to save this as your program?", 29, { metadata: { suggested_replies: ['Save it as my program', 'Make Friday shorter', 'Keep my current plan'] } }),
]
const REPLY = {
  session_id: 's-1',
  response: { id: 'm-new', role: 'assistant', content: "Logged grilled salmon 150 g to lunch · 310 cal · 34g P · 0g C · 19g F\nLogged rice 1 cup to lunch · 205 cal · 4g P · 45g C · 0g F\n\nLunch comes to 515 kcal. You've got 1,019 left and 65 g protein to go, so dinner can lean on protein." },
  actions_taken: [{ type: 'log_created', details: { logType: 'food' } }],
}
const PROFILE = { id: 'capture-user', full_name: 'Sam Rivera', ai_consent_at: '2026-10-24T00:00:00Z', health_disclaimer_ack_at: '2026-10-24T00:00:00Z', current_weight_kg: 78.2, daily_calorie_target: 1950, daily_protein_g: 140, daily_carbs_g: 190, daily_fat_g: 65, daily_targets_missing_fields: [] }
const done = { personal: { complete: true }, fitness: { complete: true }, nutrition: { complete: true } }

const geoApi = (over = {}) => ({
  '/v1/profile/onboarding': done,
  '/v1/profile': PROFILE,
  '/v1/chat/sessions': { sessions: SESSIONS },
  '/v1/chat/sessions/s-1': { messages: HISTORY },
  '/v1/chat/sessions/s-long': { messages: LONG_HISTORY },
  '/v1/chat/sessions/s-photo': { messages: PHOTO_HISTORY },
  '/v1/chat/sessions/comp-1': { messages: HISTORY.slice(0, 2) },
  '/v1/chat/companion': { session_id: 'comp-1', context_loaded: true },
  '/v1/chat': REPLY,
  '/v1/logs': { logs: [] },
  '/v1/logs/summary': { period: 'day', summary: { total_logs: 0 }, daily_breakdown: [] },
  '/v1/dashboard/check-in': { check_in: null },
  '/v1/suggestions': [],
  plans: [],
  ...over,
})

// ── Helpers used by shot actions ──
/** The photo host is not real: serve the stand-in photo, then make already-failed <img>s load again. */
async function photos(page) {
  await page.route(`${PHOTO_HOST}/**`, (route) => route.fulfill({ status: 200, contentType: 'image/jpeg', body: PHOTO }))
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const src = img.src; img.src = ''; img.src = src }))
  await page.waitForTimeout(500)
}
const onSend = (page, handler) => page.route(`${API}/v1/chat`, (route) => (route.request().method() === 'POST' ? handler(route) : route.fallback()))
const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
const typeAndSend = async (page, text) => { await page.getByLabel('Type a message').fill(text); await page.getByRole('button', { name: 'Send message' }).click() }
const openCompanion = async (page) => { await page.getByRole('button', { name: 'Ask Geo' }).click(); await page.waitForTimeout(900) }
const openReport = async (page) => { await photos(page); await page.getByRole('button', { name: 'Message options' }).last().click(); await page.waitForTimeout(300); await page.getByRole('menuitem', { name: 'Report' }).click(); await page.waitForTimeout(800) }

const SESSION = '/chat/session?id=s-1'

const shots = [
  // /chat
  { name: 'list', url: '/chat', api: geoApi() },
  { name: 'list-first-run', url: '/chat', api: geoApi({ '/v1/chat/sessions': { sessions: [] } }) },
  { name: 'list-loading', url: '/chat', api: geoApi(), hang: ['/v1/chat/sessions'] },
  { name: 'list-error', url: '/chat', api: geoApi(), fail: ['/v1/chat/sessions'] },
  { name: 'list-offline', url: '/chat', api: geoApi(), offline: true },
  { name: 'list-long', url: '/chat', api: geoApi({ '/v1/chat/sessions': { sessions: LONG_SESSIONS } }) },
  { name: 'list-typed', url: '/chat', api: geoApi(), act: (p) => p.getByLabel('Ask Geo anything').fill('What should I have for dinner?') },
  { name: 'list-actions', url: '/chat', api: geoApi(), act: async (p) => { await p.getByRole('button', { name: /^Options for Breakfast/ }).click(); await p.waitForTimeout(800) } },
  { name: 'list-rename', url: '/chat', api: geoApi(), act: async (p) => { await p.getByRole('button', { name: /^Options for Breakfast/ }).click(); await p.waitForTimeout(700); await p.getByRole('button', { name: 'Rename' }).click(); await p.waitForTimeout(900) } },
  { name: 'list-delete', url: '/chat', api: geoApi(), act: async (p) => { await p.getByRole('button', { name: /^Options for Breakfast/ }).click(); await p.waitForTimeout(700); await p.getByRole('button', { name: 'Delete' }).click(); await p.waitForTimeout(700) } },
  // /chat/session
  { name: 'session', url: SESSION, api: geoApi(), act: photos },
  { name: 'session-photo', url: '/chat/session?id=s-photo', api: geoApi(), act: photos },
  { name: 'session-new', url: '/chat/session?id=new-1', api: geoApi(), fail: ['/v1/chat/sessions/new-1'], failStatus: 404 },
  { name: 'session-loading', url: SESSION, api: geoApi(), hang: ['/v1/chat/sessions'] },
  { name: 'session-typing', url: SESSION, api: geoApi(), act: async (p) => { await photos(p); await onSend(p, () => new Promise(() => {})); await p.getByRole('button', { name: 'Grilled fillet, about 150 g' }).click(); await p.waitForTimeout(900) } },
  { name: 'session-reply', url: SESSION, api: geoApi(), act: async (p) => { await photos(p); await p.getByRole('button', { name: 'Grilled fillet, about 150 g' }).click(); await p.waitForTimeout(1400) } },
  { name: 'session-history-error', url: SESSION, api: geoApi(), fail: ['/v1/chat/sessions/s-1'] },
  { name: 'session-send-failed', url: SESSION, api: geoApi(), act: async (p) => { await photos(p); await onSend(p, (r) => r.fulfill({ status: 500, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ error: true, message: 'Server error' }) })); await typeAndSend(p, 'Smoked salmon, about 100 g'); await p.waitForTimeout(1000) } },
  { name: 'session-offline', url: SESSION, api: geoApi(), offline: true, act: photos },
  { name: 'session-long', url: '/chat/session?id=s-long', api: geoApi({ '/v1/chat/sessions': { sessions: LONG_SESSIONS } }) },
  { name: 'session-draft', url: SESSION, api: geoApi(), act: async (p) => { await photos(p); await p.getByLabel('Type a message').fill('Actually it was closer to two cups of rice, and I had a flat white with it as well') } },
  { name: 'session-menu', url: SESSION, api: geoApi(), act: async (p) => { await photos(p); await p.getByRole('button', { name: 'Message options' }).last().click(); await p.waitForTimeout(500) } },
  // Report opens with no reason picked and Send disabled; -picked shows the state after one choice.
  { name: 'session-report', url: SESSION, api: geoApi(), act: openReport },
  { name: 'session-report-picked', url: SESSION, api: geoApi(), act: async (p) => { await openReport(p); await p.getByRole('button', { name: 'Wrong or misleading' }).click(); await p.waitForTimeout(300) } },
  // Companion sheet, opened from Home's "Ask Geo" (first-run Home has no program, so the card offers it)
  { name: 'companion', url: '/dashboard', api: geoApi(), act: openCompanion },
  { name: 'companion-thread', url: '/dashboard', api: geoApi(), act: async (p) => { await p.evaluate(() => localStorage.setItem('nextmealai:companion:current-session-id', JSON.stringify({ session_id: 'comp-1', ts: Date.now() }))); await openCompanion(p) } },
  { name: 'companion-offline', url: '/dashboard', api: geoApi(), offline: true, act: openCompanion },
]

// ── Transitions ──
const transitions = [
  { name: 'open-conversation', url: '/chat', api: geoApi(), warm: SESSION, act: (p) => p.getByRole('button', { name: /^Breakfast and lunch today/ }).click() },
  { name: 'new-conversation', url: '/chat', api: geoApi(), warm: '/chat/session?id=new-2', act: (p) => p.getByRole('button', { name: 'New conversation' }).click() },
  { name: 'reply-arrives', url: SESSION, api: geoApi(), delay: 700, act: (p) => typeAndSend(p, 'Grilled, about 150 g') },
  { name: 'chip-tap', url: SESSION, api: geoApi(), delay: 700, act: (p) => p.getByRole('button', { name: 'Grilled fillet, about 150 g' }).click() },
  { name: 'companion-open', url: '/dashboard', api: geoApi(), act: (p) => p.getByRole('button', { name: 'Ask Geo' }).click() },
  {
    name: 'companion-resize', url: '/dashboard', api: geoApi(),
    act: async (p) => {
      await p.getByRole('button', { name: 'Ask Geo' }).click()
      await p.waitForTimeout(900)
      const sheet = await p.getByRole('dialog', { name: 'Geo' }).boundingBox()
      const x = sheet.x + sheet.width / 2
      await p.mouse.move(x, sheet.y + 10)
      await p.mouse.down()
      for (let i = 1; i <= 16; i++) { await p.mouse.move(x, sheet.y + 10 + i * 18); await p.waitForTimeout(16) }
      await p.mouse.up()
    },
  },
]

export default { shots, transitions }

// redesign-transitions.mjs stubs every API call with {} and has no per-transition mock hook, so for transitions
// that carry `api` this swaps its route stub for these fixtures (same longest-prefix rule as redesign-capture.mjs).
// Needs no change to the shared script; see the slice 4 report for the one-line hook that would replace this.
if (process.argv[1]?.endsWith('redesign-transitions.mjs')) {
  const launch = chromium.launch.bind(chromium)
  chromium.launch = async (...args) => {
    const browser = await launch(...args)
    const newContext = browser.newContext.bind(browser)
    let index = 0
    browser.newContext = async (...options) => {
      const t = transitions[index++]
      const context = await newContext(...options)
      if (!t?.api) return context
      const newPage = context.newPage.bind(context)
      context.newPage = async () => {
        const page = await newPage()
        const route = page.route.bind(page)
        page.route = (pattern, handler) => (String(pattern).startsWith('http://localhost:4010') || String(pattern).startsWith(API) ? route(pattern, (r) => fixture(r, t)) : route(pattern, handler))
        await route(`${PHOTO_HOST}/**`, (r) => r.fulfill({ status: 200, contentType: 'image/jpeg', body: PHOTO }))
        return page
      }
      return context
    }
    return browser
  }
}

async function fixture(route, t) {
  const req = route.request()
  const p = new URL(req.url()).pathname
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
  const key = Object.keys(t.api).filter((k) => k.startsWith('/') && (p === k || p.startsWith(k + '/'))).sort((a, b) => b.length - a.length)[0]
  if (p.startsWith('/v1/chat/sessions/new-')) return route.fulfill({ status: 404, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ error: true, message: 'Not found' }) })
  if (p === '/v1/chat' && req.method() === 'POST') {
    // Remember the turn, so the page's own history refetch (4 s after open) returns it like the real API would.
    const sent = JSON.parse(req.postData() || '{}')
    const id = sent.session_id
    t.api[`/v1/chat/sessions/${id}`] = { messages: [...(t.api[`/v1/chat/sessions/${id}`]?.messages ?? []), msg('sent', 'user', sent.message, 0), { ...REPLY.response, timestamp: ago(0) }] }
    if (t.delay) await new Promise((r) => setTimeout(r, t.delay))
  }
  const body = key && !(key === '/v1/logs' && p.startsWith('/v1/logs/summary')) ? t.api[key] : p.startsWith('/v1/plans') ? t.api.plans ?? [] : {}
  return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) })
}
