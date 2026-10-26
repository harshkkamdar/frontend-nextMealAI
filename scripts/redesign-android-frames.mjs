/**
 * redesign-android-frames.mjs - frame timing of a slice's transitions on the low-end Android emulator.
 * Setup: emulator `fiqr_lowend` running, Chrome open, then
 *   adb reverse tcp:3020 tcp:3020 && adb reverse tcp:4010 tcp:4010 && adb forward tcp:9222 localabstract:chrome_devtools_remote
 * Usage: node scripts/redesign-android-frames.mjs slice-1 [runs]
 * slice-2 reads Home from the mock API (`home` scenario): adb reverse tcp:3021 tcp:3021 && adb reverse tcp:4011 tcp:4011, then
 *   BASE_URL=http://localhost:3021 API_URL=http://localhost:4011 DEVICE='fiqr_lowend (...)' OUT_FILE=docs/redesign/screens/slice-2/android/frames-api30.json node scripts/redesign-android-frames.mjs slice-2
 * Writes docs/redesign/screens/<slice>/android-frames.json. Janky = frame interval over 25 ms (a dropped frame at 60 Hz).
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const SLICE = process.argv[2] || 'slice-1'
const RUNS = Number(process.argv[3] || 3)
const BASE = process.env.BASE_URL || 'http://localhost:3020'
const API = process.env.API_URL || 'http://localhost:4010'
const AUTH = { state: { user: { id: 'capture-user', email: 'capture@example.com' }, accessToken: 'capture-token', refreshToken: 'capture-refresh' }, version: 0 }
const EMPTY = { name: '', sex: null, dob: '', heightCm: null, goal: null, activity: null, frequency: null, experience: null, equipment: [], injuries: [], weightKg: null, targetKg: null, allergies: [], diet: null, dislikes: [], cuisines: [], meals: null }

const TRANSITIONS = {
  'slice-1': [
    { name: 'name-to-sex', url: '/onboarding/personal?q=name', draft: { ...EMPTY, name: 'Sam' }, act: (p) => p.click('button[type=submit]') },
    { name: 'sex-autoadvance', url: '/onboarding/personal?q=sex', draft: { ...EMPTY, name: 'Sam' }, act: (p) => p.click('[role=radio]') },
    { name: 'goal-autoadvance', url: '/onboarding/fitness?q=goal', draft: EMPTY, act: (p) => p.click('[role=radio]') },
    { name: 'equipment-toggle', url: '/onboarding/fitness?q=equipment', draft: EMPTY, act: (p) => p.click('[role=checkbox]') },
    { name: 'back', url: '/onboarding/fitness?q=activity', draft: { ...EMPTY, goal: 'fat_loss' }, act: (p) => p.click('button[aria-label=Back]') },
    { name: 'weight-scrub', url: '/onboarding/nutrition?q=weight', draft: EMPTY, act: (p) => p.evaluate(async () => { const el = document.querySelector('.scrollbar-hide'); for (let i = 0; i < 30; i++) { el.scrollLeft += 12; await new Promise((r) => requestAnimationFrame(r)) } }) },
  ],
  'slice-2': [
    { name: 'plus-sheet-open', url: '/dashboard', home: 'returning', act: (p) => p.click('[aria-label="Log something"]') },
    { name: 'tab-home-to-food', url: '/dashboard', home: 'returning', act: (p) => p.click('a[href="/food"]') },
    { name: 'tab-food-to-home', url: '/food', home: 'returning', act: (p) => p.click('a[href="/dashboard"]') },
  ],
}

const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }

;(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222')
  const context = browser.contexts()[0]
  const page = context.pages().find((p) => p.url().startsWith(BASE)) ?? await context.newPage()
  page.setDefaultNavigationTimeout(120000) // the emulated low-end phone can need over 30 s for a dev-mode load
  // Never let a capture reach the real local API.
  if (SLICE === 'slice-2') await page.route('http://localhost:4010/**', (route) => route.abort())
  else await page.route(`${API}/**`, (route) => {
    const p = new URL(route.request().url()).pathname
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    const body = p === '/v1/profile/onboarding' ? { personal: { complete: false }, fitness: { complete: false }, nutrition: { complete: false } } : {}
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  })
  await page.goto(BASE + '/login', { waitUntil: 'load' })
  const results = []
  for (let run = 0; run < RUNS; run++) {
    for (const t of TRANSITIONS[SLICE]) {
      if (t.home) await fetch(API + '/__scenario', { method: 'POST', body: JSON.stringify({ home: t.home, done: ['personal', 'fitness', 'nutrition'], consent: true, fail: null }) })
      await page.evaluate(([auth, draft]) => {
        localStorage.setItem('nextmealai-auth', JSON.stringify(auth))
        localStorage.setItem('fiqr-onboarding-draft', JSON.stringify({ state: draft, version: 0 }))
      }, [AUTH, t.draft])
      await page.goto(BASE + t.url, { waitUntil: 'load' })
      await page.waitForTimeout(t.home ? 6000 : 2500)
      await page.evaluate(() => {
        window.__frames = []
        let prev = performance.now()
        const loop = (now) => { window.__frames.push(now - prev); prev = now; if (window.__recording) requestAnimationFrame(loop) }
        window.__recording = true
        requestAnimationFrame(loop)
      })
      await t.act(page)
      await page.waitForTimeout(1200)
      const frames = await page.evaluate(() => { window.__recording = false; return window.__frames.slice(1) })
      const janky = frames.filter((f) => f > 25)
      const r = { run, name: t.name, frames: frames.length, janky: janky.length, max: Math.round(Math.max(...frames) * 10) / 10 }
      results.push(r)
      console.log(JSON.stringify(r))
    }
  }
  const out = process.env.OUT_FILE || path.join('docs/redesign/screens', SLICE, 'android-frames.json')
  fs.writeFileSync(out, JSON.stringify({ device: process.env.DEVICE || 'fiqr_lowend35 (Pixel 4a profile, 2 cores, 2 GB, Android 15, Chrome and WebView 124)', ...(process.env.NOTE ? { note: process.env.NOTE } : {}), jankyMeans: 'frame interval > 25 ms', results }, null, 2))
  await browser.close().catch(() => {})
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
