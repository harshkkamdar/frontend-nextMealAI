/**
 * redesign-device-mock.mjs - serves a static export and a mocked API for device captures (iOS simulator, Android
 * emulator), so a phone browser gets the same fixtures as the desktop captures and never reaches the real API.
 *   NEXT_PUBLIC_TARGET=capacitor NEXT_PUBLIC_CORE_API_URL=http://localhost:4019 npx next build   (in a worktree)
 *   node scripts/redesign-device-mock.mjs <worktree>/out        static on :3040, API on :4019
 *   Android: adb reverse tcp:3040 tcp:3040 && adb reverse tcp:4019 tcp:4019 (localhost then works on the phone too)
 * Pick the shot: curl -X POST localhost:4019/__shot -d '{"slice":"slice-5","name":"month-sheet"}'
 * The shot's `api` map answers API calls (same longest-prefix match as redesign-capture.mjs), and every HTML page
 * gets an init script (auth, onboarding draft, a fixed clock or the fake native bridge) ahead of the app bundle.
 * DEVICE_SHOTS lists what the device scripts capture; `js` is a page expression run after load (no Playwright on iOS).
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { homeApi } from './redesign-mock-api.mjs'

const AUTH = { state: { user: { id: 'capture-user', email: 'capture@example.com' }, accessToken: 'capture-token', refreshToken: 'capture-refresh' }, version: 0 }
const FULL = { name: 'Sam', sex: 'female', dob: '1994-03-12', heightCm: 168, goal: 'fat_loss', activity: 'moderate', frequency: 4, experience: 'intermediate', equipment: ['Dumbbells', 'Bench'], injuries: ['Lower back'], weightKg: 78.2, targetKg: 72, allergies: ['Nuts'], diet: 'omnivore', dislikes: ['Mushrooms'], cuisines: ['Indian', 'Italian'], meals: 3 }
const PHOTO_HOST = 'https://photos.capture.test' // slice-4 attachments; rewritten to this mock since a phone cannot be routed
const PHOTO = path.resolve('scripts/shots/slice-4-photo.jpg')

// Page expressions for the few interactions the device set needs.
const click = (match) => `(() => { const b = [...document.querySelectorAll('button, a, [role=radio]')].find((el) => ${match}((el.getAttribute('aria-label') || el.textContent).trim())); b.click(); return 1 })()`
const starts = (s) => click(`((t) => t.startsWith(${JSON.stringify(s)}))`)
const type = (sel, text) => `(() => { const i = document.querySelector(${JSON.stringify(sel)}); i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, ${JSON.stringify(text)}); i.dispatchEvent(new Event('input', { bubbles: true })); return 1 })()`
const then = (a, b, ms = 1500) => `(() => { ${a}; setTimeout(() => ${b}, ${ms}); return 1 })()`

export const DEVICE_SHOTS = {
  'slice-1c': [{ name: 'welcome-1' }],
  'slice-2': [{ name: 'home' }, { name: 'plus-sheet', js: starts('Log something') }],
  'slice-3': [{ name: 'food-results', js: type('[data-testid=food-search-input]', 'chicken') }, { name: 'food-selected', js: then(type('[data-testid=food-search-input]', 'chicken'), starts('Chicken breast')) }],
  'slice-4': [{ name: 'list' }, { name: 'session' }],
  'slice-5': [{ name: 'food' }, { name: 'month-sheet', js: starts('Open month view') }],
  'slice-6': [{ name: 'train' }, { name: 'session-mid' }],
  'slice-7': [{ name: 'plans' }, { name: 'view-workout' }],
  'slice-8': [{ name: 'due' }, { name: 'mid-week' }],
  'slice-9': [{ name: 'settings' }, { name: 'paywall' }],
}

/** Shot table for a slice: slice-2 Home from redesign-mock-api.mjs, the rest from scripts/shots/<slice>.mjs. */
async function sliceShots(slice) {
  if (slice === 'slice-2') return [{ name: 'home', url: '/dashboard', api: homeApi('returning') }, { name: 'plus-sheet', url: '/dashboard', api: homeApi('returning') }, { name: 'food', url: '/food', api: homeApi('returning') }]
  return (await import(pathToFileURL(path.resolve('scripts/shots', `${slice}.mjs`)).href)).default.shots
}

/**
 * Replays a shot's act against a recorder to lift what it would add before load (p.clock.install time, the
 * addInitScript fake native bridge). Clicks and fills in the act are not replayed; DEVICE_SHOTS carries those.
 */
async function preload(shot) {
  const rec = { clock: null, init: [] }
  if (!shot.act) return rec
  const stop = new Error('stop')
  const p = { url: () => 'http://x' + shot.url, clock: { install: async ({ time }) => { rec.clock = time } }, addInitScript: async (fn, arg) => { rec.init.push(`(${fn})(${JSON.stringify(arg)})`) }, reload: async () => { throw stop }, waitForTimeout: async () => {} }
  await shot.act(p).catch(() => {})
  return rec
}

function initScript(shot, rec) {
  const lines = [
    shot.guest ? "localStorage.removeItem('nextmealai-auth')" : `localStorage.setItem('nextmealai-auth', ${JSON.stringify(JSON.stringify(AUTH))})`,
    `localStorage.setItem('fiqr-onboarding-draft', ${JSON.stringify(JSON.stringify({ state: shot.draft ?? FULL, version: 0 }))})`,
  ]
  // Moves the clock to the fixture's NOW and keeps it running, as Playwright's clock.install does.
  if (rec.clock) lines.push(`(() => { const N = Date, off = new N(${JSON.stringify(rec.clock)}).getTime() - N.now(); function D(...a) { if (!new.target) return new N(N.now() + off).toString(); return a.length ? new N(...a) : new N(N.now() + off) } D.prototype = N.prototype; D.now = () => N.now() + off; D.parse = N.parse; D.UTC = N.UTC; window.Date = D })()`)
  return `<script>${[...lines, ...rec.init].join(';\n')}</script>`
}

const onboardingStatus = (done) => Object.fromEntries(['personal', 'fitness', 'nutrition'].map((m) => [m, { complete: done.includes(m) }]))
const PLANS = [
  { id: 'meal-1', type: 'meal', is_active: true, name: 'Lean and steady', content: { daily_targets: { calories: 1950, protein: 140, carbs: 190, fat: 65 }, days: [] } },
  { id: 'work-1', type: 'workout', is_active: true, name: 'Four-day upper lower', content: { days: [{ name: 'Upper A', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower A', exercises: [1, 2, 3, 4] }, { name: 'Upper B', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower B', exercises: [1, 2, 3, 4] }] } },
]

/** Same answers as redesign-capture.mjs mockApi, minus hang/fail/offline (not in the device set). */
function apiBody(shot, p) {
  if (shot.api) {
    const key = Object.keys(shot.api).filter((k) => k.startsWith('/') && (p === k || p.startsWith(k + '/'))).sort((a, b) => b.length - a.length)[0]
    if (key && !(key === '/v1/logs' && p.startsWith('/v1/logs/summary'))) return shot.api[key]
    if (p.startsWith('/v1/plans') && shot.api.plans) return shot.api.plans
  }
  if (p === '/v1/profile/onboarding') return onboardingStatus(shot.done ?? [])
  if (p === '/v1/profile') return { id: 'capture-user', name: 'Sam', ai_consent_at: shot.consent === false ? null : '2026-10-24T00:00:00Z', health_disclaimer_ack_at: shot.consent === false ? null : '2026-10-24T00:00:00Z' }
  if (p.startsWith('/v1/plans/generate')) return {}
  if (p.startsWith('/v1/plans')) return shot.noPlans ? [] : PLANS
  return {}
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const OUT = path.resolve(process.argv[2] || 'out')
  const API_PORT = Number(process.env.API_PORT || 4019)
  const APP_PORT = Number(process.env.APP_PORT || 3040)
  let shot = { name: 'none', url: '/' }
  let rec = { clock: null, init: [] }

  http.createServer((req, res) => {
    const origin = req.headers.origin
    const send = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': origin || '*', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' })
      res.end(JSON.stringify(body).replaceAll(PHOTO_HOST, `http://localhost:${API_PORT}/__photo`))
    }
    const p = new URL(req.url, 'http://x').pathname
    if (req.method === 'OPTIONS') return send(204, {})
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', async () => {
      if (p === '/__shot') {
        try {
          const { slice, name } = JSON.parse(raw)
          const found = (await sliceShots(slice)).find((s) => s.name === name)
          if (!found) return send(404, { error: `no shot ${slice}/${name}` })
          shot = found
          rec = await preload(shot)
          return send(200, { slice, name, url: shot.url, clock: rec.clock, init: rec.init.length })
        } catch (e) { return send(500, { error: e.message }) }
      }
      if (p.startsWith('/__photo')) { res.writeHead(200, { 'content-type': 'image/jpeg' }); return res.end(fs.readFileSync(PHOTO)) }
      if (p === '/auth/refresh' || p === '/auth/login') return send(200, { user: AUTH.state.user, session: { access_token: 'capture-token', refresh_token: 'capture-refresh' } })
      return send(200, apiBody(shot, p))
    })
  }).listen(API_PORT, () => console.log(`device mock API on :${API_PORT}`))

  http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    let file = path.join(OUT, p)
    if (!file.startsWith(OUT)) { res.writeHead(403); return res.end() }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
    else if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html'
    if (!fs.existsSync(file)) file = path.join(OUT, '404.html')
    const ext = path.extname(file)
    res.writeHead(file.endsWith('404.html') && !p.endsWith('404.html') ? 404 : 200, { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'no-store' })
    if (ext !== '.html') return res.end(fs.readFileSync(file))
    res.end(fs.readFileSync(file, 'utf8').replace('<head>', `<head>${initScript(shot, rec)}`))
  }).listen(APP_PORT, () => console.log(`static ${OUT} on :${APP_PORT}`))
}
