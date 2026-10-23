/**
 * d2-capture.mjs - screenshot every SOW D2 screen x state at 390x844 and
 * 360x800, run axe on each capture, and build contact sheets.
 *
 * Usage (dev server on :3020, core API on :4010):
 *   TEST_EMAIL=... TEST_PASSWORD=... node scripts/d2-capture.mjs baseline
 *   TEST_EMAIL=... TEST_PASSWORD=... node scripts/d2-capture.mjs after D2-01,D2-05
 *
 * Writes docs/phase2/screens/<phase>/<id>-<slug>-<state>-<width>.png,
 * axe.json (serious and critical violations per capture) and sheet-<width>-<state>.png.
 *
 * The test account lives in the production database, so every non-GET request
 * except login and refresh is stubbed with an empty 200: capturing never writes.
 * Empty, loading, error and long states are produced by rewriting GET responses.
 */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:3020'
const API = process.env.API_URL || 'http://localhost:4010'
const EMAIL = process.env.TEST_EMAIL
const PASSWORD = process.env.TEST_PASSWORD
const PHASE = process.argv[2] || 'baseline'
const ONLY = process.argv[3] ? new Set(process.argv[3].split(',')) : null
const OUT = path.join('docs/phase2/screens', PHASE)
const WIDTHS = [
  { w: 390, h: 844 },
  { w: 360, h: 800 },
]
const WORKOUT_PLAN = 'a6d46d3d-1de4-4173-8cec-eccdbfddc9cc'
const MEAL_PLAN = '44511b07-06c0-4648-8168-1324ff10c8dd'
const CHAT_SESSION = '568f5f42-f519-4cbb-aab7-6a6b345a313d'

const DATA = ['empty', 'loading', 'error', 'offline', 'long']
const ALL = ['default', ...DATA]
const STATIC = ['default', 'long']

const checkIn = (state) => (body) => {
  body.state = state
  if (state === 'due') {
    body.days_logged = 6
    body.verdict ??= 'You held a 410 kcal deficit on 6 of 7 days and dropped 0.6 kg. Keep going, with a little more protein.'
    body.proposal ??= { new_calories: 2450, new_protein_g: 185, calorie_change_pct: -6, direction: 'down' }
    body.weight.current_kg ??= 78.2
    body.weight.delta_week_kg ??= -0.6
    if (!body.weight.points?.length) body.weight.points = [79.4, 79.1, 78.8, 78.2].map((kg, i) => ({ week_end: `2026-10-0${i + 1}`, kg }))
  }
  return body
}

/** One row per SOW D2 screen x state, in SOW order. */
const ROWS = [
  { id: 'D2-01', slug: 'home', path: '/dashboard', states: ALL },
  { id: 'D2-02', slug: 'check-in-due', path: '/check-in', states: ALL, patch: { '/v1/check-in/status': checkIn('due') } },
  { id: 'D2-03', slug: 'check-in-mid-week', path: '/check-in', states: ALL, patch: { '/v1/check-in/status': checkIn('mid_week') } },
  { id: 'D2-04', slug: 'check-in-not-enough-data', path: '/check-in', states: ALL, patch: { '/v1/check-in/status': checkIn('insufficient') } },
  { id: 'D2-05', slug: 'food-diary', path: '/food', states: ALL },
  { id: 'D2-06', slug: 'log-food-search', path: '/logs/new/food', states: ALL, act: async (p) => { await p.getByPlaceholder(/Search foods/i).first().fill('oat'); await p.waitForTimeout(6000) } },
  { id: 'D2-07', slug: 'log-food-photo', path: '/logs/new/food', states: ['default', 'error', 'long'], act: photoEstimate },
  { id: 'D2-08', slug: 'log-food-menu', path: `/chat/session?id=${crypto.randomUUID()}&prefill=` + encodeURIComponent('Scan this menu and suggest what fits my remaining macros'), states: ALL },
  { id: 'D2-09', slug: 'log-weight', path: '/logs/new/weight', states: ALL },
  { id: 'D2-10', slug: 'log-water', path: '/logs/new/water', states: ALL },
  { id: 'D2-11', slug: 'log-sleep', path: '/logs/new/sleep', states: ALL },
  { id: 'D2-12', slug: 'log-mood', path: '/logs/new/mood', states: ALL },
  { id: 'D2-13', slug: 'log-energy', path: '/logs/new/energy', states: ALL },
  { id: 'D2-14', slug: 'log-chooser', path: '/logs', states: ALL },
  { id: 'D2-15', slug: 'food-database', path: '/foods', states: ALL },
  { id: 'D2-16', slug: 'train', path: '/train', states: ALL },
  { id: 'D2-17', slug: 'live-session', path: '/train/session', states: ALL, dynamicId: 'session' },
  { id: 'D2-18', slug: 'plans-list', path: '/plans', states: ALL },
  { id: 'D2-19', slug: 'plans-detail-workout', path: `/plans/view?id=${WORKOUT_PLAN}`, states: ALL },
  { id: 'D2-19b', slug: 'plans-detail-meal', path: `/plans/view?id=${MEAL_PLAN}`, states: ALL },
  { id: 'D2-20', slug: 'plans-builder-meal', path: '/plans/new/meal', states: ['default', 'long'] },
  { id: 'D2-20b', slug: 'plans-builder-workout', path: '/plans/new/workout', states: ['default', 'long'] },
  { id: 'D2-20c', slug: 'plans-edit-workout', path: `/plans/edit?id=${WORKOUT_PLAN}`, states: ALL },
  { id: 'D2-21', slug: 'geo-chat-list', path: '/chat', states: ALL },
  { id: 'D2-21b', slug: 'geo-chat-session', path: `/chat/session?id=${CHAT_SESSION}`, states: ALL },
  { id: 'D2-22', slug: 'geo-companion-sheet', path: '/dashboard', states: ['default', 'offline', 'long'], act: async (p) => { await p.getByRole('button', { name: /Talk to Geo/i }).first().click(); await p.waitForTimeout(1500) } },
  { id: 'D2-23', slug: 'onboarding-personal', path: '/onboarding/personal', states: STATIC, onboarding: 'incomplete' },
  { id: 'D2-23b', slug: 'onboarding-fitness', path: '/onboarding/fitness', states: STATIC, onboarding: 'incomplete' },
  { id: 'D2-23c', slug: 'onboarding-nutrition', path: '/onboarding/nutrition', states: STATIC, onboarding: 'incomplete' },
  { id: 'D2-23d', slug: 'onboarding-review', path: '/onboarding/review', states: STATIC, onboarding: 'incomplete' },
  { id: 'D2-24', slug: 'consent', path: '/onboarding/consent?next=/dashboard', states: STATIC, consent: 'missing' },
  { id: 'D2-25', slug: 'login', path: '/login', guest: true, states: ['default', 'error'], act: authError },
  { id: 'D2-26', slug: 'sign-up', path: '/signup', guest: true, states: ['default', 'error'], act: authError },
  { id: 'D2-27', slug: 'password-reset', path: '/forgot-password', guest: true, states: ['default', 'error'], act: authError },
  { id: 'D2-27b', slug: 'password-reset-new', path: '/reset-password', guest: true, states: ['default'] },
  { id: 'D2-28', slug: 'settings', path: '/settings', states: ALL },
  { id: 'D2-29', slug: 'profile', path: '/settings/profile', states: ALL },
  { id: 'D2-30', slug: 'privacy', path: '/privacy', guest: true, states: ['default'] },
  { id: 'D2-31', slug: 'support', path: '/support', guest: true, states: ['default'] },
  { id: 'D2-32', slug: 'account-deletion', path: '/delete-account', guest: true, states: ['default'] },
  { id: 'D2-32b', slug: 'account-deletion-in-app', path: '/settings', states: ['default'], act: async (p) => { await p.getByRole('button', { name: /Delete (my )?account/i }).first().click(); await p.waitForTimeout(1200) } },
]

const LONG = ' with roasted pumpkin, crumbled feta, toasted seeds and a lemon tahini dressing'
function deep(value, fn, key) {
  if (Array.isArray(value)) return fn(value.map((v) => deep(v, fn)), key)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = deep(v, fn, k)
    return out
  }
  return fn(value, key)
}
const emptyArrays = (body) => deep(body, (v) => (Array.isArray(v) ? [] : v))
const longStrings = (body) =>
  deep(body, (v, k) => (typeof v === 'string' && /(^|_)(name|title|label|food_name|description|last_message|day_name)$/.test(k ?? '') && v.length < 200 ? v + LONG : v))

async function photoEstimate(page) {
  await page.locator('input[type=file]').first().setInputFiles({ name: 'meal.png', mimeType: 'image/png', buffer: fs.readFileSync('assets/icon-only.png') })
  await page.waitForTimeout(2500)
}
async function authError(page, state) {
  if (state !== 'error') return
  for (const input of await page.locator('input').all()) {
    const type = await input.getAttribute('type')
    await input.fill(type === 'email' ? 'nobody@example.com' : 'Wrong-pass-123')
  }
  await page.locator('button[type=submit]').first().click()
  await page.waitForTimeout(1500)
}

const ESTIMATE = {
  estimate_id: 'capture-estimate',
  items: [
    { name: 'Grilled chicken breast', quantity_g: 150, calories: 248, protein: 46, carbs: 0, fat: 5, confidence: 0.82 },
    { name: 'Steamed jasmine rice', quantity_g: 180, calories: 234, protein: 4, carbs: 51, fat: 1, confidence: 0.74 },
    { name: 'Broccoli', quantity_g: 80, calories: 27, protein: 2, carbs: 5, fat: 0, confidence: 0.9 },
  ],
  totals: { calories: 509, protein: 52, carbs: 56, fat: 6 },
  confidence: 0.8,
}

const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
const json = (route, status, body) => route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) })

// The API allows 100 requests a minute per user, so each GET hits it once per run.
const responses = new Map()
function cachedFetch(route) {
  const url = route.request().url()
  if (!responses.has(url)) {
    responses.set(url, (async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const res = await route.fetch()
        if (res.status() === 429) { await new Promise((r) => setTimeout(r, 15000)); continue }
        return { status: res.status(), headers: { ...res.headers(), ...cors }, text: await res.text() }
      }
      throw new Error('rate limited: ' + url)
    })().catch((e) => { responses.delete(url); throw e }))
  }
  return responses.get(url)
}

async function installRoutes(page, row, state) {
  let profileReads = 0
  await page.route(`${API}/**`, async (route) => {
    const req = route.request()
    const p = new URL(req.url()).pathname
    const method = req.method()
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    if (p === '/v1/foods/estimate-from-photo') {
      if (state === 'error') return json(route, 500, { error: true, code: 'ESTIMATE_FAILED', message: 'Photo estimate failed' })
      return json(route, 200, state === 'long' ? longStrings(ESTIMATE) : ESTIMATE)
    }
    if (method !== 'GET') {
      if (/^\/auth\/(login|refresh)$/.test(p) && !(row.guest && state === 'error')) return route.continue()
      if (row.guest && state === 'error') {
        const failure = p === '/auth/signup' ? [409, 'EMAIL_TAKEN', 'An account with this email already exists'] : p === '/auth/reset-password' ? [500, 'INTERNAL', "We couldn't send the reset link. Try again in a moment."] : [401, 'INVALID_CREDENTIALS', 'Invalid email or password']
        return json(route, failure[0], { error: true, code: failure[1], message: failure[2] })
      }
      return json(route, 200, {})
    }
    if (p === '/v1/profile/onboarding' && row.onboarding === 'incomplete') {
      return json(route, 200, { personal: { complete: false }, fitness: { complete: false }, nutrition: { complete: false } })
    }
    // The gate and the timezone check read the profile first; mocking those reads would redirect away.
    const gateRead = p === '/v1/profile/onboarding' || (p === '/v1/profile' && profileReads++ < 2)
    if (!gateRead && state === 'loading') return new Promise(() => {})
    if (!gateRead && state === 'error') return json(route, 500, { error: true, code: 'INTERNAL', message: 'Internal error' })
    const res = await cachedFetch(route)
    let body
    try { body = JSON.parse(res.text) } catch { return route.fulfill({ status: res.status, headers: res.headers, body: res.text }) }
    if (p === '/v1/profile' && row.consent === 'missing') body = { ...body, ai_consent_at: null, health_disclaimer_ack_at: null }
    if (row.patch?.[p]) body = row.patch[p](body)
    if (!gateRead && state === 'empty') body = emptyArrays(body)
    if (state === 'long') body = longStrings(body)
    return route.fulfill({ status: res.status, headers: res.headers, body: JSON.stringify(body) })
  })
}

// /auth/login allows 10 calls per 15 minutes, so reuse the last session (refreshing it) across runs.
const SESSION_FILE = process.env.SESSION_FILE || path.join(process.env.TMPDIR || '/tmp', 'd2-capture-session.json')
async function session() {
  const saved = fs.existsSync(SESSION_FILE) ? JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')) : null
  if (saved) {
    const ok = await fetch(`${API}/v1/profile`, { headers: { authorization: `Bearer ${saved.session.access_token}` } })
    if (ok.status === 200) return saved
    const refreshed = await fetch(`${API}/auth/refresh`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refresh_token: saved.session.refresh_token }) }).then((r) => r.json())
    if (refreshed.session?.access_token) {
      const next = { user: saved.user, session: refreshed.session }
      fs.writeFileSync(SESSION_FILE, JSON.stringify(next))
      return next
    }
  }
  const data = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) }).then((r) => r.json())
  if (!data.session?.access_token) throw new Error('login failed: ' + JSON.stringify(data).slice(0, 200))
  fs.writeFileSync(SESSION_FILE, JSON.stringify({ user: data.user, session: data.session }))
  return data
}

async function login() {
  const data = await session()
  const inProgress = await fetch(`${API}/v1/workout-sessions/in-progress`, { headers: { authorization: `Bearer ${data.session.access_token}` } }).then((r) => r.json())
  const auth = { state: { user: { id: data.user.id, email: data.user.email }, accessToken: data.session.access_token, refreshToken: data.session.refresh_token }, version: 0 }
  return { auth, sessionId: inProgress.session?.id }
}

async function capture(browser, ctxInfo, row, state, size) {
  const context = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'Asia/Calcutta', reducedMotion: 'reduce' })
  if (!row.guest) await context.addInitScript((a) => localStorage.setItem('nextmealai-auth', JSON.stringify(a)), ctxInfo.auth)
  await context.addInitScript(() => {
    const style = () => { const s = document.createElement('style'); s.textContent = 'nextjs-portal{display:none!important}'; document.head.appendChild(s) }
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', style) : style()
  })
  const page = await context.newPage()
  await installRoutes(page, row, state)
  const url = row.dynamicId === 'session' ? `${row.path}?id=${ctxInfo.sessionId}` : row.path
  const file = path.join(OUT, `${row.id}-${row.slug}-${state}-${size.w}.png`)
  try {
    await page.goto(BASE + url, { waitUntil: state === 'loading' ? 'domcontentloaded' : 'networkidle', timeout: 45000 }).catch(() => {})
    await page.waitForTimeout(state === 'loading' ? 1800 : 1500)
    if (row.act && state !== 'loading') await row.act(page, state).catch((e) => console.warn(row.id, state, 'act failed:', e.message.split('\n')[0]))
    if (state === 'offline') { await context.setOffline(true); await page.waitForTimeout(1200) }
    await page.screenshot({ path: file })
    if (process.env.FULLPAGE) await page.screenshot({ path: file.replace(/\.png$/, '-full.png'), fullPage: true })
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    const bad = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    return { row: row.id, state, width: size.w, url: page.url().replace(BASE, ''), violations: bad.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })) }
  } finally {
    await context.close()
  }
}

async function contactSheets(browser, results) {
  const page = await browser.newPage({ viewport: { width: 1240, height: 900 } })
  for (const f of fs.readdirSync(OUT).filter((f) => f.startsWith('sheet-'))) fs.unlinkSync(path.join(OUT, f))
  for (const size of WIDTHS) {
    for (const state of ALL) {
      const shots = results.filter((r) => r.width === size.w && r.state === state)
      for (let i = 0; i < shots.length; i += 8) {
        const cells = shots.slice(i, i + 8).map((r) => {
          const row = ROWS.find((x) => x.id === r.row)
          return `<figure><img src="${row.id}-${row.slug}-${state}-${size.w}.png"><figcaption>${row.id} ${row.slug} - ${state} ${size.w}${r.violations.length ? ' - axe: ' + r.violations.map((v) => v.id).join(', ') : ''}</figcaption></figure>`
        }).join('')
        const html = path.resolve(OUT, '_sheet.html')
        fs.writeFileSync(html, `<style>body{margin:8px;font:14px Arial;background:#ddd;display:grid;grid-template-columns:repeat(4,300px);gap:8px}figure{margin:0}img{width:100%;display:block}figcaption{padding:3px 0}</style>${cells}`)
        await page.goto('file://' + html)
        await page.waitForTimeout(300)
        await page.screenshot({ path: path.join(OUT, `sheet-${size.w}-${state}-${i / 8 + 1}.png`), fullPage: true })
      }
    }
  }
  fs.unlinkSync(path.resolve(OUT, '_sheet.html'))
  await page.close()
}

;(async () => {
  if (!EMAIL || !PASSWORD) { console.error('Set TEST_EMAIL and TEST_PASSWORD'); process.exit(1) }
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  if (process.env.SHEETS_ONLY) { await contactSheets(browser, JSON.parse(fs.readFileSync(path.join(OUT, 'axe.json'), 'utf8'))); await browser.close(); return }
  const ctxInfo = await login(browser)
  const jobs = []
  for (const row of ROWS) {
    if (ONLY && !ONLY.has(row.id) && !ONLY.has(row.id.replace(/[a-z]$/, ''))) continue
    for (const state of row.states) for (const size of WIDTHS) jobs.push([row, state, size])
  }
  const results = []
  const workers = Number(process.env.WORKERS || 4)
  await Promise.all(Array.from({ length: workers }, async () => {
    while (jobs.length) {
      const [row, state, size] = jobs.shift()
      try {
        const r = await capture(browser, ctxInfo, row, state, size)
        results.push(r)
        console.log(`${r.row} ${state} ${size.w} ${r.url} axe:${r.violations.map((v) => v.id).join(',') || 0}`)
      } catch (e) {
        console.error(`${row.id} ${state} ${size.w} FAILED ${e.message.split('\n')[0]}`)
      }
    }
  }))
  results.sort((a, b) => (a.row + a.state + a.width).localeCompare(b.row + b.state + b.width))
  const axePath = path.join(OUT, 'axe.json')
  const previous = ONLY && fs.existsSync(axePath) ? JSON.parse(fs.readFileSync(axePath, 'utf8')).filter((r) => !results.some((x) => x.row === r.row && x.state === r.state && x.width === r.width)) : []
  const all = [...previous, ...results].sort((a, b) => (a.row + a.state + a.width).localeCompare(b.row + b.state + b.width))
  fs.writeFileSync(axePath, JSON.stringify(all, null, 2))
  await contactSheets(browser, all)
  await browser.close()
  const serious = all.filter((r) => r.violations.length)
  console.log(`\n${all.length} captures, ${serious.length} with serious/critical axe violations`)
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
