import { describe, expect, it } from 'vitest'
import { glassMode } from '../glass'

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
