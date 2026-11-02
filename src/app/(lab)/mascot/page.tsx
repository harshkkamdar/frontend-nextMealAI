'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { GEO_MASCOT_CSS, GeoMascot as Mascot, type Kind, type Mood } from '@/components/shared/geo-mascot'
import { Chapter, LabShell, StateLabel } from '../_parts'

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
      <style>{GEO_MASCOT_CSS}</style>
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
