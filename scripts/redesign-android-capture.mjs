/**
 * redesign-android-capture.mjs - real-device-style captures (adb screencap, with Android status bar) of a slice
 * in Chrome on the emulator, API mocked over CDP. Same setup as redesign-android-frames.mjs.
 * Usage: node scripts/redesign-android-capture.mjs slice-1
 */
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const SLICE = process.argv[2] || 'slice-1'
const OUT = path.join('docs/redesign/screens', SLICE, 'android')
const BASE = 'http://localhost:3020'
const API = 'http://localhost:4010'
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
}
const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.connectOverCDP('http://localhost:9222')
  const page = browser.contexts()[0].pages().find((p) => p.url().startsWith(BASE))
  await page.bringToFront()
  let shot
  await page.route(`${API}/**`, (route) => {
    const p = new URL(route.request().url()).pathname
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    const body = p === '/v1/profile/onboarding' ? Object.fromEntries(['personal', 'fitness', 'nutrition'].map((m) => [m, { complete: shot.done.includes(m) }]))
      : p === '/v1/profile' ? { ai_consent_at: shot.consent === false ? null : 'x', health_disclaimer_ack_at: shot.consent === false ? null : 'x' }
      : p.startsWith('/v1/plans') ? PLANS : {}
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  })
  for (shot of SHOTS[SLICE]) {
    await page.evaluate(([auth, draft]) => { localStorage.setItem('nextmealai-auth', JSON.stringify(auth)); localStorage.setItem('fiqr-onboarding-draft', JSON.stringify({ state: draft, version: 0 })) }, [AUTH, FULL])
    await page.goto(BASE + shot.url, { waitUntil: 'load' })
    await page.waitForTimeout(2500)
    fs.writeFileSync(path.join(OUT, `${shot.name}.png`), execFileSync(ADB, ['exec-out', 'screencap', '-p']))
    console.log(shot.name)
  }
  await browser.close().catch(() => {})
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
