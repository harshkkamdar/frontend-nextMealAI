'use client'

import type { ReactNode } from 'react'
import { Chapter, LabShell } from '../_parts'

type Item = [title: string, line: ReactNode]

/** One list of changes: a title and one plain sentence each. */
function Changes({ items }: { items: Item[] }) {
  return (
    <ul className="overflow-hidden rounded-[16px] border border-ink-12 bg-card">
      {items.map(([title, line]) => (
        <li key={title} className="border-b border-ink-09 px-5 py-4 last:border-b-0">
          <span className="block text-[16px] font-semibold leading-[1.35]">{title}</span>
          <span className="mt-1 block max-w-[70ch] text-[15px] leading-[1.5] text-ink-65">{line}</span>
        </li>
      ))}
    </ul>
  )
}

const Sub = ({ children }: { children: ReactNode }) => <h3 className="mb-3 mt-10 text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62 first:mt-0">{children}</h3>

const KNOWS: Item[] = [
  ['Geo knows your day before you ask', 'Geo sees today\'s food against your targets, today\'s planned workout and your top sets from the last three sessions, so "what\'s my workout today?" and "how much protein is left?" get an answer straight away.'],
  ['Progression from your real numbers', 'When Geo suggests a lift, it starts from your last top set, adds 2.5 kg or a rep, and tells you which session it is building on.'],
  ['Your last workout, by name', '"What was my last workout?" gets the session and what was in it: "Push on Thursday: bench, overhead press".'],
]

const LOGGING: Item[] = [
  ['Logs first, asks less', 'Geo logs what you tell it and offers Undo and Adjust buttons. If you list a meal without amounts, it logs typical portions and names them so you can correct them.'],
  ['Corrections that stick', '"It was 250 g", "make it 2 servings" and "move the eggs to lunch" change the entry you meant and rescale its calories.'],
  ['2 servings stays 2 servings', 'Servings and serving size are saved with each food, so a food you logged as 2 servings reopens as 2.'],
  ['Finds foods you have logged before', 'Loose names like "bega cheese" or "Nandos" find your earlier entries and reuse their numbers.'],
  ['Branded foods', 'When a product is not in the food database, Geo looks it up on the web itself and reads kcal or kJ correctly.'],
  ['Nutrition label photos', 'Photograph a label and say "add 50 g". Geo reads the per-100 g column, converts kJ to kcal and logs that amount.'],
  ['"Fill my remaining calories with X and Y"', 'Geo works out the grams for each food, shows the totals and logs them when you say so.'],
  ['Copying meals', 'Copying the same meal twice no longer duplicates it, and you can copy only some of a meal\'s items.'],
  ['Photo logs land in the right meal', 'A photo estimate files under the meal and day you picked.'],
  ['Allergies and diet style', 'An allergy saved as "None" no longer blocks foods like Danone, and Geo respects vegetarian, vegan and other diets when it logs or plans.'],
]

const PLANS: Item[] = [
  ['Better programs', 'New programs vary the exercises, set rep ranges by goal and rest by movement, and fit your equipment and injuries. Ask for "more exercises" and Geo picks them itself from the exercise library.'],
  ['See it before it replaces your plan', 'Ask to see a plan first and Geo makes a draft you can change. "Use this plan" switches over.'],
  ['Edits land where you mean', 'Plan edits understand "today", weekdays, rest days, plural names, changes across the whole program and reordering a day. Several days can change in one request.'],
  ['Editing keeps your place', 'Changing your program keeps you on the day you were on.'],
  ['Changes during a workout', 'Swap an exercise mid-session and Geo updates today\'s session and your program together.'],
]

const TRUST: Item[] = [
  ['Says "done" only when it is', 'If a change did not save, Geo says so and offers to try again.'],
  ['Calories always add up', 'Every calorie number Geo gives you is worked out from the protein, carbs and fat, so the totals match.'],
  ['Safe by design', 'Geo does not advise on medication or supplement doses, and does not set targets below 1,200 kcal for women or 1,500 kcal for men.'],
  ['Faster', 'Home loads three to four times faster, and Geo recovers on its own when a request fails. Geo also remembers your preferences between conversations and can read a workout program from a photo.'],
]

const LOOK: Item[] = [
  ['Your FIQR design', 'Every screen is rebuilt in navy, orange and cream, with Archivo, flat white cards and one orange action per screen.'],
  ['Five tabs', 'Home, Food, Geo, Train and Check-in, with Geo in the middle.'],
  ['Home, from your mock-up', 'Geo\'s line with a one-tap "Log it again", calorie and macro bars you can tap for a breakdown, the Log food button, your next workout with Resume, and Weight, Sleep, Steps and Water. A row appears when your check-in is due.'],
  ['Food', 'A week strip, the day\'s targets, your meals and a month view. Tap a food to change its amount or meal, delete it with Undo or copy it to another day.'],
  ['One "+" for everything', 'Photo, search, menu scan, water, weight, sleep, mood, energy and workouts from one menu, with your usual foods one tap away.'],
  ['Manual entry', 'Set any number of servings with a stepper or by typing. Numbers you edited stay when you change the amount, and "Create" appears when search finds nothing.'],
  ['Photo estimates you can adjust', 'Type the grams, edit each item\'s numbers and add a note for Geo before logging.'],
  ['Screens update by themselves', 'After you log something, Food, Home and Check-in refresh on their own.'],
  ['Train', 'Next up, this week, your program, a history calendar and weekly volume. A live workout shows one exercise at a time with last time\'s numbers, a muscle diagram and a rest timer, and ends with a summary against last time.'],
  ['Check-in', 'Its own tab: your week, weight trend, averages and Geo\'s read, then proposed targets you can preview and apply or keep. You choose your check-in day.'],
  ['Talking to Geo', 'The Geo tab lists your conversations, which you can rename or delete. Replies carry buttons such as Undo, Adjust and Use this plan.'],
  ['Plans, onboarding and settings', 'A plan builder and "Ask Geo for a plan", welcome screens with one question per screen, and settings for coaching style, reminders, rest timer, health sync, data download and account deletion.'],
]

const FEEDBACK: [string, 'Fixed' | 'Improved', string][] = [
  ['Workouts feel basic and repetitive', 'Improved', 'Geo now programs by goal, progresses from your last sessions and picks from the exercise library. Ask it for a new program and tell us what you think.'],
  ['Photo estimates cannot be adjusted', 'Fixed', 'You can type the grams and edit each item\'s numbers, and the totals follow.'],
  ['A Geo-like flow, not a standalone estimator', 'Improved', 'A note field and "Ask Geo with this photo" hand the photo to Geo. The standalone estimator is still there for now.'],
  ['The estimator puts food in the wrong meal', 'Fixed', 'The meal and day you choose are saved with the log.'],
  ['Editing the program resets the days', 'Fixed', 'You stay on the day you were on.'],
  ['Manual input is not ideal', 'Improved', 'A servings stepper, edited numbers that stay put, and "Create" when search finds nothing.'],
  ['Editing the diary; a food should open its own page', 'Improved', 'One tap opens the food\'s editor, as a sheet over the diary.'],
  ['2 servings are logged as 1', 'Fixed', 'Servings are saved and reopen correctly.'],
  ['The problems found in real Geo conversations', 'Fixed', 'All 13 are fixed, from Geo saying "done" when nothing saved to plans failing to build and meals copied twice.'],
]

const MOVED: [string, string][] = [
  ['Tabs', 'Home, Food, Geo, Train and Check-in. "More" is gone: Settings is behind the person button on Home, and Plans, the activity log and the food database are in Settings.'],
  ['The Geo button', 'The centre button opens your conversations with Geo. "Ask Geo" buttons on each screen open a quick chat.'],
  ['Removed', 'Dark mode and the theme choice, and the Language, Share progress and Analytics settings.'],
  ['Home', 'The weight chart moved to Check-in. Steps come from the phone app, so the Steps tile is empty on the web.'],
  ['Consent', 'Existing users see a one-time consent screen.'],
]

const PHONE: Item[] = [
  ['iPhone and Android', 'FIQR is packaged as an iPhone and Android app, with its own icon and launch screen.'],
  ['Works offline', 'Logs are kept on the phone and sent when you are back online, and a notice shows while you are offline.'],
  ['Apple Health and Health Connect', 'Steps, energy, weight, sleep and workouts come in from the phone, and finished workouts go back to it.'],
  ['Reminders', 'Check-in and logging reminders, set in Settings.'],
  ['FIQR Plus', 'A subscription screen with monthly and yearly plans, ready to connect to the App Store and Google Play.'],
]

export default function UpdatesPage() {
  return (
    <LabShell
      eyebrow="FIQR update"
      title="What's new in FIQR."
      lede={<>Everything that has changed since the version you are using now. Geo&apos;s improvements are already live in your app. The new design is on this link, and you can sign in with your usual account.</>}
    >
      <a href="/login" className="mb-2 inline-flex h-12 items-center gap-2 rounded-[15px] bg-ink px-5 text-[16px] font-semibold text-cream active:opacity-80">Open the new app <span aria-hidden="true">→</span></a>

      <Chapter n="00" id="glance" title="At a glance">
        <ul className="grid max-w-[72ch] list-disc gap-3 pl-5 text-[16px] leading-[1.5]">
          <li>Geo knows your day, logs first, corrects the right entry, builds better programs and only says &quot;done&quot; when something saved.</li>
          <li>Every screen is rebuilt on your FIQR design and your Home and Check-in mock-ups.</li>
          <li>Of your 8 feedback points, 4 are fixed and 4 are improved. All 13 problems we found in real Geo conversations are fixed.</li>
          <li>We test Geo against 26 real situations from your feedback, from logging 2 servings to reading a label in kJ, and it passes all 26.</li>
        </ul>
      </Chapter>

      <Chapter n="01" id="geo" title="Geo, the coach" intro="Already live in the app you use today.">
        <Sub>Knows your day</Sub><Changes items={KNOWS} />
        <Sub>Logging</Sub><Changes items={LOGGING} />
        <Sub>Plans and workouts</Sub><Changes items={PLANS} />
        <Sub>Honest, safe, fast</Sub><Changes items={TRUST} />
      </Chapter>

      <Chapter n="02" id="feedback" title="Your feedback, point by point">
        <ul className="overflow-hidden rounded-[16px] border border-ink-12 bg-card">
          {FEEDBACK.map(([what, status, note]) => (
            <li key={what} className="grid gap-x-6 gap-y-1 border-b border-ink-09 px-5 py-4 last:border-b-0 grid-cols-[minmax(0,1fr)_auto]">
              <span className="text-[16px] font-semibold leading-[1.35]">{what}</span>
              <span className={status === 'Fixed' ? 'h-7 rounded-full bg-ink px-3 text-[13px] font-semibold leading-7 text-cream' : 'h-7 rounded-full border border-ink-16 px-3 text-[13px] font-semibold leading-[26px] text-ink'}>{status}</span>
              <span className="col-span-2 max-w-[70ch] text-[15px] leading-[1.5] text-ink-65">{note}</span>
            </li>
          ))}
        </ul>
      </Chapter>

      <Chapter n="03" id="design" title="The new design" intro="On this link, with your own account and data.">
        <Changes items={LOOK} />
      </Chapter>

      <Chapter n="04" id="moved" title="What moved">
        <ul className="overflow-hidden rounded-[16px] border border-ink-12 bg-card">
          {MOVED.map(([what, line]) => (
            <li key={what} className="border-b border-ink-09 px-5 py-4 last:border-b-0">
              <span className="block text-[16px] font-semibold">{what}</span>
              <span className="mt-1 block max-w-[70ch] text-[15px] leading-[1.5] text-ink-65">{line}</span>
            </li>
          ))}
        </ul>
      </Chapter>

      <Chapter n="05" id="phone" title="The phone app">
        <Changes items={PHONE} />
      </Chapter>

      <Chapter n="06" id="next" title="What we need from you">
        <ol className="grid max-w-[72ch] list-decimal gap-3 pl-5 text-[16px] leading-[1.5]">
          <li><a href="/login" className="font-semibold underline decoration-ink-35 underline-offset-4">Open the new app</a> and sign in with your own account: log a few meals, ask Geo something, open a workout.</li>
          <li>Ask Geo for a new program and tell us what you think of it.</li>
          <li>Send anything that feels off, with a screenshot if you can.</li>
        </ol>
      </Chapter>
    </LabShell>
  )
}
