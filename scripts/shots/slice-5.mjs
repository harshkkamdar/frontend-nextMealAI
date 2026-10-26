/**
 * Slice 5 (Food diary) captures. Loaded by scripts/redesign-capture.mjs and scripts/redesign-transitions.mjs.
 * Shots use route interception (fixtures below); transitions use the mock API's "returning" scenario
 * (BASE_URL=http://localhost:3021 API_URL=http://localhost:4011 node scripts/redesign-transitions.mjs slice-5).
 */
const DAY_MS = 86400000
const isoDay = (offset) => new Date(Date.now() - offset * DAY_MS).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
let seq = 0
const food = (offset, meal_type, food_name, [calories, protein, carbs, fat], extra = {}) => {
  seq += 1
  const at = `${isoDay(offset)}T0${seq % 10}:00:00.000Z`
  return { id: `food-${offset}-${seq}`, user_id: 'capture-user', type: 'food', payload: { food_name, meal_type, servings: 1, est_macros: { calories, protein, carbs, fat }, ...extra }, source: 'manual', local_date: isoDay(offset), created_at: at, updated_at: at }
}

const PROFILE = { id: 'capture-user', full_name: 'Sam Rivera', ai_consent_at: '2026-10-24T00:00:00Z', health_disclaimer_ack_at: '2026-10-24T00:00:00Z', current_weight_kg: 78.2, daily_calorie_target: 1950, daily_protein_g: 140, daily_carbs_g: 190, daily_fat_g: 65, daily_targets_missing_fields: [] }
const PLANS = [{
  id: 'meal-1', type: 'meal', status: 'active', is_active: true, start_date: isoDay(14), created_at: `${isoDay(14)}T00:00:00Z`,
  content: {
    name: 'Lean and steady', notes: 'Training days add 200 kcal from carbs. Rest days hold at 1,750.',
    daily_targets: { calories: 1950, protein: 140, carbs: 190, fat: 65 },
    days: [{ date: isoDay(0), meals: [{ type: 'breakfast', name: 'Greek yoghurt, berries and oats', calories: 420 }, { type: 'lunch', name: 'Chicken burrito bowl', calories: 640 }, { type: 'dinner', name: 'Salmon, greens and potatoes', calories: 620 }], snacks: [{ name: 'Apple and peanut butter', calories: 260 }] }],
  },
}]

const BOWL_ITEMS = [
  { name: 'Brown rice', quantity_g: 150, est_macros: { calories: 165, protein: 4, carbs: 35, fat: 1 } },
  { name: 'Grilled chicken thigh', quantity_label: '1 thigh', est_macros: { calories: 230, protein: 32, carbs: 0, fat: 11 } },
  { name: 'Black beans', quantity_g: 80, est_macros: { calories: 105, protein: 7, carbs: 18, fat: 0 } },
  { name: 'Guacamole', quantity_label: '2 tbsp', est_macros: { calories: 140, protein: 2, carbs: 6, fat: 13 } },
]
const TODAY = [
  food(0, 'breakfast', 'Greek yoghurt and berries', [310, 24, 34, 8], { serving_label: 'bowl' }),
  food(0, 'breakfast', 'Oat flat white', [140, 4, 18, 6], { serving_label: 'cup' }),
  food(0, 'lunch', 'Chicken burrito bowl', [640, 45, 59, 25], { items: BOWL_ITEMS }),
]
const HISTORY = [
  food(1, 'breakfast', 'Two eggs on sourdough', [420, 22, 38, 19]),
  food(1, 'lunch', 'Tuna salad wrap', [510, 34, 46, 18]),
  food(1, 'dinner', 'Salmon, greens and potatoes', [620, 42, 44, 28]),
  food(1, 'snack', 'Apple and peanut butter', [260, 7, 28, 14]),
  food(2, 'lunch', 'Pho with beef', [550, 36, 70, 12]),
  food(3, 'breakfast', 'Overnight oats', [380, 18, 56, 10]),
  food(3, 'dinner', 'Chicken stir fry', [610, 44, 52, 22]),
  food(5, 'lunch', 'Leftover stir fry', [480, 33, 42, 18]),
  food(6, 'breakfast', 'Banana smoothie', [300, 20, 44, 6]),
]
const LONG = 'Slow-roasted pumpkin, feta and toasted pepita salad with a lemon tahini dressing and extra herbs'
const MANY = ['Scrambled eggs', 'Sourdough toast', 'Butter', 'Avocado', 'Cherry tomatoes', 'Smoked salmon', 'Orange juice', 'Long black', 'Blueberries', 'Almonds']
  .map((name, i) => food(0, 'breakfast', name, [60 + i * 23, 3 + i, 4 + i * 2, 2 + (i % 4)]))

const api = (logs, over = {}) => ({ '/v1/logs': { logs }, '/v1/profile': PROFILE, plans: PLANS, ...over })
const DEFAULT = api([...TODAY, ...HISTORY])
const wait = (p, ms = 800) => p.waitForTimeout(ms)
/** The week-strip button for a date offset from today (negative = future). */
const dayButton = (p, offset) => {
  const d = new Date(`${isoDay(offset)}T12:00:00`)
  return p.getByRole('button', { name: new RegExp('^' + d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })) })
}
/** A day next to today that is in the same week strip (yesterday, or tomorrow when today starts the week). */
async function neighbour(p) {
  const today = new Date(`${isoDay(0)}T12:00:00`).getDay()
  return dayButton(p, today === 0 ? -1 : 1)
}
/** Opens a diary row's actions sheet by the food's name. */
async function openRow(p, name) {
  await p.getByRole('button', { name: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first().click()
  await wait(p)
}
async function pickDay(p, offset) {
  const btn = dayButton(p, offset)
  if (await btn.count()) await btn.click()
  else { await p.getByRole('button', { name: 'Open month view' }).click(); await wait(p, 600); await p.getByRole('button', { name: new RegExp('^' + isoDay(offset)) }).click() }
  await wait(p)
}

const slice5 = {
  shots: [
    { name: 'food', url: '/food', api: DEFAULT },
    { name: 'food-scrolled', url: '/food', api: DEFAULT, act: async (p) => { await p.mouse.wheel(0, 700); await wait(p) } },
    { name: 'food-empty', url: '/food', api: api([]) },
    { name: 'food-past', url: '/food', api: DEFAULT, act: (p) => pickDay(p, 1) },
    { name: 'food-future', url: '/food', api: DEFAULT, act: (p) => pickDay(p, -1) },
    { name: 'food-no-target', url: '/food', api: api([...TODAY, ...HISTORY], { '/v1/profile': { ...PROFILE, daily_calorie_target: null, daily_protein_g: null, daily_carbs_g: null, daily_fat_g: null }, plans: [] }) },
    { name: 'food-long', url: '/food', api: api([...TODAY, food(0, 'dinner', LONG, [1420, 48, 120, 82]), ...HISTORY]) },
    { name: 'food-many', url: '/food', api: api([...MANY, ...TODAY.slice(2), ...HISTORY]), act: async (p) => { await p.mouse.wheel(0, 500); await wait(p) } },
    { name: 'food-loading', url: '/food', api: DEFAULT, hang: ['/v1/logs', '/v1/plans'] },
    { name: 'food-error', url: '/food', api: DEFAULT, fail: ['/v1/logs'] },
    { name: 'food-offline', url: '/food', api: DEFAULT, offline: true },
    { name: 'month-sheet', url: '/food', api: DEFAULT, act: async (p) => { await p.getByRole('button', { name: 'Open month view' }).click(); await wait(p) } },
    // The month's log reads fail after the day has loaded: the footer says so and offers a retry.
    { name: 'month-sheet-error', url: '/food', api: DEFAULT, act: async (p) => { await p.route(/\/v1\/logs\?/, (r) => r.abort()); await p.getByRole('button', { name: 'Open month view' }).click(); await wait(p) } },
    { name: 'meal-actions', url: '/food', api: DEFAULT, act: async (p) => { await p.getByRole('button', { name: 'Breakfast actions' }).click(); await wait(p) } },
    { name: 'copy-meal', url: '/food', api: DEFAULT, act: async (p) => { await pickDay(p, 1); await p.getByRole('button', { name: 'Lunch actions' }).click(); await wait(p, 600); await p.getByRole('button', { name: 'Copy to today' }).click(); await wait(p) } },
    { name: 'name-favourite', url: '/food', api: DEFAULT, act: async (p) => { await p.getByRole('button', { name: 'Breakfast actions' }).click(); await wait(p, 600); await p.getByRole('button', { name: 'Save as meal' }).click(); await wait(p); await p.getByLabel('Meal name').fill('Usual breakfast') } },
    { name: 'row-actions', url: '/food', api: DEFAULT, act: (p) => openRow(p, 'Greek yoghurt and berries') },
    { name: 'row-actions-past', url: '/food', api: DEFAULT, act: async (p) => { await pickDay(p, 1); await openRow(p, 'Tuna salad wrap') } },
    { name: 'row-move', url: '/food', api: DEFAULT, act: async (p) => { await openRow(p, 'Greek yoghurt and berries'); await p.getByRole('button', { name: /^Change meal/ }).click(); await wait(p) } },
    { name: 'row-copy', url: '/food', api: DEFAULT, act: async (p) => { await openRow(p, 'Greek yoghurt and berries'); await p.getByRole('button', { name: 'Copy to another day' }).click(); await wait(p) } },
    { name: 'row-delete-confirm', url: '/food', api: DEFAULT, act: async (p) => { await openRow(p, 'Greek yoghurt and berries'); await p.getByRole('button', { name: 'Delete' }).click(); await wait(p) } },
    { name: 'row-delete-long', url: '/food', api: api([...TODAY, food(0, 'dinner', LONG, [1420, 48, 120, 82]), ...HISTORY]), act: async (p) => { await p.mouse.wheel(0, 700); await wait(p, 400); await openRow(p, LONG.slice(0, 20)); await p.getByRole('button', { name: 'Delete' }).click(); await wait(p) } },
    { name: 'row-deleted-undo', url: '/food', api: DEFAULT, act: async (p) => { await openRow(p, 'Oat flat white'); await p.getByRole('button', { name: 'Delete' }).click(); await wait(p, 600); await p.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click(); await wait(p, 900) } },
    { name: 'edit-item', url: '/food', api: DEFAULT, act: async (p) => { await openRow(p, 'Greek yoghurt and berries'); await p.getByRole('button', { name: 'Edit amount' }).click(); await wait(p, 1000) } },
    { name: 'edit-itemised', url: '/food', api: DEFAULT, act: async (p) => { await openRow(p, 'Chicken burrito bowl'); await p.getByRole('button', { name: 'Edit amount' }).click(); await wait(p, 1000) } },
    { name: 'edit-itemised-field', url: '/food', api: DEFAULT, act: async (p) => { await openRow(p, 'Chicken burrito bowl'); await p.getByRole('button', { name: 'Edit amount' }).click(); await wait(p, 1000); await p.getByRole('button', { name: 'Edit Grilled chicken thigh' }).click(); await wait(p) } },
    { name: 'food-plan', url: '/food/plan', api: DEFAULT },
    { name: 'food-plan-none', url: '/food/plan', api: api([...TODAY, ...HISTORY], { plans: [] }) },
    { name: 'food-plan-link-none', url: '/food', api: api([...TODAY, ...HISTORY], { plans: [] }) },
  ],
  transitions: [
    // Day change: content crossfades with overlap, the capsule glides, nothing slides.
    { name: 'day-change', url: '/food', home: 'returning', act: async (p) => (await neighbour(p)).click() },
    { name: 'day-change-back', url: '/food', home: 'returning', act: async (p) => { await (await neighbour(p)).click(); await p.waitForTimeout(1200); await dayButton(p, 0).click() } },
    { name: 'month-open', url: '/food', home: 'returning', act: (p) => p.getByRole('button', { name: 'Open month view' }).click() },
    { name: 'row-actions-open', url: '/food', home: 'returning', act: (p) => p.getByRole('button', { name: /^Greek yoghurt and berries,/ }).click() },
    { name: 'plan-push', url: '/food', home: 'returning', act: (p) => p.getByRole('button', { name: /^Your nutrition plan/ }).click() },
    { name: 'week-swipe', url: '/food', home: 'returning', act: async (p) => { const b = await dayButton(p, 0).boundingBox(); const y = b.y + b.height / 2; await p.mouse.move(300, y); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(300 + i * 14, y); await p.waitForTimeout(16) } await p.mouse.up() } },
  ],
}
export default slice5
/** Fixtures for a standalone mock API when recording transitions against a dev server on this checkout. */
export { DEFAULT }
