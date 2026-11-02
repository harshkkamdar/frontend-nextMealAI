'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Chapter, LabShell, StateLabel } from '../_parts'

const INK = '#111C35'
const ORANGE = '#E8622A'
const CREAM = '#FDF6EC'

type Mood = 'rest' | 'speak' | 'listening' | 'working' | 'done' | 'nudge' | 'up' | 'down' | 'offline'
type Kind = 'coach' | 'visor' | 'pebble' | 'brow'

const MOODS: { mood: Mood; when: string }[] = [
  { mood: 'rest', when: 'Waiting. Blinks now and then.' },
  { mood: 'speak', when: "Geo's line: looks at what it's saying." },
  { mood: 'listening', when: 'You are typing to Geo.' },
  { mood: 'working', when: 'Reading a photo, writing a reply.' },
  { mood: 'done', when: 'Logged, saved, sent.' },
  { mood: 'nudge', when: 'A suggestion, a check-in ready.' },
  { mood: 'up', when: 'A week to plan, a new best.' },
  { mood: 'down', when: 'A missed week, something failed.' },
  { mood: 'offline', when: 'No connection.' },
]

const OPTIONS: { kind: Kind; name: string; idea: string }[] = [
  { kind: 'coach', name: 'Coach', idea: 'Your September pick, grown up: the orange sweatband, no mouth, no confetti. The band moves like a brow.' },
  { kind: 'visor', name: 'Visor', idea: 'A training helmet with a lit visor. The eyes are light inside the glass; the orange light is Geo being on.' },
  { kind: 'pebble', name: 'Pebble', idea: 'One smooth shape and two big eyes, nothing else. All the feeling is in the eyes; orange only marks a moment.' },
  { kind: 'brow', name: 'Brow', idea: 'A navy disc, one brow line and two eyes. The calmest of the four; the brow does the talking.' },
]

/** Eye pairs for the eye-led characters, centred on (cx, cy) with width w and height h. */
function Eyes({ mood, cx, cy, w, h, color = CREAM }: { mood: Mood; cx: [number, number]; cy: number; w: number; h: number; color?: string }) {
  const pill = (x: number, y: number, ww: number, hh: number, key: string) => <rect key={key} className="m-eye" x={x - ww / 2} y={y - hh / 2} width={ww} height={hh} rx={Math.min(ww, hh) / 2} fill={color} />
  const arc = (x: number, key: string, lift = 0) => <path key={key} d={`M${x - w * 0.8} ${cy + 2 - lift} Q${x} ${cy - h * 0.5 - lift} ${x + w * 0.8} ${cy + 2 - lift}`} stroke={color} strokeWidth={w * 0.62} strokeLinecap="round" fill="none" />
  const shut = (x: number, key: string) => <path key={key} d={`M${x - w * 0.75} ${cy + 3} H${x + w * 0.75}`} stroke={color} strokeWidth={w * 0.5} strokeLinecap="round" />
  const [a, b] = cx
  switch (mood) {
    case 'speak': return <g>{pill(a + 3, cy, w, h * 0.9, 'a')}{pill(b + 3, cy, w, h * 0.9, 'b')}</g>
    case 'listening': return <g>{pill(a - 2, cy - 3, w, h * 1.05, 'a')}{pill(b - 2, cy - 3, w, h * 1.05, 'b')}</g>
    case 'working': return <g className="m-scan">{pill(a, cy - 2, w, h * 0.8, 'a')}{pill(b, cy - 1, w * 0.9, h * 0.55, 'b')}</g>
    case 'done': return <g>{arc(a, 'a')}{arc(b, 'b')}</g>
    case 'nudge': return <g>{pill(a + 3, cy - 2, w * 1.08, h * 1.1, 'a')}{pill(b + 3, cy - 2, w * 1.08, h * 1.1, 'b')}</g>
    case 'up': return <g>{arc(a, 'a', 3)}{arc(b, 'b', 3)}</g>
    case 'down': return <g>{pill(a, cy + 4, w, h * 0.62, 'a')}{pill(b, cy + 4, w, h * 0.62, 'b')}</g>
    case 'offline': return <g>{shut(a, 'a')}{shut(b, 'b')}</g>
    default: return <g>{pill(a, cy, w, h, 'a')}{pill(b, cy, w, h, 'b')}</g>
  }
}

function Coach({ mood }: { mood: Mood }) {
  const lift = mood === 'up' || mood === 'nudge' || mood === 'listening' ? -4 : mood === 'down' ? 4 : mood === 'offline' ? 3 : 0
  return (
    <>
      <defs><clipPath id="m-coach-head"><circle cx="50" cy="50" r="44" /></clipPath></defs>
      <circle cx="50" cy="50" r="44" fill={INK} />
      <path clipPath="url(#m-coach-head)" d={`M4 ${40 + lift} Q50 ${25 + lift} 96 ${40 + lift}`} stroke={mood === 'offline' ? CREAM : ORANGE} strokeOpacity={mood === 'offline' ? 0.3 : 1} strokeWidth="11" fill="none" />
      <Eyes mood={mood} cx={[37, 63]} cy={62} w={9} h={15} />
    </>
  )
}

function Visor({ mood }: { mood: Mood }) {
  const glow = mood === 'offline' ? 0.05 : 0.12
  const cy = 52
  const capsule = (x: number, key: string, w = 15, dy = 0, rot = 0) => <rect key={key} className="m-eye" x={x - w / 2} y={cy - 3 + dy} width={w} height={6} rx={3} fill={CREAM} transform={rot ? `rotate(${rot} ${x} ${cy})` : undefined} />
  const arc = (x: number, key: string) => <path key={key} d={`M${x - 7} ${cy + 2} Q${x} ${cy - 6} ${x + 7} ${cy + 2}`} stroke={CREAM} strokeWidth="4.5" strokeLinecap="round" fill="none" />
  let eyes: ReactNode
  switch (mood) {
    case 'speak': eyes = <g transform="translate(3 0)">{capsule(36, 'a')}{capsule(64, 'b')}</g>; break
    case 'listening': eyes = <g>{capsule(35, 'a', 12, -2)}{capsule(63, 'b', 12, -2)}</g>; break
    case 'working': eyes = <rect className="m-kitt" x="44" y={cy - 3} width="12" height="6" rx="3" fill={CREAM} />; break
    case 'done': case 'up': eyes = <g>{arc(36, 'a')}{arc(64, 'b')}</g>; break
    case 'nudge': eyes = <g transform="translate(3 0)">{capsule(36, 'a', 17)}{capsule(64, 'b', 17)}</g>; break
    case 'down': eyes = <g>{capsule(36, 'a', 12, 3, -7)}{capsule(64, 'b', 12, 3, 7)}</g>; break
    case 'offline': eyes = null; break
    default: eyes = <g>{capsule(36, 'a')}{capsule(64, 'b')}</g>
  }
  return (
    <>
      <rect x="8" y="9" width="84" height="84" rx="26" fill={INK} />
      <rect x="15" y="39" width="70" height="26" rx="13" fill={CREAM} fillOpacity={glow} />
      {eyes}
      <circle className={mood === 'nudge' || mood === 'working' ? 'm-pulse' : undefined} cx="76" cy="24" r="4.5" fill={mood === 'offline' ? CREAM : ORANGE} fillOpacity={mood === 'offline' ? 0.3 : 1} />
    </>
  )
}

const SQUIRCLE = 'M50 8 C82 8 92 18 92 50 C92 82 82 92 50 92 C18 92 8 82 8 50 C8 18 18 8 50 8 Z'

function Pebble({ mood }: { mood: Mood }) {
  return (
    <>
      <path d={SQUIRCLE} fill={INK} />
      <Eyes mood={mood} cx={[36, 64]} cy={52} w={13} h={23} />
      {mood === 'nudge' ? <circle className="m-pulse" cx="80" cy="20" r="5" fill={ORANGE} /> : null}
    </>
  )
}

const BROW: Record<Mood, string> = {
  rest: 'M24 42 Q50 35 76 42',
  speak: 'M27 41 Q53 34 79 41',
  listening: 'M24 35 Q50 28 76 35',
  working: 'M24 44 Q50 33 76 37',
  done: 'M26 45 Q50 41 74 45',
  nudge: 'M27 35 Q53 28 79 35',
  up: 'M24 34 Q50 26 76 34',
  down: 'M25 41 Q50 47 75 41',
  offline: 'M26 47 Q50 45 74 47',
}

function Brow({ mood }: { mood: Mood }) {
  const accent = mood === 'up' || mood === 'nudge'
  const dot = (x: number, key: string) => <circle key={key} className="m-eye" cx={x} cy={58} r={4.6} fill={CREAM} />
  let eyes: ReactNode
  if (mood === 'done' || mood === 'up') eyes = <g>{[37, 63].map((x) => <path key={x} d={`M${x - 5} 60 Q${x} 54 ${x + 5} 60`} stroke={CREAM} strokeWidth="3.6" strokeLinecap="round" fill="none" />)}</g>
  else if (mood === 'offline') eyes = <g>{[37, 63].map((x) => <path key={x} d={`M${x - 5} 60 H${x + 5}`} stroke={CREAM} strokeWidth="3.4" strokeLinecap="round" />)}</g>
  else {
    const dx = mood === 'speak' || mood === 'nudge' ? 3 : mood === 'listening' ? -2 : 0
    const dy = mood === 'down' ? 3 : mood === 'listening' ? -2 : 0
    eyes = <g className={mood === 'working' ? 'm-scan' : undefined} transform={`translate(${dx} ${dy})`}>{dot(37, 'a')}{dot(63, 'b')}</g>
  }
  return (
    <>
      <circle cx="50" cy="50" r="44" fill={INK} />
      <path d={BROW[mood]} stroke={accent ? ORANGE : CREAM} strokeOpacity={mood === 'offline' ? 0.4 : 1} strokeWidth="6" strokeLinecap="round" fill="none" />
      {eyes}
    </>
  )
}

const MOTION: Partial<Record<Mood, string>> = { rest: 'm-blink', speak: 'm-blink', listening: 'm-tilt', done: 'm-nod', nudge: 'm-hop', up: 'm-rise', offline: 'm-dim' }

/** One mascot. `onNavy` adds a cream edge so the navy head reads on navy surfaces (the nav button, Check-in's read). */
function Mascot({ kind, mood, size, onNavy = false }: { kind: Kind; mood: Mood; size: number; onNavy?: boolean }) {
  const Body = { coach: Coach, visor: Visor, pebble: Pebble, brow: Brow }[kind]
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Geo, ${mood}`} className={cn('m-root shrink-0 overflow-visible', MOTION[mood])}>
      <g className="m-head">
        <Body mood={mood} />
        {onNavy ? (kind === 'visor'
          ? <rect x="8" y="9" width="84" height="84" rx="26" fill="none" stroke={CREAM} strokeOpacity=".9" strokeWidth="3" />
          : kind === 'pebble' ? <path d={SQUIRCLE} fill="none" stroke={CREAM} strokeOpacity=".9" strokeWidth="3" />
          : <circle cx="50" cy="50" r="44" fill="none" stroke={CREAM} strokeOpacity=".9" strokeWidth="3" />) : null}
      </g>
    </svg>
  )
}

const CSS = `
.m-root .m-head { transform-box: view-box; transform-origin: 50% 96%; }
.m-root .m-eye { transform-box: fill-box; transform-origin: 50% 50%; }
.m-blink .m-eye { animation: m-blink 4.6s infinite; }
@keyframes m-blink { 0%, 93%, 100% { transform: scaleY(1); } 95.5% { transform: scaleY(.12); } }
.m-tilt .m-head { animation: m-tilt 2.4s cubic-bezier(.45,0,.55,1) infinite alternate; }
@keyframes m-tilt { from { transform: rotate(-4deg); } to { transform: rotate(4deg); } }
.m-scan { animation: m-scan 1.8s cubic-bezier(.45,0,.55,1) infinite; }
@keyframes m-scan { 0%, 100% { transform: translateX(-4px); } 50% { transform: translateX(4px); } }
.m-kitt { animation: m-kitt 1.3s cubic-bezier(.45,0,.55,1) infinite alternate; }
@keyframes m-kitt { from { transform: translateX(-22px); } to { transform: translateX(22px); } }
.m-nod .m-head { animation: m-nod 700ms cubic-bezier(.25,1,.5,1) 1; }
@keyframes m-nod { 0%, 100% { transform: translateY(0); } 35% { transform: translateY(5px); } }
.m-hop .m-head { animation: m-hop 620ms cubic-bezier(.25,1,.5,1) 1; }
@keyframes m-hop { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-8px); } }
.m-rise .m-head { animation: m-rise 900ms cubic-bezier(.25,1,.5,1) 1 forwards; }
@keyframes m-rise { from { transform: translateY(4px); } to { transform: translateY(-2px); } }
.m-dim { opacity: .5; }
.m-pulse { animation: m-pulse 1.4s ease-in-out infinite; }
@keyframes m-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
@media (prefers-reduced-motion: reduce) { .m-root *, .m-root { animation: none !important; } }
`

/** Cycles through the moods so every option is seen moving, unless a mood is picked. */
function useCycle(picked: Mood | null) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (picked) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % MOODS.length), 1800)
    return () => window.clearInterval(id)
  }, [picked])
  return picked ?? MOODS[index].mood
}

function InContext({ kind }: { kind: Kind }) {
  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
      <div className="rounded-[20px] border border-ink-12 bg-cream p-4">
        <StateLabel>Geo&apos;s line on Home</StateLabel>
        <div className="mt-2 flex items-center gap-3">
          <Mascot kind={kind} mood="speak" size={36} />
          <p className="text-[17px] font-medium leading-[1.42] tracking-[-0.2px]">Pull today, then <b className="font-semibold text-accent-ink">180 g</b> protein to hit.</p>
        </div>
      </div>
      <div className="rounded-[20px] border border-ink-12 bg-cream p-4">
        <StateLabel>Chat</StateLabel>
        <div className="mt-2 flex items-center gap-2"><Mascot kind={kind} mood="working" size={24} /><span className="text-[13px] font-semibold">Geo</span><span className="text-[13px] text-ink-62">reading your photo</span></div>
        <div className="mt-3 flex items-start gap-2"><Mascot kind={kind} mood="done" size={24} /><p className="text-[15px] leading-[1.45]">Logged 2 slices of Bega to lunch: 92 kcal, 12 g protein.</p></div>
      </div>
      <div className="rounded-[20px] border border-ink-12 bg-cream p-4">
        <StateLabel>Nav button</StateLabel>
        <div className="mt-2 flex items-end justify-around border-t border-ink-10 pt-3">
          {['Home', 'Food'].map((t) => <span key={t} className="text-[11px] font-medium text-ink-62">{t}</span>)}
          <span className="-mt-7 flex flex-col items-center gap-1">
            <span className="grid size-14 place-items-center rounded-full bg-ink shadow-[0_6px_16px_rgba(17,28,53,.28)]"><Mascot kind={kind} mood="rest" size={40} onNavy /></span>
            <span className="text-[11px] font-medium text-ink-62">Geo</span>
          </span>
          {['Train', 'Check-in'].map((t) => <span key={t} className="text-[11px] font-medium text-ink-62">{t}</span>)}
        </div>
      </div>
      <div className="rounded-[20px] bg-ink p-4 text-cream">
        <StateLabel onNavy>Check-in</StateLabel>
        <div className="mt-2 flex items-start gap-3">
          <Mascot kind={kind} mood="up" size={30} onNavy />
          <p className="text-[17px] font-semibold leading-[1.35]">Down 0.6 kg and four sessions. Raising calories to 2,380.</p>
        </div>
      </div>
    </div>
  )
}

export default function MascotPage() {
  const [picked, setPicked] = useState<Mood | null>(null)
  const mood = useCycle(picked)
  return (
    <LabShell
      eyebrow="Geo"
      title="Four ways to draw Geo."
      lede="The Q is the FIQR logo. Geo is the coach inside the app, so Geo gets its own character. Each option uses only navy, orange and cream, has the same nine expressions, and is shown where Geo lives in the app. Pick one and it replaces the Q everywhere Geo appears."
    >
      <style>{CSS}</style>
      <Chapter n="00" id="compare" title="Side by side" intro={picked ? <>Showing <b>{picked}</b>. Tap it again to play all nine.</> : <>Playing all nine expressions. Tap one to hold it.</>}>
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,150px),1fr))]">
          {OPTIONS.map((o) => (
            <div key={o.kind} className="flex flex-col items-center gap-3 rounded-[20px] border border-ink-12 bg-card px-3 py-6">
              <Mascot key={`${o.kind}-${mood}`} kind={o.kind} mood={mood} size={112} />
              <span className="text-[15px] font-semibold">{o.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button key={m.mood} type="button" onClick={() => setPicked((p) => (p === m.mood ? null : m.mood))} className={cn('h-10 rounded-full border px-4 text-[14px] font-semibold capitalize', mood === m.mood ? 'border-ink bg-ink text-cream' : 'border-ink-16 text-ink')}>
              {m.mood}
            </button>
          ))}
        </div>
      </Chapter>

      {OPTIONS.map((o, i) => (
        <Chapter key={o.kind} n={String(i + 1).padStart(2, '0')} id={o.kind} title={o.name} intro={o.idea}>
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,150px),1fr))]">
            {MOODS.map((m) => (
              <button key={m.mood} type="button" aria-label={`Replay ${m.mood}`} onClick={(e) => { const svg = e.currentTarget.querySelector('svg'); if (svg) { const c = svg.getAttribute('class') ?? ''; svg.setAttribute('class', ''); void svg.getBoundingClientRect(); svg.setAttribute('class', c) } }} className="flex flex-col items-start gap-2 rounded-[16px] border border-ink-12 bg-card p-4 text-left">
                <Mascot kind={o.kind} mood={m.mood} size={64} />
                <span className="text-[15px] font-semibold capitalize">{m.mood}</span>
                <span className="text-[13px] leading-[1.4] text-ink-62">{m.when}</span>
              </button>
            ))}
          </div>
          <div className="mt-5"><InContext kind={o.kind} /></div>
        </Chapter>
      ))}
    </LabShell>
  )
}
