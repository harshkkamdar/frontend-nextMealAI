/**
 * Slice 3 (logging) shots and transitions. Loaded by scripts/redesign-capture.mjs and redesign-transitions.mjs:
 *   node scripts/redesign-capture.mjs slice-3
 * Every API call is mocked (route interception); nothing reaches a real account (F3).
 * Transitions need a dev server built against a mock API, e.g. a worktree of this branch:
 *   node scripts/redesign-mock-api.mjs 4013; NEXT_PUBLIC_CORE_API_URL=http://localhost:4013 npx next dev -p 3023
 *   BASE_URL=http://localhost:3023 API_URL=http://localhost:4013 node scripts/redesign-transitions.mjs slice-3
 */

const DAY_MS = 86400000
const isoDay = (offset) => new Date(Date.now() - offset * DAY_MS).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString()

const LONG_NAME = 'Slow-roasted pumpkin, feta and toasted pepita salad with a lemon tahini dressing'

const food = (id, name, kcal, extra = {}) => ({
  id, user_id: 'capture-user', name, serving_size_g: 100, source: 'manual', is_favorite: false, use_count: 3,
  macros_per_serving: { calories: kcal, protein: Math.round(kcal / 18), carbs: Math.round(kcal / 9), fat: Math.round(kcal / 30) },
  created_at: ago(60 * 24 * 20), ...extra,
})
const PERSONAL = [
  food('f1', 'Greek yoghurt, plain', 97, { is_favorite: true, use_count: 24, serving_size_g: 170, brand: 'Chobani', last_used_at: ago(60 * 5) }),
  food('f2', 'Oat flat white', 140, { is_favorite: true, use_count: 18, serving_size_g: 250, last_used_at: ago(60 * 6) }),
  food('f3', 'Chicken burrito bowl', 640, { use_count: 9, serving_size_g: 420, source: 'geo_estimate', last_used_at: ago(60 * 26) }),
  food('f4', 'Banana', 105, { use_count: 12, serving_size_g: 118, source: 'usda', last_used_at: ago(60 * 30) }),
  food('f5', 'Sourdough toast with butter', 210, { use_count: 7, serving_size_g: 60, last_used_at: ago(60 * 50) }),
]
const LONG_FOODS = [food('fl', LONG_NAME, 486, { is_favorite: true, use_count: 2, serving_size_g: 310, brand: 'Made at home with leftovers from the weekend', last_used_at: ago(30) }), ...PERSONAL]

const result = (name, kcal, extra = {}) => ({ id: null, name, serving_size_g: 100, source: 'usda', is_favorite: false, use_count: 0, macros_per_serving: { calories: kcal, protein: Math.round(kcal / 6), carbs: 0, fat: Math.round(kcal / 25) }, ...extra })
const RESULTS = [
  result('Chicken breast, grilled', 165, { id: 'f9', source: 'personal', serving_size_g: 150, use_count: 4 }),
  result('Chicken thigh, roasted, skin off', 209),
  result('Chicken schnitzel', 297, { brand: 'Steggles' }),
  result('Chicken and vegetable soup', 72, { serving_size_g: 250 }),
  result('Chicken tikka masala', 154, { serving_size_g: 350 }),
]
const LONG_RESULTS = [result(LONG_NAME, 486, { brand: 'A brand name that keeps going well past the edge', serving_size_g: 310 }), ...RESULTS]

const ESTIMATE = {
  estimate_id: 'est-capture',
  items: [
    { name: 'Grilled salmon', quantity_g: 160, calories: 330, protein: 34, carbs: 0, fat: 21, confidence: 0.82 },
    { name: 'Brown rice', quantity_g: 150, calories: 165, protein: 4, carbs: 34, fat: 1.4, confidence: 0.74 },
    { name: 'Steamed broccoli', quantity_g: 80, calories: 28, protein: 2, carbs: 5, fat: 0.3, confidence: 0.9 },
  ],
  totals: { calories: 523, protein: 40, carbs: 39, fat: 22.7 },
  confidence: 0.78,
}

const lg = (id, type, payload, minutes) => ({ id, user_id: 'capture-user', type, payload, source: 'manual', local_date: isoDay(0), created_at: ago(minutes), updated_at: ago(minutes) })
const LOGS = [
  lg('l1', 'food', { food_name: 'Greek yoghurt, plain', meal_type: 'breakfast', est_macros: { calories: 165 } }, 25),
  lg('l2', 'water', { glasses: 2 }, 70),
  lg('l3', 'weight', { weight_kg: 78.2 }, 180),
  lg('l4', 'sleep', { hours: 7.2, quality_rating: 7 }, 600),
  lg('l5', 'workout', { day_name: 'Upper A', duration_min: 48 }, 60 * 26),
  lg('l6', 'mood', { rating: 7 }, 60 * 28),
  lg('l7', 'energy', { rating: 6, time_of_day: 'Afternoon' }, 60 * 30),
  lg('l8', 'steps', { steps: 8214 }, 60 * 50),
  lg('l9', 'food', { food_name: 'Chicken burrito bowl', meal_type: 'lunch', est_macros: { calories: 640 } }, 60 * 52),
]
const LONG_LOGS = [lg('ll', 'food', { food_name: LONG_NAME, meal_type: 'dinner', est_macros: { calories: 1420 } }, 10), ...LOGS]

const PROFILE = { id: 'capture-user', full_name: 'Sam Rivera', ai_consent_at: '2026-10-24T00:00:00Z', health_disclaimer_ack_at: '2026-10-24T00:00:00Z', current_weight_kg: 78.2, daily_calorie_target: 1950 }
const done = ['personal', 'fitness', 'nutrition']
const api = (over = {}) => ({ '/v1/profile': PROFILE, '/v1/foods': { foods: PERSONAL }, '/v1/logs': { logs: LOGS }, '/v1/favourites': { favourites: [] }, ...over })

const wait = (p, ms = 900) => p.waitForTimeout(ms)
const type = async (p, text) => { await p.getByTestId('food-search-input').fill(text); await wait(p, 1100) }
const pickFirst = async (p) => { await type(p, 'chicken'); await p.getByRole('button', { name: /^Chicken breast/ }).click(); await wait(p) }
// A real 16x16 PNG so compressImage can decode it.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAI0lEQVR4nGM8URHAQApgIkk1w6gG4gATkergYFQDMYDkUAIA+qQBsNfHXEIAAAAASUVORK5CYII=', 'base64')
const photo = async (p) => { await p.locator('input[type=file]').setInputFiles({ name: 'plate.png', mimeType: 'image/png', buffer: PNG }); await wait(p, 1200) }

const MANUAL = {
  weight: async (p) => { await p.getByLabel('Weight').fill('78.4'); await p.getByLabel('Notes').fill('After the morning walk') },
  water: async (p) => { await p.getByRole('button', { name: 'More glasses' }).click(); await p.getByRole('button', { name: 'More glasses' }).click() },
  sleep: async (p) => { await p.getByLabel('Hours slept').fill('7.5'); await p.getByRole('radio', { name: '8 of 10' }).click() },
  mood: async (p) => { await p.getByRole('radio', { name: '7 of 10' }).click(); await p.getByLabel('Notes').fill('Good day at work') },
  energy: async (p) => { await p.getByRole('radio', { name: '6 of 10' }).click(); await p.getByRole('button', { name: 'Afternoon' }).click() },
  workout: async (p) => { await p.getByLabel('Name').fill('Push day') },
}
const save = (name) => async (p) => { await MANUAL[name](p); await p.getByRole('button', { name: name === 'workout' ? 'Start session' : 'Save' }).click(); await wait(p, 700) }

const diaryLog = (id, name, payload, minutes) => lg(id, 'food', { food_name: name, meal_type: 'breakfast', ...payload }, minutes)
const DIARY_LOGS = [
  diaryLog('d1', 'Greek yoghurt, plain', { quantity_g: 340, servings: 2, est_macros: { calories: 194, protein: 20, carbs: 8, fat: 6 }, user_food_id: 'f1' }, 60),
  diaryLog('d2', 'Banana', { quantity_g: 118, est_macros: { calories: 105, protein: 1, carbs: 27, fat: 0 } }, 50),
]

const shots = [
  // ── /logs/new/food ──
  { name: 'food-default', url: '/logs/new/food', api: api(), done },
  { name: 'food-empty', url: '/logs/new/food', api: api({ '/v1/foods': { foods: [] } }), done },
  { name: 'food-typing', url: '/logs/new/food', api: api(), done, act: (p) => p.getByTestId('food-search-input').fill('c') },
  { name: 'food-searching', url: '/logs/new/food', api: api(), done, hang: ['/v1/foods/search'], act: (p) => type(p, 'chicken') },
  { name: 'food-results', url: '/logs/new/food', api: api({ '/v1/foods/search': { results: RESULTS } }), done, act: (p) => type(p, 'chicken') },
  { name: 'food-no-results', url: '/logs/new/food', api: api({ '/v1/foods/search': { results: [] } }), done, act: (p) => type(p, 'dragonfruit kombucha') },
  { name: 'food-error', url: '/logs/new/food', api: api(), done, fail: ['/v1/foods/search'], act: (p) => type(p, 'chicken') },
  { name: 'food-offline', url: '/logs/new/food', api: api(), done, offline: true },
  { name: 'food-long', url: '/logs/new/food', api: api({ '/v1/foods': { foods: LONG_FOODS }, '/v1/foods/search': { results: LONG_RESULTS } }), done, act: (p) => type(p, 'pumpkin') },
  { name: 'food-selected', url: '/logs/new/food', api: api({ '/v1/foods/search': { results: RESULTS } }), done, act: pickFirst },
  { name: 'food-selected-long', url: '/logs/new/food', api: api({ '/v1/foods': { foods: LONG_FOODS } }), done, act: async (p) => { await p.getByTestId('personal-food-row').first().click(); await wait(p) } },
  { name: 'food-tray-two', url: '/logs/new/food', api: api({ '/v1/foods/search': { results: RESULTS } }), done, act: async (p) => { await pickFirst(p); await p.getByRole('button', { name: 'Add to tray' }).click(); await p.getByTestId('personal-food-row').first().click(); await wait(p, 1200) } },
  { name: 'food-saving', url: '/logs/new/food', api: api({ '/v1/foods/search': { results: RESULTS } }), done, hang: ['/v1/logs'], act: async (p) => { await pickFirst(p); await p.getByRole('button', { name: 'Log meal' }).click(); await wait(p, 500) } },
  { name: 'food-save-error', url: '/logs/new/food', api: api({ '/v1/foods/search': { results: RESULTS } }), done, fail: ['/v1/logs'], act: async (p) => { await pickFirst(p); await p.getByRole('button', { name: 'Log meal' }).click(); await wait(p, 900) } },
  { name: 'food-meal-menu', url: '/logs/new/food', api: api(), done, act: async (p) => { await p.getByRole('button', { name: /^Meal:/ }).click(); await wait(p, 500) } },
  { name: 'food-from-diary', url: `/logs/new/food?meal=dinner&date=${isoDay(1)}`, api: api(), done },
  { name: 'food-photo-estimating', url: '/logs/new/food', api: api(), done, hang: ['/v1/foods/estimate-from-photo'], act: photo },
  { name: 'food-photo-result', url: '/logs/new/food', api: api({ '/v1/foods/estimate-from-photo': ESTIMATE }), done, act: photo },
  { name: 'food-photo-failure', url: '/logs/new/food', api: api(), done, fail: ['/v1/foods/estimate-from-photo'], act: photo },
  { name: 'food-menu-to-geo', url: '/logs/new/food', api: api({ '/v1/chat': { sessions: [] } }), done, act: async (p) => { await p.getByRole('button', { name: /^Menu/ }).click(); await wait(p, 1500) } },

  // ── manual forms ──
  ...['weight', 'water', 'sleep', 'mood', 'energy', 'workout'].flatMap((name) => [
    { name: `${name}-empty`, url: `/logs/new/${name}`, api: api(), done },
    { name: `${name}-filled`, url: `/logs/new/${name}`, api: api(), done, act: MANUAL[name] },
    { name: `${name}-saving`, url: `/logs/new/${name}`, api: api(), done, hang: ['/v1/logs', '/v1/workout-sessions'], act: save(name) },
    { name: `${name}-error`, url: `/logs/new/${name}`, api: api(), done, fail: ['/v1/logs', '/v1/workout-sessions'], act: save(name) },
    { name: `${name}-offline`, url: `/logs/new/${name}`, api: api(), done, offline: true },
  ]),

  // ── /logs ──
  { name: 'logs-default', url: '/logs', api: api(), done },
  { name: 'logs-empty', url: '/logs', api: api({ '/v1/logs': { logs: [] } }), done },
  { name: 'logs-loading', url: '/logs', api: api(), done, hang: ['/v1/logs'] },
  { name: 'logs-error', url: '/logs', api: api(), done, fail: ['/v1/logs'] },
  { name: 'logs-offline', url: '/logs', api: api(), done, offline: true },
  { name: 'logs-long', url: '/logs', api: api({ '/v1/logs': { logs: LONG_LOGS } }), done },
  { name: 'logs-select', url: '/logs', api: api(), done, act: async (p) => { await p.getByRole('button', { name: 'Select' }).click(); await p.getByRole('checkbox').nth(0).click(); await p.getByRole('checkbox').nth(2).click(); await wait(p, 500) } },
  { name: 'logs-delete-confirm', url: '/logs', api: api(), done, act: async (p) => { await p.getByRole('button', { name: 'Select' }).click(); await p.getByRole('checkbox').nth(0).click(); await p.getByRole('button', { name: 'Delete' }).click(); await wait(p, 500) } },

  // ── /foods ──
  { name: 'foods-default', url: '/foods', api: api(), done },
  { name: 'foods-empty', url: '/foods', api: api({ '/v1/foods': { foods: [] } }), done },
  { name: 'foods-loading', url: '/foods', api: api(), done, hang: ['/v1/foods'] },
  { name: 'foods-error', url: '/foods', api: api(), done, fail: ['/v1/foods'] },
  { name: 'foods-offline', url: '/foods', api: api(), done, offline: true },
  { name: 'foods-long', url: '/foods', api: api({ '/v1/foods': { foods: LONG_FOODS } }), done },
  { name: 'foods-no-match', url: '/foods', api: api(), done, act: (p) => p.getByLabel('Search your foods').fill('dragonfruit') },
  { name: 'foods-options', url: '/foods', api: api(), done, act: async (p) => { await p.getByRole('button', { name: 'More options for Greek yoghurt, plain' }).first().click(); await wait(p) } },
  { name: 'foods-add', url: '/foods', api: api(), done, act: async (p) => { await p.getByRole('button', { name: 'Add a food' }).first().click(); await wait(p) } },

  // ── Food search sheet (edit mode, opened from a Food diary row) ──
  { name: 'sheet-edit-servings', url: '/food', api: api({ '/v1/logs': { logs: DIARY_LOGS } }), done, act: async (p) => { await p.getByRole('button', { name: 'Edit Greek yoghurt, plain' }).click(); await wait(p) } },
  { name: 'sheet-edit-grams', url: '/food', api: api({ '/v1/logs': { logs: DIARY_LOGS } }), done, act: async (p) => { await p.getByRole('button', { name: 'Edit Banana' }).click(); await wait(p) } },
]

// Transitions run against the shared mock API (home scenario); act() adds the routes each needs on top.
const cors = (r) => ({ 'access-control-allow-origin': r.request().headers().origin ?? '*', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' })
const reply = (r, body) => r.request().method() === 'OPTIONS' ? r.fulfill({ status: 204, headers: cors(r) }) : r.fulfill({ status: 200, headers: { ...cors(r), 'content-type': 'application/json' }, body: JSON.stringify(body) })
const routeSearch = (p) => p.route('**/v1/foods/search**', (r) => reply(r, { results: RESULTS }))
const typeSlow = async (p) => { await p.getByTestId('food-search-input').click(); await p.keyboard.type('chicken', { delay: 40 }) }

const transitions = [
  { name: 'food-search-results', url: '/logs/new/food', home: 'returning', act: async (p) => { await routeSearch(p); await typeSlow(p) } },
  { name: 'food-select-tray', url: '/logs/new/food', home: 'returning', act: async (p) => { await routeSearch(p); await typeSlow(p); await p.waitForTimeout(1200); await p.getByRole('button', { name: /^Chicken breast/ }).click() } },
  {
    name: 'photo-tray', url: '/logs/new/food', home: 'returning',
    act: async (p) => {
      await p.route('**/v1/foods/estimate-from-photo', async (r) => { if (r.request().method() !== 'OPTIONS') await new Promise((ok) => setTimeout(ok, 500)); return reply(r, ESTIMATE) })
      await p.locator('input[type=file]').setInputFiles({ name: 'plate.png', mimeType: 'image/png', buffer: PNG })
    },
  },
  // In-app: + sheet, method, save, then router.back() pops to Home (a full reload would be a false hard cut).
  { name: 'water-save', url: '/dashboard', home: 'returning', act: async (p) => { await p.getByRole('button', { name: 'Log something' }).click(); await p.waitForTimeout(700); await p.getByRole('dialog').getByRole('button', { name: 'Water', exact: true }).click(); await p.waitForTimeout(1200); await p.getByRole('button', { name: 'Save' }).click() } },
  { name: 'food-log-save', url: '/dashboard', home: 'returning', act: async (p) => { await routeSearch(p); await p.getByRole('button', { name: 'Log something' }).click(); await p.waitForTimeout(700); await p.getByRole('dialog').getByRole('button', { name: 'Search', exact: true }).click(); await p.waitForTimeout(1200); await p.keyboard.type('chicken', { delay: 40 }); await p.waitForTimeout(1200); await p.getByRole('button', { name: /^Chicken breast/ }).click(); await p.waitForTimeout(900); await p.getByRole('button', { name: 'Log meal' }).click() } },
]

const slice3 = { shots, transitions }
export default slice3
