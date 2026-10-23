/**
 * d2-compare.mjs - side-by-side before/after sheet for chosen rows.
 * Usage: node scripts/d2-compare.mjs D2-29 [default,error] [390]
 * Writes docs/phase2/screens/after/compare-<rows>-<width>.png
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const rows = process.argv[2].split(',')
const states = (process.argv[3] || 'default,empty,error,long').split(',')
const width = process.argv[4] || '390'
const dir = 'docs/phase2/screens'
const cells = []
for (const id of rows) {
  for (const state of states) {
    const file = fs.readdirSync(path.join(dir, 'after')).find((f) => f.startsWith(id + '-') && f.endsWith(`-${state}-${width}.png`) && !/^D2-\d+[a-z]-/.test(f.replace(id, 'X')))
    if (!file) continue
    for (const phase of ['baseline', 'after']) {
      if (fs.existsSync(path.join(dir, phase, file))) cells.push(`<figure><img src="${phase}/${file}"><figcaption>${phase} - ${file}</figcaption></figure>`)
    }
  }
}
const html = path.resolve(dir, '_compare.html')
fs.writeFileSync(html, `<style>body{margin:8px;font:13px Arial;background:#ddd;display:grid;grid-template-columns:repeat(4,300px);gap:8px}figure{margin:0}img{width:100%;display:block}</style>${cells.join('')}`)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1240, height: 900 } })
await page.goto('file://' + html)
await page.waitForTimeout(300)
const out = path.join(dir, 'after', `compare-${rows.join('_')}-${width}.png`)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
fs.unlinkSync(html)
console.log(out)
