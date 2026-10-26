import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// iOS 18 WebKit (the Capacitor WKWebView) ships `button { align-items: flex-start }` in its UA sheet; newer WebKit and
// Chromium use `normal`. Home's macro dots and tile progress bars are full-width rows inside flex-col buttons, so under
// the old UA rule they shrink to 0 wide and vanish on device (27 Oct 2026). The app's base layer must reset it.
const UA_IOS18 = 'button { align-items: flex-start; }'

function baseLayer(): string {
  const css = readFileSync(path.resolve(__dirname, '../globals.css'), 'utf8')
  const start = css.indexOf('@layer base {')
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}' && --depth === 0) return css.slice(css.indexOf('{', start) + 1, i)
  }
  throw new Error('no @layer base block in globals.css')
}

describe('globals.css base layer', () => {
  it('overrides the iOS 18 WebKit button align-items so flex-col button rows stretch', () => {
    const app = baseLayer().split('\n').filter((line) => !line.includes('@apply')).join('\n')
    document.head.innerHTML = `<style>${UA_IOS18}</style><style>${app}</style>`
    document.body.innerHTML = '<button class="flex flex-col"><span class="flex"></span></button>'
    expect(getComputedStyle(document.querySelector('button')!).alignItems).not.toBe('flex-start')
  })
})
