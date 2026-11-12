'use client'

import { MarkShapes } from '@/components/ui/fiqr/mark'
import { cn } from '@/lib/utils'

export type GeoState = 'default' | 'happy' | 'thinking' | 'suggest' | 'coach'
/** Kept for call sites from the earlier build; both render the FIQR mark now. */
export type GeoVariant = 'mark' | 'face'
/**
 * The FIQR mark, at rest always exactly the logo (George: one logo everywhere). `tone` picks the ring colour for the
 * surface. Motion (globals.css) only while something happens, ending back at the logo: `working` orbits the bar round
 * the ring; `done` makes one turn; `listening` sways while you type; `nudge` steps out and back once. `muted`: the ring
 * dims (offline).
 */
export function GeoMark({ size = 24, tone = 'ink', working = false, done = false, listening = false, nudge = false, muted = false, className }: {
  size?: number
  tone?: 'ink' | 'cream'
  working?: boolean
  done?: boolean
  listening?: boolean
  nudge?: boolean
  muted?: boolean
  className?: string
}) {
  // One motion at a time, strongest first: working beats listening beats a one-off.
  const motion = working ? 'geo-working' : listening ? 'geo-listening' : done ? 'geo-done' : nudge ? 'geo-nudge' : null
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={cn('shrink-0', motion, className)}>
      <MarkShapes ring={tone === 'cream' ? '#FDF6EC' : '#111C35'} ringOpacity={muted ? 0.35 : 1} barClassName="geo-bar" />
    </svg>
  )
}

/**
 * Geo's avatar: the app icon in miniature, a navy disc holding the FIQR mark (cream ring, orange bar).
 * `thinking` sets the mark working. `onNavy` adds a cream edge so the disc reads on navy surfaces.
 */
export function GeoAvatar({
  state = 'default',
  size = 36,
  className,
  onNavy = false,
}: {
  state?: GeoState
  size?: number
  variant?: GeoVariant
  className?: string
  onNavy?: boolean
}) {
  if (onNavy) {
    // On a navy surface the card is the disc: the bare cream mark, as on the app icon.
    return (
      <span role="img" aria-label="Geo" data-geo-state={state} className={cn('grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
        <GeoMark size={size} tone="cream" working={state === 'thinking'} />
      </span>
    )
  }
  return (
    <span
      role="img"
      aria-label="Geo"
      data-geo-state={state}
      className={cn('grid shrink-0 place-items-center rounded-full bg-ink', className)}
      style={{ width: size, height: size }}
    >
      <GeoMark size={Math.round(size * 0.72)} tone="cream" working={state === 'thinking'} />
    </span>
  )
}
