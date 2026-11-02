'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export type GeoState = 'default' | 'happy' | 'thinking' | 'suggest' | 'coach'
/** Kept for call sites from the earlier build; both render the FIQR mark now. */
export type GeoVariant = 'mark' | 'face'
/**
 * Geo's only expression is where its bar sits round the ring (DESIGN.md section 7). `rest` is the logo; `speak` turns
 * the bar toward the line beside it; `up` and `down` read a trend.
 */
export type GeoPose = 'rest' | 'speak' | 'up' | 'down'
const TURN: Record<GeoPose, number> = { rest: 0, speak: -45, up: -90, down: 45 }

/**
 * The FIQR mark: a ring crossed at its lower right by a short orange bar at -45 deg. Drawn on a 100 unit box, ring
 * centre 50,50. `tone` picks the ring colour for the surface. `arrive` starts at rest and turns to `pose` just after
 * mount (Geo turning to you); `working` orbits; `done` makes one turn and settles (globals.css).
 */
export function GeoMark({ size = 24, tone = 'ink', pose = 'rest', arrive = false, working = false, done = false, className }: {
  size?: number
  tone?: 'ink' | 'cream'
  pose?: GeoPose
  arrive?: boolean
  working?: boolean
  done?: boolean
  className?: string
}) {
  const [arrived, setArrived] = useState(!arrive)
  useEffect(() => {
    if (!arrive) return
    const id = window.setTimeout(() => setArrived(true), 180)
    return () => window.clearTimeout(id)
  }, [arrive])
  const turn = arrived ? TURN[pose] : 0
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ '--geo-turn': `${turn}deg` } as CSSProperties}
      className={cn('shrink-0', working && 'geo-working', done && 'geo-done', className)}
    >
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
