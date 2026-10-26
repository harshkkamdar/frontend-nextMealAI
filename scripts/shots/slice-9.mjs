/**
 * Slice 9 shots and transitions: Settings, Profile, delete sheet, paywall, public pages, 404, crash, confirm dialog,
 * offline band. Loaded by scripts/redesign-capture.mjs and scripts/redesign-transitions.mjs (`slice-9`).
 *
 * Native states (Health section, subscription rows, every paywall state) need a phone, so `native()` fakes the
 * Capacitor iOS bridge in the page: platform reads "ios" and plugin calls are answered from the config below.
 * Nothing reaches a real store or the real API; every API read is mocked by route interception.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:3020'
const API = process.env.API_URL || 'http://localhost:4010'
const DAY_MS = 86400000
const isoDay = (offset) => new Date(Date.now() - offset * DAY_MS).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
const LONG = 'Alexandria-Catherine Montgomery-Wellington'

const ONBOARDED = { personal: { complete: true }, fitness: { complete: true }, nutrition: { complete: true } }
const PROFILE = {
  id: 'capture-user', user_id: 'capture-user', full_name: 'Sam Rivera', ai_consent_at: '2026-10-24T00:00:00Z', health_disclaimer_ack_at: '2026-10-24T00:00:00Z',
  dob: '1994-03-12', sex: 'female', height_cm: 168, current_weight_kg: 78.2, target_weight_kg: 72, primary_goal: 'fat_loss', activity_level: 'moderate',
  dietary_style: 'omnivore', equipment: ['Dumbbells', 'Bench'], injuries: ['Lower back'], daily_calorie_target: 1950, daily_protein_g: 140, daily_carbs_g: 190,
  daily_fat_g: 65, daily_targets_missing_fields: [], timezone: 'Australia/Sydney', created_at: '', updated_at: '',
}
const SETTINGS = {
  id: 'settings-1', user_id: 'capture-user', notifications_enabled: true, notification_time: '07:30', notification_types: [], geo_personality: 'balanced',
  auto_apply_suggestions: false, auto_apply_threshold: 0.8, check_in_weekday: 0, share_progress: false, analytics_enabled: false, rest_timer_seconds: 90,
  created_at: '', updated_at: '',
}
const api = (over = {}) => ({ '/v1/profile/onboarding': ONBOARDED, '/v1/profile': PROFILE, '/v1/settings': SETTINGS, ...over })
const LONG_PROFILE = { ...PROFILE, full_name: LONG, injuries: ['Lower back, flares after long runs and heavy deadlifts', 'Left knee (patellar tendinopathy)'] }
const MISSING_PROFILE = { ...PROFILE, height_cm: null, daily_calorie_target: null, daily_protein_g: null, daily_carbs_g: null, daily_fat_g: null, daily_targets_missing_fields: ['height_cm'] }

const PRODUCTS = [
  { identifier: 'app.fiqr.plus.monthly', title: 'FIQR Plus Monthly', priceString: '$14.99' },
  { identifier: 'app.fiqr.plus.yearly', title: 'FIQR Plus Yearly', priceString: '$99.99' },
]

/** Runs in the page before the app: an iOS-looking Capacitor bridge answered from `cfg`. */
function fakeNative(cfg) {
  const store = { 'fiqr:push-prompted': '1' }
  if (cfg.health) { store['fiqr:health-connected'] = '1'; store['fiqr:health-last-sync'] = new Date(Date.now() - 42 * 60000).toISOString() }
  const never = () => new Promise(() => {})
  const handlers = {
    Preferences: {
      get: ({ key }) => ({ value: key in store ? store[key] : localStorage.getItem(key) }),
      set: ({ key, value }) => { localStorage.setItem(key, value); return {} },
      remove: ({ key }) => { localStorage.removeItem(key); return {} },
    },
    NativePurchases: {
      getProducts: () => (cfg.hangProducts ? never() : { products: cfg.products ?? [] }),
      getPurchases: () => ({ purchases: cfg.subscribed ? [{ productIdentifier: 'app.fiqr.plus.yearly', isActive: true }] : [] }),
      purchaseProduct: () => (cfg.purchase === 'hang' ? never() : Promise.reject(new Error('Purchase failed'))),
      restorePurchases: () => ({}),
      manageSubscriptions: () => ({}),
    },
    Network: { getStatus: () => ({ connected: true, connectionType: 'wifi' }) },
  }
  const NAMES = ['App', 'Camera', 'Filesystem', 'Haptics', 'HealthPlugin', 'Keyboard', 'LocalNotifications', 'NativePurchases', 'Network', 'Preferences', 'PushNotifications', 'SplashScreen', 'SystemBars']
  window.webkit = { messageHandlers: { bridge: { postMessage() {} } } }
  window.Capacitor = {
    PluginHeaders: { find: (match) => NAMES.map((name) => ({ name, methods: { find: () => ({ rtype: 'promise' }) } })).find(match) },
    nativePromise: async (plugin, method, options) => {
      if (method === 'addListener') return { remove: async () => {} }
      const fn = handlers[plugin]?.[method]
      return fn ? fn(options || {}) : {}
    },
    nativeCallback: () => 'callback',
  }
}

/** Act prefix: reload the page as the fake iOS app. */
const native = (cfg = {}, then) => async (p) => {
  const url = p.url()
  await p.addInitScript(fakeNative, cfg)
  // shortcut: under the dev server the Preferences chunk loads slower than the layout's first API read, so the
  // first native load loses the session; the router then lands on /dashboard with the bridge loaded, and a soft
  // navigation reaches the screen. Likely a dev-server timing artifact (device chunks are local); unverified on device.
  await p.reload({ waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(1200)
  if (p.url() !== url) {
    await p.evaluate((target) => window.next.router.push(target), new URL(url).pathname)
    await p.waitForURL(url).catch(() => {})
    await p.waitForTimeout(1200)
  }
  if (then) await then(p)
}
const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
const wait = (ms) => (p) => p.waitForTimeout(ms)
const scrollToBottom = async (p) => { await p.mouse.wheel(0, 4000); await p.waitForTimeout(800) }

/** Opens a settings menu row by name (scrolled into view first). */
const openMenu = (name) => async (p) => { const row = p.getByRole('button', { name }); await row.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await row.click(); await p.waitForTimeout(700) }
/** The settings write fails while the read stays fine, then a switch is flipped: the save-failed capsule with Retry. */
const saveFails = async (p) => {
  await p.route(`${API}/v1/settings`, (r) => (r.request().method() === 'GET' || r.request().method() === 'OPTIONS' ? r.fallback() : r.fulfill({ status: 500, headers: { ...cors, 'content-type': 'application/json' }, body: '{"error":true}' })))
  await p.getByRole('switch', { name: 'Push notifications' }).click(); await p.waitForTimeout(900)
}
/** Three changes waiting in the offline queue (as left by a log made offline), then the page reloads to read them. */
const queued = async (p) => {
  await p.evaluate(() => localStorage.setItem('fiqr-offline-queue', JSON.stringify({ state: { items: [1, 2, 3].map((i) => ({ id: `q${i}`, method: 'POST', path: '/v1/logs', body: {}, createdAt: new Date().toISOString(), attempts: 1 })), dead: [] }, version: 0 })))
  await p.route(`${API}/v1/logs`, (r) => (r.request().method() === 'OPTIONS' ? r.fallback() : new Promise(() => {})))
  await p.reload({ waitUntil: 'networkidle' }).catch(() => {}); await p.waitForTimeout(1200)
}
/** The peeking plan sits behind the front one; its visible strip is the top 60 pt, so tap there. */
const tapMonthly = (p) => p.getByRole('radio', { name: /Monthly/ }).click({ position: { x: 60, y: 24 } })

const shots = [
  // Settings
  { name: 'settings', url: '/settings', api: api() },
  { name: 'settings-scrolled', url: '/settings', api: api(), act: scrollToBottom },
  { name: 'settings-native', url: '/settings', api: api(), act: native({ health: true, products: PRODUCTS }) },
  { name: 'settings-native-plus', url: '/settings', api: api(), act: native({ health: true, subscribed: true, products: PRODUCTS }) },
  { name: 'settings-loading', url: '/settings', api: api(), hang: ['/v1/settings'] },
  { name: 'settings-error', url: '/settings', api: api(), fail: ['/v1/settings'] },
  { name: 'settings-offline', url: '/settings', api: api(), offline: true },
  { name: 'settings-long', url: '/settings', api: api({ '/v1/profile': LONG_PROFILE }) },
  { name: 'settings-plan-note', url: '/settings', api: api(), act: async (p) => { await p.getByRole('button', { name: /Plan/ }).click(); await p.waitForTimeout(900) } },
  { name: 'settings-ai-confirm', url: '/settings', api: api(), act: async (p) => { await p.getByRole('switch', { name: 'AI processing' }).click(); await p.waitForTimeout(700) } },
  { name: 'settings-menu-style', url: '/settings', api: api(), act: openMenu(/Coaching style/) },
  { name: 'settings-menu-day', url: '/settings', api: api(), act: openMenu(/Check-in day/) },
  { name: 'settings-reminder-toast', url: '/settings', api: api(), act: async (p) => { await openMenu(/Reminder time/)(p); await p.getByRole('menuitemradio', { name: '8:00 am' }).click(); await p.waitForTimeout(900) } },
  { name: 'settings-save-failed', url: '/settings', api: api(), act: saveFails },
  { name: 'settings-queued', url: '/settings', api: api(), act: queued },
  { name: 'delete-sheet', url: '/settings', api: api(), act: async (p) => { await p.getByRole('button', { name: 'Delete account' }).click(); await p.waitForTimeout(900) } },
  { name: 'delete-sheet-typed', url: '/settings', api: api(), act: async (p) => { await p.getByRole('button', { name: 'Delete account' }).click(); await p.waitForTimeout(700); await p.getByLabel('Type DELETE to confirm').fill('DELETE'); await p.waitForTimeout(300) } },
  // Profile
  { name: 'profile', url: '/settings/profile', api: api() },
  { name: 'profile-scrolled', url: '/settings/profile', api: api(), act: scrollToBottom },
  { name: 'profile-missing', url: '/settings/profile', api: api({ '/v1/profile': MISSING_PROFILE }) },
  { name: 'profile-long', url: '/settings/profile', api: api({ '/v1/profile': LONG_PROFILE }), act: scrollToBottom },
  // The auth gate reads the profile first, so the form's own read is failed or hung from Settings, then the row is opened.
  { name: 'profile-error', url: '/settings', api: api(), act: async (p) => { await p.route(`${API}/v1/profile`, (r) => r.request().method() === 'OPTIONS' ? r.fulfill({ status: 204, headers: cors }) : r.fulfill({ status: 500, headers: { ...cors, 'content-type': 'application/json' }, body: '{"error":true}' })); await p.getByRole('button', { name: /Sam Rivera/ }).click(); await p.waitForTimeout(1500) } },
  { name: 'profile-loading', url: '/settings', api: api(), act: async (p) => { await p.route(`${API}/v1/profile`, (r) => r.request().method() === 'OPTIONS' ? r.fulfill({ status: 204, headers: cors }) : new Promise(() => {})); await p.getByRole('button', { name: /Sam Rivera/ }).click(); await p.waitForTimeout(1200) } },
  { name: 'profile-offline', url: '/settings/profile', api: api(), offline: true },
  // Paywall
  { name: 'paywall-web', url: '/paywall', api: api() },
  { name: 'paywall', url: '/paywall', api: api(), act: native({ products: PRODUCTS }) },
  { name: 'paywall-monthly', url: '/paywall', api: api(), act: native({ products: PRODUCTS }, async (p) => { await tapMonthly(p); await p.waitForTimeout(900) }) },
  { name: 'paywall-restore-none', url: '/paywall', api: api(), act: native({ products: PRODUCTS }, async (p) => { await scrollToBottom(p); await p.getByRole('button', { name: 'Restore purchases' }).click(); await p.mouse.wheel(0, -4000); await p.waitForTimeout(900) }) },
  { name: 'paywall-offline', url: '/paywall', api: api(), act: native({ products: PRODUCTS }), offline: true },
  { name: 'paywall-loading', url: '/paywall', api: api(), act: native({ hangProducts: true }) },
  { name: 'paywall-purchasing', url: '/paywall', api: api(), act: native({ products: PRODUCTS, purchase: 'hang' }, async (p) => { await scrollToBottom(p); await p.getByRole('button', { name: 'Start FIQR Plus' }).click(); await p.waitForTimeout(400) }) },
  { name: 'paywall-error', url: '/paywall', api: api(), act: native({ products: PRODUCTS, purchase: 'fail' }, async (p) => { await scrollToBottom(p); await p.getByRole('button', { name: 'Start FIQR Plus' }).click(); await p.waitForTimeout(600) }) },
  { name: 'paywall-subscribed', url: '/paywall', api: api(), act: native({ products: PRODUCTS, subscribed: true }) },
  // Public pages
  { name: 'privacy', url: '/privacy', guest: true },
  { name: 'privacy-scrolled', url: '/privacy', guest: true, act: async (p) => { await p.mouse.wheel(0, 1400); await p.waitForTimeout(600) } },
  { name: 'support', url: '/support', guest: true },
  { name: 'delete-account', url: '/delete-account', guest: true },
  {
    name: 'delete-account-sent', url: '/delete-account', guest: true,
    act: async (p) => {
      await p.route(`${API}/v1/account/deletion-request`, (route) => route.fulfill({ status: 202, headers: { 'access-control-allow-origin': BASE, 'content-type': 'application/json' }, body: '{}' }))
      await p.getByLabel('Email').fill('sam@example.com'); await p.getByRole('button', { name: 'Request deletion' }).click(); await p.waitForTimeout(700)
    },
  },
  { name: 'delete-account-error', url: '/delete-account', guest: true, fail: ['/v1/account'], act: async (p) => { await p.getByLabel('Email').fill('sam@example.com'); await p.getByRole('button', { name: 'Request deletion' }).click(); await p.waitForTimeout(700) } },
  { name: 'support-offline', url: '/support', guest: true, offline: true },
  // 404 and crash boundary (a malformed onboarding draft throws during render, caught by src/app/error.tsx)
  { name: 'not-found', url: '/no-such-page', guest: true },
  { name: 'crash', url: '/onboarding/fitness?q=equipment', draft: { equipment: null }, act: wait(600) },
]

// ── Transitions ──
// The transitions runner stubs reads as {} with onboarding incomplete (app routes would redirect). For this slice it
// routes the API through the fixtures above instead: when the runner loads this file, newContext() installs the mock
// on the context and skips the runner's own page routes.
const TRANSITION_API = api()
let contexts = 0
if (process.argv[1]?.endsWith('redesign-transitions.mjs')) {
  const launch = chromium.launch.bind(chromium)
  chromium.launch = async (...args) => {
    const browser = await launch(...args)
    const newContext = browser.newContext.bind(browser)
    browser.newContext = async (...options) => {
      const context = await newContext(...options)
      const t = transitions[contexts++] ?? {}
      if (t.native) {
        await context.addInitScript(fakeNative, t.native)
        // The first native load can read the profile before the session hydrates (see native() above) and send the
        // page to /login; a 204 cancels that navigation, so the page stays and the hydrated session takes over.
        await context.route(/\/login\/?$/, (route) => route.fulfill({ status: 204 }))
      }
      // Pre-scroll before recording so the act is the only motion in the capture.
      if (t.scroll) await context.addInitScript(() => { addEventListener('load', () => setTimeout(() => scrollTo(0, document.body.scrollHeight), 900)) })
      await context.route(`${API}/**`, (route) => {
        const req = route.request()
        const p = new URL(req.url()).pathname
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
        if (p.startsWith('/v1/admin')) return route.fulfill({ status: 403, headers: cors })
        const key = Object.keys(TRANSITION_API).filter((k) => p === k || p.startsWith(k + '/')).sort((a, b) => b.length - a.length)[0]
        return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(key ? TRANSITION_API[key] : {}) })
      })
      const newPage = context.newPage.bind(context)
      context.newPage = async () => { const page = await newPage(); page.route = async () => {}; return page }
      return context
    }
    return browser
  }
}

const transitions = [
  { name: 'settings-row-push', url: '/settings', warm: '/settings/profile', act: (p) => p.getByRole('button', { name: /Sam Rivera/ }).click() },
  { name: 'profile-back', url: '/settings/profile', warm: '/settings', act: (p) => p.getByRole('button', { name: 'Back to settings' }).click() },
  { name: 'delete-sheet-open', url: '/settings', scroll: true, act: (p) => p.getByRole('button', { name: 'Delete account' }).click() },
  { name: 'confirm-dialog-in-out', url: '/settings', scroll: true, act: async (p) => { await p.getByRole('switch', { name: 'AI processing' }).click(); await p.waitForTimeout(800); await p.getByRole('button', { name: 'Keep it on' }).click() } },
  { name: 'paywall-plan-switch', url: '/paywall', native: { products: PRODUCTS }, act: tapMonthly },
  { name: 'settings-menu-open', url: '/settings', act: (p) => p.getByRole('button', { name: /Check-in day/ }).click() },
  { name: 'settings-switch', url: '/settings', act: (p) => p.getByRole('switch', { name: 'Push notifications' }).click() },
]

// The capture user is not an admin: the admin probe (/v1/admin/metrics) would otherwise hit the catch-all 200 and show
// the Admin dashboard row. Any failure reads as "not admin".
for (const s of shots) if (!s.guest) s.fail = [].concat(s.fail ?? [], '/v1/admin')

const slice9 = { shots, transitions }
export default slice9
