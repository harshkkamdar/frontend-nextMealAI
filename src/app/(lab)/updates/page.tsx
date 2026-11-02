'use client'

import type { ReactNode } from 'react'
import { Chapter, LabShell } from '../_parts'
import { FINALISTS, Mascot } from '../mascot/characters'

type Item = [title: string, line: ReactNode, date: string]

/** One list of changes: a title, one plain sentence, the date it landed. */
function Changes({ items }: { items: Item[] }) {
  return (
    <ul className="overflow-hidden rounded-[16px] border border-ink-12 bg-card">
      {items.map(([title, line, date]) => (
        <li key={title} className="grid gap-x-6 gap-y-1 border-b border-ink-09 px-5 py-4 last:border-b-0 grid-cols-[minmax(0,1fr)_auto]">
          <span className="text-[16px] font-semibold leading-[1.35]">{title}</span>
          <span className="text-[13px] font-medium tabular-nums text-ink-62">{date}</span>
          <span className="col-span-2 max-w-[70ch] text-[15px] leading-[1.5] text-ink-65">{line}</span>
        </li>
      ))}
    </ul>
  )
}

const Sub = ({ children }: { children: ReactNode }) => <h3 className="mb-3 mt-10 text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62 first:mt-0">{children}</h3>

const KNOWS: Item[] = [
  ['Geo knows your day before you ask', 'Every message now carries today\'s food against your targets, today\'s planned workout and the top sets from your last three sessions. "What\'s my workout today?" and "how much protein is left?" are answered straight away.', '2 Nov'],
  ['Progression from your real numbers', 'When Geo suggests a lift it starts from your last top set and adds 2.5 kg (or a rep), and it says which session it is building on.', '2 Nov'],
  ['"What was my last workout?"', 'Geo names the session and what was in it ("Push on 23 Oct: bench, overhead press"), not just a date.', '2 Nov'],
]

const LOGGING: Item[] = [
  ['Logs first, asks less', 'Geo logs what you tell it and offers Undo and Adjust buttons instead of asking questions. If you list a meal without amounts it logs typical portions and tells you which, so you can correct them.', '20 Oct · 2 Nov'],
  ['Corrections that stick', '"It was 250 g", "make it 2 servings" and "move the eggs to lunch" now change the entry you meant and rescale its calories, instead of adding a second one.', '20 Oct · 2 Nov'],
  ['2 servings is 2 servings', 'Servings and serving size are saved with each food, so 2 servings reopens as 2. (Entries logged before the fix still open as 1.)', '2 Nov'],
  ['Finds the foods you have logged before', 'Loose names like "bega cheese" or "Nandos" find your earlier entries and reuse their numbers.', '20 Oct'],
  ['Branded foods without asking', 'When a product is not in the food database Geo searches the web for it by itself, and reads energy correctly whether the label says kcal or kJ.', '20 Oct'],
  ['Nutrition label photos', 'Photograph a label and say "add 50 g": Geo reads the per-100 g column, converts kJ to kcal and logs that amount. Labels with a per-serving column first were being read wrongly; that is fixed.', '20 Oct · 3 Nov'],
  ['"Fill my remaining calories with X and Y"', 'Geo works out the grams like a coach (the protein food covers the protein you still need, the other fills the calories), shows the totals and logs them when you say so.', '20 Oct · 2 Nov'],
  ['Copying meals', 'Copying the same meal twice no longer duplicates it, and you can copy only some of a meal\'s items.', '20 Oct'],
  ['Photo logs land in the right meal', 'A photo estimate files under the meal and day you picked, in your own timezone.', '2 Nov'],
  ['Allergies and diet style', 'An allergy saved as "None" no longer blocks foods like Danone, and Geo respects vegetarian, vegan and other styles when it logs or plans.', '20 Oct · 17 Sep'],
]

const PLANS: Item[] = [
  ['Better programs', 'New programs follow rules for exercise variety, rep ranges by goal, rest by movement, and your equipment and injuries. When you ask for "more exercises" Geo picks them itself; swaps come from the exercise library.', '2 Nov'],
  ['See it before it replaces your plan', 'Ask to see a plan first and Geo makes a draft you can change, then "Use this plan" switches over.', '20 Oct'],
  ['Edits that land where you mean', 'Plan edits understand "today", weekdays, rest days, plural names, changes across the whole program and reordering a day. Several days can change in one request.', '20 Oct'],
  ['Editing no longer resets your week', 'Changing your program keeps you on the day you were on instead of jumping back to Day 1.', '2 Nov'],
  ['Changes during a workout', 'Swapping an exercise mid-session updates today\'s session and your program together.', '20 Oct · 2 Nov'],
]

const TRUST: Item[] = [
  ['Never says "done" unless it saved', 'If a change did not save, Geo says so and offers to try again, instead of claiming success.', '20 Oct'],
  ['Calories always add up', 'Every calorie number Geo quotes is worked out from the protein, carbs and fat, so the totals match.', 'Aug'],
  ['Safe by design', 'Geo will not advise on medication or supplement doses and will not set targets below 1,200 kcal for women or 1,500 kcal for men.', '17 Sep'],
  ['Faster and steadier', 'The server moved next to the database (Home loads three to four times faster), Geo retries a failed call up to three times, and its instructions are half the size. Reading a workout program from a photo, and Geo remembering your preferences, work again.', '2 Nov'],
]

const LOOK: Item[] = [
  ['Your FIQR design system', 'Navy, orange and cream, one typeface (Archivo), flat white cards, one orange action per screen. Every screen was rebuilt on it.', '2 Nov'],
  ['Five tabs', 'Home, Food, Geo, Train and Check-in, with Geo in the middle.', '17 Sep · 2 Nov'],
  ['Home, from your mock-up', 'Geo\'s line with a one-tap "Log it again", calorie and macro bars you can tap for a breakdown, the Log food button, your next workout with Resume, and Weight, Sleep, Steps and Water tiles. A "check-in due" row appears when it is.', '2 Nov'],
  ['Food', 'A week strip, the day\'s targets, your meals and a month view. Tap a food to edit its amount and meal, delete it with Undo or copy it to another day.', '2 Nov'],
  ['One "+" for everything', 'Photo, search, menu scan, water, weight, sleep, mood, energy and workouts from one menu, with your usual foods one tap away.', '27 Oct'],
  ['Manual entry', 'Any number of servings with a stepper or typed, numbers you edited survive a change of amount, and "Create" appears when search finds nothing.', '2 Nov'],
  ['Photo estimates you can adjust', 'Type the grams, edit each item\'s numbers and add a note for Geo before logging.', '2 Nov'],
  ['Screens update by themselves', 'After you log something, Food, Home and Check-in refresh on their own.', '2 Nov'],
  ['Train', 'Next up, this week, your program, a history calendar and weekly volume. The live workout shows one exercise at a time with last time\'s numbers, a muscle diagram and a rest timer, and ends with a summary against last time.', '26–27 Oct'],
  ['Check-in', 'Its own tab: your week, weight trend, averages and Geo\'s read, then proposed targets you can preview and Apply or Keep. You choose your check-in day.', '2 Nov'],
  ['Talking to Geo', 'The Geo tab lists your conversations (rename or delete them). Failed messages show Retry, and replies carry buttons such as Undo, Adjust and Use this plan.', '27 Oct · 2 Nov'],
  ['Plans, onboarding and settings', 'A plan builder and "Ask Geo for a plan"; welcome screens and one question per onboarding screen; settings for coaching style, reminders, rest timer, health sync, data download, an AI switch and account deletion.', '17 Sep–27 Oct'],
]

const FEEDBACK: [string, 'Fixed' | 'Partly', string][] = [
  ['Workouts feel basic and repetitive', 'Partly', 'Geo now follows programming rules, progresses from your last sessions and picks from the exercise library. Whether the plans are good enough is your call: please try one.'],
  ['Photo estimates cannot be adjusted', 'Fixed', 'Grams are typed, each item\'s numbers are editable and the totals follow.'],
  ['A Geo-like flow, not a standalone estimator', 'Partly', 'A note field and "Ask Geo with this photo" hand the photo to Geo, but you still tap send, and the standalone estimator is still there.'],
  ['The estimator puts food in the wrong meal', 'Fixed', 'The meal and day you choose are saved with the log.'],
  ['Editing the program resets the days', 'Fixed', 'You stay on the day you were on.'],
  ['Manual input is not ideal', 'Partly', 'Servings stepper, edited numbers kept, Create on no match. Not yet a full redesign.'],
  ['Editing the diary is not friendly; a food should open its own page', 'Partly', 'One tap opens the editor, as a sheet rather than a full page.'],
  ['2 servings are logged as 1', 'Fixed', 'Servings are saved and reopen correctly.'],
  ['The 13 problems from October\'s review of 678 real conversations', 'Fixed', 'Saying "done" without saving, plan builds failing, no draft before replacing a plan, edits missing the live workout, partial multi-edits, names not resolved, program-wide edits, food search misses, past logs not found, label photos, asking instead of calculating, duplicate copies and the "None" allergy.'],
]

const MOVED: [string, string][] = [
  ['Tabs', 'Home, Food, Geo, Train, Check-in. "More" is gone: Settings is behind the person button on Home, and Plans, the activity log and the food database sit in Settings.'],
  ['The Geo button', 'The centre button opens your conversations with Geo. "Ask Geo" buttons on each screen open a quick chat.'],
  ['Removed', 'Dark mode and the theme choice, plus the Language, Share progress and Analytics settings.'],
  ['Home', 'The weight chart moved to Check-in. On the web the Steps tile shows no data: steps come from the phone app.'],
  ['Consent', 'Existing users see a one-time consent screen.'],
  ['Daily limit', 'Each person has a daily allowance of Geo messages, sized well above normal use.'],
]

const PHONE: Item[] = [
  ['iOS and Android apps', 'Both projects are set up with icon, splash and permission texts, and the app runs in the iPhone simulator. Not yet tested on a real phone.', '26 Oct'],
  ['Works offline', 'Logs are kept on the phone and sent when you are back online; recent screens are cached and a notice shows when you are offline.', '27 Oct'],
  ['Apple Health and Health Connect', 'Reads steps, energy, weight, sleep and workouts, and writes finished workouts. Needs testing on a phone.', '20 Oct'],
  ['Reminders and push', 'Written, not switched on yet: they need the phone apps installed and a notification service account.', 'Ready'],
  ['FIQR Plus', 'The paywall screen exists (monthly or yearly) but the store products are not set up, its text is placeholder and nothing is locked.', 'Ready'],
]

export default function UpdatesPage() {
  return (
    <LabShell
      eyebrow="Update · 3 Nov 2026"
      title="What's new in FIQR."
      lede={<>Everything since the version you are using now. <b className="font-semibold text-ink">Geo&apos;s improvements are already live in your app</b> (since 2 Nov). The new design is on this link: sign in with your usual account to try it. And Geo is getting a character, which we&apos;d like you to choose.</>}
    >
      <a href="/login" className="mb-2 inline-flex h-12 items-center gap-2 rounded-[15px] bg-ink px-5 text-[16px] font-semibold text-cream active:opacity-80">Open the new app <span aria-hidden="true">→</span></a>

      <Chapter n="00" id="glance" title="At a glance">
        <ul className="grid max-w-[72ch] gap-3 text-[16px] leading-[1.5]">
          <li><b className="font-semibold">Geo is smarter and more honest.</b> It knows your day, logs first, corrects the right entry, builds better programs and never says &quot;done&quot; unless it saved.</li>
          <li><b className="font-semibold">Every screen is new,</b> rebuilt on your FIQR design and your Home and Check-in mock-ups.</li>
          <li><b className="font-semibold">Your feedback:</b> 4 of your 8 points are fixed and 4 are partly there (details below). All 13 problems from October&apos;s conversation review are fixed.</li>
          <li><b className="font-semibold">Tested on 26 real situations</b> taken from your feedback, from logging 2 servings to a label photo in kJ. All 26 pass, and they run again on every change.</li>
          <li><b className="font-semibold">Pick a mascot:</b> four options for Geo&apos;s character, below.</li>
        </ul>
      </Chapter>

      <Chapter n="01" id="geo" title="Geo, the coach" intro="Live in your current app since 2 Nov.">
        <Sub>Knows your day</Sub><Changes items={KNOWS} />
        <Sub>Logging</Sub><Changes items={LOGGING} />
        <Sub>Plans and workouts</Sub><Changes items={PLANS} />
        <Sub>Honest, safe and fast</Sub><Changes items={TRUST} />
      </Chapter>

      <Chapter n="02" id="feedback" title="Your feedback, point by point" intro="Fixed means done and tested. Partly means improved but not yet what you asked for.">
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

      <Chapter n="03" id="design" title="The new design" intro="On this link. Everything you see here runs on your live account and data.">
        <Changes items={LOOK} />
      </Chapter>

      <Chapter n="04" id="mascot" title="Meet Geo: choose a character" intro="Geo is getting a character of its own. At rest it is just the character; a mouth and hands appear only when Geo is doing something. Four options, each with nine expressions.">
        <a href="/mascot" className="flex flex-wrap items-center gap-6 rounded-[20px] border border-ink-12 bg-card p-5 active:bg-ink-04">
          <span className="flex gap-4">{FINALISTS.map((id, i) => (
            <span key={id} className="flex flex-col items-center gap-1"><Mascot id={id} mood="rest" scheme="navy" size={72} /><span className="text-[13px] font-semibold tabular-nums text-ink-62">{i + 1}</span></span>
          ))}</span>
          <span className="min-w-[200px] flex-1">
            <span className="block text-[17px] font-semibold">Roo, Bear, Coach or Kettlebell?</span>
            <span className="block text-[14.5px] text-ink-65">See them large, small and in every expression, then tell us your favourite by number.</span>
          </span>
          <span aria-hidden="true" className="text-[19px] text-ink-50">→</span>
        </a>
      </Chapter>

      <Chapter n="05" id="moved" title="What moved or changed" intro="Things that work differently from the version you know.">
        <ul className="overflow-hidden rounded-[16px] border border-ink-12 bg-card">
          {MOVED.map(([what, line]) => (
            <li key={what} className="border-b border-ink-09 px-5 py-4 last:border-b-0">
              <span className="block text-[16px] font-semibold">{what}</span>
              <span className="mt-1 block max-w-[70ch] text-[15px] leading-[1.5] text-ink-65">{line}</span>
            </li>
          ))}
        </ul>
      </Chapter>

      <Chapter n="06" id="phone" title="The phone app" intro="Built and waiting for real-phone testing and the store setup.">
        <Changes items={PHONE} />
      </Chapter>

      <Chapter n="07" id="next" title="What we need from you">
        <ol className="grid max-w-[72ch] list-decimal gap-3 pl-5 text-[16px] leading-[1.5]">
          <li>Pick Geo&apos;s character on the <a href="/mascot" className="font-semibold underline decoration-ink-35 underline-offset-4">Mascot page</a>, by number.</li>
          <li><a href="/login" className="font-semibold underline decoration-ink-35 underline-offset-4">Open the new app</a> and sign in with your own account: log a few meals, ask Geo something, open a workout.</li>
          <li>Ask Geo for a new program and tell us whether it is good enough.</li>
          <li>Send anything that feels off, with a screenshot if you can.</li>
        </ol>
      </Chapter>
    </LabShell>
  )
}
