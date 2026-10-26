// Slice O (Spatial build, 27 Oct 2026): welcome, sign-in and setup on the Aurora, stepping in depth (mocks/aurora-onboarding.html).
// Shots: node scripts/redesign-capture.mjs slice-1c   Transitions: node scripts/redesign-transitions.mjs slice-1c

const EMPTY = { name: '', sex: null, dob: '', heightCm: null, goal: null, activity: null, frequency: null, experience: null, equipment: [], injuries: [], weightKg: null, targetKg: null, allergies: [], diet: null, dislikes: [], cuisines: [], meals: null }
const FULL = {
  name: 'Sam', sex: 'female', dob: '1994-03-12', heightCm: 168, goal: 'fat_loss', activity: 'moderate', frequency: 4, experience: 'intermediate',
  equipment: ['Dumbbells', 'Bench'], injuries: ['Lower back'], weightKg: 78.2, targetKg: 72, allergies: ['Nuts'], diet: 'omnivore',
  dislikes: ['Mushrooms'], cuisines: ['Indian', 'Italian'], meals: 3,
}
const STEPS = { name: 'personal', sex: 'personal', dob: 'personal', height: 'personal', goal: 'fitness', activity: 'fitness', frequency: 'fitness', experience: 'fitness', equipment: 'fitness', injuries: 'fitness', weight: 'nutrition', target: 'nutrition', reflection: 'nutrition', allergies: 'nutrition', diet: 'nutrition', dislikes: 'nutrition', cuisines: 'nutrition', meals: 'nutrition' }
const PLANS = [
  { id: 'meal-1', type: 'meal', is_active: true, name: 'Lean and steady', content: { daily_targets: { calories: 1950, protein: 140, carbs: 190, fat: 65 }, days: [] } },
  { id: 'work-1', type: 'workout', is_active: true, name: 'Four-day upper lower', content: { days: [{ name: 'Upper A', exercises: [1, 2, 3] }, { name: 'Lower A', exercises: [1, 2] }, { name: 'Upper B', exercises: [1, 2, 3] }, { name: 'Lower B', exercises: [1, 2] }] } },
]
const LONG_DAYS = [{ id: 'work-1', type: 'workout', is_active: true, name: 'x', content: { days: ['Upper body strength and conditioning', 'Lower body power', 'Full body hypertrophy circuit', 'Mobility and core', 'Posterior chain'].map((name) => ({ name, exercises: [1] })) } }, PLANS[0]]

/** Settle the welcome on beat i with the arrow keys. */
async function beatTo(page, i) {
  const region = page.getByLabel('What FIQR does')
  await region.focus()
  for (let n = 0; n < i; n++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(120) }
  await region.evaluate((el) => el.blur()) // keyboard drove it; drop the focus ring from the still
  await page.waitForTimeout(2400)
}
const fill = async (page, fields) => { for (const [label, value] of Object.entries(fields)) await page.getByLabel(label, { exact: true }).fill(value) }
const press = async (page, name) => { await page.getByRole('button', { name, exact: true }).click(); await page.waitForTimeout(900) }

/** Pointer drag on the welcome: from x0 to x1 in `steps` moves `ms` apart, optionally dragging back to `back` before release. */
async function drag(page, x0, x1, steps, ms, { back = null } = {}) {
  const y = 470
  await page.mouse.move(x0, y)
  await page.mouse.down()
  for (let s = 1; s <= steps; s++) { await page.mouse.move(x0 + ((x1 - x0) * s) / steps, y); await page.waitForTimeout(ms) }
  if (back !== null) for (let s = 1; s <= steps; s++) { await page.mouse.move(x1 + ((back - x1) * s) / steps, y); await page.waitForTimeout(ms) }
  await page.mouse.up()
}

/** A flick dispatched inside the page on a 16 ms timer, so slow CDP round trips cannot turn it into a slow drag. */
function flick(page, x0, x1, steps) {
  return page.evaluate(([x0, x1, steps]) => new Promise((done) => {
    const el = document.querySelector('[aria-label="What FIQR does"]')
    const ev = (type, x) => (type === 'pointerdown' ? el : window).dispatchEvent(new PointerEvent(type, { clientX: x, clientY: 470, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1, bubbles: true }))
    ev('pointerdown', x0)
    let s = 0
    const id = setInterval(() => {
      s += 1
      const x = x0 + ((x1 - x0) * s) / steps
      ev('pointermove', x)
      if (s === steps) { clearInterval(id); ev('pointerup', x); done() }
    }, 16)
  }), [x0, x1, steps])
}

/** Plans for the reveal and the generate call, for transitions (their default stub returns {} for every path). */
const planRoutes = (page) => page.route('http://localhost:4010/v1/plans**', (route) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' }
  if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
  return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(new URL(route.request().url()).pathname.includes('generate') ? {} : PLANS) })
})

const slice = {
  shots: [
    ...[0, 1, 2, 3].map((i) => ({ name: `welcome-${i + 1}`, url: '/welcome', guest: true, act: (p) => beatTo(p, i) })),
    { name: 'welcome-offline', url: '/welcome', guest: true, offline: true },
    { name: 'login-empty', url: '/login', guest: true },
    { name: 'login-filled', url: '/login', guest: true, act: (p) => fill(p, { Email: 'sam@example.com', Password: 'correct horse' }) },
    { name: 'login-invalid', url: '/login', guest: true, act: (p) => press(p, 'Sign in') },
    { name: 'login-error', url: '/login', guest: true, fail: '/auth/login', failStatus: 401, failMessage: 'Invalid login credentials', act: async (p) => { await fill(p, { Email: 'sam@example.com', Password: 'wrong password' }); await press(p, 'Sign in') } },
    { name: 'signup-empty', url: '/signup', guest: true },
    { name: 'signup-filled', url: '/signup', guest: true, act: (p) => fill(p, { Email: 'sam@example.com', Password: 'longenough1', 'Confirm password': 'longenough1' }) },
    { name: 'signup-invalid', url: '/signup', guest: true, act: async (p) => { await fill(p, { Email: 'sam@', Password: 'short', 'Confirm password': 'other' }); await press(p, 'Create account') } },
    { name: 'signup-error', url: '/signup', guest: true, fail: '/auth/signup', failStatus: 400, failMessage: 'User already registered', act: async (p) => { await fill(p, { Email: 'sam@example.com', Password: 'longenough1', 'Confirm password': 'longenough1' }); await press(p, 'Create account') } },
    { name: 'forgot-empty', url: '/forgot-password', guest: true },
    { name: 'forgot-sent', url: '/forgot-password', guest: true, act: async (p) => { await fill(p, { Email: 'a.very.long.address.for.testing@example-company.com.au' }); await press(p, 'Send reset link') } },
    { name: 'reset-expired', url: '/reset-password', guest: true },
    { name: 'reset-valid', url: '/reset-password#access_token=capture&type=recovery', guest: true },
    ...Object.keys(STEPS).flatMap((id) => [
      { name: `ob-${id}-empty`, url: `/onboarding/${STEPS[id]}?q=${id}`, draft: { ...EMPTY, goal: id === 'target' || id === 'reflection' ? 'fat_loss' : null, weightKg: id === 'target' || id === 'reflection' ? 78.2 : null, targetKg: id === 'reflection' ? 72 : null } },
      { name: `ob-${id}-filled`, url: `/onboarding/${STEPS[id]}?q=${id}`, draft: FULL },
    ]),
    { name: 'ob-height-error', url: '/onboarding/personal?q=height', draft: FULL, fail: '/v1/profile/onboarding/personal', act: (p) => press(p, 'Continue') },
    { name: 'consent', url: '/onboarding/consent' },
    { name: 'generating', url: '/onboarding/generating', hangPlans: true },
    { name: 'reveal', url: '/onboarding/review' },
    { name: 'reveal-long-days', url: '/onboarding/review', api: { plans: LONG_DAYS } },
    { name: 'reveal-no-plan', url: '/onboarding/review', noPlans: true },
    { name: 'reveal-error', url: '/onboarding/review', fail: '/v1/plans' },
  ],
  transitions: [
    { name: 'welcome-first-paint', url: '/signup', guest: true, act: (p) => p.goto(new URL('/welcome', p.url()).href) },
    { name: 'welcome-continue', url: '/welcome', guest: true, act: (p) => p.getByRole('button', { name: 'Continue' }).click() },
    // Double tap mid-flight: the second tap retargets from the live value.
    { name: 'welcome-double-continue', url: '/welcome', guest: true, act: async (p) => { const b = p.getByRole('button', { name: 'Continue' }); await b.click(); await p.waitForTimeout(90); await b.click() } },
    // Slow scrub past halfway, drift back, release with almost no velocity: settles back on beat 1.
    { name: 'welcome-drag-scrub', url: '/welcome', guest: true, act: (p) => drag(p, 330, 100, 40, 16, { back: 260 }) },
    { name: 'welcome-drag-release', url: '/welcome', guest: true, act: (p) => drag(p, 340, 110, 36, 16) },
    { name: 'welcome-flick', url: '/welcome', guest: true, act: (p) => flick(p, 300, 220, 3) },
    { name: 'welcome-back', url: '/welcome', guest: true, act: async (p) => { await p.getByRole('button', { name: 'Continue' }).click(); await p.waitForTimeout(900); await p.getByRole('button', { name: 'Back' }).click() } },
    { name: 'welcome-to-signup', url: '/welcome', guest: true, warm: '/signup', act: async (p) => { await beatTo(p, 3); await p.getByRole('button', { name: 'Get started' }).click() } },
    { name: 'welcome-to-login', url: '/welcome', guest: true, warm: '/login', act: (p) => p.getByRole('button', { name: 'I have an account' }).click() },
    { name: 'login-to-welcome', url: '/login', guest: true, warm: '/welcome', act: (p) => p.getByRole('button', { name: 'Back' }).click() },
    { name: 'login-to-forgot', url: '/login', guest: true, warm: '/forgot-password', act: (p) => p.getByRole('button', { name: 'Forgot password?' }).click() },
    { name: 'forgot-sent', url: '/forgot-password', guest: true, act: async (p) => { await p.getByLabel('Email', { exact: true }).fill('sam@example.com'); await p.getByRole('button', { name: 'Send reset link' }).click() } },
    { name: 'signup-to-setup', url: '/signup', guest: true, warm: '/onboarding/personal', act: async (p) => { await fill(p, { Email: 'sam@example.com', Password: 'longenough1', 'Confirm password': 'longenough1' }); await p.getByRole('button', { name: 'Create account' }).click() }, setup: (page) => page.route('http://localhost:4010/auth/signup', (r) => r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: JSON.stringify({ user: { id: 'capture-user', email: 'sam@example.com' }, session: { access_token: 'capture-token', refresh_token: 'capture-refresh' } }) })) },
    { name: 'name-to-sex', url: '/onboarding/personal?q=name', draft: { ...EMPTY, name: 'Sam' }, act: (p) => p.getByRole('button', { name: 'Continue' }).click() },
    { name: 'goal-autoadvance', url: '/onboarding/fitness?q=goal', draft: { ...EMPTY, name: 'Sam' }, act: (p) => p.getByRole('radio', { name: /^Lose fat/ }).click() },
    { name: 'step-back', url: '/onboarding/fitness?q=activity', draft: { ...EMPTY, goal: 'fat_loss' }, act: (p) => p.getByRole('button', { name: 'Back' }).click() },
    { name: 'module-forward', url: '/onboarding/personal?q=height', draft: FULL, warm: '/onboarding/fitness?q=goal', act: (p) => p.getByRole('button', { name: 'Continue' }).click() },
    { name: 'module-back', url: '/onboarding/fitness?q=goal', draft: FULL, warm: '/onboarding/personal?q=height', act: (p) => p.getByRole('button', { name: 'Back' }).click() },
    { name: 'generating-to-reveal', url: '/onboarding/consent', draft: FULL, warm: '/onboarding/review', setup: planRoutes, act: async (p) => { const tap = async (t) => { const b = await p.getByText(t, { exact: true }).boundingBox(); await p.mouse.click(b.x + 20, b.y + 8) }; await tap('I understand and agree'); for (let i = 0; i < 25; i++) { await p.mouse.wheel(0, 20); await p.waitForTimeout(16) } await p.waitForTimeout(400); await tap('I understand'); await p.getByRole('button', { name: 'I agree' }).click(); await p.waitForTimeout(1800) } },
    { name: 'reveal-to-today', url: '/onboarding/review', warm: '/dashboard', setup: planRoutes, act: async (p) => { await p.waitForTimeout(600); await p.getByRole('button', { name: 'Start' }).click() } },
  ],
}

export default slice
