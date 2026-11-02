'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Chapter, LabShell, StateLabel } from '../_parts'
import { GEO_V2_CSS, GeoV2, MOODS, type CharId, type Mood } from './geo-v2'

/** Plays all nine expressions in turn unless one is held. */
function useCycle(held: Mood | null) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (held) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % MOODS.length), 2000)
    return () => window.clearInterval(id)
  }, [held])
  return held ?? MOODS[index].mood
}

const OPTIONS: { id: CharId; name: string; idea: string }[] = [
  { id: 'roo', name: 'Roo', idea: 'Australian and athletic, in orange boxing gloves.' },
  { id: 'bear', name: 'Bear', idea: 'Calm strength in a sweatband. The steady coach.' },
  { id: 'coach', name: 'Coach', idea: 'A small coach in a hood and an orange headband, with the FIQR mark on its chest.' },
  { id: 'kettlebell', name: 'Kettlebell', idea: 'A kettlebell with a face. Its handle echoes the ring in the FIQR logo.' },
]
const chip = (on: boolean) => cn('flex h-10 items-center rounded-full border px-4 text-[14px] font-semibold capitalize', on ? 'border-ink bg-ink text-cream' : 'border-ink-16 text-ink')

function NavButton({ id, mood = 'rest' }: { id: CharId; mood?: Mood }) {
  return (
    <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ink shadow-[0_6px_16px_rgba(17,28,53,.28)]">
      <GeoV2 id={id} mood={mood} size={42} form="small" onNavy />
    </span>
  )
}

/** The small versions: where the head alone stands in for Geo. */
function Small({ id }: { id: CharId }) {
  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
      <div className="rounded-[20px] border border-ink-12 bg-cream p-4">
        <StateLabel>Geo&apos;s line on Home</StateLabel>
        <div className="mt-2 flex items-center gap-3">
          <GeoV2 id={id} mood="speak" size={40} form="small" />
          <p className="text-[17px] font-medium leading-[1.42] tracking-[-0.2px]">Pull today, then <b className="font-semibold text-accent-ink">180 g</b> protein to hit.</p>
        </div>
      </div>
      <div className="rounded-[20px] border border-ink-12 bg-cream p-4">
        <StateLabel>Chat with Geo</StateLabel>
        <div className="mt-2 flex items-center gap-2"><GeoV2 id={id} mood="working" size={26} form="small" /><span className="text-[13px] font-semibold">Geo</span><span className="text-[13px] text-ink-62">reading your photo</span></div>
        <div className="mt-3 flex items-start gap-2"><GeoV2 id={id} mood="done" size={26} form="small" /><p className="text-[15px] leading-[1.45]">Logged 2 slices of Bega to lunch: 92 kcal, 12 g protein.</p></div>
      </div>
      <div className="rounded-[20px] border border-ink-12 bg-cream p-4">
        <StateLabel>The Geo button in the tab bar</StateLabel>
        <div className="mt-9 flex items-end justify-around border-t border-ink-10 pt-3">
          {['Home', 'Food'].map((t) => <span key={t} className="text-[11px] font-medium text-ink-62">{t}</span>)}
          <span className="-mt-7 flex flex-col items-center gap-1"><NavButton id={id} /><span className="text-[11px] font-medium text-ink-62">Geo</span></span>
          {['Train', 'Check-in'].map((t) => <span key={t} className="text-[11px] font-medium text-ink-62">{t}</span>)}
        </div>
      </div>
      <div className="rounded-[20px] bg-ink p-4 text-cream">
        <StateLabel onNavy>Weekly check-in</StateLabel>
        <div className="mt-2 flex items-start gap-3">
          <GeoV2 id={id} mood="up" size={34} form="small" onNavy />
          <p className="text-[17px] font-semibold leading-[1.35]">Down 0.6 kg and four sessions. Raising calories to 2,380.</p>
        </div>
      </div>
    </div>
  )
}

export default function MascotPage() {
  const [held, setHeld] = useState<Mood | null>(null)
  const mood = useCycle(held)

  return (
    <LabShell
      eyebrow="Geo"
      title="Meet Geo: four options."
      lede="Geo is getting a character. These are the four we like most. Each has nine expressions for the moments Geo shows up in the app, and a small version for tight spots like the tab bar. Tell us your favourite by number."
    >
      <style>{GEO_V2_CSS}</style>

      <Chapter n="00" id="compare" title="Side by side" intro={held ? <>{MOODS.find((m) => m.mood === held)?.when} Tap it again to play all nine.</> : 'Tap an expression to hold it.'}>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button key={m.mood} type="button" onClick={() => setHeld((h) => (h === m.mood ? null : m.mood))} className={chip(mood === m.mood)}>{m.mood}</button>
          ))}
        </div>
        <div className="mt-5 grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))]">
          {OPTIONS.map((c, i) => (
            <a key={c.id} href={`#${c.id}`} className="flex flex-col rounded-[20px] border border-ink-12 bg-card p-4">
              <span className="text-[26px] font-bold tabular-nums">{i + 1}</span>
              <span className="grid place-items-center py-2"><GeoV2 key={`${c.id}-${mood}`} id={c.id} mood={mood} size={170} /></span>
              <span className="text-[19px] font-semibold">{c.name}</span>
              <span className="mt-1 text-[14px] leading-[1.45] text-ink-65">{c.idea}</span>
              <span className="mt-4 flex items-end gap-4 border-t border-ink-09 pt-4">
                <GeoV2 id={c.id} mood="rest" size={24} form="small" />
                <GeoV2 id={c.id} mood="speak" size={40} form="small" />
                <span className="ml-auto"><NavButton id={c.id} /></span>
              </span>
            </a>
          ))}
        </div>
      </Chapter>

      {OPTIONS.map((c, i) => (
        <Chapter key={c.id} n={String(i + 1).padStart(2, '0')} id={c.id} title={`${i + 1}. ${c.name}`} intro={c.idea}>
          <h3 className="mb-3 text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62">Large: nine expressions</h3>
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,150px),1fr))]">
            {MOODS.map((m) => (
              <div key={m.mood} className="flex flex-col items-start gap-2 rounded-[16px] border border-ink-12 bg-card p-4">
                <GeoV2 id={c.id} mood={m.mood} size={104} />
                <span className="text-[15px] font-semibold capitalize">{m.mood}</span>
                <span className="text-[13px] leading-[1.4] text-ink-62">{m.when}</span>
              </div>
            ))}
          </div>
          <h3 className="mb-3 mt-8 text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62">Small: where Geo lives in the app</h3>
          <Small id={c.id} />
          <div className="mt-4 flex items-center gap-5 rounded-[20px] border border-ink-12 bg-cream p-4">
            <GeoV2 id={c.id} mood="up" size={110} />
            <div>
              <StateLabel>A big moment: a new best</StateLabel>
              <p className="mt-1 text-[22px] font-bold tracking-[-0.4px]">Bench 62.5 kg × 8</p>
              <p className="text-[15px] text-ink-65">2.5 kg up on last Tuesday.</p>
            </div>
          </div>
        </Chapter>
      ))}
    </LabShell>
  )
}
