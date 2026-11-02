'use client'

/**
 * Mascot round 4 (sketch, /mascot only): Roo, Bear, Coach and Kettlebell redrawn with one face system (navy features
 * on a cream face area, or cream eyes on navy for the bear), arms attached to the body, a pose per expression and
 * sparing orange marks. Each has a full form (160 grid) and a small form (the head alone, its own crop).
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type Mood = 'rest' | 'speak' | 'listening' | 'working' | 'done' | 'nudge' | 'up' | 'down' | 'offline'
export type CharId = 'roo' | 'bear' | 'coach' | 'kettlebell'

const NAVY = '#111C35'
const ORANGE = '#E8622A'
const CREAM = '#FDF6EC'

export const MOODS: { mood: Mood; when: string }[] = [
  { mood: 'rest', when: 'Waiting. Breathes, blinks.' },
  { mood: 'speak', when: "Talking: Geo's line on Home." },
  { mood: 'listening', when: 'You are typing.' },
  { mood: 'working', when: 'Reading a photo, building a plan.' },
  { mood: 'done', when: 'Logged.' },
  { mood: 'nudge', when: 'Check-in ready.' },
  { mood: 'up', when: 'A new best.' },
  { mood: 'down', when: 'A missed week.' },
  { mood: 'offline', when: 'No connection.' },
]

type Pt = [number, number]

// ---------------------------------------------------------------------------------------------------------------
// Face: eyes, brows, mouth. `ink` draws navy features on a cream face; `sclera` draws cream eyes with navy pupils on
// a navy head (the bear), with the mouth on its cream muzzle.
// ---------------------------------------------------------------------------------------------------------------

interface FaceSpec { l: Pt; r: Pt; er: number; mouth: Pt; mw: number; kind?: 'ink' | 'sclera'; far?: number }

function Face({ mood, f }: { mood: Mood; f: FaceSpec }) {
  const { er, mw } = f
  const sclera = f.kind === 'sclera'
  const feature = NAVY
  const brow = sclera ? CREAM : NAVY
  const gaze: Pt = mood === 'listening' ? [-er * 0.35, -er * 0.35] : mood === 'down' ? [0, er * 0.45] : mood === 'speak' || mood === 'nudge' ? [er * 0.25, 0] : [0, 0]
  const open = (p: Pt, scale = 1, key = '') => {
    const [x, y] = p
    if (sclera) {
      return (
        <g key={key} className="m-eye">
          <ellipse cx={x} cy={y} rx={er * 1.05 * scale} ry={er * 1.25 * scale} fill={CREAM} />
          <circle cx={x + gaze[0] * 0.8} cy={y + gaze[1] * 0.8 + er * 0.1} r={er * 0.62 * scale} fill={NAVY} />
          <circle cx={x + gaze[0] * 0.8 + er * 0.22} cy={y + gaze[1] * 0.8 - er * 0.18} r={er * 0.2 * scale} fill={CREAM} />
        </g>
      )
    }
    return (
      <g key={key} className="m-eye">
        <ellipse cx={x + gaze[0]} cy={y + gaze[1]} rx={er * scale} ry={er * 1.35 * scale} fill={feature} />
        <circle cx={x + gaze[0] + er * 0.3} cy={y + gaze[1] - er * 0.45} r={er * 0.32 * scale} fill={CREAM} />
      </g>
    )
  }
  const happy = (p: Pt, key: string) => <path key={key} d={`M${p[0] - er * 1.05} ${p[1] + er * 0.35} Q${p[0]} ${p[1] - er * 1.25} ${p[0] + er * 1.05} ${p[1] + er * 0.35}`} stroke={sclera ? CREAM : feature} strokeWidth={er * 0.62} strokeLinecap="round" fill="none" />
  const sleepy = (p: Pt, key: string) => <path key={key} d={`M${p[0] - er * 1.05} ${p[1]} Q${p[0]} ${p[1] + er * 0.95} ${p[0] + er * 1.05} ${p[1]}`} stroke={sclera ? CREAM : feature} strokeWidth={er * 0.55} strokeLinecap="round" fill="none" />
  const browLine = (p: Pt, side: -1 | 1, tilt: number, lift: number, key: string) => {
    const [x, y] = p
    const yb = y - er * 1.9 - lift
    return <path key={key} d={`M${x - er * 1.1} ${yb + tilt * side * -1} Q${x} ${yb - er * 0.35} ${x + er * 1.1} ${yb + tilt * side}`} stroke={brow} strokeWidth={er * 0.42} strokeLinecap="round" fill="none" />
  }
  const farScale = f.far ?? 1

  let eyes: ReactNode
  let brows: ReactNode = null
  switch (mood) {
    case 'done': case 'up': eyes = <>{happy(f.l, 'a')}{happy(f.r, 'b')}</>; break
    case 'offline': eyes = <>{sleepy(f.l, 'a')}{sleepy(f.r, 'b')}</>; break
    case 'nudge': eyes = <>{open(f.l, farScale, 'a')}{happy(f.r, 'b')}</>; break
    default: eyes = <>{open(f.l, farScale, 'a')}{open(f.r, 1, 'b')}</>
  }
  if (mood === 'working') brows = <>{browLine(f.l, 1, er * 0.55, 0, 'c')}{browLine(f.r, -1, er * 0.55, 0, 'd')}</>
  if (mood === 'down') brows = <>{browLine(f.l, -1, er * 0.6, 0, 'c')}{browLine(f.r, 1, er * 0.6, 0, 'd')}</>
  if (mood === 'listening' || mood === 'up') brows = <>{browLine(f.l, 1, 0, er * 0.5, 'c')}{browLine(f.r, 1, 0, er * 0.5, 'd')}</>

  const [mx, my] = f.mouth
  let mouth: ReactNode = null
  switch (mood) {
    case 'rest': case 'nudge': case 'done':
      mouth = <path d={`M${mx - mw * (mood === 'rest' ? 0.3 : 0.42)} ${my} Q${mx} ${my + mw * (mood === 'rest' ? 0.22 : 0.38)} ${mx + mw * (mood === 'rest' ? 0.3 : 0.42)} ${my}`} stroke={NAVY} strokeWidth={mw * 0.13} strokeLinecap="round" fill="none" />; break
    case 'speak':
      mouth = <g className="m-talk"><path d={`M${mx - mw * 0.32} ${my - mw * 0.05} Q${mx} ${my - mw * 0.12} ${mx + mw * 0.32} ${my - mw * 0.05} Q${mx + mw * 0.24} ${my + mw * 0.42} ${mx} ${my + mw * 0.42} Q${mx - mw * 0.24} ${my + mw * 0.42} ${mx - mw * 0.32} ${my - mw * 0.05} Z`} fill={NAVY} /><ellipse cx={mx} cy={my + mw * 0.3} rx={mw * 0.14} ry={mw * 0.08} fill={ORANGE} /></g>; break
    case 'listening':
      mouth = <ellipse cx={mx} cy={my + mw * 0.06} rx={mw * 0.1} ry={mw * 0.12} fill={NAVY} />; break
    case 'working':
      mouth = <path d={`M${mx - mw * 0.22} ${my + mw * 0.1} L${mx + mw * 0.24} ${my + mw * 0.02}`} stroke={NAVY} strokeWidth={mw * 0.12} strokeLinecap="round" />; break
    case 'up':
      mouth = <g><path d={`M${mx - mw * 0.5} ${my - mw * 0.06} Q${mx} ${my - mw * 0.14} ${mx + mw * 0.5} ${my - mw * 0.06} Q${mx + mw * 0.4} ${my + mw * 0.62} ${mx} ${my + mw * 0.62} Q${mx - mw * 0.4} ${my + mw * 0.62} ${mx - mw * 0.5} ${my - mw * 0.06} Z`} fill={NAVY} /><ellipse cx={mx} cy={my + mw * 0.45} rx={mw * 0.22} ry={mw * 0.12} fill={ORANGE} /></g>; break
    case 'down':
      mouth = <path d={`M${mx - mw * 0.3} ${my + mw * 0.16} Q${mx} ${my - mw * 0.06} ${mx + mw * 0.3} ${my + mw * 0.16}`} stroke={NAVY} strokeWidth={mw * 0.12} strokeLinecap="round" fill="none" />; break
  }
  return <g>{brows}{eyes}{mouth}</g>
}

// ---------------------------------------------------------------------------------------------------------------
// Arms: a rounded limb from the shoulder to the hand with a cream keyline so it reads over the body, and a mitt
// (an orange glove for Roo). Hand shapes: mitt, open palm, fist, thumbs up.
// ---------------------------------------------------------------------------------------------------------------

type Hand = 'mitt' | 'palm' | 'thumb'
interface ArmPose { s: Pt; h: Pt; hand?: Hand; bend?: number; className?: string }

function Arm({ a, w, glove, hand: handR }: { a: ArmPose; w: number; glove?: string; hand?: number }) {
  const [sx, sy] = a.s
  const [hx, hy] = a.h
  const mx = (sx + hx) / 2
  const my = (sy + hy) / 2
  const bend = a.bend ?? 0
  const nx = -(hy - sy)
  const ny = hx - sx
  const len = Math.hypot(nx, ny) || 1
  const cx = mx + (nx / len) * bend
  const cy = my + (ny / len) * bend
  const d = `M${sx} ${sy} Q${cx} ${cy} ${hx} ${hy}`
  const r = handR ?? w * 0.78
  const fill = glove ?? NAVY
  const hand = a.hand ?? 'mitt'
  return (
    <g className={a.className} style={a.className ? { transformOrigin: `${sx}px ${sy}px` } : undefined}>
      <path d={d} stroke={CREAM} strokeWidth={w + 4} strokeLinecap="round" fill="none" />
      <path d={d} stroke={NAVY} strokeWidth={w} strokeLinecap="round" fill="none" />
      {hand === 'thumb' ? <rect x={hx - r * 0.35} y={hy - r * 2} width={r * 0.75} height={r * 1.4} rx={r * 0.37} fill={fill} stroke={CREAM} strokeWidth="2.5" /> : null}
      {hand === 'palm' ? <path d={`M${hx - r * 0.9} ${hy} Q${hx - r * 1.4} ${hy - r * 0.9} ${hx - r * 0.6} ${hy - r * 0.6}`} stroke={fill} strokeWidth={r * 0.6} strokeLinecap="round" fill="none" /> : null}
      <circle cx={hx} cy={hy} r={r} fill={fill} stroke={CREAM} strokeWidth="2.5" />
      {glove ? <path d={`M${hx - r * 0.55} ${hy + r * 0.25} Q${hx} ${hy + r * 0.62} ${hx + r * 0.55} ${hy + r * 0.25}`} stroke={NAVY} strokeOpacity=".35" strokeWidth="1.6" fill="none" strokeLinecap="round" /> : null}
    </g>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Orange marks: speech lines, wave arcs, a burst for a new best, sound arcs for listening, zzz for offline.
// ---------------------------------------------------------------------------------------------------------------

function Marks({ mood, at }: { mood: Mood; at: { mouth: Pt; top: Pt; ear: Pt; hand: Pt; speakSide?: -1 | 1 } }) {
  const line = (x1: number, y1: number, x2: number, y2: number, key: string) => <path key={key} d={`M${x1} ${y1} L${x2} ${y2}`} stroke={ORANGE} strokeWidth="3.2" strokeLinecap="round" />
  switch (mood) {
    case 'speak': {
      // Front-facing characters gesture with the right hand, so their speech marks sit left of the mouth.
      const [x, y] = at.mouth
      const k = at.speakSide ?? 1
      return <g className="m-flicker">{line(x + 6 * k, y - 9, x + 14 * k, y - 15, 'a')}{line(x + 9 * k, y, x + 19 * k, y, 'b')}{line(x + 6 * k, y + 9, x + 14 * k, y + 15, 'c')}</g>
    }
    case 'nudge': {
      const [x, y] = at.hand
      return <g className="m-flicker"><path d={`M${x + 12} ${y - 8} Q${x + 18} ${y} ${x + 12} ${y + 8}`} stroke={ORANGE} strokeWidth="3" fill="none" strokeLinecap="round" /><path d={`M${x + 19} ${y - 13} Q${x + 27} ${y} ${x + 19} ${y + 13}`} stroke={ORANGE} strokeWidth="3" fill="none" strokeLinecap="round" /></g>
    }
    case 'listening': {
      const [x, y] = at.ear
      return <g className="m-flicker"><path d={`M${x} ${y - 7} Q${x + 6} ${y} ${x} ${y + 7}`} stroke={ORANGE} strokeWidth="3" fill="none" strokeLinecap="round" /><path d={`M${x + 7} ${y - 12} Q${x + 15} ${y} ${x + 7} ${y + 12}`} stroke={ORANGE} strokeWidth="3" fill="none" strokeLinecap="round" /></g>
    }
    case 'up': case 'done': {
      const [x, y] = at.top
      const n = mood === 'up' ? [[-22, 6, -30, 0], [-8, -2, -10, -11], [8, -2, 10, -11], [22, 6, 30, 0]] : [[18, 4, 25, -3], [26, 14, 34, 12]]
      return <g className="m-pop-in">{n.map(([a, b, c, e], i) => line(x + a, y + b, x + c, y + e, String(i)))}</g>
    }
    case 'offline': {
      const [x, y] = at.top
      return <g className="m-zzz" fill={ORANGE} fontFamily="var(--font-archivo), Archivo, sans-serif" fontWeight="800"><text x={x + 14} y={y + 6} fontSize="13">z</text><text x={x + 24} y={y - 4} fontSize="17">z</text><text x={x + 36} y={y - 16} fontSize="21">z</text></g>
    }
    default: return null
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Characters. Each: a head (drawn alone for the small form), a body, shoulders, arm width, face, mark anchors and
// pose targets. Poses are absolute points on the 160 grid.
// ---------------------------------------------------------------------------------------------------------------

interface Character {
  head: (mood: Mood) => ReactNode
  /** The small form's square crop around the head: x, y, side. */
  headBox: [number, number, number]
  /** Rotation pivot for the head (the neck). */
  neck: Pt
  body: (mood: Mood) => ReactNode
  face: FaceSpec
  arms: { w: number; glove?: string; hand?: number; l: Pt; r: Pt }
  /** Hand targets per pose. */
  pose: Record<'rest' | 'low' | 'gesture' | 'ear' | 'thumb' | 'wave' | 'upL' | 'upR' | 'boardL' | 'boardR' | 'restL' | 'lowL', Pt>
  board: Pt
  marks: { mouth: Pt; top: Pt; ear: Pt; speakSide?: -1 | 1 }
}

const shadow = (cx: number, w: number) => <ellipse cx={cx} cy="152" rx={w} ry="4.5" fill={NAVY} fillOpacity=".09" />

const CHARS: Record<CharId, Character> = {
  coach: {
    headBox: [10, 2, 124],
    neck: [80, 94],
    face: { l: [69, 61], r: [91, 61], er: 4.6, mouth: [80, 73], mw: 16 },
    head: () => (
      <>
        <path d="M40 46 Q26 34 14 40 Q24 44 34 52 Z" fill={ORANGE} />
        <path d="M40 50 Q26 58 20 70 Q32 64 42 56 Z" fill={ORANGE} />
        <circle cx="80" cy="56" r="40" fill={NAVY} />
        <ellipse cx="80" cy="64" rx="28" ry="21" fill={CREAM} />
        <defs><clipPath id="geo-coach-head"><circle cx="80" cy="56" r="40" /></clipPath></defs>
        <path clipPath="url(#geo-coach-head)" d="M36 42 Q80 18 124 42 L124 52 Q80 30 36 52 Z" fill={ORANGE} />
        <circle cx="41" cy="49" r="6" fill={ORANGE} />
      </>
    ),
    body: () => (
      <>
        {shadow(80, 30)}
        <rect x="63" y="122" width="13" height="22" rx="6.5" fill={NAVY} />
        <rect x="84" y="122" width="13" height="22" rx="6.5" fill={NAVY} />
        <ellipse cx="69" cy="146" rx="10" ry="5.5" fill={NAVY} />
        <ellipse cx="91" cy="146" rx="10" ry="5.5" fill={NAVY} />
        <path d="M56 126 Q54 96 80 92 Q106 96 104 126 Q104 134 96 134 H64 Q56 134 56 126 Z" fill={NAVY} />
        <circle cx="80" cy="113" r="7" stroke={CREAM} strokeWidth="2.6" fill="none" />
        <path d="M84.6 117.6 L89.6 122.6" stroke={ORANGE} strokeWidth="2.8" strokeLinecap="round" />
      </>
    ),
    arms: { w: 10, l: [62, 102], r: [98, 102] },
    pose: { rest: [106, 126], restL: [54, 126], low: [101, 131], lowL: [59, 131], gesture: [122, 92], ear: [116, 62], thumb: [122, 96], wave: [124, 64], upL: [42, 64], upR: [118, 64], boardL: [66, 112], boardR: [94, 112] },
    board: [80, 106],
    marks: { mouth: [62, 72], top: [80, 16], ear: [124, 50], speakSide: -1 },
  },
  bear: {
    headBox: [22, 0, 124],
    neck: [80, 92],
    face: { l: [66, 54], r: [94, 54], er: 5, mouth: [80, 77], mw: 15, kind: 'sclera' },
    head: () => (
      <>
        <circle cx="50" cy="26" r="13" fill={NAVY} />
        <circle cx="110" cy="26" r="13" fill={NAVY} />
        <circle cx="50" cy="26" r="6.5" fill={CREAM} />
        <circle cx="110" cy="26" r="6.5" fill={CREAM} />
        <path d="M118 40 Q132 30 142 36 Q132 40 122 48 Z" fill={ORANGE} />
        <path d="M118 44 Q132 52 136 64 Q126 58 118 50 Z" fill={ORANGE} />
        <circle cx="80" cy="56" r="39" fill={NAVY} />
        <defs><clipPath id="geo-bear-head"><circle cx="80" cy="56" r="39" /></clipPath></defs>
        <path clipPath="url(#geo-bear-head)" d="M38 38 Q80 16 122 38 L122 47 Q80 26 38 47 Z" fill={ORANGE} />
        <circle cx="119" cy="44" r="5.5" fill={ORANGE} />
        <ellipse cx="80" cy="73" rx="21" ry="15" fill={CREAM} />
        <path d="M72.5 65 Q80 61 87.5 65 Q86.5 71 80 73 Q73.5 71 72.5 65 Z" fill={NAVY} />
      </>
    ),
    body: () => (
      <>
        {shadow(80, 34)}
        <rect x="60" y="124" width="16" height="20" rx="8" fill={NAVY} />
        <rect x="84" y="124" width="16" height="20" rx="8" fill={NAVY} />
        <ellipse cx="68" cy="146" rx="11" ry="5.5" fill={NAVY} />
        <ellipse cx="92" cy="146" rx="11" ry="5.5" fill={NAVY} />
        <path d="M50 128 Q46 96 80 90 Q114 96 110 128 Q110 138 98 138 H62 Q50 138 50 128 Z" fill={NAVY} />
        <ellipse cx="80" cy="118" rx="18" ry="15" fill={CREAM} />
      </>
    ),
    arms: { w: 13, l: [58, 104], r: [102, 104] },
    pose: { rest: [108, 128], restL: [52, 128], low: [104, 133], lowL: [56, 133], gesture: [126, 92], ear: [118, 62], thumb: [126, 96], wave: [128, 64], upL: [38, 62], upR: [122, 62], boardL: [64, 114], boardR: [96, 114] },
    board: [80, 108],
    marks: { mouth: [60, 77], top: [80, 12], ear: [126, 46], speakSide: -1 },
  },
  kettlebell: {
    headBox: [22, 8, 116],
    neck: [80, 130],
    face: { l: [68, 92], r: [92, 92], er: 4.6, mouth: [80, 104], mw: 16 },
    head: () => (
      <>
        <path d="M50 70 V52 Q50 18 80 18 Q110 18 110 52 V70" stroke={NAVY} strokeWidth="15" fill="none" strokeLinecap="round" />
        <circle cx="80" cy="96" r="46" fill={NAVY} />
        <rect x="40" y="60" width="20" height="11" rx="5.5" transform="rotate(-24 50 65)" fill={ORANGE} />
        <rect x="100" y="60" width="20" height="11" rx="5.5" transform="rotate(24 110 65)" fill={ORANGE} />
        <rect x="52" y="76" width="56" height="40" rx="18" fill={CREAM} />
      </>
    ),
    body: () => (
      <>
        {shadow(80, 34)}
        <ellipse cx="64" cy="145" rx="12" ry="6.5" fill={NAVY} />
        <ellipse cx="96" cy="145" rx="12" ry="6.5" fill={NAVY} />
      </>
    ),
    arms: { w: 10, l: [40, 104], r: [120, 104] },
    pose: { rest: [128, 124], restL: [32, 124], low: [112, 130], lowL: [48, 130], gesture: [140, 90], ear: [132, 64], thumb: [140, 92], wave: [142, 62], upL: [24, 60], upR: [136, 60], boardL: [64, 132], boardR: [96, 132] },
    board: [80, 126],
    marks: { mouth: [54, 86], top: [80, 12], ear: [136, 52], speakSide: -1 },
  },
  roo: {
    headBox: [52, -6, 86],
    neck: [92, 68],
    face: { l: [91, 43], r: [104, 44], er: 4.4, mouth: [113, 57], mw: 14, far: 0.85 },
    head: () => (
      <>
        <path d="M74 28 Q57 14 56 -3 Q73 1 84 21 Z" fill={NAVY} />
        <path d="M73 21 Q63 12 62 3 Q72 6 79 18 Z" fill={CREAM} />
        <path d="M89 19 Q91 1 104 -5 Q110 10 99 27 Z" fill={NAVY} />
        <path d="M93 15 Q96 4 103 0 Q105 9 98 20 Z" fill={CREAM} />
        <circle cx="85" cy="43" r="25" fill={NAVY} />
        <ellipse cx="108" cy="52" rx="19" ry="13" transform="rotate(10 108 52)" fill={NAVY} />
        <path d="M80 45 Q83 33 96 35 Q108 37 115 43 Q126 47 126 54.5 Q124 61.5 113 63 Q99 65 89 61 Q78 57 80 45 Z" fill={CREAM} />
        <ellipse cx="125" cy="51.5" rx="4.8" ry="3.8" fill={NAVY} />
      </>
    ),
    body: () => (
      <>
        {shadow(76, 46)}
        <path d="M66 126 Q24 130 15 95 Q14 85 21 81 Q25 104 47 110 Q60 112 70 106 Z" fill={NAVY} />
        <ellipse cx="70" cy="122" rx="22" ry="20" fill={NAVY} />
        <path d="M62 141 Q64 134 77 134 H119 Q127 136 125 142 Q123 147 115 147 H68 Q62 147 62 141 Z" fill={NAVY} />
        <path d="M60 124 Q54 86 76 70 Q92 60 106 72 Q118 90 110 122 Q104 140 84 141 Q64 140 60 124 Z" fill={NAVY} />
        <path d="M82 80 Q100 78 104 100 Q106 124 90 134 Q75 134 73 114 Q71 92 82 80 Z" fill={CREAM} />
      </>
    ),
    arms: { w: 9, glove: ORANGE, hand: 10.5, l: [82, 86], r: [100, 84] },
    pose: { rest: [112, 104], restL: [95, 110], low: [108, 122], lowL: [92, 124], gesture: [128, 74], ear: [120, 36], thumb: [128, 78], wave: [130, 46], upL: [76, 46], upR: [124, 44], boardL: [96, 104], boardR: [116, 100] },
    board: [106, 98],
    marks: { mouth: [122, 58], top: [92, 0], ear: [126, 26] },
  },
}

function Clipboard({ at }: { at: Pt }) {
  const [x, y] = at
  return (
    <g>
      <rect x={x - 14} y={y - 16} width="28" height="32" rx="4" fill={CREAM} stroke={NAVY} strokeWidth="2.6" />
      <rect x={x - 6} y={y - 19} width="12" height="6" rx="2.5" fill={ORANGE} />
      <path d={`M${x - 8} ${y - 6} H${x + 8} M${x - 8} ${y + 1} H${x + 8} M${x - 8} ${y + 8} H${x + 3}`} stroke={NAVY} strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

function poseFor(mood: Mood, c: Character): { l: ArmPose; r: ArmPose } {
  const { l, r } = c.arms
  const P = c.pose
  switch (mood) {
    case 'speak': return { l: { s: l, h: P.restL, bend: 4 }, r: { s: r, h: P.gesture, hand: 'palm', bend: -6, className: 'm-gesture' } }
    case 'listening': return { l: { s: l, h: P.restL, bend: 4 }, r: { s: r, h: P.ear, bend: -10 } }
    case 'working': return { l: { s: l, h: P.boardL, bend: 6 }, r: { s: r, h: P.boardR, bend: -6 } }
    case 'done': return { l: { s: l, h: P.restL, bend: 4 }, r: { s: r, h: P.thumb, hand: 'thumb', bend: -6 } }
    case 'nudge': return { l: { s: l, h: P.restL, bend: 4 }, r: { s: r, h: P.wave, hand: 'palm', bend: -8, className: 'm-wave' } }
    case 'up': return { l: { s: l, h: P.upL, bend: 6, className: 'm-pump' }, r: { s: r, h: P.upR, bend: -6, className: 'm-pump' } }
    case 'down': case 'offline': return { l: { s: l, h: P.lowL, bend: -4 }, r: { s: r, h: P.low, bend: 4 } }
    default: return { l: { s: l, h: P.restL, bend: 4 }, r: { s: r, h: P.rest, bend: -4 } }
  }
}

const HEAD_TILT: Partial<Record<Mood, number>> = { listening: -7, down: 6, offline: 9 }
const MOTION: Partial<Record<Mood, string>> = { rest: 'm-blink m-breathe', speak: 'm-blink', listening: 'm-blink', working: 'm-blink', done: 'm-nod', nudge: 'm-hop', up: 'm-hop', down: 'm-blink', offline: 'm-breathe' }

/** Geo. `form="full"` is the whole character; `form="small"` is the head alone for small spots. */
export function GeoV2({ id, mood, size, form = 'full', onNavy = false, className }: { id: CharId; mood: Mood; size: number; form?: 'full' | 'small'; onNavy?: boolean; className?: string }) {
  const c = CHARS[id]
  const tilt = HEAD_TILT[mood] ?? 0
  const [hx, hy, hs] = c.headBox
  const arms = poseFor(mood, c)
  const backFirst = id === 'roo'
  const headGroup = (
    <g transform={tilt ? `rotate(${tilt} ${c.neck[0]} ${c.neck[1]})` : undefined}>
      <g className="m-head">
        {c.head(mood)}
        <Face mood={mood} f={c.face} />
      </g>
    </g>
  )
  if (form === 'small') {
    return (
      <svg width={size} height={size} viewBox={`${hx} ${hy} ${hs} ${hs}`} role="img" aria-label={`Geo, ${mood}`} className={cn('m-root shrink-0 overflow-hidden', MOTION[mood], mood === 'offline' && 'm-dim', className)} style={onNavy ? { filter: `drop-shadow(0 0 0.8px ${CREAM}) drop-shadow(0 0 0.8px ${CREAM})` } : undefined}>
        {headGroup}
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" role="img" aria-label={`Geo, ${mood}`} className={cn('m-root shrink-0 overflow-visible', MOTION[mood], className)}>
      <g className="m-all">
        {backFirst ? <Arm a={arms.l} w={c.arms.w} glove={c.arms.glove} hand={c.arms.hand} /> : null}
        <g className="m-body">{c.body(mood)}</g>
        {headGroup}
        {!backFirst ? <Arm a={arms.l} w={c.arms.w} glove={c.arms.glove} hand={c.arms.hand} /> : null}
        {mood === 'working' ? <Clipboard at={c.board} /> : null}
        <Arm a={arms.r} w={c.arms.w} glove={c.arms.glove} hand={c.arms.hand} />
        <Marks mood={mood} at={{ ...c.marks, hand: c.pose.wave }} />
      </g>
    </svg>
  )
}

export const GEO_V2_CSS = `
.m-root .m-all, .m-root .m-head, .m-root .m-body { transform-box: view-box; transform-origin: 50% 92%; }
.m-root .m-eye, .m-root .m-talk { transform-box: fill-box; transform-origin: 50% 50%; }
.m-blink .m-eye { animation: m-blink 4.4s infinite; }
@keyframes m-blink { 0%, 93%, 100% { transform: scaleY(1); } 95.5% { transform: scaleY(.1); } }
.m-breathe .m-body { animation: m-breathe 3.2s cubic-bezier(.45,0,.55,1) infinite alternate; }
@keyframes m-breathe { from { transform: scale(1); } to { transform: scale(1.015, .99); } }
.m-talk { animation: m-talk 240ms cubic-bezier(.45,0,.55,1) infinite alternate; }
@keyframes m-talk { from { transform: scaleY(.45); } to { transform: scaleY(1); } }
.m-gesture { transform-box: view-box; animation: m-gesture 900ms cubic-bezier(.45,0,.55,1) infinite alternate; }
@keyframes m-gesture { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
.m-wave { transform-box: view-box; animation: m-wave 480ms cubic-bezier(.45,0,.55,1) 4 alternate; }
@keyframes m-wave { from { transform: rotate(-12deg); } to { transform: rotate(12deg); } }
.m-pump { transform-box: view-box; animation: m-pump 420ms cubic-bezier(.45,0,.55,1) infinite alternate; }
@keyframes m-pump { from { transform: translateY(0); } to { transform: translateY(-4px); } }
.m-nod .m-all { animation: m-nod 700ms cubic-bezier(.25,1,.5,1) 1; }
@keyframes m-nod { 0%, 100% { transform: translateY(0); } 35% { transform: translateY(4px); } }
.m-hop .m-all { animation: m-hop 620ms cubic-bezier(.25,1,.5,1) 1; }
@keyframes m-hop { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-8px); } }
.m-flicker { animation: m-flicker 900ms ease-in-out infinite; }
@keyframes m-flicker { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
.m-pop-in { animation: m-pop-in 500ms cubic-bezier(.25,1,.5,1) 1; }
@keyframes m-pop-in { from { opacity: 0; } to { opacity: 1; } }
.m-zzz { animation: m-zzz 2.4s ease-in-out infinite; }
@keyframes m-zzz { 0%, 100% { opacity: .5; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }
.m-dim { opacity: .55; }
@media (prefers-reduced-motion: reduce) { .m-root, .m-root * { animation: none !important; } }
`
