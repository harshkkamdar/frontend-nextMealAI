'use client'

import { useState } from 'react'
import { ChatBubble } from '@/components/chat/chat-bubble'
import { GeoRead } from '@/components/check-in/parts'
import { SegmentsBar } from '@/components/check-in/segments-bar'
import { WorkoutCard } from '@/components/dashboard/workout-card'
import { LargeTitleHeader, PushedHeader } from '@/components/layout/screen-header'
import { TabBar } from '@/components/layout/tab-bar'
import { Dock, INK_BUTTON, TextButton } from '@/components/plans/spatial-parts'
import { GeoLine } from '@/components/ui/fiqr/geo-line'
import { GroupedList, GroupedRow } from '@/components/ui/fiqr/grouped-list'
import { PersonFill } from '@/components/ui/fiqr/icons'
import { MacroBar } from '@/components/ui/fiqr/macro-bar'
import { MetricStrip } from '@/components/ui/fiqr/metric-strip'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { WeekStrip } from '@/components/ui/fiqr/week-strip'
import type { WorkoutPlan } from '@/types/plans.types'
import type { WorkoutSession } from '@/types/workout-session.types'
import { Chapter, LabShell, Specimen, StateLabel } from '../_parts'

const noop = () => {}
const today = new Date().toISOString().slice(0, 10)
const exercise = (name: string) => ({ name, sets: 3, reps: '8-10', rest_seconds: 90 })
const plan = {
  current_position: 0,
  content: { days: [{ name: 'Leg day', is_rest_day: false, exercises: ['Back squat', 'Romanian deadlift', 'Leg press', 'Walking lunge', 'Leg curl', 'Calf raise'].map(exercise) }] },
} as unknown as WorkoutPlan
const restPlan = { current_position: 0, content: { days: [{ name: 'Rest', is_rest_day: true, exercises: [] }] } } as unknown as WorkoutPlan
const session = (hoursAgo: number) => ({
  id: 'lab',
  day_name: 'Pull',
  started_at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
  exercises: [{ sets: [{ completed: true }, { completed: true }, { completed: false }, { completed: false }] }],
}) as unknown as WorkoutSession

/** Retired on 2 Nov: listed so nobody brings them back. */
const RETIRED = 'Glass and glass-cream surfaces, the four CARD copies, wide and 800-weight type, ActionCard, MetricTile, PageHeader, press tilt, dashed empty boxes, gradient fades, filled icons, a face for Mood, the Aurora name, the glass flag.'

export default function LabPage() {
  const [day, setDay] = useState(today)
  return (
    <LabShell
      eyebrow="Components"
      title="Everything the screens are built from."
      lede={<>Live components from the app, in every state they take. A screen that needs something not on this page needs a reason, and it gets added here first. Rules and tokens: <a href="/brand" className="font-semibold text-ink underline decoration-ink-35 underline-offset-4">Brand</a>.</>}
    >
      <Chapter n="01" id="headers" title="Headers" intro="Tab roots and pushed screens. The bar fills with cream and a hairline once content scrolls under it.">
        <div className="grid gap-8 grid-cols-[repeat(auto-fill,minmax(min(100%,390px),1fr))]">
          <Specimen name="Screen header" file="components/layout/screen-header.tsx · LargeTitleHeader" use="Every tab root: Home, Food, Geo, Train, Check-in" height={150} fixedInside>
            <div className="px-gutter">
              <LargeTitleHeader title="Welcome back, George" subtitle="Mon 15 Sep" actions={<RoundButton aria-label="Profile"><PersonFill /></RoundButton>} />
            </div>
          </Specimen>
          <Specimen name="Pushed header" file="components/layout/screen-header.tsx · PushedHeader" use="Every screen you go into: a plan, a food, settings" height={150} fixedInside>
            <div className="px-gutter">
              <PushedHeader title="Leg day" onBack={noop} large subtitle="6 exercises · 45 min" />
            </div>
          </Specimen>
        </div>
      </Chapter>

      <Chapter n="02" id="geo" title="Geo" intro="Geo speaks in two places: a line under Home's greeting, and the navy read on Check-in.">
        <div className="grid gap-8 grid-cols-[repeat(auto-fill,minmax(min(100%,390px),1fr))]">
          <Specimen name="Geo's line" file="components/ui/fiqr/geo-line.tsx" use="Home, under the greeting. Taps open Geo.">
            <StateLabel>Speaking</StateLabel>
            <GeoLine onOpen={noop}>Legs today, then <b className="font-semibold text-accent-ink">83 g</b> protein to close the gap.</GeoLine>
            <StateLabel>With a one-tap action</StateLabel>
            <GeoLine onOpen={noop} action={<button type="button" className="-ml-2 min-h-11 px-2 text-[15px] font-semibold text-ink underline decoration-ink-20 underline-offset-4">Log oats again</button>}>
              Same breakfast as yesterday? That was <b className="font-semibold text-accent-ink">32 g</b> protein.
            </GeoLine>
            <StateLabel>Working</StateLabel>
            <GeoLine thinking>Logging your oats…</GeoLine>
          </Specimen>
          <Specimen name="Geo's read" file="components/check-in/parts.tsx · GeoRead" use="Check-in: the verdict, then the data under it as evidence">
            <GeoRead verdict="You lost 0.6 kg and trained four times, a bit faster than planned, so I'm raising your calories." aside="8 – 14 Sep" />
            <div className="mt-4">
              <GeoRead
                verdict="Three days logged isn't enough to tell whether your targets are right, so I'm leaving them alone."
                aside={null}
                footer={<div className="mt-[18px]"><SegmentsBar onNavy filled={3} total={7} label="3 of 7 days logged" /><p className="mt-2.5 text-[14px] text-cream-60">3 of 7 days logged. Five next week gives me a real answer.</p></div>}
              />
            </div>
          </Specimen>
        </div>
      </Chapter>

      <Chapter n="03" id="actions" title="Actions" intro="One orange action per screen at most. Everything else is navy, cream or a text button.">
        <div className="grid gap-8 grid-cols-[repeat(auto-fill,minmax(min(100%,390px),1fr))]">
          <Specimen name="Primary action" file="components/ui/fiqr/primary-button.tsx" use="The screen's next step: Log food, Apply new targets, Finish workout">
            <StateLabel>With icon and trailing</StateLabel>
            <PrimaryButton type="button" icon="+" trailing="Scan · Search">Log food</PrimaryButton>
            <StateLabel>Plain</StateLabel>
            <PrimaryButton type="button">Apply new targets</PrimaryButton>
          </Specimen>
          <Specimen name="Secondary, committing and text buttons" file="ui/fiqr/secondary-button.tsx · plans/spatial-parts.tsx" use="Choices that are not the next step">
            <StateLabel>Secondary</StateLabel>
            <SecondaryButton type="button">See program</SecondaryButton>
            <StateLabel>Committing (navy)</StateLabel>
            <button type="button" className={INK_BUTTON}>Keep current targets</button>
            <StateLabel>Text</StateLabel>
            <TextButton onClick={noop}>Ask Geo about this</TextButton>
          </Specimen>
        </div>
      </Chapter>

      <Chapter n="04" id="feature" title="Feature card" intro="Navy, the name as the largest type, one cream button. One per screen.">
        <div className="grid gap-8 grid-cols-[repeat(auto-fill,minmax(min(100%,390px),1fr))]">
          <Specimen name="Next up" file="components/dashboard/workout-card.tsx" use="Home and Train">
            <WorkoutCard workoutPlan={plan} today={today} onStart={noop} onSeeProgram={noop} onAskGeo={noop} />
            <div className="mt-4"><WorkoutCard workoutPlan={restPlan} today={today} onStart={noop} onSeeProgram={noop} onAskGeo={noop} /></div>
          </Specimen>
          <Specimen name="Open session" file="components/dashboard/workout-card.tsx" use="A workout in progress; stale after 12 hours">
            <WorkoutCard workoutPlan={plan} today={today} inProgress={session(1)} onStart={noop} onResume={noop} onSeeProgram={noop} onAskGeo={noop} />
            <div className="mt-4"><WorkoutCard workoutPlan={plan} today={today} inProgress={session(60)} onStart={noop} onResume={noop} onDiscard={noop} onSeeProgram={noop} onAskGeo={noop} /></div>
          </Specimen>
        </div>
      </Chapter>

      <Chapter n="05" id="numbers" title="Numbers" intro="Bars for the day's targets; one strip for the quiet metrics. Never rings, never a grid of boxes.">
        <div className="grid gap-8 grid-cols-[repeat(auto-fill,minmax(min(100%,390px),1fr))]">
          <Specimen name="Macro bars" file="components/ui/fiqr/macro-bar.tsx" use="Home, Food, the macro sheet">
            <SectionLabel>Today&apos;s targets</SectionLabel>
            <div className="mt-[10px] flex flex-col gap-[6px]">
              <MacroBar name="Calories" lead current={1353} target={2200} onClick={noop} />
              <MacroBar name="Protein" unit="g" current={82} target={165} onClick={noop} />
              <MacroBar name="Carbs" unit="g" current={145} target={220} onClick={noop} />
              <MacroBar name="Fat" unit="g" current={81} target={73} onClick={noop} />
            </div>
          </Specimen>
          <Specimen name="Metric strip" file="components/ui/fiqr/metric-strip.tsx" use="Home's quiet metrics, Check-in's evidence, Train's week">
            <StateLabel>With data</StateLabel>
            <MetricStrip items={[{ label: 'Weight', value: '78.4', unit: 'kg' }, { label: 'Sleep', value: '7.2', unit: 'h' }, { label: 'Steps', value: '6,480' }, { label: 'Water', value: '5', unit: 'of 8' }]} />
            <StateLabel>Empty</StateLabel>
            <MetricStrip items={[{ label: 'Weight', value: '—', sub: 'no trend yet' }, { label: 'Sessions', value: '0', unit: 'of 4', sub: 'this week' }, { label: 'Sleep', value: '—', sub: 'not tracked' }]} />
          </Specimen>
        </div>
      </Chapter>

      <Chapter n="06" id="nav" title="Navigation" intro="The week strip picks a day; the nav holds the five tabs with Geo raised in the centre; the dock pins a screen's action above it.">
        <div className="grid gap-8 grid-cols-[repeat(auto-fill,minmax(min(100%,390px),1fr))]">
          <Specimen name="Week strip" file="components/ui/fiqr/week-strip.tsx" use="Food and Train: Monday first, the selected day in navy">
            <WeekStrip selected={day} today={today} onSelect={setDay} />
          </Specimen>
          <Specimen name="Nav bar" file="components/layout/tab-bar.tsx" use="Every tab root" height={120} fixedInside>
            <TabBar />
          </Specimen>
          <Specimen name="Dock" file="components/plans/spatial-parts.tsx · Dock" use="A screen's action kept in view above the nav (Check-in, plan builder)" height={250} fixedInside>
            <div className="h-full" />
            <Dock>
              <button type="button" className={INK_BUTTON}>Keep current targets</button>
              <TextButton onClick={noop}>Ask Geo about this</TextButton>
            </Dock>
            <TabBar />
          </Specimen>
        </div>
      </Chapter>

      <Chapter n="07" id="chat" title="Chat" intro="Geo writes on the page; you write in navy.">
        <Specimen name="Messages" file="components/chat/chat-bubble.tsx" use="Geo tab, a conversation">
          <div className="flex flex-col gap-3">
            <ChatBubble message={{ role: 'user', content: 'Had a flat white and a banana' }} showTime={false} />
            <ChatBubble message={{ role: 'assistant', content: 'Logged both to breakfast: 215 kcal, 9 g protein. You have 156 g protein left today.' }} clusterStart showTime={false} />
          </div>
        </Specimen>
        <Specimen name="Grouped list" file="components/ui/fiqr/grouped-list.tsx" use="Settings, and any list of rows in one tile">
          <GroupedList title="Account" footer="Changes save as you go.">
            <GroupedRow label="Name" value="George" />
            <GroupedRow label="Units" value="Metric" onClick={noop} />
          </GroupedList>
        </Specimen>
        <p className="text-[14px] text-ink-65">Retired on 2 Nov: {RETIRED}</p>
      </Chapter>
    </LabShell>
  )
}
