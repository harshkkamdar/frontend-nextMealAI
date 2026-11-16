'use client'

import { Fragment, type ReactNode } from 'react'
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

type Fix = [flagged: string, fix: string, proof: string]

/** What George flagged on the new design, newest round first: the fix and how it was checked. */
const ROUNDS: [round: string, fixes: Fix[]][] = [
  ['Round 5', [
    ['Geo refused to log "600g raw chicken breast" because the macros didn\'t match the calories', 'When Geo\'s numbers don\'t add up, it now works the food out again from its nutrition per 100 g and logs it, without stopping to ask you. If that fails too, it searches the web.', 'Your exact message, "600g raw chicken breast, 10ml olive oil lunch", now logs straight away: 622 kcal and 139 g protein for the chicken, with no warning.'],
    ['You had to ask Geo to use raw chicken numbers', 'A food you call raw, cooked or dry is checked against that state, and Geo\'s reply quotes the numbers that were saved.', 'The chicken now logs at 23 g protein per 100 g, the raw figure, instead of the cooked figure of 31 g that Geo used before.'],
    ['The olive oil was blocked as a duplicate, then logged twice', 'When Geo retries a meal, an item that already saved counts as logged. It is no longer blocked or added a second time.', 'In the same test the olive oil was logged once.'],
    ['The "Heads up" note repeated the same sentence three times', 'The note lists each problem once.', 'Your message no longer brings up the note at all.'],
  ]],
  ['Round 4', [
    ['Geo misreads kJ, or reads the per-100 g column', 'The kJ conversion was right. Your label photo was sideways and the rows got mixed up, with sugars read as carbs. Labels are now read by a stronger image model, the macros are checked against the energy on the label, and in chat the label\'s numbers replace Geo\'s own guess.', 'Your exact photo with "Salmon nigiri 6 pieces" now logs 320 kcal, 14.8 g protein, 48.1 g carbs and 6.3 g fat, as on the label.'],
    ['Geo said the swap didn\'t go through, but it did', 'Geo has a check that stops it claiming changes it didn\'t make. It didn\'t know about swaps, so it replaced Geo\'s correct reply. It now knows every change Geo can make.', 'In a live workout, Geo swapped the exercise and kept its "I\'ve swapped" reply.'],
    ['The swap search doesn\'t fit the page', 'The swap sheet opens full height, like the Log food search, and the results scroll inside it.', 'Checked at phone size with the screen cut to the height left when the keyboard is open.'],
    ['The menu prompt disappears when a photo is attached', '"Scan this menu…" stays in the box when you attach the photo. A photo sent without text now goes as "Here\'s the photo", so Geo scans the menu instead of answering "What is this?".', 'An automated test picks the menu prompt, attaches a photo and checks the prompt is still there and sent with it.'],
    ['The logo is inconsistent, and the orange part of the Q doesn\'t match the logo file', 'Every Q is now drawn from your logo file: in Geo, the tab bar, Check-in, the wordmark and the browser tab icon.', 'Every Q now comes from one shared drawing, built from the measurements in your logo file.'],
  ]],
  ['Round 3', [
    ['Check-in lost the weight progress chart, and Home needs positive reinforcement', 'The weight chart is back on Check-in and now on Home too: your start weight, every weigh-in, a dashed goal line and how much you\'ve lost, in green when you\'re heading to your goal.', 'Checked on the live app: the weight card shows on Home.'],
    ['Sleep logged days ago carries into the next days', 'The Sleep tile shows only a night logged today, so it resets each day.', 'An automated test checks that a night logged on an earlier day no longer shows today.'],
    ['Reps pre-fill to the bottom of the range when last time was outside it', 'Each set starts from last time\'s reps, even when they were outside the range.', 'An automated test: an 8–12 set with 15 reps last time starts at 15, not 8.'],
    ['The current set has too many numbers', 'Kg, reps and the tick sit side by side on one line.', '28.75 kg fits on that line on the narrowest iPhone.'],
    ['Train\'s "This week" doesn\'t move', 'The workout history didn\'t mark workouts as finished, so the week counted none. It now does.', 'Your 4 sessions that week now count, instead of 0 of 6.'],
    ['The Geo bubble is gone, and there\'s no way to swap an exercise mid-workout', 'Geo has a button in the workout\'s bottom bar, and each exercise has a Swap button that keeps your sets, reps and rest. Tapping Geo anywhere opens it over the screen you\'re on, like before.', 'Checked on the live app: Geo opens over Train.'],
    ['Meals show calories only', 'Each meal header shows protein, carbs and fat next to the calories, like "622 kcal · 25.7 P · 118.9 C · 16 F".', 'An automated test checks every meal header shows all four.'],
    ['Copy should let me pick foods and plan ahead, and it left foods off', '"Copy foods" on any meal: tick the foods you want, then pick any day in the next week and any meal. Foods with a zero macro, like mince with no carbs, were being dropped; they now copy.', 'A snack with 3 identical kiwis copied with all 4 foods.'],
    ['72.75 kg shows as 72.8', 'It was saved as 72.75; only the display rounded. Weights now show two decimals everywhere.', 'An automated test checks the weight chart keeps 72.75.'],
    ['An iced long black was refused for having no macros', 'Zero-calorie drinks only matched a short list. Long black, tea, Coke Zero and the like now log.', '"Add iced long black for breakfast" logged through Geo.'],
  ]],
  ['Round 2', [
    ['Adjust guessed "2 servings"', 'Adjust now asks what to change it to (half a serving, 2 servings or a different amount) and changes nothing until you choose.', 'It is one of the 31 Geo test cases, and all 31 pass.'],
    ['28.75 kg shows as 28.8 in the live workout', 'The live workout keeps two decimals, and the +2.5 kg button keeps them too.', 'An automated test checks 28.75 shows as 28.75 and steps up to 31.25.'],
    ['Previous and Next float over the sets', 'They sit in a solid bar docked to the bottom of the screen.', 'Checked in a live workout at phone size.'],
    ['Settings says "Couldn\'t save that" for push notifications', 'A bug on our side: every Settings change failed once your settings had been saved the first time. Notifications come through the phone app, not the web link.', 'Confirmed on the live app: Settings changes save.'],
    ['iPhone zooms in on the grams field and stays zoomed', 'iPhone zooms into small text boxes when you tap them. The app now tells it not to, and you can still pinch to zoom.', 'The setting is on every page of the live app.'],
  ]],
  ['Round 1', [
    ['Rep-range fields can\'t be typed in, and + or − shows "NaN"', 'Kg and reps can be typed, and a rep range records the one number you hit.', 'An automated test reads ranges like 8–12 and records one number for each set.'],
    ['Label photos in Log food don\'t work properly, and should work like the chat', 'Four faults, all fixed: chat photos had stopped working, two-column labels read the per-100 g column as the serving (a 192 kcal serving showed as 77), some label layouts lost their calories, and non-food items were added at 0 kcal.', 'A photo check sends 5 real photos, 2 labels and 3 plates, through Log food and chat on every test run, and passes 23 of 23.'],
    ['No real way to interact with the Check-in page', 'Opening the review used up your check-in, so it vanished as soon as you looked; now only Apply or Keep records it. "Check in now" works on any day, every day and tile opens a breakdown, and "Ask Geo about my week" talks it through.', 'Checked on the live app with a test account.'],
  ]],
]

/** One round's fixes: what was flagged, then the fix and its proof. */
function Fixes({ fixes }: { fixes: Fix[] }) {
  return (
    <ul className="overflow-hidden rounded-[16px] border border-ink-12 bg-card">
      {fixes.map(([flagged, fix, proof]) => (
        <li key={flagged} className="border-b border-ink-09 px-5 py-4 last:border-b-0">
          <span className="block text-[16px] font-semibold leading-[1.35]">{flagged}</span>
          <span className="mt-1 block max-w-[70ch] text-[15px] leading-[1.5] text-ink-65"><b className="font-semibold text-ink">Fix.</b> {fix}</span>
          <span className="mt-1 block max-w-[70ch] text-[15px] leading-[1.5] text-ink-65"><b className="font-semibold text-ink">Proof.</b> {proof}</span>
        </li>
      ))}
    </ul>
  )
}

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

      <Chapter n="New" id="latest" title="Your feedback on the new design" intro="Newest first: what you flagged, what we changed and how we checked it.">
        {ROUNDS.map(([round, fixes]) => <Fragment key={round}><Sub>{round}</Sub><Fixes fixes={fixes} /></Fragment>)}
      </Chapter>

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
