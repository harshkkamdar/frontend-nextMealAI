'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { GeoAnchor } from '@/components/chat/chat-bubble'
import { GeoRead } from '@/components/check-in/parts'
import { SegmentsBar } from '@/components/check-in/segments-bar'
import { GeoMark, type GeoPose } from '@/components/shared/geo-avatar'
import { GeoLine } from '@/components/ui/fiqr/geo-line'
import { cn } from '@/lib/utils'
import { Chapter, LabShell } from '../_parts'

type Mark = { pose?: GeoPose; arrive?: boolean; working?: boolean; done?: boolean; listening?: boolean; nudge?: boolean; muted?: boolean }

/** Geo's whole vocabulary. The bar is where Geo is looking; how it moves is how Geo feels. */
const EXPRESSIONS: { name: string; mark: Mark; means: string; when: string; spec: string }[] = [
  { name: 'Rest', mark: { pose: 'rest' }, means: 'Idle. Geo is the logo.', when: 'The app icon, the nav, anywhere Geo has nothing to add.', spec: 'Bar at the lower right, still.' },
  { name: 'Speak', mark: { pose: 'speak', arrive: true }, means: 'Geo is talking to you.', when: 'Geo’s line on Home; a new chat; the companion sheet.', spec: 'Bar turns to point at the words, 420 ms ease-out.' },
  { name: 'Listening', mark: { pose: 'speak', listening: true }, means: 'Geo is following.', when: 'While you type to Geo.', spec: 'Bar sways 10° either side, 1.1 s each way.' },
  { name: 'Working', mark: { working: true }, means: 'Geo is on it.', when: 'Reading a photo, writing a reply, building a plan.', spec: 'Bar travels round the ring, 1.4 s a turn. The only loop.' },
  { name: 'Done', mark: { done: true }, means: 'It landed.', when: 'A photo read, a reply arrived, a log saved by Geo.', spec: 'One turn, 760 ms ease-out, back to rest.' },
  { name: 'Nudge', mark: { nudge: true }, means: 'Something new to look at.', when: 'Check-in is ready; a suggestion appears.', spec: 'Steps 16° out and back once, 560 ms.' },
  { name: 'Up', mark: { pose: 'up', arrive: true }, means: 'Going the right way.', when: 'A week that went to plan; a new best.', spec: 'Bar turns to the upper right.' },
  { name: 'Down', mark: { pose: 'down', arrive: true }, means: 'Needs your attention.', when: 'A week that didn’t go to plan; something failed.', spec: 'Bar turns straight down. Never shakes.' },
  { name: 'Offline', mark: { muted: true }, means: 'Geo can’t reach you.', when: 'No connection; changes wait on the phone.', spec: 'Ring at 35%, bar still and orange.' },
]

function ExpressionTile({ name, mark, means, when, spec, active, onPick }: (typeof EXPRESSIONS)[number] & { active: boolean; onPick: () => void }) {
  const [run, setRun] = useState(0)
  return (
    <button
      type="button"
      onClick={() => { setRun((r) => r + 1); onPick() }}
      aria-pressed={active}
      className={cn('flex flex-col items-start rounded-[16px] border bg-card p-4 text-left transition-colors active:bg-ink-04', active ? 'border-ink' : 'border-ink-12')}
    >
      <span className="grid h-[76px] w-full place-items-center"><GeoMark key={run} size={64} {...mark} /></span>
      <span className="mt-3 text-[15.5px] font-semibold">{name}</span>
      <span className="mt-0.5 text-[14px] text-ink-80">{means}</span>
      <span className="mt-2 text-[13px] leading-[1.4] text-ink-65">{when}</span>
      <span className="mt-2 text-[12px] leading-[1.4] text-ink-62">{spec}</span>
    </button>
  )
}

/** The status capsule as the app draws it (DESIGN.md component 12). */
function Capsule({ children, geo }: { children: ReactNode; geo?: Mark }) {
  return (
    <div className="flex min-h-11 items-center gap-2.5 rounded-[22px] bg-ink py-2 pl-3.5 pr-4 text-[14px] font-medium text-cream shadow-[0_12px_28px_-12px_rgba(17,28,53,.45)]">
      {geo ? <GeoMark size={20} tone="cream" {...geo} /> : <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-cream" />}
      <span>{children}</span>
    </div>
  )
}

/** The nav's raised Geo button. */
function NavGeo({ mark }: { mark: Mark }) {
  return (
    <div className="absolute inset-x-0 bottom-0 border-t border-ink-10 bg-cream pb-4 pt-2.5">
      <div className="grid grid-cols-5 items-end text-center text-[11px] font-semibold text-ink-62">
        <span>Home</span><span>Food</span>
        <span className="flex flex-col items-center">
          <span className="-mt-7 grid size-14 place-items-center rounded-full bg-ink shadow-[var(--shadow-raised)]"><GeoMark size={34} tone="cream" {...mark} /></span>
          <span className="mt-[6px]">Geo</span>
        </span>
        <span>Train</span><span>Check-in</span>
      </div>
    </div>
  )
}

function HomeTop({ children }: { children?: ReactNode }) {
  return (
    <div className="px-5 pt-5">
      <p className="text-[12px] font-medium uppercase tracking-[1.4px] text-ink-62">Mon 15 Sep</p>
      <p className="mt-[5px] text-[24px] font-bold tracking-[-0.5px]">Welcome back, George</p>
      <div className="mt-2 border-b border-ink-09">{children}</div>
    </div>
  )
}

const Skel = ({ w }: { w: string }) => <span className="block h-3 rounded-full bg-ink-08" style={{ width: w }} />

type Step = { at: number; caption: string; view: ReactNode }
type Scene = { id: string; title: string; summary: string; steps: Step[] }

const em = (s: string) => <b className="font-semibold text-accent-ink">{s}</b>

const SCENES: Scene[] = [
  {
    id: 'open', title: 'Opening Home', summary: 'Geo’s line is the first thing on the screen. The mark turns once as it lands, then rests.',
    steps: [
      { at: 0, caption: 'Home opens', view: <HomeTop><div className="flex items-start gap-3 py-4"><span className="size-[26px] rounded-full bg-ink-08" /><span className="flex flex-1 flex-col gap-2 pt-1.5"><Skel w="82%" /><Skel w="40%" /></span></div></HomeTop> },
      { at: 700, caption: 'Geo’s line arrives: one turn, then rest', view: <HomeTop><GeoLine>Legs today, then {em('83 g')} protein to close the gap.</GeoLine></HomeTop> },
    ],
  },
  {
    id: 'photo', title: 'Logging a photo', summary: 'Geo reads the photo. The nav’s Geo works while it reads, turns once when the estimate lands, and the capsule says what went in.',
    steps: [
      { at: 0, caption: 'You take a photo', view: <PhotoView phase={0} /> },
      { at: 500, caption: 'Geo reads it: the bar travels round the ring', view: <PhotoView phase={1} /> },
      { at: 2900, caption: 'The estimate lands: one turn', view: <PhotoView phase={2} /> },
      { at: 3900, caption: 'Logged: the capsule says what changed', view: <PhotoView phase={3} /> },
    ],
  },
  {
    id: 'ask', title: 'Asking Geo', summary: 'Geo listens while you type, works while it writes, and turns to you when it answers.',
    steps: [
      { at: 0, caption: 'You start typing: Geo listens', view: <AskView phase={0} /> },
      { at: 1800, caption: 'Sent: Geo works', view: <AskView phase={1} /> },
      { at: 3600, caption: 'The answer: the numbers first', view: <AskView phase={2} /> },
    ],
  },
  {
    id: 'good', title: 'A week that went to plan', summary: 'Every planned session done. Geo’s bar turns up as the read opens. Praise is specific, never loud.',
    steps: [{ at: 0, caption: 'Check-in, all sessions done', view: <ReadView pose="up" verdict="You lost 0.6 kg and trained four times, a bit faster than planned, so I'm raising your calories to 2,380." filled={7} /> }],
  },
  {
    id: 'off', title: 'A week that didn’t', summary: 'Fewer than half the sessions. The bar turns down. Geo names it plainly and gives one thing to do.',
    steps: [{ at: 0, caption: 'Check-in, one session of four', view: <ReadView pose="down" verdict="One session of four and most days ran 300 kcal over. Targets stay as they are; three sessions this week is the goal." filled={6} /> }],
  },
  {
    id: 'thin', title: 'Not enough to go on', summary: 'Too few days logged. Geo stays at rest and says what it needs, without scolding.',
    steps: [{ at: 0, caption: 'Check-in, three days logged', view: <ReadView pose="rest" verdict="Three days logged isn't enough to tell whether your targets are right, so I'm leaving them alone." filled={3} note="3 of 7 days logged. Five next week gives me a real answer." /> }],
  },
  {
    id: 'best', title: 'A new best', summary: 'Mid-workout, a set beats the last top set. The bar turns up beside the number. No confetti.',
    steps: [
      { at: 0, caption: 'Set 3 logged', view: <BestView best={false} /> },
      { at: 900, caption: 'Geo notices the new best', view: <BestView best /> },
    ],
  },
  {
    id: 'ready', title: 'Check-in is ready', summary: 'Something new to look at. Geo’s line nudges once; it never repeats or loops.',
    steps: [
      { at: 0, caption: 'Sunday morning', view: <HomeTop><GeoLine>{em('1,840')} kcal and {em('162 g')} protein yesterday. Close to plan.</GeoLine></HomeTop> },
      { at: 900, caption: 'The week is ready: one nudge', view: <HomeTop><NudgeLine /></HomeTop> },
    ],
  },
  {
    id: 'failed', title: 'Something failed', summary: 'Geo says what happened and what is safe, with one way forward. The bar points down; nothing shakes or flashes.',
    steps: [{ at: 0, caption: 'A save didn’t go through', view: <div className="px-5 pt-6"><div className="flex items-start gap-3"><span role="img" aria-label="Geo"><GeoMark size={26} pose="down" arrive /></span><p className="text-[17px] font-medium leading-[1.42] tracking-[-0.2px]">I couldn&apos;t save that. Your entry is still here.</p></div><button type="button" className="ml-[38px] mt-1 min-h-11 text-[15px] font-semibold underline decoration-ink-20 underline-offset-4">Try again</button></div> }],
  },
  {
    id: 'offline', title: 'Offline', summary: 'Geo dims. What you log waits on the phone and sends when you’re back; Geo works while it syncs.',
    steps: [
      { at: 0, caption: 'No connection', view: <div className="px-5 pt-6"><Capsule geo={{ muted: true }}>Offline. This saves on your phone and sends later.</Capsule></div> },
      { at: 1800, caption: 'Back online: syncing', view: <div className="px-5 pt-6"><Capsule geo={{ working: true }}>2 changes waiting to sync</Capsule></div> },
      { at: 3300, caption: 'Synced', view: <div className="px-5 pt-6"><Capsule>Back online. 2 changes synced</Capsule></div> },
    ],
  },
]

function PhotoView({ phase }: { phase: number }) {
  return (
    <div className="relative h-full">
      <div className="px-5 pt-5">
        <p className="text-[17px] font-semibold">Photo</p>
        <div className="mt-3 overflow-hidden rounded-[16px] border border-ink-12 bg-card">
          {phase < 2 ? (
            <div className="flex items-center gap-3 px-4 py-4">
              <span className="size-12 rounded-[12px] bg-ink-08" />
              <span className="text-[15px] text-ink-65">{phase === 0 ? 'Photo taken' : 'Reading your photo…'}</span>
            </div>
          ) : (
            [['Chicken', '180 g', '297'], ['Rice', '200 g', '260'], ['Greens', '60 g', '55']].map(([n, g, k]) => (
              <div key={n} className="flex items-center justify-between border-b border-ink-09 px-4 py-3 last:border-b-0 text-[15px]">
                <span className="font-semibold">{n}</span><span className="text-ink-65 tabular-nums">{g} · {k} kcal</span>
              </div>
            ))
          )}
        </div>
        {phase === 3 ? <div className="mt-4"><Capsule>Chicken rice bowl in, 612 kcal. 96 g protein to go.</Capsule></div> : null}
      </div>
      <NavGeo mark={phase === 1 ? { working: true } : phase === 2 ? { done: true } : {}} />
    </div>
  )
}

function AskView({ phase }: { phase: number }) {
  const [typed, setTyped] = useState('')
  const text = 'What should I eat before training?'
  useEffect(() => {
    if (phase !== 0) return
    let i = 0
    const id = window.setInterval(() => { i += 1; setTyped(text.slice(0, i)); if (i >= text.length) window.clearInterval(id) }, 45)
    return () => window.clearInterval(id)
  }, [phase])
  return (
    <div className="flex h-full flex-col justify-end px-5 pb-5">
      {phase >= 1 ? <p className="mb-4 ml-auto max-w-[80%] rounded-[18px] rounded-br-[6px] bg-ink px-3.5 py-2.5 text-[15px] text-cream">{text}</p> : null}
      {phase === 1 ? <div className="mb-auto mt-0"><GeoAnchor working /><div className="mt-3 flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="size-2 rounded-full bg-ink-35" />)}</div></div> : null}
      {phase === 2 ? (
        <div className="mb-auto">
          <GeoAnchor done />
          <p className="mt-3 text-[16px] leading-[1.5]">A banana and 200 g Greek yogurt an hour before: 40 g carbs, 20 g protein. You still need 83 g protein today.</p>
        </div>
      ) : null}
      <div className="mt-4 flex h-14 items-center gap-2 rounded-[15px] border border-ink-12 bg-card pl-3 pr-1.5">
        <GeoMark size={20} pose="speak" listening={phase === 0 && typed.length > 0} />
        <span className={cn('min-w-0 flex-1 truncate text-[15.5px]', phase === 0 && typed ? 'text-ink' : 'text-ink-62')}>{phase === 0 ? typed || 'Tell Geo' : 'Tell Geo'}</span>
        <span className="grid size-11 place-items-center rounded-full bg-accent text-[18px] text-cream">↑</span>
      </div>
    </div>
  )
}

function ReadView({ pose, verdict, filled, note }: { pose: GeoPose; verdict: string; filled: number; note?: string }) {
  return (
    <div className="px-4 pt-5">
      <p className="px-1 text-[12px] font-medium uppercase tracking-[1.4px] text-ink-62">8 – 14 Sep</p>
      <p className="mb-3 mt-[5px] px-1 text-[24px] font-bold tracking-[-0.5px]">Week 6 check-in</p>
      <GeoRead
        verdict={verdict}
        aside={null}
        pose={pose}
        footer={<div className="mt-[18px]"><SegmentsBar onNavy filled={filled} total={7} label={`${filled} of 7 days logged`} />{note ? <p className="mt-2.5 text-[14px] text-cream-60">{note}</p> : null}</div>}
      />
    </div>
  )
}

function BestView({ best }: { best: boolean }) {
  return (
    <div className="px-5 pt-6">
      <p className="text-[12px] font-medium uppercase tracking-[1.4px] text-ink-62">Push · exercise 1 of 6</p>
      <p className="mt-1 text-[28px] font-bold tracking-[-0.6px]">Bench press</p>
      <div className="mt-4 overflow-hidden rounded-[16px] border border-ink-12 bg-card">
        {[['1', '60 kg × 8'], ['2', '60 kg × 8'], ['3', '62.5 kg × 8']].map(([n, v]) => (
          <div key={n} className="flex min-h-14 items-center gap-3 border-b border-ink-09 px-4 last:border-b-0">
            <span className="w-5 text-[13px] text-ink-62 tabular-nums">{n}</span>
            <span className="flex-1 text-[16px] font-semibold tabular-nums">{v}</span>
            {n === '3' && best ? <span role="img" aria-label="Geo"><GeoMark size={22} pose="up" arrive /></span> : <span className="text-[13px] text-ink-62">Done</span>}
          </div>
        ))}
      </div>
      {best ? <p className="mt-3 text-[15.5px] font-medium">New best: <b className="font-semibold tabular-nums">62.5 kg × 8</b>. Last time 60 kg × 8.</p> : null}
    </div>
  )
}

function NudgeLine() {
  return (
    <div className="flex items-start gap-3 py-4">
      <span role="img" aria-label="Geo"><GeoMark size={26} nudge /></span>
      <span className="text-[17px] font-medium leading-[1.42] tracking-[-0.2px]">Your week is ready. Two minutes to see what changes.</span>
    </div>
  )
}

/** One play-through of a scene: mounted fresh per play (keyed by the player), so it always starts at step 0. */
function SceneStage({ scene, onReplay }: { scene: Scene; onReplay: () => void }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const timers = scene.steps.slice(1).map((s, i) => window.setTimeout(() => setStep(i + 1), s.at))
    return () => timers.forEach(window.clearTimeout)
  }, [scene])
  return (
    <div className="flex min-w-0 flex-1 basis-[360px] flex-wrap gap-8">
      <div className="relative h-[480px] w-[340px] shrink-0 overflow-hidden rounded-[36px] border border-ink-16 bg-cream" style={{ transform: 'translateZ(0)' }}>
        <div key={step} className="h-full">{scene.steps[step].view}</div>
      </div>
      <div className="min-w-[220px] flex-1">
        <p className="text-[19px] font-semibold tracking-[-0.3px]">{scene.title}</p>
        <p className="mt-2 max-w-[42ch] text-[15px] leading-[1.5] text-ink-80">{scene.summary}</p>
        <ol className="mt-5 flex flex-col gap-2">
          {scene.steps.map((s, i) => (
            <li key={s.caption} className={cn('flex items-baseline gap-3 text-[14px]', i === step ? 'text-ink' : 'text-ink-62')}>
              <span aria-hidden="true" className={cn('size-2 shrink-0 translate-y-[-1px] rounded-full', i === step ? 'bg-ink' : 'bg-ink-16')} />
              <span className="w-12 shrink-0 text-[12px] tabular-nums">{(s.at / 1000).toFixed(1)} s</span>
              <span className={i === step ? 'font-semibold' : ''}>{s.caption}</span>
            </li>
          ))}
        </ol>
        <button type="button" onClick={onReplay} className="mt-5 flex min-h-11 items-center rounded-[15px] border border-ink-16 px-4 text-[15px] font-semibold active:bg-ink-04">Play again</button>
      </div>
    </div>
  )
}

function ScenePlayer() {
  const [sceneId, setSceneId] = useState(SCENES[0].id)
  const [run, setRun] = useState(0)
  const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0]
  const pick = (id: string) => { setSceneId(id); setRun((r) => r + 1) }
  return (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-8">
      <ol className="flex w-[300px] shrink-0 flex-col">
        {SCENES.map((s, i) => (
          <li key={s.id}>
            <button type="button" onClick={() => pick(s.id)} aria-pressed={s.id === sceneId} className={cn('flex min-h-12 w-full items-baseline gap-3 border-b border-ink-09 py-3 text-left', s.id === sceneId ? 'text-ink' : 'text-ink-65')}>
              <span className="w-5 text-[12px] font-semibold text-ink-62 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span className={cn('text-[15.5px]', s.id === sceneId ? 'font-semibold' : 'font-medium')}>{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
      <SceneStage key={`${scene.id}-${run}`} scene={scene} onReplay={() => setRun((r) => r + 1)} />
    </div>
  )
}

const SIZES = [16, 20, 26, 34, 56, 120]

const RULES = [
  ['Geo moves only in answer to something.', 'A tap, a reply, a saved log, a finished week. Never to decorate, never on a timer.'],
  ['One Geo moves at a time.', 'If the nav is working, the line on the screen stays still.'],
  ['Working is the only loop.', 'Everything else plays once and settles back to its pose.'],
  ['The bar is always orange; the ring is ink on cream, cream on navy.', 'Offline dims the ring, never the bar.'],
  ['No face, no eyes, no limbs, no speech bubbles.', 'Geo is a mark that pays attention, not a cartoon.'],
  ['Reduced motion: Geo holds still.', 'Poses change instantly; working shows a dimmed bar instead of an orbit.'],
] as const

const VOICE: [string, string, string][] = [
  ['Logged a photo', 'Chicken rice bowl in, 612 kcal. 96 g protein to go.', 'Done'],
  ['Morning, nothing logged', 'Legs today, then 165 g protein to hit.', 'Speak'],
  ['Good week', 'You lost 0.6 kg and trained four times, so I’m raising calories to 2,380.', 'Up'],
  ['Off week', 'One session of four. Targets stay; three sessions this week is the goal.', 'Down'],
  ['Thin data', 'Three days isn’t enough to tell. Five next week gives me a real answer.', 'Rest'],
  ['New best', 'New best: 62.5 kg × 8. Last time 60 kg × 8.', 'Up'],
  ['Failure', 'I couldn’t save that. Your entry is still here; tap to try again.', 'Down'],
  ['Unsure', 'Was that a small or a large flat white? I’ve logged a small, 90 kcal.', 'Speak'],
]

export default function GeoPage() {
  const [hero, setHero] = useState(0)
  const [heroRun, setHeroRun] = useState(0)
  const pick = (i: number) => { setHero(i); setHeroRun((r) => r + 1) }
  return (
    <LabShell
      eyebrow="Geo"
      title="The coach in the mark."
      lede={<>Geo is the ring and bar from the app icon. It has no face and no body: the bar is where Geo is looking, and the way it moves is how Geo feels. Every expression on this page is the app&apos;s own component, so what you see here is what ships.</>}
    >
      <div className="mt-6 flex flex-wrap items-center gap-x-14 gap-y-8 border-t border-ink-12 pt-10">
        <div className="grid size-[240px] shrink-0 place-items-center rounded-[54px] bg-ink">
          <GeoMark key={heroRun} size={176} tone="cream" {...EXPRESSIONS[hero].mark} />
        </div>
        <div className="min-w-[260px] flex-1">
          <p className="text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62">Try an expression</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXPRESSIONS.map((e, i) => (
              <button key={e.name} type="button" onClick={() => pick(i)} aria-pressed={hero === i} className={cn('min-h-11 rounded-full border px-4 text-[15px] font-semibold transition-colors', hero === i ? 'border-ink bg-ink text-cream' : 'border-ink-16 text-ink active:bg-ink-04')}>
                {e.name}
              </button>
            ))}
          </div>
          <p className="mt-5 text-[21px] font-semibold tracking-[-0.3px]">{EXPRESSIONS[hero].means}</p>
          <p className="mt-1 max-w-[46ch] text-[15px] leading-[1.5] text-ink-65">{EXPRESSIONS[hero].when} {EXPRESSIONS[hero].spec}</p>
        </div>
      </div>

      <Chapter n="01" id="expressions" title="Expressions" intro="Nine, and no more. Each is a place for the bar or one movement of it. Tap one to play it again.">
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))]">
          {EXPRESSIONS.map((e, i) => <ExpressionTile key={e.name} {...e} active={hero === i} onPick={() => pick(i)} />)}
        </div>
      </Chapter>

      <Chapter n="02" id="situations" title="In the app" intro="Ten situations, played with the real components. Pick one; it plays through and holds on the last frame.">
        <ScenePlayer />
      </Chapter>

      <Chapter n="03" id="voice" title="What Geo says" intro="The number first, then the one thing to do. The expression beside each line is the one the screen shows.">
        <div className="overflow-hidden rounded-[16px] border border-ink-12 bg-card">
          {VOICE.map(([when, line, pose]) => {
            const e = EXPRESSIONS.find((x) => x.name === pose)
            return (
              <div key={when} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-ink-09 px-4 py-4 last:border-b-0">
                <span className="w-[150px] shrink-0 text-[13.5px] text-ink-62">{when}</span>
                <span className="min-w-[240px] flex-1 text-[16px] font-medium leading-[1.45]">{line}</span>
                <span className="flex w-[100px] shrink-0 items-center gap-2 text-[13px] font-semibold text-ink-65">
                  {e ? <GeoMark size={20} {...e.mark} arrive={false} pose={e.mark.pose} working={false} listening={false} /> : null}{pose}
                </span>
              </div>
            )
          })}
        </div>
      </Chapter>

      <Chapter n="04" id="sizes" title="Sizes and surfaces" intro="16 pt is the smallest Geo. On cream the ring is ink; on navy it is cream. The bar never changes colour.">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-6 rounded-[20px] border border-ink-12 bg-cream px-6 py-8">
          {SIZES.map((s) => <figure key={s} className="flex flex-col items-center gap-2"><GeoMark size={s} /><figcaption className="text-[12px] text-ink-62 tabular-nums">{s}</figcaption></figure>)}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-x-10 gap-y-6 rounded-[20px] bg-ink px-6 py-8">
          {SIZES.map((s) => <figure key={s} className="flex flex-col items-center gap-2"><GeoMark size={s} tone="cream" /><figcaption className="text-[12px] text-cream-60 tabular-nums">{s}</figcaption></figure>)}
        </div>
        <div className="mt-6 grid gap-x-8 gap-y-3 text-[14px] text-ink-80 grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))]">
          <p><b className="font-semibold">16 to 22</b>: inline, the status capsule, chat</p>
          <p><b className="font-semibold">26</b>: Geo&apos;s line on Home</p>
          <p><b className="font-semibold">34 in a 56 disc</b>: the nav button</p>
          <p><b className="font-semibold">120 and up</b>: the app icon, onboarding, this page</p>
        </div>
      </Chapter>

      <Chapter n="05" id="rules" title="Rules" intro="What keeps Geo adult and calm.">
        <ol className="grid gap-x-10 gap-y-6 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
          {RULES.map(([rule, why], i) => (
            <li key={rule} className="flex gap-4">
              <span className="w-6 shrink-0 pt-[3px] text-[13px] font-semibold text-accent-ink tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span><span className="block text-[17px] font-semibold tracking-[-0.2px]">{rule}</span><span className="mt-1 block text-[14.5px] leading-[1.5] text-ink-65">{why}</span></span>
            </li>
          ))}
        </ol>
      </Chapter>
    </LabShell>
  )
}
