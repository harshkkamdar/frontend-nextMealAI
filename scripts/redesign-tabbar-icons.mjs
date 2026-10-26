// Usage: mock API (node scripts/redesign-mock-api.mjs 4071) and the app on :3071, then node scripts/redesign-tabbar-icons.mjs (REDUCE=1 for reduced motion).
// Real-browser check: every tab icon is visible while the bar is expanded, across tab switches, collapse/expand, push/pop.
import { chromium } from 'playwright'
const BASE = process.env.BASE_URL || 'http://localhost:3071'
const API = process.env.API_URL || 'http://localhost:4071'
const REDUCE = process.env.REDUCE === '1'
const AUTH = { state: { user: { id: 'capture-user', email: 'capture@example.com' }, accessToken: 'capture-token', refreshToken: 'capture-refresh' }, version: 0 }
await fetch(API + '/__scenario', { method: 'POST', body: JSON.stringify({ home: 'returning', done: ['personal', 'fitness', 'nutrition'], consent: true, fail: null }) })
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: REDUCE ? 'reduce' : 'no-preference', timezoneId: 'Australia/Sydney' })
await ctx.addInitScript((a) => { localStorage.setItem("nextmealai-auth", JSON.stringify(a)); const hide = () => { const s = document.createElement("style"); s.textContent = "nextjs-portal{display:none!important}"; document.head.appendChild(s) }; document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", hide) : hide() }, AUTH)
const page = await ctx.newPage()
await page.route('http://localhost:4010/**', (r) => r.abort())
let failures = 0
const check = async (step) => {
  await page.waitForTimeout(900)
  const res = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main"]')
    if (nav.querySelector('[aria-label^="Show tabs"]')) return { collapsed: true }
    return Object.fromEntries([...nav.querySelectorAll('a')].map((a) => {
      const svg = a.querySelector('svg')
      let op = 1
      for (let el = svg; el && el !== nav; el = el.parentElement) op *= parseFloat(getComputedStyle(el).opacity)
      return [a.textContent, svg ? Math.round(op * 100) / 100 : 'no svg']
    }))
  })
  const bad = !res.collapsed && Object.values(res).some((v) => v !== 1)
  if (bad) failures++
  console.log(bad ? 'FAIL' : 'ok  ', step, JSON.stringify(res))
}
const wheel = async (dy, n) => { await page.mouse.move(195, 400); for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy); await page.waitForTimeout(16) } }
const tab = (name) => page.locator('nav[aria-label="Main"] a', { hasText: new RegExp(`^${name}$`) }).click()
await page.goto(BASE + '/dashboard')
await page.waitForSelector('nav[aria-label="Main"] a')
await check('load /dashboard')
for (const name of ['Food', 'Train', 'Geo', 'Home', 'Food', 'Home']) {
  await tab(name); await check(`tab -> ${name}`)
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300)
  await wheel(30, 30); await check(`collapse on ${name}`)
  const restore = page.locator('[aria-label^="Show tabs"]')
  if (await restore.count()) { await restore.click(); await check(`tap expand on ${name}`) }
  await wheel(30, 10); await wheel(-10, 4); await check(`scroll-up expand on ${name}`)
}
// Push a pushed page from Home (settings), then back.
await page.evaluate(() => scrollTo(0, 0))
const settings = page.getByRole('link', { name: /settings/i }).first()
if (await settings.count()) { await settings.click(); await check('push settings'); await page.goBack(); await check('pop back') }
console.log(failures ? `${failures} FAILURES` : 'ALL OK')
await browser.close()
process.exit(failures ? 1 : 0)
