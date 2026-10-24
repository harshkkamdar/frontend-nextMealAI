/**
 * Glass material mode for the controls layer (tab bar, round buttons, sheets).
 * Measured 24 Oct 2026: backdrop blur froze 150-200 ms on a 2-core Android emulator, so weak
 * devices get the opaque surface. See docs/redesign/design-system.md "Glass material".
 */
export type GlassMode = 'on' | 'off'

interface DeviceHints {
  hardwareConcurrency?: number
  deviceMemory?: number
  reduceTransparency?: boolean
}

export function glassMode({ hardwareConcurrency, deviceMemory, reduceTransparency }: DeviceHints): GlassMode {
  if (reduceTransparency) return 'off'
  if (hardwareConcurrency !== undefined && hardwareConcurrency <= 4) return 'off'
  if (deviceMemory !== undefined && deviceMemory <= 4) return 'off'
  return 'on'
}

/** CSS defaults to the opaque surface; this turns glass on only where the device can afford it. */
export function applyGlassMode(reduceTransparency = false): GlassMode {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const mode = glassMode({ hardwareConcurrency: nav.hardwareConcurrency, deviceMemory: nav.deviceMemory, reduceTransparency })
  document.documentElement.dataset.glass = mode
  return mode
}
