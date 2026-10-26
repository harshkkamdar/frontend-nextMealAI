/**
 * Slice T (Today) native states and transitions. Loaded by scripts/redesign-capture.mjs and
 * scripts/redesign-transitions.mjs as `today`; the web states live in the slice-2 table of redesign-capture.mjs.
 *
 * The Health tile, the Health permission sheet and the notifications sheet only exist in the app, so `native()`
 * fakes the Capacitor iOS bridge in the page (as slice-9 does): platform reads "ios", plugin calls are answered from
 * the config. Every API read is mocked by route interception; nothing reaches a real account.
 */
import { homeApi } from '../redesign-mock-api.mjs'

/** Runs in the page before the app: an iOS-looking Capacitor bridge answered from `cfg`. */
function fakeNative(cfg) {
  const store = cfg.push ? {} : { 'fiqr:push-prompted': '1' }
  if (cfg.health) { store['fiqr:health-connected'] = '1'; store['fiqr:health-last-sync'] = new Date(Date.now() - 42 * 60000).toISOString() }
  const handlers = {
    Preferences: {
      get: ({ key }) => ({ value: key in store ? store[key] : localStorage.getItem(key) }),
      set: ({ key, value }) => { localStorage.setItem(key, value); return {} },
      remove: ({ key }) => { localStorage.removeItem(key); return {} },
    },
    PushNotifications: { checkPermissions: () => ({ receive: cfg.push ?? 'granted' }), requestPermissions: () => ({ receive: 'granted' }) },
    HealthPlugin: { isHealthAvailable: () => ({ available: true }), requestHealthPermissions: () => (cfg.healthFails ? Promise.reject(new Error('denied')) : { permissions: {} }) },
    Network: { getStatus: () => ({ connected: true, connectionType: 'wifi' }) },
  }
  const NAMES = ['App', 'Haptics', 'HealthPlugin', 'Keyboard', 'Network', 'Preferences', 'PushNotifications', 'SplashScreen', 'SystemBars']
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

/** Act prefix: reload the page as the fake iOS app, then run `then`. */
const native = (cfg = {}, then) => async (p) => {
  await p.addInitScript(fakeNative, cfg)
  await p.reload({ waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(1500)
  if (!p.url().includes('/dashboard')) { await p.evaluate(() => window.next.router.push('/dashboard')); await p.waitForTimeout(1500) }
  if (then) await then(p)
}
const tap = (name) => async (p) => { await p.getByRole('button', { name }).click(); await p.waitForTimeout(900) }
const DONE = ['personal', 'fitness', 'nutrition']
const api = (kind) => homeApi(kind)
const noSteps = () => { const a = api('returning'); return { ...a, '/v1/logs': { logs: a['/v1/logs'].logs.filter((log) => log.type !== 'steps' && log.type !== 'sleep') } } }

const shots = [
  { name: 'native-health-off', url: '/dashboard', api: noSteps(), done: DONE, act: native({}) },
  { name: 'native-health-sheet', url: '/dashboard', api: noSteps(), done: DONE, act: native({}, tap(/^Steps\. Connect/)) },
  { name: 'native-health-fail', url: '/dashboard', api: noSteps(), done: DONE, act: native({ healthFails: true }, async (p) => { await tap(/^Steps\. Connect/)(p); await tap('Continue')(p) }) },
  { name: 'native-health-on', url: '/dashboard', api: api('returning'), done: DONE, act: native({ health: true }) },
  { name: 'native-notifications', url: '/dashboard', api: api('returning'), done: DONE, act: native({ push: 'prompt' }) },
  { name: 'native-notifications-off', url: '/dashboard', api: api('returning'), done: DONE, act: native({ push: 'denied' }) },
]

/** Before recording starts, open the Steps week from Home's tile with a real in-app push, so Home sits under it. */
const openStepsFirst = (page) => page.addInitScript(() => {
  if (!location.pathname.startsWith('/dashboard') || location.pathname.includes('steps')) return
  const go = () => { const b = document.querySelector('[aria-label^="Steps "]'); if (b) b.click(); else setTimeout(go, 100) }
  setTimeout(go, 600)
})

const transitions = [
  // First paint of the session: Home settles forward from 1.04 while the ring draws.
  { name: 'home-first-load', url: '/food', home: 'returning', act: (p) => p.getByRole('link', { name: 'Home' }).click() },
  { name: 'push-steps-week', url: '/dashboard', home: 'returning', warm: '/dashboard/steps', act: (p) => p.getByRole('button', { name: /^Steps / }).click() },
  { name: 'pop-steps-week', url: '/dashboard', home: 'returning', setup: openStepsFirst, act: (p) => p.getByRole('button', { name: 'Back to Today' }).click() },
  { name: 'macro-sheet-open', url: '/dashboard', home: 'returning', act: (p) => p.getByRole('button', { name: /^Protein/ }).click() },
  { name: 'macro-sheet-switch', url: '/dashboard', home: 'returning', act: async (p) => { await p.getByRole('button', { name: /^Protein/ }).click(); await p.waitForTimeout(900); await p.getByRole('button', { name: 'Fat', exact: true }).click() } },
  { name: 'water-sheet-open', url: '/dashboard', home: 'returning', act: (p) => p.getByRole('button', { name: /^Water / }).click() },
  { name: 'water-plus', url: '/dashboard', home: 'returning', act: (p) => p.getByRole('button', { name: 'Add one glass of water' }).click() },
  { name: 'weight-sheet-open', url: '/dashboard', home: 'returning', act: (p) => p.getByRole('button', { name: /^Weight/ }).click() },
]

export default { shots, transitions }
