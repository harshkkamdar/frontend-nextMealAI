/**
 * redesign-walkthrough.mjs - plays the whole onboarding the way a person would (taps, wheel and ruler scrolls)
 * against a mocked API and records it, so the motion can be reviewed as video.
 * Usage (prod server on :3020): node scripts/redesign-walkthrough.mjs
 * Writes docs/redesign/screens/slice-1/walkthrough.mp4 and walkthrough.json (taps and seconds).
 */
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:3020'
const API = process.env.API_URL || 'http://localhost:4010'
const OUT = 'docs/redesign/screens/slice-1'
const AUTH = { state: { user: { id: 'capture-user', email: 'capture@example.com' }, accessToken: 'capture-token', refreshToken: 'capture-refresh' }, version: 0 }
const PLANS = [
  { id: 'meal-1', type: 'meal', is_active: true, name: 'Lean and steady', content: { daily_targets: { calories: 1950, protein: 140, carbs: 190, fat: 65 }, days: [] } },
  { id: 'work-1', type: 'workout', is_active: true, name: 'Four-day upper lower', content: { days: [{ name: 'Upper A', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower A', exercises: [1, 2, 3, 4] }, { name: 'Upper B', exercises: [1, 2, 3, 4, 5] }, { name: 'Lower B', exercises: [1, 2, 3, 4] }] } },
]
const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }

;(async () => {
  const browser = await chromium.launch()
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fiqr-video-'))
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, recordVideo: { dir: tmp, size: { width: 390, height: 844 } } })
  const page = await context.newPage()
  const done = new Set()
  let consent = false
  await page.route(`${API}/**`, (route) => {
    const req = route.request()
    const p = new URL(req.url()).pathname
    const json = (body) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    const m = p.match(/^\/v1\/profile\/onboarding\/(personal|fitness|nutrition)$/)
    if (m) { done.add(m[1]); return json({}) }
    if (p === '/v1/profile/onboarding') return json(Object.fromEntries(['personal', 'fitness', 'nutrition'].map((k) => [k, { complete: done.has(k) }])))
    if (p === '/v1/profile') {
      if (req.method() !== 'GET') consent = true
      return json({ id: 'capture-user', name: 'Sam', ai_consent_at: consent ? '2026-10-24T00:00:00Z' : null, health_disclaimer_ack_at: consent ? '2026-10-24T00:00:00Z' : null })
    }
    if (p.startsWith('/v1/plans/generate')) return new Promise((r) => setTimeout(r, 1800)).then(() => json({ success: true, plans: PLANS }))
    if (p.startsWith('/v1/plans')) return json(PLANS)
    return json({})
  })

  await page.goto(BASE + '/login')
  await page.evaluate((auth) => { localStorage.clear(); localStorage.setItem('nextmealai-auth', JSON.stringify(auth)) }, AUTH)
  await page.goto(BASE + '/onboarding/personal?q=name', { waitUntil: 'networkidle' })

  let taps = 0
  const t0 = Date.now()
  const tap = async (locator) => { await locator.tap(); taps++; await page.waitForTimeout(650) }
  const radio = (name) => page.getByRole('radio', { name: new RegExp('^' + name) })
  const next = (name = 'Continue') => tap(page.getByRole('button', { name, exact: true }))
  const scrub = (selector, px) => page.evaluate(async ([s, d]) => {
    const el = document.querySelector(s)
    for (let i = 0; i < 40; i++) { el.scrollLeft += Math.round(d / 40); await new Promise((r) => requestAnimationFrame(r)) }
  }, [selector, px])
  const wheel = (label, index) => page.evaluate(([l, i]) => document.querySelector(`[role=listbox][aria-label="${l}"]`).scrollTo({ top: i * 44, behavior: 'smooth' }), [label, index])

  await page.waitForTimeout(900)
  await page.getByLabel('Your name').pressSequentially('Sam', { delay: 120 })
  await next()
  await tap(radio('Female'))
  await page.waitForTimeout(400)
  await wheel('Month', 2); await page.waitForTimeout(500)
  await wheel('Day', 11); await page.waitForTimeout(500)
  await wheel('Year', 1994 - 1926); await page.waitForTimeout(900)
  if (process.env.DEBUG) { await page.screenshot({ path: process.env.DEBUG }); console.log(await page.evaluate(() => localStorage.getItem('fiqr-onboarding-draft'))) }
  await next()
  await scrub('.scrollbar-hide.overflow-x-auto', -40); await page.waitForTimeout(500)
  await next()
  await tap(radio('Lose fat'))
  await tap(radio('Moderately active'))
  await tap(radio('4'))
  await tap(radio('Some experience'))
  await tap(page.getByRole('checkbox', { name: /^Dumbbells/ }))
  await tap(page.getByRole('checkbox', { name: /^Bench/ }))
  await next()
  await tap(page.getByRole('button', { name: 'Lower back', exact: true }))
  await next()
  await scrub('.scrollbar-hide.overflow-x-auto', 80); await page.waitForTimeout(500)
  await next()
  await scrub('.scrollbar-hide.overflow-x-auto', -240); await page.waitForTimeout(500)
  await next()
  await page.waitForTimeout(2200)
  await next('Sounds right')
  await tap(page.getByRole('checkbox', { name: /^Nuts/ }))
  await next()
  await tap(radio('I eat everything'))
  await tap(page.getByRole('button', { name: 'Mushrooms', exact: true }))
  await next()
  await tap(page.getByRole('button', { name: 'Indian', exact: true }))
  await tap(page.getByRole('button', { name: 'Italian', exact: true }))
  await next()
  await tap(radio('3'))
  await next('Finish')
  await page.waitForURL('**/onboarding/consent', { timeout: 10000 })
  await page.waitForTimeout(700)
  await tap(page.getByText('I understand and agree'))
  await tap(page.getByText('I understand', { exact: true }))
  await next('I agree')
  await page.waitForURL('**/onboarding/review', { timeout: 15000 })
  await page.waitForTimeout(2500)
  const seconds = Math.round((Date.now() - t0) / 100) / 10

  const video = await page.video().path()
  await context.close()
  await browser.close()
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', path.join(OUT, 'walkthrough.mp4')])
  fs.rmSync(tmp, { recursive: true, force: true })
  // Scripted pauses (650 ms after each tap) are included, so the seconds are an upper bound for a fast scripted run, not a human time.
  fs.writeFileSync(path.join(OUT, 'walkthrough.json'), JSON.stringify({ taps, seconds, note: 'scripted; 650 ms pause after each tap, wheel and ruler scrolls not counted as taps' }, null, 2))
  console.log(JSON.stringify({ taps, seconds }))
})().catch(async (e) => { console.error("FATAL", e.message.split("\n")[0], e.stack.split("\n").filter((l) => l.includes("walkthrough.mjs")).join(" | ")); process.exit(1) })
