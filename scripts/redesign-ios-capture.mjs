/**
 * redesign-ios-capture.mjs - capture slice screens in Safari on the booted iOS simulator (real WebKit, real status bar).
 * Setup:
 *   node scripts/redesign-mock-api.mjs 4011
 *   NEXT_PUBLIC_CORE_API_URL=http://localhost:4011 npx next dev -p 3021
 *   xcrun simctl boot "iPhone 16 Pro" && xcrun simctl openurl booted http://localhost:3021/login
 *   ios_webkit_debug_proxy -s unix:<webinspectord_sim socket> -c null:9300,:9301-9310
 * Usage: node scripts/redesign-ios-capture.mjs slice-1
 * Writes docs/redesign/screens/<slice>/ios/<shot>.png
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const SLICE = process.argv[2] || 'slice-1'
const OUT = path.join('docs/redesign/screens', SLICE, 'ios')
const APP = 'http://localhost:3021'
const MOCK = 'http://localhost:4011'
const AUTH = { state: { user: { id: 'capture-user', email: 'capture@example.com' }, accessToken: 'capture-token', refreshToken: 'capture-refresh' }, version: 0 }
const EMPTY = { name: '', sex: null, dob: '', heightCm: null, goal: null, activity: null, frequency: null, experience: null, equipment: [], injuries: [], weightKg: null, targetKg: null, allergies: [], diet: null, dislikes: [], cuisines: [], meals: null }
const FULL = { name: 'Sam', sex: 'female', dob: '1994-03-12', heightCm: 168, goal: 'fat_loss', activity: 'moderate', frequency: 4, experience: 'intermediate', equipment: ['Dumbbells', 'Bench'], injuries: ['Lower back'], weightKg: 78.2, targetKg: 72, allergies: ['Nuts'], diet: 'omnivore', dislikes: ['Mushrooms'], cuisines: ['Indian', 'Italian'], meals: 3 }
const MODULE = { name: 'personal', sex: 'personal', dob: 'personal', height: 'personal', goal: 'fitness', activity: 'fitness', frequency: 'fitness', experience: 'fitness', equipment: 'fitness', injuries: 'fitness', weight: 'nutrition', target: 'nutrition', reflection: 'nutrition', allergies: 'nutrition', diet: 'nutrition', dislikes: 'nutrition', cuisines: 'nutrition', meals: 'nutrition' }

const SHOTS = {
  'slice-1': [
    ...Object.keys(MODULE).map((id) => ({ name: `ob-${id}`, url: `/onboarding/${MODULE[id]}?q=${id}`, draft: FULL, scenario: { done: [], consent: true, plans: 'full' } })),
    { name: 'ob-weight-empty', url: '/onboarding/nutrition?q=weight', draft: EMPTY, scenario: { done: [] } },
    { name: 'consent', url: '/onboarding/consent', draft: EMPTY, scenario: { done: ['personal', 'fitness', 'nutrition'], consent: false } },
    { name: 'generating', url: '/onboarding/generating', draft: EMPTY, scenario: { done: ['personal', 'fitness', 'nutrition'], consent: true, plans: 'slow' } },
    { name: 'reveal', url: '/onboarding/review', draft: EMPTY, scenario: { done: ['personal', 'fitness', 'nutrition'], consent: true, plans: 'full' } },
    { name: 'reveal-empty', url: '/onboarding/review', draft: EMPTY, scenario: { done: ['personal', 'fitness', 'nutrition'], consent: true, plans: 'none' } },
  ],
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function page() {
  const list = await fetch('http://localhost:9301/json').then((r) => r.json())
  const target = list.find((p) => p.url.startsWith(APP))
  if (!target) throw new Error('No Safari tab on ' + APP)
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  // iOS 18 Web Inspector wraps page domains in Target.*: wait for the page target, then tunnel messages to it.
  let targetId = null
  let id = 0
  const pending = new Map()
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    if (d.method === 'Target.targetCreated') targetId = d.params.targetInfo.targetId
    if (d.method === 'Target.dispatchMessageFromTarget') {
      const inner = JSON.parse(d.params.message)
      if (inner.id && pending.has(inner.id)) { pending.get(inner.id)(inner); pending.delete(inner.id) }
    }
  }
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  for (let i = 0; i < 50 && !targetId; i++) await sleep(50)
  const evaluate = (expression) => new Promise((res) => {
    const i = ++id
    pending.set(i, res)
    ws.send(JSON.stringify({ id: 100000 + i, method: 'Target.sendMessageToTarget', params: { targetId, message: JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression } }) } }))
    setTimeout(() => { if (pending.has(i)) { pending.delete(i); res(null) } }, 4000)
  })
  return { evaluate, close: () => ws.close() }
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  for (const shot of SHOTS[SLICE]) {
    await fetch(MOCK + '/__scenario', { method: 'POST', body: JSON.stringify({ fail: null, ...shot.scenario }) })
    const p = await page()
    await p.evaluate(`localStorage.setItem('nextmealai-auth', ${JSON.stringify(JSON.stringify(AUTH))}); localStorage.setItem('fiqr-onboarding-draft', ${JSON.stringify(JSON.stringify({ state: shot.draft, version: 0 }))}); location.href = ${JSON.stringify(APP + shot.url)}; 1`)
    p.close()
    await sleep(3500)
    // Hide the Next.js dev indicator so it does not sit in the capture.
    const q = await page()
    await q.evaluate(`(() => { const s = document.createElement('style'); s.textContent = 'nextjs-portal{display:none!important}'; document.head.appendChild(s); return 1 })()`)
    q.close()
    await sleep(600)
    const file = path.join(OUT, `${shot.name}.png`)
    execFileSync('xcrun', ['simctl', 'io', 'booted', 'screenshot', file], { stdio: 'ignore' })
    console.log(file)
  }
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
