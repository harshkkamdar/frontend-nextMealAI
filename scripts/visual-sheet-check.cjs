/**
 * visual-sheet-check.cjs — log in and screenshot the diary + bottom sheets on a
 * mobile viewport, so sheet/layout changes can be EYEBALLED before shipping
 * (the bottom-sheet UX has been a repeat source of blind-shipped regressions).
 *
 * Usage:
 *   pnpm dev                       # in another terminal (localhost:3010)
 *   TEST_EMAIL=… TEST_PASSWORD=… node scripts/visual-sheet-check.cjs
 *
 * Env:
 *   BASE_URL       default http://localhost:3010
 *   TEST_EMAIL     required
 *   TEST_PASSWORD  required
 *   OUT            output dir, default ./visual-check
 */
const { chromium, devices } = require('playwright')
const fs = require('fs')

const BASE = process.env.BASE_URL || 'http://localhost:3010'
const EMAIL = process.env.TEST_EMAIL
const PASSWORD = process.env.TEST_PASSWORD
const OUT = process.env.OUT || './visual-check'

;(async () => {
  if (!EMAIL || !PASSWORD) { console.error('Set TEST_EMAIL and TEST_PASSWORD'); process.exit(1) }
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ ...devices['iPhone 12 Pro'] })
  const page = await ctx.newPage()

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.fill('input[type=email]', EMAIL)
  await page.fill('input[type=password]', PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(/dashboard|diary|onboarding/, { timeout: 25000 }).catch(() => {})
  await page.goto(`${BASE}/diary`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/diary.png` })

  // Add-food sheet (Food + Meals tabs)
  await page.getByText(/Add to (Breakfast|Lunch|Dinner|Snack)/).first().click({ timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `${OUT}/add-sheet.png` })
  await page.getByRole('button', { name: /Meals/ }).first().click({ timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/meals-tab.png` })
  await page.keyboard.press('Escape'); await page.waitForTimeout(700)

  // Edit sheet
  await page.getByText(/^(banana|oatmeal|black coffee|dal|Roti)/i).first().click({ timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(1300)
  await page.screenshot({ path: `${OUT}/edit-sheet.png` })
  await page.keyboard.press('Escape'); await page.waitForTimeout(700)

  // Geo chat
  await page.getByRole('button', { name: /Geo/i }).first().click({ timeout: 6000 }).catch(() => {})
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `${OUT}/geo-chat.png` })

  await browser.close()
  console.log(`Screenshots written to ${OUT}/`)
})().catch((e) => { console.error('FATAL', e.message); process.exit(1) })
