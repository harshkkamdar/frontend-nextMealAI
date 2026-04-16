let ctx: AudioContext | null = null

/**
 * Create / resume a shared AudioContext. Call on any user-initiated tap so
 * Mobile Safari unlocks audio playback before the timer fires later.
 */
export function unlockAudio(): void {
  if (typeof window === 'undefined' || !window.AudioContext) return
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
}

/**
 * Play a short two-tone bell (~400ms). Silent no-op when AudioContext is
 * unavailable or still suspended.
 */
export function playBell(): void {
  if (!ctx || ctx.state !== 'running') return

  const now = ctx.currentTime

  // Tone 1 — 830 Hz (Ab5-ish)
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.value = 830
  gain1.gain.setValueAtTime(0.35, now)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
  osc1.connect(gain1).connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.4)

  // Tone 2 — 1046 Hz (C6), offset 150ms for a "ding-ding" feel
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sine'
  osc2.frequency.value = 1046
  gain2.gain.setValueAtTime(0.25, now + 0.15)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
  osc2.connect(gain2).connect(ctx.destination)
  osc2.start(now + 0.15)
  osc2.stop(now + 0.5)
}
