/**
 * redesign-capture.mjs - capture redesign slices against a fully mocked API (no test account needed).
 * Usage (dev server on :3020): node scripts/redesign-capture.mjs slice-1 [filter]
 * Writes docs/redesign/screens/<slice>/<shot>-<width>.png and checks.json:
 *   axe serious/critical violations, tap targets under 44x44 CSS px, and orange-action count per shot.
 */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const BASE = process.env.BASE_URL || 'http://localhost:3020'
const API = process.env.API_URL || 'http://localhost:4010'
const SLICE = process.argv[2] || 'slice-1'
const FILTER = process.argv[3] ? new RegExp(process.argv[3]) : null
const OUT = path.join('docs/redesign/screens', SLICE)
const WIDTHS = [{ w: 390, h: 844 }, { w: 360, h: 800 }]

const AUTH = { state: { user: { id: 'capture-user', email: 'capture@example.com' }, accessToken: 'capture-token', refreshToken: 'capture-refresh' }, version: 0 }
const DRAFT_FULL = {
  name: 'Sam', sex: 'female', dob: '1994-03-12', heightCm: 168, goal: 'fat_loss', activity: 'moderate', frequency: 4, experience: 'intermediate',
  equipment: ['Dumbbells', 'Bench'], injuries: ['Lower back'], weightKg: 78.2, targetKg: 72, allergies: ['Nuts'], diet: 'omnivore',
  dislikes: ['Mushrooms'], cuisines: ['Indian', 'Italian'], meals: 3,
}
const LONG = 'Alexandria-Catherine Montgomery-Wellington'

const onboardingStatus = (done) => ({ personal: { complete: done.includes('personal') }, fitness: { complete: done.includes('fitness') }, nutrition: { complete: done.includes('nutrition') } })

// ── Slice 2 fixtures: a returning user with eight days of logs, and the variants Home must handle ──
const DAY_MS = 86400000
const isoDay = (offset) => new Date(Date.now() - offset * DAY_MS).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
const lg = (type, offset, payload, hour = 8) => ({ id: `${type}-${offset}-${hour}`, user_id: 'capture-user', type, payload, source: 'manual', local_date: isoDay(offset), created_at: `${isoDay(offset)}T0${hour % 10}:00:00.000Z`, updated_at: `${isoDay(offset)}T0${hour % 10}:00:00.000Z` })
const RETURNING_LOGS = [
  lg('food', 0, { food_name: 'Greek yoghurt and berries', meal_type: 'breakfast', calories: 310, protein_g: 24 }, 1),
  lg('food', 0, { food_name: 'Oat flat white', meal_type: 'breakfast', calories: 140 }, 2),
  lg('food', 0, { food_name: 'Chicken burrito bowl', meal_type: 'lunch', calories: 640 }, 3),
  lg('water', 0, { glasses: 3 }, 4), lg('water', 0, { glasses: 2 }, 5),
  lg('steps', 0, { steps: 8214 }, 6),
  lg('sleep', 0, { hours: 7.2, quality_rating: 7 }, 7),
  ...[1, 2, 3, 4, 5, 6].map((o) => lg('sleep', o, { hours: [6.5, 7.8, 5.9, 7.1, 8.2, 6.8][o - 1] })),
  ...[0, 2, 4, 7].map((o, i) => lg('weight', o, { weight_kg: [78.2, 78.5, 78.6, 79.0][i] }, 9)),
]
const LONG_NAME = 'Slow-roasted pumpkin, feta and toasted pepita salad with a lemon tahini dressing'
const HOME = {
  profile: { id: 'capture-user', full_name: 'Sam Rivera', ai_consent_at: '2026-10-24T00:00:00Z', health_disclaimer_ack_at: '2026-10-24T00:00:00Z', current_weight_kg: 78.2, daily_calorie_target: 1950, daily_protein_g: 140, daily_carbs_g: 190, daily_fat_g: 65, daily_targets_missing_fields: [] },
  summary: { period: 'day', summary: { total_logs: 9, avg_daily_calories: 1090, avg_daily_protein: 62, workout_count: 0, avg_sleep_hours: 7.2, avg_energy_rating: 0 }, daily_breakdown: [{ date: isoDay(0), calories: 1090, protein: 62, carbs: 118, fat: 41 }] },
  status: (state) => ({ state, week: { start: isoDay(6), end: isoDay(0), label: 'Week 3 · 20 to 26 Oct', number: 3 }, days_logged: state === 'insufficient' ? 2 : 6, days_needed: 4, next_check_in_date: isoDay(-3), days_to_go: 3, weight: { current_kg: 78.2, delta_week_kg: -0.8, points: [] }, week_so_far: { avg_calories: 1880, avg_protein_g: 121, sessions_done: 2, sessions_planned: 4, sleep_avg_h: 7.1, sleep_nights: 6 }, targets: { calories: 1950, protein_g: 140 }, verdict: null, proposal: null }),
  takeaway: 'Protein is 78 g short today. Greek yoghurt now or chicken at dinner closes it.',
}
const homeApi = (over = {}) => ({
  '/v1/logs/summary': HOME.summary,
  '/v1/logs': { logs: RETURNING_LOGS },
  '/v1/dashboard/check-in': { check_in: { days: [], takeaway: HOME.takeaway, generated_at: new Date().toISOString(), v: 2 } },
  '/v1/check-in/status': HOME.status('mid_week'),
  '/v1/suggestions': [],
  '/v1/profile': HOME.profile,
  ...over,
})
const FIRST_RUN_API = homeApi({
  '/v1/logs/summary': { period: 'day', summary: { total_logs: 0 }, daily_breakdown: [] },
  '/v1/logs': { logs: [] },
  '/v1/dashboard/check-in': { check_in: null },
  '/v1/check-in/status': HOME.status('insufficient'),
  '/v1/profile': { ...HOME.profile, current_weight_kg: null },
  plans: [],
})

/** Each shot: url, draft (localStorage), api overrides, optional act. */
const STEP_MODULE = { name: 'personal', sex: 'personal', dob: 'personal', height: 'personal', goal: 'fitness', activity: 'fitness', frequency: 'fitness', experience: 'fitness', equipment: 'fitness', injuries: 'fitness', weight: 'nutrition', target: 'nutrition', reflection: 'nutrition', allergies: 'nutrition', diet: 'nutrition', dislikes: 'nutrition', cuisines: 'nutrition', meals: 'nutrition' }
const SHOTS = {
  'slice-1': [
    ...Object.keys(STEP_MODULE).flatMap((id) => [
      { name: `ob-${id}-empty`, url: `/onboarding/${STEP_MODULE[id]}?q=${id}`, draft: { ...emptyDraft(), goal: id === 'target' || id === 'reflection' ? 'fat_loss' : null, weightKg: id === 'target' || id === 'reflection' ? 78.2 : null, targetKg: id === 'reflection' ? 72 : null } },
      { name: `ob-${id}-filled`, url: `/onboarding/${STEP_MODULE[id]}?q=${id}`, draft: DRAFT_FULL },
    ]),
    { name: 'ob-name-long', url: '/onboarding/personal?q=name', draft: { ...DRAFT_FULL, name: LONG } },
    { name: 'ob-reflection-gain', url: '/onboarding/nutrition?q=reflection', draft: { ...DRAFT_FULL, goal: 'muscle_gain', targetKg: 82 } },
    { name: 'ob-height-error', url: '/onboarding/personal?q=height', draft: DRAFT_FULL, fail: '/v1/profile/onboarding/personal', act: async (p) => { await p.getByRole('button', { name: 'Continue' }).click(); await p.waitForTimeout(900) } },
    { name: 'ob-height-offline', url: '/onboarding/personal?q=height', draft: DRAFT_FULL, offline: true },
    { name: 'consent', url: '/onboarding/consent', consent: false, done: ['personal', 'fitness', 'nutrition'] },
    { name: 'generating', url: '/onboarding/generating', done: ['personal', 'fitness', 'nutrition'], hangPlans: true },
    { name: 'reveal', url: '/onboarding/review', done: ['personal', 'fitness', 'nutrition'] },
    { name: 'reveal-empty', url: '/onboarding/review', done: ['personal', 'fitness', 'nutrition'], noPlans: true },
    { name: 'reveal-error', url: '/onboarding/review', done: ['personal', 'fitness', 'nutrition'], fail: '/v1/plans' },
  ],
  'slice-2': [
    { name: 'home', url: '/dashboard', api: homeApi() },
    { name: 'home-scrolled', url: '/dashboard', api: homeApi(), act: async (p) => { await p.mouse.wheel(0, 900); await p.waitForTimeout(700) } },
    { name: 'home-first-run', url: '/dashboard', api: FIRST_RUN_API },
    { name: 'home-checkin-due', url: '/dashboard', api: homeApi({ '/v1/check-in/status': HOME.status('due') }) },
    { name: 'home-long', url: '/dashboard', api: homeApi({ '/v1/logs': { logs: [...RETURNING_LOGS, lg('food', 0, { food_name: LONG_NAME, meal_type: 'dinner', calories: 1420 }, 8)] }, '/v1/logs/summary': { ...HOME.summary, daily_breakdown: [{ date: isoDay(0), calories: 2510, protein: 171, carbs: 260, fat: 98 }] }, '/v1/dashboard/check-in': { check_in: { days: [], takeaway: 'You went 560 kcal over today, mostly from dinner. Keep tomorrow steady and lean on protein at breakfast so the week still lands on target.', generated_at: new Date().toISOString(), v: 2 } } }) },
    { name: 'home-loading', url: '/dashboard', api: homeApi(), hang: ['/v1/logs', '/v1/plans', '/v1/dashboard', '/v1/check-in'] },
    { name: 'home-error', url: '/dashboard', api: homeApi(), fail: ['/v1/logs/summary', '/v1/plans'], failAfterFirst: ['/v1/profile'] },
    { name: 'home-offline', url: '/dashboard', api: homeApi(), offline: true },
    { name: 'plus-sheet', url: '/dashboard', api: homeApi(), act: async (p) => { await p.getByRole('button', { name: 'Log something' }).click(); await p.waitForTimeout(800) } },
    { name: 'plus-sheet-typed', url: '/dashboard', api: homeApi(), act: async (p) => { await p.getByRole('button', { name: 'Log something' }).click(); await p.waitForTimeout(500); await p.getByLabel('Tell Geo what you ate or did').fill('2 eggs and toast with butter') } },
    { name: 'macro-sheet', url: '/dashboard', api: homeApi(), act: async (p) => { await p.getByRole('button', { name: /^Protein/ }).click(); await p.waitForTimeout(800) } },
    ...['Weight', 'Water', 'Sleep'].map((t) => ({ name: `quicklog-${t.toLowerCase()}`, url: '/dashboard', api: homeApi(), act: async (p) => { await p.getByRole('button', { name: new RegExp(`^${t}`) }).click(); await p.waitForTimeout(800) } })),
    { name: 'tabs-food', url: '/food', api: homeApi() },
    { name: 'tabs-train', url: '/train', api: homeApi() },
    { name: 'tabs-geo', url: '/chat', api: homeApi() },
  ],
  'slice-1b': [
    ...[0, 1, 2, 3].map((i) => ({ name: `welcome-${i + 1}`, url: '/welcome', guest: true, act: (p) => slideTo(p, i) })),
    { name: 'welcome-offline', url: '/welcome', guest: true, offline: true },
    { name: 'login-empty', url: '/login', guest: true },
    { name: 'login-filled', url: '/login', guest: true, act: (p) => fill(p, { Email: 'sam@example.com', Password: 'correct horse' }) },
    { name: 'login-invalid', url: '/login', guest: true, act: (p) => submit(p, 'Sign in') },
    { name: 'login-error', url: '/login', guest: true, fail: '/auth/login', failStatus: 401, failMessage: 'Invalid login credentials', act: async (p) => { await fill(p, { Email: 'sam@example.com', Password: 'wrong password' }); await submit(p, 'Sign in') } },
    { name: 'login-offline', url: '/login', guest: true, offline: true },
    { name: 'signup-empty', url: '/signup', guest: true },
    { name: 'signup-filled', url: '/signup', guest: true, act: (p) => fill(p, { Email: 'sam@example.com', Password: 'longenough1', 'Confirm password': 'longenough1' }) },
    { name: 'signup-invalid', url: '/signup', guest: true, act: async (p) => { await fill(p, { Email: 'sam@', Password: 'short', 'Confirm password': 'other' }); await submit(p, 'Create account') } },
    { name: 'signup-error', url: '/signup', guest: true, fail: '/auth/signup', failStatus: 400, failMessage: 'User already registered', act: async (p) => { await fill(p, { Email: 'sam@example.com', Password: 'longenough1', 'Confirm password': 'longenough1' }); await submit(p, 'Create account') } },
    { name: 'forgot-empty', url: '/forgot-password', guest: true },
    { name: 'forgot-invalid', url: '/forgot-password', guest: true, act: (p) => submit(p, 'Send reset link') },
    { name: 'forgot-sent', url: '/forgot-password', guest: true, act: async (p) => { await fill(p, { Email: 'sam@example.com' }); await submit(p, 'Send reset link') } },
    { name: 'reset-expired', url: '/reset-password', guest: true },
    { name: 'reset-valid', url: '/reset-password#access_token=capture&type=recovery', guest: true },
    { name: 'reset-invalid', url: '/reset-password#access_token=capture&type=recovery', guest: true, act: async (p) => { await fill(p, { 'New password': 'longenough1', 'Confirm new password': 'different1' }); await submit(p, 'Update password') } },
    { name: 'reset-error', url: '/reset-password#access_token=capture&type=recovery', guest: true, fail: '/auth/update-password', failStatus: 401, failMessage: 'This reset link has already been used', act: async (p) => { await fill(p, { 'New password': 'longenough1', 'Confirm new password': 'longenough1' }); await submit(p, 'Update password') } },
  ],
}

// Per-slice tables live in scripts/shots/<slice>.mjs (default export: { shots, transitions }) so parallel slice work never edits this file.
const sliceFile = path.resolve('scripts/shots', `${SLICE}.mjs`)
if (!SHOTS[SLICE] && fs.existsSync(sliceFile)) SHOTS[SLICE] = (await import(pathToFileURL(sliceFile).href)).default.shots ?? []

async function fill(page, fields) {
  for (const [label, value] of Object.entries(fields)) await page.getByLabel(label, { exact: true }).fill(value)
}
async function submit(page, name) {
  await page.getByRole('button', { name, exact: true }).click()
  await page.waitForTimeout(900)
}
async function slideTo(page, i) {
  await page.evaluate((n) => { const el = document.querySelector('[aria-roledescription=carousel]'); el.scrollLeft = n * el.clientWidth }, i)
  await page.waitForTimeout(2400)
}

function emptyDraft() {
  return { name: '', sex: null, dob: '', heightCm: null, goal: null, activity: null, frequency: null, experience: null, equipment: [], injuries: [], weightKg: null, targetKg: null, allergies: [], diet: null, dislikes: [], cuisines: [], meals: null }
}

const PLANS = [
  { id: 'meal-1', type: 'meal', is_active: true, name: 'Lean and steady', content: { daily_targets: { calories: 1950, protein: 140, carbs: 190, fat: 65 }, days: [] } },
  { id: 'work-1', type: 'workout', is_active: true, name: 'Four-day upper lower', content: { days: [{ name: 'Upper A', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower A', exercises: [1, 2, 3, 4] }, { name: 'Upper B', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower B', exercises: [1, 2, 3, 4] }] } },
]


const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
const json = (route, status, body) => route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) })

async function mockApi(page, shot) {
  const seen = {}
  await page.route(`${API}/**`, async (route) => {
    const req = route.request()
    const p = new URL(req.url()).pathname
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    if (shot.hang && shot.hang.some((h) => p.startsWith(h))) return new Promise(() => {})
    const fails = [].concat(shot.fail ?? [])
    // failAfterFirst: the auth gate's first read succeeds, the screen's own read fails.
    for (const f of shot.failAfterFirst ?? []) if (p.startsWith(f) && req.method() === 'GET') { seen[f] = (seen[f] ?? 0) + 1; if (seen[f] > 1) fails.push(f) }
    if (fails.some((f) => p.startsWith(f))) return json(route, shot.failStatus ?? 500, { error: true, code: 'INTERNAL', message: shot.failMessage ?? "We couldn't save that. Check your connection and try again." })
    if (shot.api) {
      const key = Object.keys(shot.api).filter((k) => k.startsWith('/') && (p === k || p.startsWith(k + '/'))).sort((a, b) => b.length - a.length)[0]
      if (key && !(key === '/v1/logs' && p.startsWith('/v1/logs/summary'))) return json(route, 200, shot.api[key])
      if (p.startsWith('/v1/plans') && shot.api.plans) return json(route, 200, shot.api.plans)
    }
    if (p === '/v1/profile/onboarding') return json(route, 200, onboardingStatus(shot.done ?? []))
    if (p === '/v1/profile') return json(route, 200, { id: 'capture-user', name: 'Sam', ai_consent_at: shot.consent === false ? null : '2026-10-24T00:00:00Z', health_disclaimer_ack_at: shot.consent === false ? null : '2026-10-24T00:00:00Z' })
    if (p.startsWith('/v1/plans/generate')) return shot.hangPlans ? new Promise(() => {}) : json(route, 200, {})
    if (p.startsWith('/v1/plans')) return json(route, 200, shot.noPlans ? [] : PLANS)
    return json(route, 200, {})
  })
}

async function checks(page) {
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => ({ id: v.id, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }))
  const small = await page.evaluate(() => [...document.querySelectorAll('button, a[href], input, select, textarea, [role="radio"], [role="checkbox"]')]
    .filter((el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && el.closest('[aria-hidden="true"]') === null })
    .map((el) => { const r = el.getBoundingClientRect(); return { el: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) } })
    .filter((t) => t.w < 44 || t.h < 44))
  const orange = await page.evaluate(() => [...document.querySelectorAll('button, a')].filter((el) => getComputedStyle(el).backgroundColor === 'rgb(232, 98, 42)' && el.getBoundingClientRect().width > 0).length)
  return { axe: serious, smallTargets: small, orangeActions: orange }
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const results = []
  for (const shot of SHOTS[SLICE].filter((s) => !FILTER || FILTER.test(s.name))) {
    for (const size of WIDTHS) {
      const context = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'Australia/Sydney', reducedMotion: 'reduce' })
      await context.addInitScript(([auth, draft]) => {
        if (auth) localStorage.setItem('nextmealai-auth', JSON.stringify(auth))
        if (draft) localStorage.setItem('fiqr-onboarding-draft', JSON.stringify({ state: draft, version: 0 }))
        const hide = () => { const s = document.createElement('style'); s.textContent = 'nextjs-portal{display:none!important}'; document.head.appendChild(s) }
        document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', hide) : hide()
      }, [shot.guest ? null : AUTH, shot.draft ?? null])
      const page = await context.newPage()
      await mockApi(page, shot)
      const file = path.join(OUT, `${shot.name}-${size.w}.png`)
      try {
        await page.goto(BASE + shot.url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {})
        await page.waitForTimeout(900)
        if (shot.act) await shot.act(page).catch((e) => console.warn(shot.name, 'act failed:', e.message.split('\n')[0]))
        if (shot.offline) { await context.setOffline(true); await page.waitForTimeout(800) }
        await page.screenshot({ path: file })
        const c = await checks(page)
        results.push({ shot: shot.name, width: size.w, url: page.url().replace(BASE, ''), ...c })
        console.log(`${shot.name} ${size.w} axe:${c.axe.map((v) => v.id).join(',') || 0} small:${c.smallTargets.length} orange:${c.orangeActions}`)
      } finally {
        await context.close()
      }
    }
  }
  const prev = FILTER && fs.existsSync(path.join(OUT, 'checks.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'checks.json'), 'utf8')).filter((r) => !results.some((x) => x.shot === r.shot && x.width === r.width)) : []
  fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify([...prev, ...results].sort((a, b) => (a.shot + a.width).localeCompare(b.shot + b.width)), null, 2))
  await browser.close()
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
