/**
 * redesign-transitions.mjs - record every frame of a slice's transitions (CDP screencast, motion on).
 * Usage (dev server on :3020): node scripts/redesign-transitions.mjs slice-1
 * Writes docs/redesign/screens/<slice>/transitions/<name>/NNNN.png plus frames.json (timestamps),
 * then run: python3 scripts/redesign-framediff.py docs/redesign/screens/<slice>/transitions
 * slice-2 entries set `home` and use the mock API instead of route stubs:
 *   node scripts/redesign-mock-api.mjs 4011 and a dev server on :3021 built with NEXT_PUBLIC_CORE_API_URL=http://localhost:4011, then
 *   BASE_URL=http://localhost:3021 API_URL=http://localhost:4011 node scripts/redesign-transitions.mjs slice-2
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const BASE = process.env.BASE_URL || 'http://localhost:3020'
const API = process.env.API_URL || 'http://localhost:4010'
const SLICE = process.argv[2] || 'slice-1'
const OUT = path.join('docs/redesign/screens', SLICE, 'transitions')
const AUTH = { state: { user: { id: 'capture-user', email: 'capture@example.com' }, accessToken: 'capture-token', refreshToken: 'capture-refresh' }, version: 0 }
const EMPTY = { name: '', sex: null, dob: '', heightCm: null, goal: null, activity: null, frequency: null, experience: null, equipment: [], injuries: [], weightKg: null, targetKg: null, allergies: [], diet: null, dislikes: [], cuisines: [], meals: null }

/** Each transition: start url + draft, then the action that triggers it, and how long to record. */
const TRANSITIONS = {
  'slice-1': [
    { name: 'name-to-sex', url: '/onboarding/personal?q=name', draft: { ...EMPTY, name: 'Sam' }, act: (p) => p.getByRole('button', { name: 'Continue' }).click() },
    { name: 'sex-autoadvance', url: '/onboarding/personal?q=sex', draft: { ...EMPTY, name: 'Sam' }, act: (p) => p.getByRole('radio', { name: 'Female' }).click() },
    { name: 'goal-autoadvance', url: '/onboarding/fitness?q=goal', draft: { ...EMPTY, name: 'Sam' }, act: (p) => p.getByRole('radio', { name: /^Lose fat/ }).click() },
    { name: 'equipment-toggle', url: '/onboarding/fitness?q=equipment', draft: EMPTY, act: (p) => p.getByRole('checkbox', { name: 'Dumbbells' }).click() },
    { name: 'back', url: '/onboarding/fitness?q=activity', draft: { ...EMPTY, goal: 'fat_loss' }, act: (p) => p.getByRole('button', { name: 'Back' }).click() },
    { name: 'weight-scrub', url: '/onboarding/nutrition?q=weight', draft: EMPTY, act: async (p) => { const r = p.locator('.scrollbar-hide').first(); for (let i = 0; i < 12; i++) { await r.evaluate((el) => { el.scrollLeft += 15 }); await p.waitForTimeout(16) } } },
  ],
  'slice-1b': [
    { name: 'welcome-continue', url: '/welcome', guest: true, act: (p) => p.getByRole('button', { name: 'Continue' }).click() },
    { name: 'welcome-last', url: '/welcome', guest: true, act: async (p) => { await p.evaluate(() => { const el = document.querySelector('[aria-roledescription=carousel]'); el.scrollLeft = 2 * el.clientWidth }); await p.waitForTimeout(600); await p.getByRole('button', { name: 'Continue' }).click() } },
    { name: 'welcome-to-signup', url: '/welcome', guest: true, act: (p) => p.getByRole('button', { name: 'I have an account' }).click() },
    { name: 'login-error', url: '/login', guest: true, act: async (p) => { await p.getByLabel('Email', { exact: true }).fill('sam@example.com'); await p.getByLabel('Password', { exact: true }).fill('wrong password'); await p.getByRole('button', { name: 'Sign in' }).click() } },
    { name: 'forgot-sent', url: '/forgot-password', guest: true, act: async (p) => { await p.getByLabel('Email', { exact: true }).fill('sam@example.com'); await p.getByRole('button', { name: 'Send reset link' }).click() } },
  ],
  'slice-2': [
    // Home -> Food -> Home as two recordings, so the second tap is not read as a late shift by the frame diff.
    { name: 'tab-home-to-food', url: '/dashboard', home: 'returning', warm: '/food', act: (p) => p.getByRole('link', { name: 'Food' }).click() },
    { name: 'tab-food-to-home', url: '/food', home: 'returning', warm: '/dashboard', act: async (p) => { await p.getByRole('link', { name: 'Home' }).click() } },
    { name: 'plus-open-close', url: '/dashboard', home: 'returning', act: async (p) => { const orb = p.getByRole('button', { name: 'Log something' }); const b = await orb.boundingBox(); await orb.click(); await p.waitForTimeout(1000); await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2) } },
    // First load: a full navigation to Home (ring draw, count-up, staggered rise) with the route already compiled.
    { name: 'home-first-load', url: '/food', home: 'returning', warm: '/dashboard', act: (p) => p.goto(BASE + '/dashboard') },
    { name: 'header-condense-scroll', url: '/dashboard', home: 'returning', act: async (p) => { await p.mouse.move(195, 400); for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, 10); await p.waitForTimeout(16) } } },
    { name: 'quicklog-open', url: '/dashboard', home: 'returning', act: (p) => p.getByRole('button', { name: /^Weight/ }).click() },
  ],
}

// Per-slice tables live in scripts/shots/<slice>.mjs (default export: { shots, transitions }) so parallel slice work never edits this file.
const sliceFile = path.resolve('scripts/shots', `${SLICE}.mjs`)
if (!TRANSITIONS[SLICE] && fs.existsSync(sliceFile)) TRANSITIONS[SLICE] = (await import(pathToFileURL(sliceFile).href)).default.transitions ?? []

const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }

;(async () => {
  const browser = await chromium.launch()
  for (const t of TRANSITIONS[SLICE]) {
    const dir = path.join(OUT, t.name)
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(dir, { recursive: true })
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'no-preference', ...(t.home ? { timezoneId: 'Australia/Sydney' } : {}) })
    await context.addInitScript(([auth, draft]) => {
      if (auth) localStorage.setItem('nextmealai-auth', JSON.stringify(auth))
      if (draft) localStorage.setItem('fiqr-onboarding-draft', JSON.stringify({ state: draft, version: 0 }))
      const hide = () => { const s = document.createElement('style'); s.textContent = 'nextjs-portal{display:none!important}'; document.head.appendChild(s) }
      document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', hide) : hide()
    }, [t.guest ? null : AUTH, t.draft ?? null])
    const page = await context.newPage()
    // Never let a capture reach the real local API.
    await page.route('http://localhost:4010/**', (route) => route.abort())
    if (t.home) await fetch(API + '/__scenario', { method: 'POST', body: JSON.stringify({ home: t.home, done: ['personal', 'fitness', 'nutrition'], consent: true, fail: null }) })
    if (!t.home) await page.route(`${API}/**`, (route) => {
      const p = new URL(route.request().url()).pathname
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
      if (p === '/auth/login') return route.fulfill({ status: 401, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ error: true, message: 'Invalid login credentials' }) })
      const body = p === '/v1/profile/onboarding' ? { personal: { complete: false }, fitness: { complete: false }, nutrition: { complete: false } } : {}
      return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    })
    await page.goto(BASE + t.url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    if (t.warm) { await page.goto(BASE + t.warm, { waitUntil: 'networkidle' }); await page.goto(BASE + t.url, { waitUntil: 'networkidle' }); await page.waitForTimeout(1200) }
    // Visit the destination once so route code is loaded; the recorded transition then measures motion, not compile time.
    const cdp = await context.newCDPSession(page)
    const frames = []
    cdp.on('Page.screencastFrame', async (f) => {
      frames.push({ t: f.metadata.timestamp, data: f.data })
      await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
    })
    await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: 390, maxHeight: 844 })
    await page.waitForTimeout(300)
    await t.act(page)
    await page.waitForTimeout(1400)
    await cdp.send('Page.stopScreencast')
    frames.forEach((f, i) => fs.writeFileSync(path.join(dir, String(i).padStart(4, '0') + '.png'), Buffer.from(f.data, 'base64')))
    fs.writeFileSync(path.join(dir, 'frames.json'), JSON.stringify(frames.map((f) => f.t)))
    console.log(t.name, frames.length, 'frames')
    await context.close()
  }
  await browser.close()
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
