'use client'

import { cn } from '@/lib/utils'

export type GeoState = 'default' | 'happy' | 'thinking' | 'suggest' | 'coach'
/** Kept for call sites from the earlier build; both render the FIQR mark now. */
export type GeoVariant = 'mark' | 'face'

/**
 * The FIQR mark: a ring crossed at its lower right by a short orange bar at -45 deg (DESIGN.md section 7).
 * Drawn on a 100 unit box: ring centre 50,50. `tone` picks the ring colour for the surface it sits on.
 * While `working`, the bar travels round the ring (globals.css `geo-orbit`).
 */
export function GeoMark({ size = 24, tone = 'ink', working = false, className }: {
  size?: number
  tone?: 'ink' | 'cream'
  working?: boolean
  className?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={cn('shrink-0', working && 'geo-working', className)}>
      <circle cx="50" cy="50" r="31.5" fill="none" stroke={tone === 'cream' ? '#FDF6EC' : '#111C35'} strokeWidth="7" />
      <line className="geo-bar" x1="65.4" y1="65.4" x2="81" y2="81" stroke="#E8622A" strokeWidth="7" strokeLinecap="round" />
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
