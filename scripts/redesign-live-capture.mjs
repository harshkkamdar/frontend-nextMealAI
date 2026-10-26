/**
 * redesign-live-capture.mjs - capture screens against the real local API with the capture account
 * (.env.capture, F3). Read-only: it only navigates, scrolls and opens sheets; it never saves anything.
 * Usage (dev server on :3020, core API on :4010): node scripts/redesign-live-capture.mjs slice-2 [filter]
 * Writes docs/redesign/screens/<slice>/live/<shot>-<width>.png and live/checks.json (axe, small targets, orange count).
 */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:3020'
const SLICE = process.argv[2] || 'slice-2'
const FILTER = process.argv[3] ? new RegExp(process.argv[3]) : null
const OUT = path.join('docs/redesign/screens', SLICE, 'live')
const WIDTHS = [{ w: 390, h: 844 }, { w: 360, h: 800 }]

const env = Object.fromEntries(fs.readFileSync('.env.capture', 'utf8').split('\n').filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)))

const SHOTS = {
  'slice-2': [
    { name: 'home', url: '/dashboard' },
    { name: 'home-scrolled', url: '/dashboard', act: async (p) => { await p.mouse.wheel(0, 700); await p.waitForTimeout(700) } },
    { name: 'home-plus-sheet', url: '/dashboard', act: async (p) => { await p.getByRole('button', { name: 'Log something' }).click(); await p.waitForTimeout(700) } },
    { name: 'home-macro-sheet', url: '/dashboard', act: async (p) => { await p.getByRole('button', { name: /^Protein/ }).click(); await p.waitForTimeout(700) } },
    { name: 'home-weight-sheet', url: '/dashboard', act: async (p) => { await p.getByRole('button', { name: /^Weight/ }).click(); await p.waitForTimeout(700) } },
    { name: 'home-water-sheet', url: '/dashboard', act: async (p) => { await p.getByRole('button', { name: /^Water/ }).click(); await p.waitForTimeout(700) } },
    { name: 'home-sleep-sheet', url: '/dashboard', act: async (p) => { await p.getByRole('button', { name: /^Sleep/ }).click(); await p.waitForTimeout(700) } },
    { name: 'food-under-shell', url: '/food' },
    { name: 'train-under-shell', url: '/train' },
    { name: 'geo-under-shell', url: '/chat' },
  ],
}

async function checks(page) {
  const axe = await new AxeBuilder({ page }).analyze()
  const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }))
  const { small, orange } = await page.evaluate(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0' && r.bottom > 0 && r.top < innerHeight }
    const controls = [...document.querySelectorAll('button, a[href], input, [role="radio"], [role="tab"]')].filter(visible).filter((el) => !el.closest('[aria-hidden="true"]'))
    const small = controls.filter((el) => { const r = el.getBoundingClientRect(); return (r.width < 44 || r.height < 44) && !(el.tagName === 'INPUT' && r.height >= 44) }).map((el) => `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`)
    const orange = controls.filter((el) => getComputedStyle(el).backgroundColor === 'rgb(232, 98, 42)').length
    return { small, orange }
  })
  return { serious, small, orange }
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const results = {}
  for (const { w, h } of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
    await page.getByLabel('Email').fill(env.TEST_EMAIL)
    await page.getByLabel('Password', { exact: true }).fill(env.TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/dashboard|onboarding/, { timeout: 30000 })
    for (const shot of SHOTS[SLICE]) {
      if (FILTER && !FILTER.test(shot.name)) continue
      await page.goto(`${BASE}${shot.url}`, { waitUntil: 'networkidle' })
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
      await page.waitForTimeout(1600)
      if (shot.act) await shot.act(page)
      const file = path.join(OUT, `${shot.name}-${w}.png`)
      await page.screenshot({ path: file })
      results[`${shot.name}-${w}`] = await checks(page)
      console.log(file, JSON.stringify(results[`${shot.name}-${w}`]))
    }
    await ctx.close()
  }
  fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify(results, null, 2))
  await browser.close()
})().catch((error) => { console.error(error.message); process.exit(1) })
