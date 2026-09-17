'use client'

import { cn } from '@/lib/utils'

export type GeoState = 'default' | 'happy' | 'thinking' | 'suggest' | 'coach'
export type GeoVariant = 'mark' | 'face'

type Expression = 'neutral' | 'happy' | 'thinking' | 'celebrating'

const EXPRESSION: Record<GeoState, Expression> = {
  default: 'neutral',
  happy: 'happy',
  thinking: 'thinking',
  suggest: 'happy',
  coach: 'celebrating',
}

const INK = '#111C35'
const ORANGE = '#E8622A'
const CREAM = '#FDF6EC'

function Eyes({ expression }: { expression: Expression }) {
  switch (expression) {
    case 'happy':
      return (
        <>
          <path d="M32 56 q7 -9 14 0" stroke={CREAM} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M54 56 q7 -9 14 0" stroke={CREAM} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M40 70 q10 8 20 0" stroke={CREAM} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      )
    case 'thinking':
      return (
        <>
          <rect x="35" y="52" width="8" height="12" rx="4" fill={CREAM} />
          <rect x="57" y="46" width="8" height="18" rx="4" fill={CREAM} />
          <path d="M42 72 h14" stroke={CREAM} strokeWidth="5" strokeLinecap="round" />
        </>
      )
    case 'celebrating':
      return (
        <>
          <path d="M32 56 q7 -9 14 0" stroke={CREAM} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M54 56 q7 -9 14 0" stroke={CREAM} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M38 68 q12 12 24 0" stroke={ORANGE} strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="84" cy="20" r="4" fill={ORANGE} />
          <circle cx="16" cy="24" r="3" fill={ORANGE} />
        </>
      )
    default:
      return (
        <>
          <rect x="35" y="48" width="8" height="16" rx="4" fill={CREAM} />
          <rect x="57" y="48" width="8" height="16" rx="4" fill={CREAM} />
        </>
      )
  }
}

/**
 * Geo's avatar.
 * - `mark` (default): the navy circle with the orange G from the design reference. Used where the
 *   reference shows it: the nav button, Geo's line on Home, the "Geo's read" label.
 * - `face`: the Coach — navy head, orange sweatband, cream eyes — with an expression derived from
 *   `state`. Used where Geo is talking: chat bubbles, the companion header, onboarding, generating.
 * Inline SVG, no network, no dependencies.
 */
export function GeoAvatar({
  state = 'default',
  size = 36,
  variant = 'mark',
  className,
  onNavy = false,
}: {
  state?: GeoState
  size?: number
  variant?: GeoVariant
  className?: string
  /** Adds a 1px cream ring so the navy head stays visible on navy surfaces. */
  onNavy?: boolean
}) {
  if (variant === 'face') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label="Geo"
        data-geo-expression={EXPRESSION[state]}
        className={cn('shrink-0', className)}
      >
        <circle cx="50" cy="50" r="46" fill={INK} stroke={onNavy ? CREAM : 'none'} strokeWidth={onNavy ? 4 : 0} />
        <path d="M8 38 q42 -14 84 0 v10 q-42 -12 -84 0z" fill={ORANGE} />
        <Eyes expression={EXPRESSION[state]} />
      </svg>
    )
  }

  return (
    <div
      role="img"
      aria-label="Geo"
      className={cn('rounded-full bg-ink text-accent font-bold flex items-center justify-center shrink-0', className)}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      G
    </div>
  )
}
