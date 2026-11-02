'use client'

/**
 * Mascot exploration, round 2 (throwaway sketch, /mascot only). Eight characters on one 120-unit grid share one face
 * and one pair of floating hands, so every expression reads the same across them. The mouth and hands appear only when
 * Geo is doing something; at rest it is just the character.
 */

import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type Mood = 'rest' | 'speak' | 'listening' | 'working' | 'done' | 'nudge' | 'up' | 'down' | 'offline'
export type Scheme = 'navy' | 'volt' | 'sky'
export type CharId = 'kangaroo' | 'bear' | 'coach' | 'kettlebell' | 'quokka' | 'wombat' | 'shaker' | 'stopwatch'

const NAVY = '#111C35'
const ORANGE = '#E8622A'
const CREAM = '#FDF6EC'

export const SCHEMES: Record<Scheme, { name: string; body: string; feature: string; patch: string; note: string }> = {
  navy: { name: 'Navy', body: NAVY, feature: CREAM, patch: CREAM, note: 'The brand navy. Calm; disappears into the navy nav button without an edge.' },
  volt: { name: 'Volt', body: '#C6F135', feature: NAVY, patch: '#F4FCD3', note: "Geo's own colour: sporty, loud, owned. Pops on cream and on navy." },
  sky: { name: 'Sky', body: '#8CCBF2', feature: NAVY, patch: CREAM, note: 'Fresh and friendly; softer than volt, still pops on navy.' },
}

export const MOODS: { mood: Mood; when: string }[] = [
  { mood: 'rest', when: 'Waiting. Breathes, blinks.' },
  { mood: 'speak', when: "Geo's line: mouth moves, a hand gestures." },
  { mood: 'listening', when: 'You are typing: head tilts.' },
  { mood: 'working', when: 'Reading a photo: clipboard out.' },
  { mood: 'done', when: 'Logged: smile, thumbs up.' },
  { mood: 'nudge', when: 'Check-in ready: a wave.' },
  { mood: 'up', when: 'New best: fists up, grin.' },
  { mood: 'down', when: 'Missed week: concerned, not sad.' },
  { mood: 'offline', when: 'No connection: asleep.' },
]

type Pt = [number, number]
interface Spec {
  /** Eye centre line, eye gap, eye size, mouth line and width. `mouthOnPatch`: the mouth sits on the light muzzle. */
  face: { cx: number; cy: number; gap: number; ew: number; eh: number; my: number; mw: number; mouthOnPatch?: boolean; eyesOnPatch?: boolean }
  /** Hand rest points left and right, the raised-hands line, and where a clipboard is held. */
  hands: { l: Pt; r: Pt; up: number; board: Pt; size?: number; fill?: string }
  /** Square crop for small spots (Geo's line, the nav button): x, y, side. */
  head: [number, number, number]
  body: (mood: Mood, c: (typeof SCHEMES)[Scheme], clip: string) => ReactNode
}

const lift = (mood: Mood) => (mood === 'up' || mood === 'nudge' || mood === 'listening' ? -4 : mood === 'down' ? 4 : 0)

const SPECS: Record<CharId, Spec> = {
  coach: {
    face: { cx: 60, cy: 68, gap: 26, ew: 9, eh: 15, my: 89, mw: 22 },
    hands: { l: [11, 88], r: [109, 88], up: 22, board: [60, 104] },
    head: [14, 14, 92],
    body: (mood, c, clip) => (
      <>
        <defs><clipPath id={clip}><circle cx="60" cy="60" r="42" /></clipPath></defs>
        <circle cx="60" cy="60" r="42" fill={c.body} />
        <path clipPath={`url(#${clip})`} d={`M8 ${47 + lift(mood)} Q60 ${28 + lift(mood)} 112 ${47 + lift(mood)}`} stroke={ORANGE} strokeWidth="12" fill="none" />
      </>
    ),
  },
  kettlebell: {
    face: { cx: 60, cy: 75, gap: 24, ew: 8, eh: 14, my: 93, mw: 20 },
    hands: { l: [13, 84], r: [107, 84], up: 30, board: [60, 100] },
    head: [10, 10, 100],
    body: (_mood, c) => (
      <>
        <path d="M40 54 V37 Q40 18 60 18 Q80 18 80 37 V54" stroke={c.body} strokeWidth="10" fill="none" strokeLinecap="round" />
        <ellipse cx="48" cy="112" rx="8" ry="4" fill={c.body} />
        <ellipse cx="72" cy="112" rx="8" ry="4" fill={c.body} />
        <circle cx="60" cy="76" r="35" fill={c.body} />
        <rect x="33" y="46" width="14" height="7" rx="3.5" fill={ORANGE} />
        <rect x="73" y="46" width="14" height="7" rx="3.5" fill={ORANGE} />
      </>
    ),
  },
  kangaroo: {
    face: { cx: 60, cy: 36, gap: 18, ew: 5.5, eh: 9, my: 69, mw: 8, mouthOnPatch: true },
    hands: { l: [36, 82], r: [84, 82], up: 26, board: [60, 86], size: 7.5, fill: ORANGE },
    head: [27, 0, 66],
    body: (_mood, c) => (
      <>
        <path d="M73 102 Q97 105 113 117" stroke={c.body} strokeWidth="9" fill="none" strokeLinecap="round" />
        <ellipse cx="48" cy="113" rx="13" ry="4" fill={c.body} />
        <ellipse cx="72" cy="113" rx="13" ry="4" fill={c.body} />
        <ellipse className="m-body" cx="60" cy="92" rx="18" ry="21" fill={c.body} />
        <ellipse cx="60" cy="99" rx="9.5" ry="10" fill={c.patch} />
        <path d="M47 27 Q28 16 30 1 Q46 8 53 25 Z" fill={c.body} stroke={c.body} strokeWidth="3" strokeLinejoin="round" />
        <path d="M73 27 Q92 16 90 1 Q74 8 67 25 Z" fill={c.body} stroke={c.body} strokeWidth="3" strokeLinejoin="round" />
        <path d="M47 23 Q36 16 35 7 Q45 12 50 22 Z" fill={c.patch} />
        <path d="M73 23 Q84 16 85 7 Q75 12 70 22 Z" fill={c.patch} />
        <path d="M60 22 C76 22 80 34 76 48 C73 60 67 72 60 72 C53 72 47 60 44 48 C40 34 44 22 60 22 Z" fill={c.body} />
        <path d="M60 48 C67 48 70 56 68 63 C66 69 63 72 60 72 C57 72 54 69 52 63 C50 56 53 48 60 48 Z" fill={c.patch} />
        <ellipse cx="60" cy="63" rx="4.2" ry="2.8" fill={NAVY} />
      </>
    ),
  },
  bear: {
    face: { cx: 60, cy: 62, gap: 27, ew: 7, eh: 12, my: 87, mw: 11, mouthOnPatch: true },
    hands: { l: [11, 90], r: [109, 90], up: 28, board: [60, 106] },
    head: [12, 12, 96],
    body: (mood, c, clip) => (
      <>
        <circle cx="31" cy="30" r="12" fill={c.body} />
        <circle cx="89" cy="30" r="12" fill={c.body} />
        <circle cx="31" cy="30" r="6" fill={c.patch} />
        <circle cx="89" cy="30" r="6" fill={c.patch} />
        <defs><clipPath id={clip}><circle cx="60" cy="62" r="38" /></clipPath></defs>
        <circle cx="60" cy="62" r="38" fill={c.body} />
        <path clipPath={`url(#${clip})`} d={`M16 ${50 + lift(mood)} Q60 ${34 + lift(mood)} 104 ${50 + lift(mood)}`} stroke={ORANGE} strokeWidth="10" fill="none" />
        <ellipse cx="60" cy="81" rx="16" ry="12" fill={c.patch} />
        <ellipse cx="60" cy="75" rx="5.5" ry="3.8" fill={NAVY} />
      </>
    ),
  },
  quokka: {
    face: { cx: 60, cy: 42, gap: 22, ew: 6.5, eh: 10.5, my: 63, mw: 11, mouthOnPatch: true },
    hands: { l: [30, 88], r: [90, 88], up: 30, board: [60, 92], size: 7 },
    head: [20, 6, 80],
    body: (_mood, c) => (
      <>
        <ellipse cx="50" cy="112" rx="9" ry="4" fill={c.body} />
        <ellipse cx="70" cy="112" rx="9" ry="4" fill={c.body} />
        <ellipse className="m-body" cx="60" cy="95" rx="22" ry="17" fill={c.body} />
        <ellipse cx="60" cy="99" rx="12" ry="10" fill={c.patch} />
        <ellipse cx="33" cy="25" rx="7" ry="8" fill={c.body} />
        <ellipse cx="87" cy="25" rx="7" ry="8" fill={c.body} />
        <ellipse cx="60" cy="42" rx="27" ry="25" fill={c.body} />
        <circle cx="41" cy="56" r="16" fill={c.body} />
        <circle cx="79" cy="56" r="16" fill={c.body} />
        <ellipse cx="60" cy="61" rx="15" ry="11" fill={c.patch} />
        <ellipse cx="60" cy="55" rx="5" ry="3.4" fill={NAVY} />
        <path d="M51 63 Q60 70 69 63" stroke={NAVY} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9" />
      </>
    ),
  },
  wombat: {
    face: { cx: 60, cy: 56, gap: 30, ew: 6, eh: 9.5, my: 88, mw: 12, mouthOnPatch: true },
    hands: { l: [10, 92], r: [110, 92], up: 30, board: [60, 108] },
    head: [12, 16, 96],
    body: (_mood, c) => (
      <>
        <path d="M26 36 Q26 22 38 30 Z" fill={c.body} stroke={c.body} strokeWidth="6" strokeLinejoin="round" />
        <path d="M94 36 Q94 22 82 30 Z" fill={c.body} stroke={c.body} strokeWidth="6" strokeLinejoin="round" />
        <rect x="16" y="28" width="88" height="76" rx="36" fill={c.body} />
        <ellipse cx="60" cy="83" rx="22" ry="15" fill={c.patch} />
        <rect x="50" y="68" width="20" height="13" rx="6" fill={NAVY} />
      </>
    ),
  },
  shaker: {
    face: { cx: 60, cy: 62, gap: 22, ew: 7, eh: 12, my: 82, mw: 16 },
    hands: { l: [18, 82], r: [102, 82], up: 30, board: [60, 100] },
    head: [12, 6, 96],
    body: (_mood, c) => (
      <>
        <ellipse cx="49" cy="112" rx="8" ry="4" fill={c.body} />
        <ellipse cx="71" cy="112" rx="8" ry="4" fill={c.body} />
        <path d="M33 36 H87 L83 104 Q83 110 77 110 H43 Q37 110 37 104 Z" fill={c.body} />
        <path d="M78 52 H84 M79 64 H84 M80 76 H84 M80 88 H84" stroke={c.patch} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <rect x="30" y="22" width="60" height="17" rx="7" fill={ORANGE} />
        <rect x="52" y="11" width="16" height="13" rx="4" fill={ORANGE} />
      </>
    ),
  },
  stopwatch: {
    face: { cx: 60, cy: 73, gap: 26, ew: 7, eh: 12, my: 89, mw: 14, mouthOnPatch: true, eyesOnPatch: true },
    hands: { l: [11, 84], r: [109, 84], up: 26, board: [60, 104] },
    head: [12, 8, 96],
    body: (mood, c) => {
      const angle = mood === 'up' || mood === 'nudge' ? 0 : mood === 'down' ? 120 : mood === 'offline' ? 180 : mood === 'listening' ? -40 : 40
      return (
        <>
          <rect x="53" y="8" width="14" height="10" rx="3" fill={c.body} />
          <rect x="50" y="15" width="20" height="7" rx="3" fill={ORANGE} />
          <rect x="84" y="22" width="11" height="8" rx="3" fill={c.body} transform="rotate(45 89 26)" />
          <circle cx="60" cy="60" r="41" fill={c.body} />
          <circle cx="60" cy="60" r="33" fill={c.patch} />
          <path d="M60 30 V35 M90 60 H85 M60 90 V85 M30 60 H35" stroke={NAVY} strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
          <g className={mood === 'working' ? 'm-spin' : 'm-hand'} style={{ transform: `rotate(${angle}deg)` }}>
            <path d="M60 60 V33" stroke={ORANGE} strokeWidth="3.6" strokeLinecap="round" />
          </g>
          <circle cx="60" cy="60" r="4" fill={ORANGE} />
        </>
      )
    },
  },
}

export const CHARACTERS: { id: CharId; name: string; kind: string; idea: string }[] = [
  { id: 'kangaroo', name: 'Roo', kind: 'Creature', idea: 'Australian, athletic, boxes in orange gloves; the pouch holds your food log.' },
  { id: 'bear', name: 'Bear', kind: 'Creature', idea: 'Calm strength in a sweatband: the steady coach who never shouts.' },
  { id: 'coach', name: 'Coach', kind: 'Character', idea: 'The September pick, grown up: the sweatband is a brow, the mouth and hands come out to act.' },
  { id: 'kettlebell', name: 'Kettlebell', kind: 'Object', idea: 'The bell is the body, the handle the ring from the FIQR mark. Unmistakably training.' },
  { id: 'quokka', name: 'Quokka', kind: 'Creature', idea: "Australia's happiest animal: the supportive friend who's always glad you showed up." },
  { id: 'wombat', name: 'Wombat', kind: 'Creature', idea: 'Stocky, steady, built like a powerlifter. Slow and sure wins the year.' },
  { id: 'shaker', name: 'Shaker', kind: 'Object', idea: 'A protein shaker: the one thing that lives in both the kitchen and the gym, like Geo.' },
  { id: 'stopwatch', name: 'Stopwatch', kind: 'Object', idea: "The coach's watch. The orange hand is a brow: it spins while Geo works, points up on a good week." },
]

/** Eyes, brows and the mouth, shared by every character. */
function Face({ mood, f, c }: { mood: Mood; f: Spec['face']; c: (typeof SCHEMES)[Scheme] }) {
  const { cx, cy, gap, ew, eh, my, mw } = f
  const color = f.eyesOnPatch ? NAVY : c.feature
  const L = cx - gap / 2
  const R = cx + gap / 2
  const pill = (x: number, y: number, w: number, h: number, key: string) => <rect key={key} className="m-eye" x={x - w / 2} y={y - h / 2} width={w} height={h} rx={Math.min(w, h) / 2} fill={color} />
  const arc = (x: number, key: string, rise = 0) => <path key={key} d={`M${x - ew * 0.85} ${cy + 2 - rise} Q${x} ${cy - Math.max(eh, ew) * 0.55 - rise} ${x + ew * 0.85} ${cy + 2 - rise}`} stroke={color} strokeWidth={Math.min(ew, eh) * 0.6} strokeLinecap="round" fill="none" />
  const shut = (x: number, key: string) => <path key={key} d={`M${x - ew * 0.75} ${cy + 2} H${x + ew * 0.75}`} stroke={color} strokeWidth={Math.min(ew, eh) * 0.5} strokeLinecap="round" />
  const brow = (x1: number, y1: number, x2: number, y2: number, key: string) => <path key={key} d={`M${x1} ${y1} L${x2} ${y2}`} stroke={color} strokeWidth={Math.min(ew, eh) * 0.45} strokeLinecap="round" />
  const big = Math.max(eh, ew)

  let eyes: ReactNode
  switch (mood) {
    case 'speak': eyes = <g>{pill(L + 2, cy, ew, eh * 0.9, 'a')}{pill(R + 2, cy, ew, eh * 0.9, 'b')}</g>; break
    case 'listening': eyes = <g>{pill(L - 2, cy - 2, ew, eh * 1.05, 'a')}{pill(R - 2, cy - 2, ew, eh * 1.05, 'b')}</g>; break
    case 'working': eyes = <g className="m-scan">{pill(L, cy, ew, eh * 0.85, 'a')}{pill(R, cy + eh * 0.12, ew, eh * 0.45, 'b')}{brow(R - ew * 0.8, cy - big * 0.95, R + ew * 0.8, cy - big * 1.15, 'c')}</g>; break
    case 'done': eyes = <g>{arc(L, 'a')}{arc(R, 'b')}</g>; break
    case 'nudge': eyes = <g>{pill(L + 2.5, cy - 1, ew * 1.1, eh * 1.1, 'a')}{pill(R + 2.5, cy - 1, ew * 1.1, eh * 1.1, 'b')}</g>; break
    case 'up': eyes = <g>{arc(L, 'a', 2)}{arc(R, 'b', 2)}</g>; break
    case 'down': eyes = <g>{pill(L, cy + 3, ew, eh * 0.62, 'a')}{pill(R, cy + 3, ew, eh * 0.62, 'b')}{brow(L - ew * 0.8, cy - big * 0.55, L + ew * 0.7, cy - big * 0.85, 'c')}{brow(R + ew * 0.8, cy - big * 0.55, R - ew * 0.7, cy - big * 0.85, 'd')}</g>; break
    case 'offline': eyes = <g>{shut(L, 'a')}{shut(R, 'b')}</g>; break
    default: eyes = <g>{pill(L, cy, ew, eh, 'a')}{pill(R, cy, ew, eh, 'b')}</g>
  }

  const mc = f.mouthOnPatch ? NAVY : color
  const sw = Math.max(1.6, mw * 0.14)
  let mouth: ReactNode = null
  switch (mood) {
    case 'speak': mouth = <ellipse className="m-talk" cx={cx} cy={my} rx={mw * 0.32} ry={mw * 0.26} fill={mc} />; break
    case 'working': mouth = <path d={`M${cx - mw * 0.1} ${my + 1} L${cx + mw * 0.28} ${my - 0.5}`} stroke={mc} strokeWidth={sw} strokeLinecap="round" />; break
    case 'done': mouth = <path d={`M${cx - mw * 0.4} ${my - 1} Q${cx} ${my + mw * 0.35} ${cx + mw * 0.4} ${my - 1}`} stroke={mc} strokeWidth={sw} strokeLinecap="round" fill="none" />; break
    case 'nudge': mouth = <path d={`M${cx - mw * 0.25} ${my - 1} Q${cx} ${my + mw * 0.22} ${cx + mw * 0.25} ${my - 1}`} stroke={mc} strokeWidth={sw} strokeLinecap="round" fill="none" />; break
    case 'up': mouth = <path d={`M${cx - mw * 0.48} ${my - 2} Q${cx} ${my + mw * 0.75} ${cx + mw * 0.48} ${my - 2} Z`} fill={mc} stroke={mc} strokeWidth={sw * 0.6} strokeLinejoin="round" />; break
    case 'down': mouth = <path d={`M${cx - mw * 0.32} ${my + 1.5} Q${cx} ${my - mw * 0.12} ${cx + mw * 0.32} ${my + 1.5}`} stroke={mc} strokeWidth={sw} strokeLinecap="round" fill="none" />; break
  }
  return <g>{eyes}{mouth}</g>
}

/** Floating hands: out only when Geo is doing something. Mittens with a thumb, so they read as hands at any size. */
function Hands({ mood, h, c }: { mood: Mood; h: Spec['hands']; c: (typeof SCHEMES)[Scheme] }) {
  const k = ((h.size ?? 7.5) / 7.5) * 1.55
  const fill = h.fill ?? c.body
  const edge = c.feature
  const line = { fill, stroke: edge, strokeWidth: 1.8, strokeLinejoin: 'round' as const }
  /** An open hand, palm out, fingers up; `side` -1 puts the thumb on the left. */
  const palm = (x: number, y: number, side: 1 | -1, key: string) => (
    <g key={key} transform={`translate(${x} ${y}) scale(${k * side} ${k})`}>
      <ellipse cx="-6.5" cy="2" rx="3" ry="5" transform="rotate(-35 -6.5 2)" {...line} />
      <path d="M-5 9 V-4 Q-5 -10 0 -10 Q5 -10 5 -4 V9 Q0 12 -5 9 Z" {...line} />
    </g>
  )
  const fist = (x: number, y: number, key: string) => (
    <g key={key} transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x="-6.5" y="-6" width="13" height="12" rx="5" {...line} />
      <path d="M-2.5 -6 V-1 M2 -6 V-1" stroke={edge} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  )
  const thumbsUp = (x: number, y: number, key: string) => (
    <g key={key} transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x="-9" y="-16" width="6" height="13" rx="3" transform="rotate(-14 -6 -4)" {...line} />
      <rect x="-8" y="-5" width="15" height="11" rx="4.5" {...line} />
      <path d="M2.5 -1.5 H7 M2.5 2.2 H7" stroke={edge} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  )
  const [lx] = h.l
  const [rx, ry] = h.r
  switch (mood) {
    case 'speak':
      return <g className="m-gesture">{palm(rx - 9, ry - 14, 1, 'a')}</g>
    case 'working': {
      const [bx, by] = h.board
      return (
        <g>
          <rect x={bx - 11} y={by - 15} width="22" height="27" rx="3" fill={CREAM} stroke={NAVY} strokeWidth="1.8" />
          <rect x={bx - 5} y={by - 17.5} width="10" height="5" rx="2" fill={ORANGE} />
          <path d={`M${bx - 6} ${by - 6} H${bx + 6} M${bx - 6} ${by} H${bx + 6} M${bx - 6} ${by + 6} H${bx + 2}`} stroke={NAVY} strokeWidth="1.6" strokeLinecap="round" />
          {fist(bx - 14, by + 5, 'a')}{fist(bx + 14, by + 5, 'b')}
        </g>
      )
    }
    case 'done':
      return <g className="m-pop">{thumbsUp(rx - 9, ry - 2, 'a')}</g>
    case 'nudge':
      return <g className="m-wave">{palm(rx - 9, ry - 30, 1, 'a')}</g>
    case 'up':
      return <g className="m-pump">{fist(lx + 12, h.up + 8, 'a')}{fist(rx - 12, h.up + 8, 'b')}</g>
    default:
      return null
  }
}

const MOTION: Partial<Record<Mood, string>> = { rest: 'm-blink m-breathe', speak: 'm-blink', listening: 'm-tilt m-blink', done: 'm-nod', nudge: 'm-hop', up: 'm-hop', offline: 'm-dim m-breathe' }

/** One character. `framing="head"` crops to the head for small spots; `onNavy` adds a cream edge for navy surfaces. */
export function Mascot({ id, mood, scheme, size, framing = 'full', onNavy = false, className }: { id: CharId; mood: Mood; scheme: Scheme; size: number; framing?: 'full' | 'head'; onNavy?: boolean; className?: string }) {
  const clip = useId().replace(/:/g, '')
  const s = SPECS[id]
  const c = SCHEMES[scheme]
  const [hx, hy, hw] = s.head
  const viewBox = framing === 'head' ? `${hx} ${hy} ${hw} ${hw}` : '0 0 120 120'
  return (
    <svg width={size} height={size} viewBox={viewBox} role="img" aria-label={`Geo, ${mood}`} className={cn('m-root shrink-0', framing === 'full' ? 'overflow-visible' : 'overflow-hidden', MOTION[mood], className)} style={onNavy && scheme === 'navy' ? { filter: `drop-shadow(0 0 0.6px ${CREAM}) drop-shadow(0 0 0.6px ${CREAM})` } : undefined}>
      <g className="m-all">
        <g className="m-head">
          {s.body(mood, c, `m${clip}`)}
          <Face mood={mood} f={s.face} c={c} />
        </g>
        {framing === 'full' ? <Hands mood={mood} h={s.hands} c={c} /> : null}
      </g>
    </svg>
  )
}

export const MASCOT_CSS = `
.m-root .m-all, .m-root .m-head, .m-root .m-body { transform-box: view-box; transform-origin: 50% 92%; }
.m-root .m-eye, .m-root .m-talk { transform-box: fill-box; transform-origin: 50% 50%; }
.m-blink .m-eye { animation: m-blink 4.4s infinite; }
@keyframes m-blink { 0%, 93%, 100% { transform: scaleY(1); } 95.5% { transform: scaleY(.12); } }
.m-breathe .m-head { animation: m-breathe 3.2s cubic-bezier(.45,0,.55,1) infinite alternate; }
@keyframes m-breathe { from { transform: translateY(0); } to { transform: translateY(1.4px); } }
.m-talk { animation: m-talk 260ms cubic-bezier(.45,0,.55,1) infinite alternate; }
@keyframes m-talk { from { transform: scaleY(.25); } to { transform: scaleY(1); } }
.m-gesture { transform-box: fill-box; transform-origin: 50% 100%; animation: m-gesture 900ms cubic-bezier(.45,0,.55,1) infinite alternate; }
@keyframes m-gesture { from { transform: translateY(0) rotate(-6deg); } to { transform: translateY(-3px) rotate(6deg); } }
.m-tilt .m-head { animation: m-tilt 2.4s cubic-bezier(.45,0,.55,1) infinite alternate; }
@keyframes m-tilt { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
.m-scan { animation: m-scan 1.8s cubic-bezier(.45,0,.55,1) infinite; }
@keyframes m-scan { 0%, 100% { transform: translateX(-2.5px); } 50% { transform: translateX(2.5px); } }
.m-nod .m-all { animation: m-nod 700ms cubic-bezier(.25,1,.5,1) 1; }
@keyframes m-nod { 0%, 100% { transform: translateY(0); } 35% { transform: translateY(5px); } }
.m-pop { transform-box: fill-box; transform-origin: 50% 100%; animation: m-pop 520ms cubic-bezier(.25,1,.5,1) 1; }
@keyframes m-pop { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.m-hop .m-all { animation: m-hop 620ms cubic-bezier(.25,1,.5,1) 1; }
@keyframes m-hop { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-9px); } }
.m-wave { transform-box: fill-box; transform-origin: 50% 100%; animation: m-wave 520ms cubic-bezier(.45,0,.55,1) 3 alternate; }
@keyframes m-wave { from { transform: rotate(-22deg); } to { transform: rotate(22deg); } }
.m-pump { animation: m-pump 420ms cubic-bezier(.45,0,.55,1) infinite alternate; }
@keyframes m-pump { from { transform: translateY(0); } to { transform: translateY(-5px); } }
.m-hand { transform-box: view-box; transform-origin: 50% 50%; transition: transform 500ms cubic-bezier(.25,1,.5,1); }
.m-spin { transform-box: view-box; transform-origin: 50% 50%; animation: m-spin 1.2s linear infinite; }
@keyframes m-spin { to { transform: rotate(360deg); } }
.m-pulse { animation: m-pulse 1.4s ease-in-out infinite; }
@keyframes m-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
.m-dim { opacity: .5; }
@media (prefers-reduced-motion: reduce) { .m-root, .m-root * { animation: none !important; } }
`
