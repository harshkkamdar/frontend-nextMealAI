/**
 * Slice 7 (Plans) captures and transitions. Loaded by scripts/redesign-capture.mjs and redesign-transitions.mjs.
 * Every request is mocked; nothing reaches the real API.
 */
const DONE = ['personal', 'fitness', 'nutrition']

const ex = (name, sets, reps, rest = 90, weight) => ({ name, sets, reps, rest_seconds: rest, ...(weight ? { weight } : {}) })
const WORKOUT = {
  id: 'work-1', user_id: 'capture-user', type: 'workout', status: 'active', version: 3, start_date: '2026-10-05', end_date: '2026-11-29', current_position: 1,
  content: {
    name: 'Four-day upper lower',
    notes: 'Leave two reps in the tank on the main lifts. Add 2.5 kg once every set hits the top of the range.',
    days: [
      { date: '', name: 'Upper A', exercises: [ex('Bench press', 4, '6-8', 150, 60), ex('Chest-supported row', 4, '8-10'), ex('Seated dumbbell press', 3, '8-10'), ex('Lat pulldown', 3, '10-12'), ex('Cable curl', 3, '12-15', 60)] },
      { date: '', name: 'Lower A', exercises: [ex('Back squat', 4, '5-7', 180, 80), ex('Romanian deadlift', 3, '8-10'), ex('Walking lunge', 3, '10'), ex('Calf raise', 4, '12-15', 60)] },
      { date: '', name: 'Rest', is_rest_day: true, exercises: [] },
      { date: '', name: 'Upper B', exercises: [ex('Incline dumbbell press', 4, '8-10'), ex('Pull-up', 4, '6-8'), ex('Arnold press', 3, '10'), ex('Face pull', 3, '15', 60), ex('Triceps pushdown', 3, '12', 60)] },
      { date: '', name: 'Lower B', exercises: [ex('Deadlift', 3, '4-6', 180, 100), ex('Leg press', 3, '10-12'), ex('Hamstring curl', 3, '12'), ex('Hanging knee raise', 3, '15', 60)] },
    ],
  },
  created_at: '2026-10-05T00:00:00Z', updated_at: '2026-10-20T00:00:00Z',
}
const meal = (type, name, calories, protein, carbs, fat) => ({ type, name, calories, protein, carbs, fat })
const MEAL = {
  id: 'meal-1', user_id: 'capture-user', type: 'meal', status: 'active', version: 1, start_date: '2026-10-26', end_date: '2026-11-22',
  content: {
    name: 'Lean and steady',
    daily_targets: { calories: 1950, protein: 140, carbs: 190, fat: 65 },
    days: ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'].map((date, i) => ({
      date,
      meals: [
        meal('Breakfast', ['Greek yoghurt, berries and oats', 'Two eggs on rye toast', 'Protein oats with banana', 'Cottage cheese and peach'][i], 420, 32, 48, 11),
        meal('Lunch', ['Chicken burrito bowl', 'Tuna and white bean salad', 'Turkey and avocado wrap', 'Leftover beef stir-fry'][i], 610, 45, 62, 18),
        meal('Dinner', ['Salmon, rice and greens', 'Lean beef chilli', 'Chicken thigh traybake', 'Prawn and pea risotto'][i], 680, 48, 66, 22),
      ],
      snacks: [{ name: 'Apple and a handful of almonds', calories: 210, protein: 6, carbs: 22, fat: 12 }],
    })),
  },
  created_at: '2026-10-26T00:00:00Z', updated_at: '2026-10-26T00:00:00Z',
}
const EARLIER = [
  { ...WORKOUT, id: 'work-0', status: 'superseded', version: 2 },
  { id: 'old-1', user_id: 'capture-user', type: 'workout', status: 'completed', start_date: '2026-06-02', end_date: '2026-08-24', content: { name: 'Summer strength block', days: [] }, created_at: '2026-06-01T00:00:00Z', updated_at: 'n' },
  { id: 'old-2', user_id: 'capture-user', type: 'meal', status: 'completed', start_date: '2026-04-06', end_date: '2026-05-31', content: { name: 'Autumn cut', daily_targets: { calories: 1750, protein: 140, carbs: 160, fat: 55 }, days: [] }, created_at: '2026-04-05T00:00:00Z', updated_at: 'n' },
]
const LONG_NAME = 'Twelve-week hypertrophy block with deload weeks and accessory work for shoulders'
const LONG_MEAL = 'Slow-roasted pumpkin, feta and toasted pepita salad with lemon tahini dressing'
const LONG_WORKOUT = { ...WORKOUT, content: { ...WORKOUT.content, name: LONG_NAME, days: WORKOUT.content.days.map((d, i) => i === 0 ? { ...d, name: 'Upper body strength and hypertrophy emphasis day', exercises: [ex('Single-arm half-kneeling landmine press with pause', 4, '8-10'), ...d.exercises] } : d) } }
const LONG_MEALPLAN = { ...MEAL, content: { ...MEAL.content, name: 'Recomposition phase with higher protein on training days', days: MEAL.content.days.map((d) => ({ ...d, meals: d.meals.map((m, j) => j === 1 ? { ...m, name: LONG_MEAL } : m) })) } }
const VERSIONS = { versions: [{ id: 'work-1', version: 3, status: 'active', created_at: '2026-10-20T00:00:00Z' }, { id: 'work-0', version: 2, status: 'superseded', created_at: '2026-10-12T00:00:00Z' }, { id: 'work-00', version: 1, status: 'superseded', created_at: '2026-10-05T00:00:00Z' }] }
const DIFF = { current: VERSIONS.versions[0], previous: VERSIONS.versions[1], changes: [{ type: 'exercise_added', field: 'days', description: 'Added Face pull to Upper B' }, { type: 'exercise_modified', field: 'days', description: 'Back squat now 4 sets of 5-7' }] }

export const plansApi = (over = {}) => ({
  '/v1/plans': { plans: [MEAL, WORKOUT, ...EARLIER] },
  '/v1/plans/work-1': WORKOUT,
  '/v1/plans/work-1/versions': VERSIONS,
  '/v1/plans/work-0/diff': DIFF,
  '/v1/plans/work-1/diff': DIFF,
  '/v1/plans/meal-1': MEAL,
  '/v1/plans/meal-1/versions': { versions: [{ id: 'meal-1', version: 1, status: 'active', created_at: '2026-10-26T00:00:00Z' }] },
  '/v1/foods/search': { results: [
    { id: 'f1', name: 'Greek yoghurt, plain', brand: 'Chobani', serving_size_g: 170, macros_per_serving: { calories: 150, protein: 17, carbs: 6, fat: 6 }, source: 'usda', is_favorite: false, use_count: 0 },
    { id: 'f2', name: LONG_MEAL, serving_size_g: 320, macros_per_serving: { calories: 540, protein: 18, carbs: 44, fat: 32 }, source: 'personal', is_favorite: false, use_count: 3 },
  ] },
  '/v1/exercises/search': { results: [{ id: 'e1', name: 'Bench press', primary_muscles: ['chest', 'triceps'] }, { id: 'e2', name: 'Single-arm half-kneeling landmine press with pause', primary_muscles: ['shoulders'] }] },
  ...over,
})
const NONE_API = plansApi({ '/v1/plans': { plans: [] } })
const LONG_API = plansApi({ '/v1/plans': { plans: [LONG_MEALPLAN, LONG_WORKOUT, ...EARLIER] }, '/v1/plans/work-1': LONG_WORKOUT, '/v1/plans/meal-1': LONG_MEALPLAN })
const INACTIVE_API = plansApi({ '/v1/plans/old-1': { ...WORKOUT, id: 'old-1', status: 'completed', start_date: '2026-06-02', end_date: '2026-08-24', content: { ...WORKOUT.content, name: 'Summer strength block' } }, '/v1/plans/old-1/versions': { versions: [] } })

const wait = (p, ms = 700) => p.waitForTimeout(ms)
const cont = async (p) => { await p.getByRole('button', { name: 'Continue' }).click(); await wait(p) }
const name = (p, value) => p.getByLabel('Plan name').fill(value)
/** Opens the add sheet (Add meal / Add exercise), searches and picks a result; the sheet closes on pick. */
async function pick(p, placeholder, query, option, opener = placeholder === 'Search foods' ? 'Add meal' : 'Add exercise') {
  await p.getByRole('button', { name: opener }).first().click()
  await wait(p, 600)
  await p.getByPlaceholder(placeholder).first().fill(query)
  await p.getByRole('button', { name: option }).first().click()
  await wait(p, 800)
}

const s = (shot) => ({ done: DONE, api: plansApi(), ...shot })

const shots = [
  // /plans
  s({ name: 'plans', url: '/plans' }),
  s({ name: 'plans-scrolled', url: '/plans', act: async (p) => { await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await wait(p) } }),
  s({ name: 'plans-none', url: '/plans', api: NONE_API }),
  s({ name: 'plans-loading', url: '/plans', hang: ['/v1/plans'] }),
  s({ name: 'plans-error', url: '/plans', fail: ['/v1/plans'] }),
  s({ name: 'plans-offline', url: '/plans', offline: true }),
  s({ name: 'plans-long', url: '/plans', api: LONG_API }),
  // /plans/view
  s({ name: 'view-workout', url: '/plans/view?id=work-1' }),
  // The plan's next day (current_position 1, Lower A) is open on arrival; this opens another day.
  s({ name: 'view-workout-open', url: '/plans/view?id=work-1', act: async (p) => { await p.getByRole('button', { name: 'Upper B day 4' }).click(); await wait(p) } }),
  s({ name: 'view-workout-end', url: '/plans/view?id=work-1', act: async (p) => { await p.mouse.wheel(0, 1600); await wait(p) } }),
  s({ name: 'view-workout-history', url: '/plans/view?id=work-1', act: async (p) => { await p.getByRole('button', { name: /^Version 2/ }).click(); await wait(p); await p.getByRole('button', { name: /^Version 2/ }).scrollIntoViewIfNeeded() } }),
  s({ name: 'view-workout-long', url: '/plans/view?id=work-1', api: LONG_API, act: async (p) => { await p.getByRole('button', { name: /day 1$/ }).click(); await wait(p) } }),
  s({ name: 'view-workout-starting', url: '/plans/view?id=work-1', hang: ['/v1/workout-sessions'], act: async (p) => { await p.getByRole('button', { name: /^Start Lower A/ }).click(); await wait(p, 400) } }),
  s({ name: 'view-workout-inactive', url: '/plans/view?id=old-1', api: INACTIVE_API, act: async (p) => { await p.mouse.wheel(0, 1400); await wait(p) } }),
  s({ name: 'view-meal', url: '/plans/view?id=meal-1' }),
  s({ name: 'view-meal-end', url: '/plans/view?id=meal-1', act: async (p) => { await p.mouse.wheel(0, 1600); await wait(p) } }),
  s({ name: 'view-meal-day', url: '/plans/view?id=meal-1', act: async (p) => { await p.getByRole('button', { name: 'Wed 28' }).click(); await wait(p); await p.mouse.wheel(0, 300); await wait(p) } }),
  s({ name: 'view-meal-long', url: '/plans/view?id=meal-1', api: LONG_API }),
  s({ name: 'view-loading', url: '/plans/view?id=work-1', hang: ['/v1/plans'] }),
  s({ name: 'view-error', url: '/plans/view?id=work-1', fail: ['/v1/plans/work-1'] }),
  s({ name: 'view-gone', url: '/plans/view?id=work-1', fail: ['/v1/plans/work-1'], failStatus: 404, failMessage: 'Plan not found' }),
  s({ name: 'view-offline', url: '/plans/view?id=work-1', offline: true }),
  // builders
  s({ name: 'new-meal-empty', url: '/plans/new/meal' }),
  s({ name: 'new-meal-filled', url: '/plans/new/meal', act: async (p) => { await name(p, 'Cut phase'); await p.getByLabel('Notes').fill('Higher carbs on training days') } }),
  s({ name: 'new-meal-targets', url: '/plans/new/meal', act: async (p) => { await name(p, 'Cut phase'); await cont(p) } }),
  s({ name: 'new-meal-days-invalid', url: '/plans/new/meal', act: async (p) => { await name(p, 'Cut phase'); await cont(p); await cont(p) } }),
  s({ name: 'new-meal-days-filled', url: '/plans/new/meal', act: async (p) => { await name(p, 'Cut phase'); await cont(p); await cont(p); await pick(p, 'Search foods', 'pumpkin', new RegExp('^Slow-roasted')) } }),
  s({ name: 'new-meal-search', url: '/plans/new/meal', act: async (p) => { await name(p, 'Cut phase'); await cont(p); await cont(p); await p.getByRole('button', { name: 'Add meal' }).click(); await wait(p, 600); await p.getByPlaceholder('Search foods').fill('yog'); await wait(p, 900) } }),
  s({ name: 'new-meal-saving', url: '/plans/new/meal', hang: ['/v1/plans'], act: async (p) => { await name(p, 'Cut phase'); await cont(p); await cont(p); await pick(p, 'Search foods', 'yog', /^Greek yoghurt/); await p.getByRole('button', { name: 'Save plan' }).click(); await wait(p, 400) } }),
  s({ name: 'new-meal-error', url: '/plans/new/meal', fail: ['/v1/plans'], failMessage: "We couldn't save that. Check your connection and try again.", act: async (p) => { await name(p, 'Cut phase'); await cont(p); await cont(p); await pick(p, 'Search foods', 'yog', /^Greek yoghurt/); await p.getByRole('button', { name: 'Save plan' }).click(); await wait(p, 900) } }),
  s({ name: 'new-workout-empty', url: '/plans/new/workout' }),
  s({ name: 'new-workout-days-invalid', url: '/plans/new/workout', act: async (p) => { await name(p, 'Push Pull Legs'); await cont(p) } }),
  s({ name: 'new-workout-days-filled', url: '/plans/new/workout', act: async (p) => { await name(p, 'Push Pull Legs'); await cont(p); await pick(p, 'Search exercises', 'press', /^Single-arm/); await pick(p, 'Search exercises', 'bench', /^Bench press/); await p.getByRole('button', { name: 'Add day' }).click(); await p.getByRole('button', { name: 'Rest day' }).nth(1).click() } }),
  s({ name: 'new-workout-search', url: '/plans/new/workout', act: async (p) => { await name(p, 'Push Pull Legs'); await cont(p); await p.getByRole('button', { name: 'Add exercise' }).click(); await wait(p, 600); await p.getByPlaceholder('Search exercises').fill('press'); await wait(p, 900) } }),
  s({ name: 'new-workout-error', url: '/plans/new/workout', fail: ['/v1/plans'], act: async (p) => { await name(p, 'Push Pull Legs'); await cont(p); await pick(p, 'Search exercises', 'bench', /^Bench press/); await p.getByRole('button', { name: 'Save program' }).click(); await wait(p, 900) } }),
  s({ name: 'edit-workout', url: '/plans/edit?id=work-1' }),
  s({ name: 'edit-workout-days', url: '/plans/edit?id=work-1', act: async (p) => { await cont(p) } }),
  s({ name: 'edit-meal-targets', url: '/plans/edit?id=meal-1', act: async (p) => { await cont(p) } }),
  s({ name: 'edit-loading', url: '/plans/edit?id=work-1', hang: ['/v1/plans'] }),
]

// ── Transitions. The recorder's route stubs return {} (and onboarding incomplete), so slice 7 records against its own
// mock (`home` set): run the fixtures above as a server and a dev server pointed at it, then
//   BASE_URL=http://localhost:3027 API_URL=http://localhost:4017 node scripts/redesign-transitions.mjs slice-7 ──
const day1 = (p) => p.getByRole('button', { name: 'Upper A day 1' })
const transitions = [
  { name: 'open-plan', url: '/plans', home: 'plans', warm: '/plans/view?id=work-1', act: (p) => p.getByRole('button', { name: /^Training/ }).click() },
  { name: 'day-expand', url: '/plans/view?id=work-1', home: 'plans', act: (p) => day1(p).click() },
  { name: 'day-collapse', url: '/plans/view?id=work-1', home: 'plans', act: async (p) => { await day1(p).click(); await wait(p, 1200); await day1(p).click() } },
  // The edit route starts with the name filled, so the recording holds only the step change (no CTA enabling).
  { name: 'builder-step', url: '/plans/edit?id=meal-1', home: 'plans', act: (p) => p.getByRole('button', { name: 'Continue' }).click() },
  { name: 'builder-step-back', url: '/plans/edit?id=meal-1', home: 'plans', act: async (p) => { await p.getByRole('button', { name: 'Continue' }).click(); await wait(p, 1200); await p.getByRole('button', { name: 'Back' }).click() } },
  { name: 'meal-day-switch', url: '/plans/view?id=meal-1', home: 'plans', act: (p) => p.getByRole('button', { name: 'Tue 27' }).click() },
]

const slice7 = { shots, transitions }
export default slice7
