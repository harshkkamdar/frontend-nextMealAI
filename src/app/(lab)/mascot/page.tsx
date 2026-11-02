'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Chapter, LabShell, StateLabel } from '../_parts'
import { CHARACTERS, MASCOT_CSS, MOODS, Mascot, SCHEMES, type CharId, type Mood, type Scheme } from './characters'

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

const chip = (on: boolean) => cn('flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-semibold capitalize', on ? 'border-ink bg-ink text-cream' : 'border-ink-16 text-ink')

function NavButton({ id, scheme, mood }: { id: CharId; scheme: Scheme; mood: Mood }) {
  return (
    <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ink shadow-[0_6px_16px_rgba(17,28,53,.28)]">
      <Mascot id={id} mood={mood} scheme={scheme} size={42} framing="head" onNavy />
    </span>
  )
}

function InContext({ id, scheme }: { id: CharId; scheme: Scheme }) {
  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
      <div className="rounded-[20px] border border-ink-12 bg-cream p-4">
        <StateLabel>Geo&apos;s line on Home</StateLabel>
        <div className="mt-2 flex items-center gap-3">
          <Mascot id={id} mood="speak" scheme={scheme} size={40} framing="head" />
          <p className="text-[17px] font-medium leading-[1.42] tracking-[-0.2px]">Pull today, then <b className="font-semibold text-accent-ink">180 g</b> protein to hit.</p>
        </div>
      </div>
      <div className="rounded-[20px] border border-ink-12 bg-cream p-4">
        <StateLabel>Chat</StateLabel>
        <div className="mt-2 flex items-center gap-2"><Mascot id={id} mood="working" scheme={scheme} size={26} framing="head" /><span className="text-[13px] font-semibold">Geo</span><span className="text-[13px] text-ink-62">reading your photo</span></div>
        <div className="mt-3 flex items-start gap-2"><Mascot id={id} mood="done" scheme={scheme} size={26} framing="head" /><p className="text-[15px] leading-[1.45]">Logged 2 slices of Bega to lunch: 92 kcal, 12 g protein.</p></div>
      </div>
      <div className="rounded-[20px] border border-ink-12 bg-cream p-4">
        <StateLabel>Nav button</StateLabel>
        <div className="mt-2 flex items-end justify-around border-t border-ink-10 pt-3">
          {['Home', 'Food'].map((t) => <span key={t} className="text-[11px] font-medium text-ink-62">{t}</span>)}
          <span className="-mt-7 flex flex-col items-center gap-1"><NavButton id={id} scheme={scheme} mood="rest" /><span className="text-[11px] font-medium text-ink-62">Geo</span></span>
          {['Train', 'Check-in'].map((t) => <span key={t} className="text-[11px] font-medium text-ink-62">{t}</span>)}
        </div>
      </div>
      <div className="rounded-[20px] bg-ink p-4 text-cream">
        <StateLabel onNavy>Check-in</StateLabel>
        <div className="mt-2 flex items-start gap-3">
          <Mascot id={id} mood="up" scheme={scheme} size={34} framing="head" onNavy />
          <p className="text-[17px] font-semibold leading-[1.35]">Down 0.6 kg and four sessions. Raising calories to 2,380.</p>
        </div>
      </div>
      <div className="rounded-[20px] border border-ink-12 bg-cream p-4">
        <StateLabel>A big moment: new best</StateLabel>
        <div className="mt-2 flex items-center gap-4">
          <Mascot id={id} mood="up" scheme={scheme} size={96} />
          <div><p className="text-[22px] font-bold tracking-[-0.4px]">Bench 62.5 kg × 8</p><p className="text-[15px] text-ink-65">2.5 kg up on last Tuesday.</p></div>
        </div>
      </div>
    </div>
  )
}

export default function MascotPage() {
  const [scheme, setScheme] = useState<Scheme>('navy')
  const [held, setHeld] = useState<Mood | null>(null)
  const [picked, setPicked] = useState<CharId>('kangaroo')
  const mood = useCycle(held)
  const pickedChar = CHARACTERS.find((c) => c.id === picked)!

  return (
    <LabShell
      eyebrow="Geo · round 2"
      title="Who is Geo?"
      lede="Eight characters in three colours, each with the same nine expressions. At rest Geo is just the character; a mouth and hands come out only when Geo is doing something: talking, working, celebrating. Tell me the numbers worth keeping and we iterate from there."
    >
      <style>{MASCOT_CSS}</style>

      <Chapter n="00" id="controls" title="Colour and expression" intro={SCHEMES[scheme].note}>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SCHEMES) as Scheme[]).map((s) => (
            <button key={s} type="button" onClick={() => setScheme(s)} className={chip(scheme === s)}>
              <span className="size-4 rounded-full border border-ink-16" style={{ background: SCHEMES[s].body }} />
              {SCHEMES[s].name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button key={m.mood} type="button" onClick={() => setHeld((h) => (h === m.mood ? null : m.mood))} className={chip(mood === m.mood)}>{m.mood}</button>
          ))}
        </div>
        <p className="mt-3 text-[14px] text-ink-62">{held ? <>Holding <b>{held}</b>: {MOODS.find((m) => m.mood === held)?.when} Tap it again to play all nine.</> : 'Playing all nine expressions. Tap one to hold it.'}</p>
      </Chapter>

      <Chapter n="01" id="all" title="All eight" intro="Your four picks first, then four new ones in the same spirit. Tap one to see its expressions and how it sits in the app.">
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))]">
          {CHARACTERS.map((c, i) => (
            <button key={c.id} type="button" onClick={() => { setPicked(c.id); document.getElementById('detail')?.scrollIntoView({ behavior: 'smooth' }) }} className={cn('flex flex-col rounded-[20px] border bg-card p-4 text-left', picked === c.id ? 'border-ink' : 'border-ink-12')}>
              <span className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold tabular-nums text-ink-62">{i + 1}</span>
                <span className="text-[12px] font-semibold uppercase tracking-[1.4px] text-ink-62">{c.kind}</span>
              </span>
              <span className="grid place-items-center py-3"><Mascot key={`${c.id}-${mood}-${scheme}`} id={c.id} mood={mood} scheme={scheme} size={150} /></span>
              <span className="text-[17px] font-semibold">{c.name}</span>
              <span className="mt-1 text-[13.5px] leading-[1.4] text-ink-65">{c.idea}</span>
              <span className="mt-3 flex items-center gap-3 border-t border-ink-09 pt-3">
                <Mascot id={c.id} mood="speak" scheme={scheme} size={32} framing="head" />
                <span className="text-[13px] text-ink-62">Small</span>
                <span className="ml-auto"><NavButton id={c.id} scheme={scheme} mood="rest" /></span>
              </span>
            </button>
          ))}
        </div>
      </Chapter>

      <Chapter n="02" id="detail" title={`${CHARACTERS.indexOf(pickedChar) + 1}. ${pickedChar.name}`} intro={pickedChar.idea}>
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,150px),1fr))]">
          {MOODS.map((m) => (
            <div key={m.mood} className="flex flex-col items-start gap-2 rounded-[16px] border border-ink-12 bg-card p-4">
              <Mascot id={picked} mood={m.mood} scheme={scheme} size={96} />
              <span className="text-[15px] font-semibold capitalize">{m.mood}</span>
              <span className="text-[13px] leading-[1.4] text-ink-62">{m.when}</span>
            </div>
          ))}
        </div>
        <div className="mt-5"><InContext id={picked} scheme={scheme} /></div>
      </Chapter>
    </LabShell>
  )
}
