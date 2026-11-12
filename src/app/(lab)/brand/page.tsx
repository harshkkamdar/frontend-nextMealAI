'use client'

import type { ReactNode } from 'react'
import { GeoRead } from '@/components/check-in/parts'
import { SegmentsBar } from '@/components/check-in/segments-bar'
import { GeoMark } from '@/components/shared/geo-avatar'
import { GeoLine } from '@/components/ui/fiqr/geo-line'
import { MarkShapes } from '@/components/ui/fiqr/mark'
import { Wordmark } from '@/components/ui/fiqr/wordmark'
import { Chapter, LabShell } from '../_parts'

const ETHOS = [
  ['A coach, not a tracker', 'Every main screen opens with Geo’s read and one next step. The numbers sit underneath as evidence.'],
  ['Adult and calm', 'Nothing cute, nothing loud. Praise is specific; a bad week is named plainly and never scolded.'],
  ['Few things, made well', 'A small set of components, each placed with intent. Type and space do the grouping; a box is the exception.'],
  ['Printed, not glowing', 'Cream paper, navy ink, one orange. Flat surfaces and hairlines. No gradients, glass or blur.'],
  ['Numbers are the hero', 'Big, tabular and exact. Bars, because bars compare at a glance.'],
  ['One orange thing per screen', 'It is what Geo would tell you to do next. A screen with nothing to act on has no orange.'],
] as const

const VOICE: [string, string][] = [
  ['Great job today! 🎉 You’re crushing your goals!', 'Banana’s in, 105 kcal. 179 g protein to go.'],
  ['It looks like you might want to consider increasing your protein intake.', 'You’re 60 g short on protein. Greek yogurt or a shake closes it.'],
  ['I’ve updated your plan!', 'Swapped bench for incline dumbbell press on Push. Undo'],
  ['Sorry, something went wrong. Please try again later.', 'I couldn’t save that. Your entry is still here; tap to try again.'],
]

const COLOURS = [
  { token: 'ink', hex: '#111C35', role: 'All text, the navy cards, the Geo button, protein' },
  { token: 'cream', hex: '#FDF6EC', role: 'Every screen; text on navy and on orange' },
  { token: 'accent', hex: '#E8622A', role: 'The one action per screen, calories, Geo’s bar' },
  { token: 'accent-ink', hex: '#BD4A19', role: 'Orange text under 19 pt bold' },
  { token: 'card', hex: '#FFFFFF', role: 'Tiles and grouped lists only' },
  { token: 'macro-teal', hex: '#3E7C77', role: 'Carbs, nothing else' },
  { token: 'macro-ochre', hex: '#A07A3C', role: 'Fat, nothing else' },
]

const INK_RAMP = [['80', 'Long reading'], ['65', 'Secondary text'], ['62', 'Labels, lightest text'], ['50', 'Icons, inactive nav'], ['16', 'Button outlines'], ['12', 'Tile borders'], ['09', 'Dividers']] as const

const TYPE: [string, string, string, string][] = [
  ['display', '28 / 700', 'text-[28px] font-bold leading-[1.1] tracking-[-0.6px]', 'Pull'],
  ['title', '24 / 700', 'text-[24px] font-bold tracking-[-0.5px]', 'Welcome back, George'],
  ['geo-read', '21 / 600', 'text-[21px] font-semibold leading-[1.3] tracking-[-0.3px]', 'You lost 0.6 kg and trained four times.'],
  ['metric', '19 / 600', 'text-[19px] font-semibold tracking-[-0.3px] tabular-nums', '78.4 kg'],
  ['button', '19 / 700', 'text-[19px] font-bold', 'Log food'],
  ['geo-line', '17 / 500', 'text-[17px] font-medium tracking-[-0.2px]', 'Legs today, then 83 g protein to hit.'],
  ['body', '15.5 / 500', 'text-[15.5px] font-medium', 'Protein'],
  ['readout', '13.5 / 400', 'text-[13.5px] text-ink-65 tabular-nums', '82 / 165 g · 83 g left'],
  ['date', '12 / 500 caps', 'text-[12px] font-medium uppercase tracking-[1.4px] text-ink-62', 'Mon 15 Sep'],
  ['section', '11.5 / 600 caps', 'text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62', 'Today’s targets'],
]

const NEVER = ['Gradients or gradient text', 'Glass and blur', 'Decorative shapes or blobs', 'Shadows on neutral cards', 'A card inside a card', 'Rings for macros', 'Sparkles or magic icons for AI', 'Emoji in the interface', 'A second orange action', 'Side-stripe borders', 'Faces on Geo', 'Exclamation marks in Geo’s voice']

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((hi + 0.05) / (lo + 0.05)).toFixed(1)
}

/** The app icon: a navy squircle holding the cream ring and the orange bar. */
function AppIcon({ size }: { size: number }) {
  return (
    <span className="grid place-items-center bg-ink shadow-[0_10px_30px_-12px_rgba(17,28,53,.5)]" style={{ width: size, height: size, borderRadius: size * 0.225 }}>
      <GeoMark size={size * 0.7} tone="cream" />
    </span>
  )
}

/** The mark's construction (FIQR Logo.dc.html), measured in the 100 unit box. */
function Construction() {
  return (
    <svg viewBox="-10 -10 120 120" className="w-full max-w-[340px]" role="img" aria-label="Construction of the Geo mark">
      <rect x="0" y="0" width="100" height="100" fill="none" stroke="var(--color-ink-12)" strokeWidth=".4" />
      <line x1="50" y1="0" x2="50" y2="100" stroke="var(--color-ink-12)" strokeWidth=".4" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="var(--color-ink-12)" strokeWidth=".4" />
      <MarkShapes ring="var(--color-ink)" />
      <circle cx="50" cy="50" r="1.2" fill="var(--color-ink)" />
      <text x="3" y="7" fontSize="4.2" fill="var(--color-ink-65)" fontFamily="var(--font-archivo)">100 unit box</text>
      <text x="50" y="7" fontSize="4.2" fill="var(--color-ink-65)" fontFamily="var(--font-archivo)">ring stroke 9% of diameter</text>
      <text x="3" y="98" fontSize="4.2" fill="var(--color-accent-ink)" fontFamily="var(--font-archivo)">bar 33% of diameter, at −45°</text>
    </svg>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-8 gap-y-6 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">{children}</div>
}

export default function BrandPage() {
  return (
    <LabShell
      eyebrow="Brand"
      title="A coach, not a tracker."
      lede={<>FIQR is a nutrition and training coach for adults who train with intent. Its coach, Geo, reads what you log and tells you what to do next. The app is the evidence behind Geo&apos;s word. This page is the brand; <a href="/lab" className="font-semibold text-ink underline decoration-ink-35 underline-offset-4">Components</a> is everything the screens are built from.</>}
    >
      <div className="mt-6 flex flex-wrap items-end gap-x-12 gap-y-8 border-t border-ink-12 pt-10">
        <figure><AppIcon size={128} /><figcaption className="mt-3 text-[13px] text-ink-65">App icon</figcaption></figure>
        <figure><span className="grid size-[128px] place-items-center rounded-[29px] border border-ink-12 bg-card"><GeoMark size={92} /></span><figcaption className="mt-3 text-[13px] text-ink-65">The mark</figcaption></figure>
        <figure><span className="flex h-[128px] items-center"><Wordmark size={44} /></span><figcaption className="mt-3 text-[13px] text-ink-65">Wordmark</figcaption></figure>
      </div>

      <Chapter n="01" id="ethos" title="Ethos" intro="Six rules every screen is checked against.">
        <ol className="grid gap-x-10 gap-y-7 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
          {ETHOS.map(([title, line], i) => (
            <li key={title} className="flex gap-4">
              <span className="w-6 shrink-0 pt-[3px] text-[13px] font-semibold text-accent-ink tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <span className="block text-[19px] font-semibold tracking-[-0.3px]">{title}</span>
                <span className="mt-1 block text-[15px] leading-[1.5] text-ink-65">{line}</span>
              </span>
            </li>
          ))}
        </ol>
      </Chapter>

      <Chapter n="02" id="mark" title="The mark and Geo" intro={<>The FIQR mark is a ring crossed by a short orange bar: the logo, on the app icon and beside the wordmark.</>}>
        <div className="flex flex-wrap items-center gap-10">
          <div className="w-[300px] shrink-0"><Construction /></div>
          <div className="min-w-[260px] flex-1 max-w-[46ch] text-[15.5px] leading-[1.55] text-ink-80">
            <p>One stroke weight for ring and bar, 7 in a 100 unit box. The bar sits on the 45 degree line through the centre, half on the ring and half outside it, with round caps.</p>
            <p className="mt-3">Ink ring on cream, cream ring on navy. The bar is always orange, at every size, in every place.</p>
          </div>
        </div>


        <h3 className="mb-4 mt-12 text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62">Where Geo lives</h3>
        <Row>
          <figure className="min-w-0">
            <div className="rounded-[20px] border border-ink-12 bg-cream px-gutter">
              <GeoLine>Legs today, then <b className="font-semibold text-accent-ink">83 g</b> protein to close the gap.</GeoLine>
            </div>
            <figcaption className="mt-3 text-[13px] text-ink-65">Home: Geo&apos;s line, the first thing under the greeting</figcaption>
          </figure>
          <figure className="min-w-0">
            <GeoRead
              verdict="You lost 0.6 kg and trained four times, a bit faster than planned, so I'm raising your calories."
              aside={null}
              footer={<div className="mt-[18px]"><SegmentsBar onNavy filled={6} total={7} label="6 of 7 days logged" /></div>}
            />
            <figcaption className="mt-3 text-[13px] text-ink-65">Check-in: Geo&apos;s read, the largest type on the screen</figcaption>
          </figure>
          <figure className="min-w-0">
            <div className="flex h-[132px] items-end justify-center rounded-[20px] border border-ink-12 bg-cream pb-4">
              <span className="flex flex-col items-center gap-1.5">
                <span className="grid size-14 place-items-center rounded-full bg-ink shadow-[var(--shadow-raised)]"><GeoMark size={34} tone="cream" /></span>
                <span className="text-[11px] font-medium text-ink-62">Geo</span>
              </span>
            </div>
            <figcaption className="mt-3 text-[13px] text-ink-65">The nav: the app icon in miniature, raised in the centre</figcaption>
          </figure>
        </Row>
      </Chapter>

      <Chapter n="03" id="voice" title="Geo's voice" intro="A good coach's text message: the number, the next step, nothing else.">
        <ul className="grid gap-2 text-[15.5px] leading-[1.5] text-ink-80 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
          {['Numbers first, exact, with units.', 'The action, then the reason. One sentence where one will do.', 'Say what changed, and only after it changed.', 'No exclamation marks, no emoji, no filler.', 'A bad week is named plainly, never scolded.', 'When Geo can’t tell, it says what it needs.'].map((rule) => (
            <li key={rule} className="flex gap-3"><span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-accent" />{rule}</li>
          ))}
        </ul>
        <div className="mt-8 overflow-hidden rounded-[16px] border border-ink-12 bg-card">
          <div className="grid grid-cols-2 border-b border-ink-09 text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-62">
            <span className="px-4 py-3">Not Geo</span><span className="border-l border-ink-09 px-4 py-3">Geo</span>
          </div>
          {VOICE.map(([no, yes]) => (
            <div key={yes} className="grid grid-cols-2 border-b border-ink-09 last:border-b-0">
              <p className="px-4 py-4 text-[15px] leading-[1.45] text-ink-62 line-through decoration-ink-20">{no}</p>
              <p className="border-l border-ink-09 px-4 py-4 text-[15px] font-medium leading-[1.45]">{yes}</p>
            </div>
          ))}
        </div>
      </Chapter>

      <Chapter n="04" id="colour" title="Colour" intro="Restrained: tinted paper, one ink, one orange for action, two muted macro hues. No dark mode.">
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
          {COLOURS.map((c) => (
            <div key={c.token} className="flex overflow-hidden rounded-[16px] border border-ink-12 bg-card">
              <span className="w-20 shrink-0 border-r border-ink-09" style={{ background: c.hex }} />
              <span className="min-w-0 px-4 py-3">
                <span className="block text-[15.5px] font-semibold">{c.token}</span>
                <span className="block font-mono text-[12.5px] text-ink-65">{c.hex}</span>
                <span className="mt-1 block text-[13px] leading-[1.4] text-ink-65">{c.role}</span>
                <span className="mt-1 block text-[12px] text-ink-62 tabular-nums">{c.hex === '#FDF6EC' ? `Ink on it ${contrast('#111C35', c.hex)}:1` : `On cream ${contrast(c.hex, '#FDF6EC')}:1`}</span>
              </span>
            </div>
          ))}
        </div>
        <h3 className="mb-3 mt-10 text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62">Ink on cream</h3>
        <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(min(100%,110px),1fr))]">
          {INK_RAMP.map(([o, use]) => (
            <div key={o} className="min-w-0">
              <span className="block h-12 rounded-[10px] border border-ink-09" style={{ background: `rgba(17,28,53,.${o})` }} />
              <span className="mt-2 block text-[13px] font-semibold tabular-nums">ink-{o}</span>
              <span className="block text-[12px] leading-[1.35] text-ink-62">{use}</span>
            </div>
          ))}
        </div>
      </Chapter>

      <Chapter n="05" id="type" title="Type" intro="Archivo at normal width, tabular figures on every number. Hierarchy from size and weight, never colour alone.">
        <div className="divide-y divide-ink-09 border-y border-ink-09">
          {TYPE.map(([role, spec, cls, sample]) => (
            <div key={role} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
              <span className="w-[120px] text-[13px] font-semibold">{role}</span>
              <span className="w-[110px] text-[13px] text-ink-62 tabular-nums">{spec}</span>
              <span className={`min-w-0 flex-1 basis-[260px] truncate ${cls}`}>{sample}</span>
            </div>
          ))}
        </div>
      </Chapter>

      <Chapter n="06" id="never" title="Never" intro="If a screen needs one of these, the screen is wrong.">
        <ul className="flex flex-wrap gap-2">
          {NEVER.map((n) => <li key={n} className="rounded-full border border-ink-16 px-3.5 py-2 text-[14px] text-ink-80">{n}</li>)}
        </ul>
      </Chapter>
    </LabShell>
  )
}
