/**
 * redesign-android-capture.mjs - real-device-style captures (adb screencap, with Android status bar) of a slice
 * in Chrome on the emulator, API mocked over CDP. Same setup as redesign-android-frames.mjs.
 * Usage: node scripts/redesign-android-capture.mjs slice-1
 * slice-2 reads Home states from the mock API (`home` scenario) instead of route stubs:
 *   adb reverse tcp:3021 tcp:3021 && adb reverse tcp:4011 tcp:4011, then
 *   BASE_URL=http://localhost:3021 API_URL=http://localhost:4011 OUT_SUFFIX=-api30 node scripts/redesign-android-capture.mjs slice-2 [filter]
 */
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const SLICE = process.argv[2] || 'slice-1'
const OUT = path.join('docs/redesign/screens', SLICE, 'android')
const BASE = process.env.BASE_URL || 'http://localhost:3020'
const API = process.env.API_URL || 'http://localhost:4010'
const SUFFIX = process.env.OUT_SUFFIX || ''
const FILTER = process.argv[3] ? new RegExp(process.argv[3]) : null
const ADB = path.join(process.env.ANDROID_HOME || '/opt/homebrew/share/android-commandlinetools', 'platform-tools/adb')
const AUTH = { state: { user: { id: 'capture-user', email: 'capture@example.com' }, accessToken: 'capture-token', refreshToken: 'capture-refresh' }, version: 0 }
const FULL = { name: 'Sam', sex: 'female', dob: '1994-03-12', heightCm: 168, goal: 'fat_loss', activity: 'moderate', frequency: 4, experience: 'intermediate', equipment: ['Dumbbells', 'Bench'], injuries: ['Lower back'], weightKg: 78.2, targetKg: 72, allergies: ['Nuts'], diet: 'omnivore', dislikes: ['Mushrooms'], cuisines: ['Indian', 'Italian'], meals: 3 }
const MODULE = { name: 'personal', sex: 'personal', dob: 'personal', height: 'personal', goal: 'fitness', activity: 'fitness', frequency: 'fitness', experience: 'fitness', equipment: 'fitness', injuries: 'fitness', weight: 'nutrition', target: 'nutrition', reflection: 'nutrition', allergies: 'nutrition', diet: 'nutrition', dislikes: 'nutrition', cuisines: 'nutrition', meals: 'nutrition' }
const PLANS = [
  { id: 'meal-1', type: 'meal', is_active: true, content: { daily_targets: { calories: 1950, protein: 140, carbs: 190, fat: 65 }, days: [] } },
  { id: 'work-1', type: 'workout', is_active: true, content: { days: [{ name: 'Upper A', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower A', exercises: [1, 2, 3, 4] }, { name: 'Upper B', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower B', exercises: [1, 2, 3, 4] }] } },
]
const SHOTS = {
  'slice-1': [
    ...Object.keys(MODULE).map((id) => ({ name: `ob-${id}`, url: `/onboarding/${MODULE[id]}?q=${id}`, done: [] })),
    { name: 'consent', url: '/onboarding/consent', done: ['personal', 'fitness', 'nutrition'], consent: false },
    { name: 'reveal', url: '/onboarding/review', done: ['personal', 'fitness', 'nutrition'] },
  ],
  'slice-1b': [
    ...[0, 1, 2, 3].map((i) => ({ name: `welcome-${i + 1}`, url: '/welcome', guest: true, done: [], act: (p) => p.evaluate((n) => { const el = document.querySelector('[aria-roledescription=carousel]'); el.scrollLeft = n * el.clientWidth }, i) })),
    { name: 'login', url: '/login', guest: true, done: [] },
    { name: 'signup', url: '/signup', guest: true, done: [] },
    { name: 'forgot', url: '/forgot-password', guest: true, done: [] },
    { name: 'reset-expired', url: '/reset-password', guest: true, done: [] },
    { name: 'reset-valid', url: '/reset-password#access_token=capture&type=recovery', guest: true, done: [] },
  ],
  'slice-2': [
    { name: 'home', url: '/dashboard', home: 'returning' },
    { name: 'home-first-run', url: '/dashboard', home: 'first-run' },
    { name: 'home-checkin-due', url: '/dashboard', home: 'due' },
    { name: 'home-offline', url: '/dashboard', home: 'returning', act: async (p) => { await p.context().setOffline(true); await p.evaluate(() => window.dispatchEvent(new Event('offline'))) } },
    { name: 'plus-sheet', url: '/dashboard', home: 'returning', act: (p) => p.click('[aria-label="Log something"]') },
    { name: 'plus-sheet-typed', url: '/dashboard', home: 'returning', act: async (p) => { await p.click('[aria-label="Log something"]'); await p.waitForTimeout(800); await p.fill('[aria-label="Tell Geo what you ate or did"]', '2 eggs and toast with butter') } },
    { name: 'macro-sheet', url: '/dashboard', home: 'returning', act: (p) => p.getByRole('button', { name: /^Protein/ }).click() },
    ...['Weight', 'Water', 'Sleep'].map((t) => ({ name: `quicklog-${t.toLowerCase()}`, url: '/dashboard', home: 'returning', act: (p) => p.getByRole('button', { name: new RegExp(`^${t}`) }).click() })),
  ],
}
const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.connectOverCDP('http://localhost:9222')
  const page = browser.contexts()[0].pages().find((p) => p.url().startsWith(BASE))
  await page.bringToFront()
  let shot
  // Never let a capture reach the real local API.
  await page.route('http://localhost:4010/**', (route) => (shot?.home ? route.abort() : route.fallback()))
  await page.route(`${API}/**`, (route) => {
    if (shot.home) return route.fallback()
    const p = new URL(route.request().url()).pathname
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    const body = p === '/v1/profile/onboarding' ? Object.fromEntries(['personal', 'fitness', 'nutrition'].map((m) => [m, { complete: shot.done.includes(m) }]))
      : p === '/v1/profile' ? { ai_consent_at: shot.consent === false ? null : 'x', health_disclaimer_ack_at: shot.consent === false ? null : 'x' }
      : p.startsWith('/v1/plans') ? PLANS : {}
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  })
  for (shot of SHOTS[SLICE].filter((s) => !FILTER || FILTER.test(s.name))) {
    if (shot.home) await fetch(API + '/__scenario', { method: 'POST', body: JSON.stringify({ home: shot.home, done: ['personal', 'fitness', 'nutrition'], consent: true, fail: null }) })
    await page.evaluate(([auth, draft]) => { if (auth) localStorage.setItem('nextmealai-auth', JSON.stringify(auth)); else localStorage.removeItem('nextmealai-auth'); localStorage.setItem('fiqr-onboarding-draft', JSON.stringify({ state: draft, version: 0 })) }, [shot.guest ? null : AUTH, FULL])
    await page.goto(BASE + shot.url, { waitUntil: 'load' })
    await page.waitForTimeout(shot.home ? 15000 : 2500)
    // Hide the Next.js dev indicator so it does not sit in the capture.
    await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {})
    if (shot.act) { await shot.act(page); await page.waitForTimeout(2200) } else if (shot.home) await page.waitForTimeout(1500)
    fs.writeFileSync(path.join(OUT, `${shot.name}${SUFFIX}.png`), execFileSync(ADB, ['exec-out', 'screencap', '-p']))
    await page.context().setOffline(false)
    console.log(shot.name)
  }
  await browser.close().catch(() => {})
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
