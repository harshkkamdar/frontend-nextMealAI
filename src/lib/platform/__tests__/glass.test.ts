import { describe, expect, it } from 'vitest'
import { applyGlassMode, glassMode } from '../glass'

describe('glassMode', () => {
  it('turns glass off on low-end devices', () => {
    expect(glassMode({ hardwareConcurrency: 2 })).toBe('off')
    expect(glassMode({ hardwareConcurrency: 8, deviceMemory: 4 })).toBe('off')
  })

  it('turns glass off when Reduce Transparency is on', () => {
    expect(glassMode({ hardwareConcurrency: 8, deviceMemory: 8, reduceTransparency: true })).toBe('off')
  })

  it('keeps glass on capable devices, including when deviceMemory is not exposed (Safari)', () => {
    expect(glassMode({ hardwareConcurrency: 6 })).toBe('on')
    expect(glassMode({ hardwareConcurrency: 8, deviceMemory: 8 })).toBe('on')
  })
})

describe('applyGlassMode', () => {
  const media = (matches: boolean) => { window.matchMedia = ((q: string) => ({ matches: matches && q.includes('reduced-transparency'), media: q, addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia }

  it('marks reduced transparency and turns glass off when the system setting asks for it', () => {
    media(true)
    expect(applyGlassMode()).toBe('off')
    expect(document.documentElement.dataset.transparency).toBe('reduced')
  })

  it('honours the native flag even when the web setting is not exposed (WKWebView)', () => {
    media(false)
    expect(applyGlassMode(true)).toBe('off')
    expect(document.documentElement.dataset.transparency).toBe('reduced')
    applyGlassMode(false)
    expect(document.documentElement.dataset.transparency).toBeUndefined()
  })
})
