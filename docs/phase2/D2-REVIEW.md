# FIQR redesign (D2): review pack

23 October 2026. Branch `phase2/fiqr`, not yet deployed.

This pack shows every screen in the SOW D2 list before and after a craft pass, and lists the questions we need you to answer. Nothing here changes what a screen does or what data it shows. The pass covers layout, hierarchy, text sizes, touch targets, contrast, copy and the error, loading, empty, offline and long-content states.

## How to read the screenshots

- **Before**: `docs/phase2/screens/baseline/`
- **After**: `docs/phase2/screens/after/`
- **Side-by-side sheets**: `docs/phase2/screens/after/compare-*.png`

Files are named `<screen id>-<screen>-<state>-<width>.png`. Each screen was captured at two phone widths, 390 and 360 points, and in up to six states:

- **default**: your test account's real data
- **empty**: no data at all
- **loading**: data still on its way
- **error**: the server failed
- **offline**: the phone lost its connection
- **long**: very long food and plan names

The empty, error and long captures were made by changing the data the app received. Your account was never written to.

Home, Food diary and a live workout were also checked on the iPhone 16 Pro simulator, in `after/ios-sim/`.

## What changed on every screen

- **Readable secondary text.** The light grey text (dates, units, captions, the tab labels) was below the accessibility contrast minimum. It is now one step darker everywhere. Automated accessibility checks went from serious problems on 300 of 350 captures to none.
- **Orange used only for the action.** Orange text on cream is too faint to read at small sizes. The "2600 cal left" style highlights are now navy with an orange underline. Links are navy and underlined. Selected chips are navy instead of orange, so each screen has one orange button.
- **Bigger touch targets.** Chips, steppers, the "..." menus, the set ticks in a workout and the back buttons are at least 44 points, Apple's minimum.
- **One header.** Every inner screen uses the same left-aligned title with a back arrow. The manual logs no longer centre their title.
- **Errors look like errors.** Before, a failed load often looked like an empty account: "No program yet", "No logs yet", zero targets, or a blank page. A small number of messages read "[object Object]". Every screen now says what went wrong in Geo's voice and offers Try again.
- **Neutral notifications.** The pop-up messages were red, green and pink, which are outside the FIQR colours. They are now navy on white.
- **Reduced motion.** If the phone is set to reduce motion, looping animations stop.

## Screen by screen

| Screen | What we changed |
|---|---|
| Home | A failed load shows Geo's message and Try again, not zero bars. Long workout names wrap to two lines. The last row scrolls clear of the Geo button. |
| Check-in (due, mid-week, not enough data) | Same error treatment, with the header kept. The "Sess." tile now reads "Train". "0 weeks" no longer shows before there is a trend. |
| Food diary | The title reads "Friday 23". The "..." menus and "+ Add" are full-size targets. A failed load is shown as an error. The Log food button sits on a cream band above the nav. |
| Log food: search, photo, menu | **Menu used to lose its prompt: it opened the chat list. It now opens a new Geo chat with "Scan this menu..." ready to send.** All chips are 44 points. A failed search or photo says so. Long photo-estimate names wrap instead of being cut off. |
| Weight, water, sleep, mood, energy | Left-aligned title. Scales show "-/10" with a label until you pick a number, and use bigger pills. |
| Log chooser | The filter chips no longer run under "Select". Dates read "Thu, 17 Sept". A failed load is an error, not "No logs yet". |
| Food database | A failed load is an error, not "No saved foods yet". The star and "..." are full-size. The search placeholder is shorter so it fits on small phones. |
| Train | The "Resume · Push" strip repeated the Resume Workout button below it and is gone. "1 exercises" is fixed. A failed load is shown as an error. |
| Live workout | If the workout fails to load, the screen stays with Try again. It used to go back to a blank page. The set ticks and the top buttons are full-size. Finish workout shows on the last exercise. |
| Plans: list, detail, builders | Shared header. Errors keep a way back. Dates fit two to a row on small phones. "Rest day" and "Set as active plan" are full-size rows. Save is centred. |
| Geo chat and companion sheet | Chat rows are proper buttons with full-size menus. The sheet shows "Offline" when you are offline. It used to always say "Online", with a teal dot, and teal is reserved for carbs. The send button is full-size. |
| Onboarding and consent | Chips and checkboxes are full-size. The step dots are navy. The review says "3-day program" and only mentions the cycle when there are rest days. |
| Login, sign-up, password reset | Errors read as plain messages. An expired reset link offers a full "Request a new link" button. |
| Settings, Profile | Settings errors offer Try again. Selected chips are navy. The reminder time is labelled for screen readers. **Profile was the weakest screen and was rebuilt as the pattern for every form.** It has one suggested-targets sentence instead of a pink chip and a paragraph of small print, navy chips, units inside the fields, and a single orange Save that stays in reach. |
| Privacy, support, account deletion | Links are navy and underlined. The deletion button label is centred. |

## Questions for you

1. **Original mock-ups.** Please send the source files for Home (6a) and Check-in (7a to 7c). We compared against Home and Check-in as built, because the files are not with us.
2. **Orange highlights in text.** Orange text fails the readability minimum at body size. We changed highlights like "2600 cal" and "2600 left" to navy with an orange underline. Are you happy with that, or would you rather keep orange text and accept the lower contrast?
3. **Main button text size.** Cream text on orange only passes the readability minimum at large sizes, so the main button text went from 17 to 19 points. Is that acceptable on Home and Check-in?
4. **Fitness onboarding length.** The fitness step asks about 25 choices on one screen. Should we split it into two steps (equipment and injuries, then activity, experience and goal)?
5. **Editing a plan that fails to load.** Today the app sends you back to Plans with a message. Would you rather stay on the edit screen with a Try again button?

## Known gaps

- Loading and offline states were checked by automated accessibility tests and by eye. The independent graders did not cover them.
