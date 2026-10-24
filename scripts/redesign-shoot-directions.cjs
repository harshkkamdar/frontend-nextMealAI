const { chromium } = require('playwright')
const path = require('path')
;(async () => {
  const dir = process.argv[2]
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1400, height: 940 }, deviceScaleFactor: 2 })
  for (const k of ['a', 'b', 'c']) {
    await p.goto('file://' + path.resolve(dir, k + '.html'), { waitUntil: 'networkidle' })
    await p.evaluate(() => document.fonts.ready)
    const phones = await p.$$('.phone')
    const names = ['home', 'sheet', 'onboarding']
    for (let i = 0; i < phones.length; i++) await phones[i].screenshot({ path: path.join(dir, `${k}-${names[i]}.png`) })
    await p.screenshot({ path: path.join(dir, `${k}-all.png`) })
  }
  await b.close()
})()
