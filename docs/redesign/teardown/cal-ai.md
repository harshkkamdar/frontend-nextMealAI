# Cal AI onboarding teardown

Source: 38 iPhone screenshots, `IMG_6818.PNG` to `IMG_6855.PNG` (1320x2868 px, 440x956 pt at @3x). All measurements below are estimates in iOS points (px / 3), read off the captures. Captured 2026-10-24.

Cal AI palette, for reference only (FIQR must not copy it): near-black ink (about #1C1B22), white, cool light grey surfaces (about #F5F5F8), a muted tan-orange accent (about #D9915F) for "Recommended" and highlighted numbers, green for positive calorie deltas.

## Shared chrome (applies to almost every question screen)

- Status bar, then a header row at about y 92 pt: circular back button (40 pt diameter, pale grey fill, 1.5 pt arrow glyph, left edge at 19 pt), and a progress bar from x 84 to x 408 pt, about 2.5 pt tall, ink fill on a light grey track, square ends. No step count, no labels.
- Title: left aligned at 24 pt gutter, about 32-34 pt, bold, tight leading (line height about 38 pt), 1-3 lines, starts about y 125 pt.
- Subtitle (optional): about 15-16 pt regular, mid grey, 1-2 lines, 8 pt below title. Always a "why we ask" line.
- Options: vertically centred in the remaining space (not top aligned) on short lists; top aligned on long lists.
- Option card: 24 pt side gutter (390 pt wide), 62 pt tall single-line or 87 pt two-line, 12 pt gap, about 14 pt radius, hairline (1 pt) light grey border on white. Left: 40 pt pale grey circle with a 20 pt glyph. Label 17 pt medium at x 92 pt. Right: 23 pt radio.
- Selected card: 1.5-2 pt ink border, filled ink radio with a white centre dot. No fill change, no scale change.
- Footer: fixed. A white-to-light-grey gradient fade from about y 650 pt, a hairline divider at about y 832 pt, then the CTA.
- CTA: full-width pill 408 x 57 pt (16 pt side gutter, narrower gutter than content), ink fill, white 17-18 pt medium label "Continue", centred at y 877 pt. Disabled state: mid grey fill, light grey label.

---

### IMG_6818 - Sex

- What it shows: personal data. "Choose your sex" / "This helps personalize your experience." Single select, 3 cards (Male, Female, Other) with gender glyphs. Layout: back + progress (about 3 percent filled) / title / subtitle / large white gap / 3 cards centred around y 430-600 pt / fixed Continue.
- Notable craft: Male shown selected (ink border, filled radio). Cards 62 pt, 12 pt apart. Title one line, 33 pt bold. Subtitle 15 pt grey. Lots of empty space keeps the screen calm.
- Why it works: opens with the easiest possible tap, a low-effort first commitment that starts momentum (foot-in-the-door). One question per screen, zero reading.
- FIQR verdict: ADOPT for Personal - `sex`. Do not preselect any option (keep CTA disabled until a choice) since sex is sensitive; the selected state may be preselected here only because the user tapped. Map selected border to ink navy, CTA to orange.

### IMG_6819 - Workouts per week

- What it shows: "How many workouts do you do per week?" / "This will be used to calibrate your custom plan." Single select, 3 two-line cards: 0-2 "Workouts now and then", 3-5 "A few workouts per week", 6+ "Dedicated athlete". Icons are 1, 3, 6 dots, a quantity metaphor.
- Notable craft: two-line card 87 pt tall: value 17 pt medium, descriptor 14 pt grey. Middle option selected. Title wraps to two lines at 33 pt bold. Progress about 6 percent.
- Why it works: bucketed ranges remove precision anxiety, and the descriptor gives identity labels ("Dedicated athlete") that feel flattering. Dot-count icons read instantly.
- FIQR verdict: ADOPT for Fitness - `workout_frequency`. Use FIQR's existing frequency enum as buckets with a short descriptor line each. Dot-count icon idea is cheap to draw in ink navy.

### IMG_6820 - Date of birth

- What it shows: "When were you born?" / "This will be taken into account when calculating your daily nutrition goals." Three-column wheel picker (month, day, year), selection band in a pale grey 41 pt pill, default December 8 2003.
- Notable craft: wheel is centred vertically around y 520 pt; rows fade and compress toward edges (native UIDatePicker wheel style). Subtitle explains the calculation use.
- Why it works: wheel is fast for a date that is near a sensible default; the "why" line pre-empts the privacy objection.
- FIQR verdict: ADAPT for Personal - `dob` (YYYY-MM-DD). In Capacitor WebView use native `<input type="date">`, which renders the iOS wheel on iOS and a native dialog on Android, instead of a hand-built wheel. Default to an adult year, not today.

### IMG_6821 - Acquisition source

- What it shows: "Where did you hear about us?" Single select list of 9+ cards with brand logos (App Store, Google, Youtube, TikTok, X, Facebook, Instagram, Friend or family, more below the fold). No subtitle. CTA disabled (grey) until a selection.
- Notable craft: list is top aligned and scrolls under the footer fade. Full-colour third-party logos inside the 40 pt icon circles. Disabled CTA uses grey fill 40 percent label.
- Why it works: for Cal AI it is attribution data for marketing. For the user it is pure friction at question 4, but it is cheap (one tap).
- FIQR verdict: REJECT. Not data we need for coaching, and third-party brand logos break the colour constraint. If marketing wants it, put it after the plan reveal as an optional single tap. The disabled-CTA-until-answered pattern itself is ADOPT.

### IMG_6822 - Tried other apps

- What it shows: "Have you tried other calorie tracking apps?" Yes / No cards with thumbs up / thumbs down glyphs. Yes selected.
- Notable craft: only 2 cards, vertically centred, so the screen is mostly white space. No subtitle.
- Why it works: segmentation for later copy (switchers vs first-timers); also a micro-commitment. Little user value.
- FIQR verdict: REJECT. Not in our data model and Geo does not use it. Every question must feed the plan or Geo.

### IMG_6823 - Value interstitial: weight trend chart

- What it shows: "Designed to help you stay on track". A light grey card (about 340 x 300 pt, 20 pt radius) with "Weight trend" chart: Cal AI line (ink) falls from Month 1 to Month 6; red "Without a plan" line dips then rebounds above start. Caption "Track your habits and stay consistent over time." Continue.
- Notable craft: chart uses one hero line plus a ghost comparison in red with a soft red fill; hollow ring end markers; small "Cal AI" wordmark pill on the line. No question, no input.
- Why it works: breaks the questionnaire rhythm with a payoff and frames the product against a fear (rebound). The comparison data is illustrative, not sourced.
- FIQR verdict: ADAPT as a Geo interstitial after the goal step, but with honest content (for example Geo explaining how weekly check-ins adjust the plan). REJECT the unsourced "without a plan" curve; it is an implied claim we cannot back. Use ink navy line on cream card, no red.

### IMG_6824 - Height

- What it shows: "What is your height?" / calculation "why" line. Segmented control "ft, in" | "cm" (200 x 32 pt, pill, selected segment white on grey track). Two-column wheel: ft, in. Default 5 ft 6 in.
- Notable craft: unit toggle centred above the picker; wheel selection band same as DOB, giving consistent picker language.
- Why it works: unit choice before value avoids conversion errors; defaults to an average so most users scroll a little.
- FIQR verdict: ADAPT. FIQR already asks height (`height_cm`, Personal step, `personal-form.tsx`); give it its own screen. Use a unit toggle plus numeric input with stepper rather than a custom wheel.

### IMG_6825 - Current weight

- What it shows: "What is your weight?" / why line. Unit toggle lbs | kg (kg selected). Label "Current weight" (15 pt grey), value "60 kg" (about 29 pt bold), then a horizontal ruler slider spanning edge to edge: long tick every 5, short ticks between, a taller ink centre indicator.
- Notable craft: ruler bleeds off both screen edges (implies infinite scroll). Value updates live above the needle. Haptic ticks implied per step.
- Why it works: a ruler feels physical and playful and makes a sensitive number feel less like a form field.
- FIQR verdict: ADAPT for Nutrition - `weight_kg`. Build as a horizontal scroll-snap ruler in ink navy on cream, but pair it with a tappable value that opens a numeric keypad for accessibility and precision. Use Capacitor Haptics for tick feedback if already installed; otherwise skip.

### IMG_6826 - Working with a professional

- What it shows: "Do you currently work with a personal trainer or registered dietitian?" Yes / No cards, Yes selected. Three-line title.
- Notable craft: identical to IMG_6822 template.
- Why it works: segmentation (and possibly a liability or upsell signal). Weak user value.
- FIQR verdict: REJECT as a standalone screen. Not a FIQR field. If clinical safety matters, it belongs inside the injuries step as a note, not its own question.

### IMG_6827 - Goal

- What it shows: "What is your goal?" / "This helps us generate a plan for your calorie intake." 3 cards: Lose weight (down arrow), Maintain (dash), Gain weight (up arrow). Lose weight selected.
- Notable craft: directional glyphs carry the meaning so labels can be 2 words. Cards centred vertically.
- Why it works: the single most important input, asked plainly, with symmetric options.
- FIQR verdict: ADOPT for Fitness - `primary_goal`. Move it early (it is the anchor for target weight, pace and Geo's framing). Use FIQR's existing goal enum; keep a directional or simple glyph per option.

### IMG_6828 - Desired weight

- What it shows: "What is your desired weight?" Label echoes the chosen goal ("Lose weight", 15 pt), value "55.0 kg" (about 31 pt bold), same ruler; the span between current and target weight is shaded grey to the right of the needle.
- Notable craft: the shaded delta visualises the distance to the goal in place. No unit toggle (inherits from the previous screen). One decimal place.
- Why it works: echoing the previous answer proves the app is listening; the shaded gap makes the goal tangible.
- FIQR verdict: ADOPT for Nutrition - `target_weight_kg`. Shade the delta in a cream-on-navy tint (no new colours). Skip this screen when goal is maintain. Validate a safe range client side.

### IMG_6829 - Reflection interstitial: "Losing 5 kg starts with a plan!"

- What it shows: no input. Centred headline "Losing **5 kg** starts with a plan!" (about 31 pt bold, the number in tan-orange), body "To help you make steady progress we'll create a personalized plan based on your habits, goals, and timeline." (17 pt grey, centred). Continue.
- Notable craft: first centred layout in the flow, which signals "this is a moment, not a question". The user's own number is the hero.
- Why it works: personalisation reveal; reflecting the user's numbers back builds trust and investment before more questions.
- FIQR verdict: ADAPT as a Geo comment after target weight: "5 kg is very doable. I'll build your plan around it." Emphasise the number with ink weight, not orange, to keep orange reserved for the single primary action.

### IMG_6830 - Pace slider (frame 1)

- What it shows: "How fast do you want to reach your goal?" Label "Weight loss speed per week", value "0.5 kg" (about 31 pt bold). Three animal illustrations: sloth "Slow", rabbit "Recommended" (tan-orange, active), panther "Fast". A continuous slider (track 390 pt, ink fill left, white pill thumb about 36 x 24 pt with shadow). Info card below: "You should reach your goal in **2 months**" (orange), "This is the most balanced pace, motivating and ideal for most users.", "Daily calorie goal: 1,843 cal".
- Notable craft: the info card (grey, 16 pt radius) recomputes live: timeline and calories update as the thumb moves. Active animal is tinted.
- Why it works: shows consequences of a choice in real time (cause and effect), and defaults to a "Recommended" anchor most people accept.
- FIQR verdict: ADAPT. FIQR has no pace field; derive the timeline display from `weight_kg`, `target_weight_kg` and a pace, and only persist pace if the backend adds it (flag). Replace animals with Geo copy; tint the active label ink navy bold, not orange. Clamp the fast end to a safe rate.

### IMG_6831 - Pace slider (frame 2)

- What it shows: same screen as IMG_6830, a moment later. Only the rabbit illustration differs (mid-hop pose).
- Notable craft: proves the active-state mascot is animated in a loop (a hop cycle), adding life to an otherwise static control.
- Why it works: subtle motion draws the eye to the recommended option without extra copy.
- FIQR verdict: ADAPT the principle (gentle motion on the recommended state) with a small Geo avatar pulse that respects `prefers-reduced-motion`. REJECT copying the animal set (trade-dress risk, off-palette).

### IMG_6832 - Value interstitial: "A simpler way to stay on track"

- What it shows: no input. Title plus subtitle "Log meals in seconds, follow your plan, and see your progress add up." Gradient grey card with two bars: "Without Cal AI" (short grey bar with person icon) vs "With Cal AI" (tall black bar with verified-person icon). Caption "✓ Small daily actions lead to progress".
- Notable craft: bar comparison with no axis or numbers; soft multi-tint gradient background inside the card.
- Why it works: second value break around question 9 to sustain motivation. Claim is vague and visual only.
- FIQR verdict: REJECT the with/without bar (unquantified comparative claim). Keep at most one value interstitial in FIQR's flow and make it about how Geo works.

### IMG_6833 - Barriers

- What it shows: "What's stopping you from reaching your goals?" 5 cards: Lack of consistency, Unhealthy eating habits, Lack of support, Busy schedule, Lack of meal inspiration. Single select (radio), first selected.
- Notable craft: solid filled glyphs; cards vertically centred from about y 330 pt.
- Why it works: lets the user name their pain, which the app can echo later (personalised paywall and tips). Single select is limiting; real barriers overlap.
- FIQR verdict: ADAPT as optional, multi-select, only if Geo will actually use it in its system prompt; otherwise REJECT. Not in current fields - flag to product rather than add.

### IMG_6834 - Diet style

- What it shows: "Do you follow a specific diet?" Long single select list, top aligned, 8+ cards: Balanced, Whole-food focus, Mediterranean (selected), Flexitarian, Pescatarian, Vegetarian, Vegan, Low-carb, more below fold.
- Notable craft: list scrolls under the footer fade; each diet has a bespoke glyph.
- Why it works: short labels, one choice, a sensible "Balanced" first option as the no-preference escape.
- FIQR verdict: ADOPT for Nutrition - `dietary_style`. Use FIQR's existing enum; put the neutral option first; keep icons monochrome ink.

### IMG_6835 - Aspiration

- What it shows: "What would you like to accomplish?" 4 cards: Eat and live healthier, Boost my energy and mood (selected), Stay motivated and consistent, Feel better about my body.
- Notable craft: emotional, first-person labels ("my energy").
- Why it works: captures intrinsic motivation, useful for tone of later copy. Overlaps with goal.
- FIQR verdict: REJECT as its own screen (duplicates `primary_goal`, no field). Geo can ask this conversationally after onboarding.

### IMG_6836 - Motivation interstitial: "You have great potential to crush your goal"

- What it shows: no input. Card "Your weight transition" with a curve rising over 3 Days, 7 Days, 30 Days, ending in a tan-orange trophy badge. Caption "Weight change takes time. Consistency in the early weeks matters most".
- Notable craft: segmented gradient fill under the curve getting warmer toward the trophy; hollow ring milestones.
- Why it works: encouragement and milestone framing. But the message is the same for every user regardless of answers (generic flattery), and the rising curve is odd for a weight-loss goal.
- FIQR verdict: REJECT. Generic praise not tied to inputs reads as manipulation. FIQR's equivalent is the honest reflection in IMG_6829 and the real plan reveal.

### IMG_6837 - "Thank you for trusting us!"

- What it shows: no input. Large gradient ring (about 235 pt) with a line illustration of two hands high-fiving, centred title "Thank you for trusting us!", subtitle "Now let's personalize Cal AI for you...", small card "Personalized to your goals - We'll use your answers to tailor your plan, targets, and recommendations." with a badge icon.
- Notable craft: illustration plus gradient halo, centred hierarchy, badge overlapping card top edge.
- Why it works: a gratitude beat that marks the end of questions and the start of setup (permissions). Also a light privacy reassurance.
- FIQR verdict: ADAPT as the bridge into FIQR's AI-consent step: Geo thanks the user and states plainly how answers are used. Use a cream card, no gradient (off-palette).

### IMG_6838 - Add burned calories back

- What it shows: "Add calories burned back to your daily goal?" / "Cal AI reads your workouts and adds the calories you burn back into your daily calorie budget." White card listing Morning Run +320 cal, Yoga +90 cal, Steps +80 cal (green), then a mint band "Added to today's budget +490 cal". Below: "Daily Calorie Budget ~~2,500~~ -> 2,990". Footer: ink "Yes" pill plus text-only "No" below.
- Notable craft: binary choice as a primary pill plus a secondary text button (CTA 57 pt at about y 820 pt, "No" at about y 882 pt). The example makes the abstract setting concrete with numbers and a strikethrough.
- Why it works: shows the result of the setting before you choose it ("show, don't explain").
- FIQR verdict: ADAPT the pattern (worked example card before a settings choice) for any FIQR plan setting Geo needs. The specific setting is not one of our fields; REJECT the green (off-palette).

### IMG_6839 - Sync workouts from Apple Health?

- What it shows: "Sync workouts from Apple Health?" Greyscale photo of a runner (about 280 x 330 pt, 24 pt radius) overlapped by a white widget card "Today's Goal 2500 Cal, Running +250 cal". Yes pill plus No text.
- Notable craft: monochrome photography keeps the palette clean; floating UI card shows the feature in use.
- Why it works: aspirational image plus concrete outcome before a permission ask.
- FIQR verdict: REJECT for onboarding now. HealthKit / Health Connect needs a native Capacitor plugin and is not in our data model. Revisit post-launch; the photo-plus-widget composition is a good reference for an empty state.

### IMG_6840 - Connect to Apple Health

- What it shows: illustration of the Health app icon and Cal AI icon linked by arrows to a check, with floating chips Walking, Running, Yoga, Sleep on a pale circle. Title "Connect to Apple Health" (lower half, left aligned), subtitle about syncing activity. CTA "Connect Apple Health" with Health icon.
- Notable craft: title moves below the illustration here; CTA label names the exact action (not "Continue").
- Why it works: a specific verb on the CTA raises the tap rate and sets expectations for the OS sheet.
- FIQR verdict: REJECT (same as IMG_6839). ADOPT the principle: CTA labels name the action ("Save my plan", "Turn on reminders").

### IMG_6841 - Coach mark for the OS permission sheet

- What it shows: a mock phone showing the iOS Health Access sheet with "Turn On All" circled in red and a hand cursor. Title "Tap "Turn On All" to sync workouts", subtitle "Turn on all categories - workouts can't raise your calorie budget without it." Continue.
- Notable craft: rehearses the next system UI so the user knows exactly where to tap.
- Why it works: reduces drop-off at the OS sheet. But it pushes users to grant every category, including ones the feature does not need.
- FIQR verdict: REJECT. Steering users to "allow all" is a consent dark pattern. If FIQR ever primes a permission, explain the minimum needed and let the OS sheet stand alone.

### IMG_6842 - iOS Health Access sheet (all off)

- What it shows: native iOS Health permission sheet: "Health - "Cal AI" would like to access and update your Health data.", "Turn On All", "Allow "Cal AI" to write" list (Active Energy, Carbohydrates, Dietary Energy, Dietary Sugar, Fibre, ...), all toggles off, Allow disabled, Don't Allow.
- Notable craft: system UI, not Cal AI's design.
- Why it works: n/a (OS). Shows Cal AI requests write access to many nutrition types.
- FIQR verdict: REJECT (native HealthKit out of scope).

### IMG_6843 - iOS Health Access sheet (all on)

- What it shows: same sheet after tapping "Turn On All": every toggle green, button reads "Turn Off All", Allow becomes blue and enabled.
- Notable craft: system UI.
- Why it works: confirms the coach mark in IMG_6841 achieved its goal: blanket permission.
- FIQR verdict: REJECT (native HealthKit out of scope).

### IMG_6844 - Apple Health connected

- What it shows: confirmation, no back button or progress bar. Green check circle (about 44 pt), title "Apple Health Connected!" (about 31 pt bold), subtitle "Your workouts will now sync automatically, with calories included." Continue.
- Notable craft: header chrome removed for a success state; content vertically centred.
- Why it works: closes the loop after a system dialog so the user is never left wondering if it worked.
- FIQR verdict: ADAPT the pattern for any FIQR success beat (for example after AI consent or notification opt-in): ink check on cream, one line, Continue. No green.

### IMG_6845 - Social proof

- What it shows: "Join over 10 million people like you". Laurel badge "4.8 ★ avg rating, 250K+ App Ratings" and three avatar photos "10M+ Cal AI Users". Then review cards with 5 gold stars, name and date, long quote; list scrolls under the footer.
- Notable craft: laurels and gold stars in a yellow-tan; review cards light grey 20 pt radius; first review is long (sells a specific feature, photo logging).
- Why it works: social proof just before the account and paywall asks, when doubt peaks.
- FIQR verdict: REJECT for now. We cannot claim user counts or ratings we do not have, gold is off-palette, and real-person photos and names in UI need consent. Revisit only with verified, consented testimonials.

### IMG_6846 - Notification pre-prompt

- What it shows: no back-row content besides chrome. Centred title "Stay on track with Cal AI notifications", a fake iOS alert mock "Cal AI would like to send you Notifications" with Don't Allow / Allow buttons, and a pointing-hand emoji under Allow. No CTA in the footer; the mock itself is the trigger.
- Notable craft: the soft prompt imitates the system alert so the real alert feels like a continuation; the emoji nudges toward Allow.
- Why it works: raises opt-in by previewing the system dialog. Imitating system UI and pointing at Allow is manipulative.
- FIQR verdict: ADAPT with an honest version: Geo explains what reminders it will send (for example meal and check-in reminders), FIQR-styled buttons "Turn on reminders" (orange) and "Not now" (text), then trigger the OS prompt only on yes. REJECT the fake alert mock and the pointing hand.

### IMG_6847 - Notification OS prompt

- What it shows: the real iOS alert ""Cal AI" Would Like to Send You Notifications" sitting over the dimmed pre-prompt, almost exactly aligned with the mock beneath it; the pointing hand still visible under Allow.
- Notable craft: the mock was positioned so the real dialog lands on top of it, making the hand point at the real Allow button.
- Why it works: maximises Allow taps by visual continuity. This is deliberate steering of a system consent dialog.
- FIQR verdict: REJECT the overlay trick. Use the OS prompt via Capacitor Push Notifications only after an explicit in-app yes.

### IMG_6848 - Referral code

- What it shows: "Enter referral code (optional)" / "You can skip this step". Input field with inline "Submit" pill (disabled grey), field about 390 x 64 pt, pale grey fill. Footer CTA reads "Skip" in the ink pill.
- Notable craft: the primary footer button becomes "Skip", so the skip path is the default and a code is a side action.
- Why it works: optional step without friction; still catches influencer codes.
- FIQR verdict: REJECT. No referral program in scope. If one ships, place it in settings, not onboarding.

### IMG_6849 - "All done! Time to generate your custom plan!"

- What it shows: gradient ring with a finger-heart hand illustration, small row "✓ All done!" (tan-orange check), centred title "Time to generate your custom plan!" Continue.
- Notable craft: reuses the IMG_6837 ring template for visual bookends of the setup segment.
- Why it works: explicit end of effort and anticipation before the reveal (goal-gradient effect, progress bar is about 88 percent).
- FIQR verdict: ADAPT as the post-consent "Geo is building your plan" lead-in. One line from Geo, orange CTA "Build my plan".

### IMG_6850 - Plan generation loader (19 percent)

- What it shows: no header chrome. Huge "19%" (about 64 pt bold), title "We're setting everything up for you", gradient progress bar (red to blue, 390 x 10 pt, rounded), status "Customizing health plan...", white card "Daily recommendation for" with bullets Calories, Carbs, Protein, Fats, Health Score.
- Notable craft: big numeric percentage plus status text plus checklist gives three layers of progress.
- Why it works: labour illusion; perceived effort raises perceived value of the result. Here it appears time-based theatre (the plan is a formula).
- FIQR verdict: ADAPT only if it reflects real work: FIQR's plan call to the core API can drive the checklist (calories, protein, carbs, fat ticks as data arrives). No fake percentage; use an indeterminate bar or real steps. Bar in orange or ink, not a gradient.

### IMG_6851 - Plan generation loader (91 percent)

- What it shows: same screen at "91%", status "Finalizing results...", bar nearly full, Calories, Carbs, Protein, Fats each with a filled ink check circle (about 20 pt) on the right; Health Score still unchecked.
- Notable craft: checklist ticks appear sequentially; status line changes copy by phase.
- Why it works: sequential completion reads as real computation.
- FIQR verdict: ADAPT as above: tick macros as the response resolves. Macro rows may carry the reserved macro colours (teal dot for carbs, ochre dot for fat) to pre-teach the colour code.

### IMG_6852 - Plan generation loader (94 percent)

- What it shows: identical to IMG_6851 except "94%" and a slightly longer bar.
- Notable craft: the last few percent crawl slowly, a classic pacing trick to build anticipation.
- Why it works: creates a beat before the reveal. Purely artificial delay.
- FIQR verdict: REJECT artificial slowdown. Reveal as soon as the API returns; if it returns instantly, hold at most a short (under 1 s) transition for continuity.

### IMG_6853 - Plan reveal

- What it shows: no back row. Ink check circle (about 32 pt), centred title "Goal: lose 5 kg by January 2, 2027". Card "Estimated progress" with a descending curve Now -> January 2, 2027 and a callout "Target 55 kg". Card "Your daily recommendation - You can edit this anytime": a wide tile "1843 Calories" with flame icon and pencil, then three tiles 115g Protein (red icon), 231g Carbs (wheat icon, orange), 51g Fats (blue icon), each with a pencil. "View micronutrients" disclosure. CTA "Let's get started!".
- Notable craft: concrete date makes the goal real; each number is individually editable (pencil, 16 pt) which signals control. Tiles about 120 x 90 pt in a 3-up grid with 8 pt gaps, nested inside a grey card.
- Why it works: the payoff for all the questions; the personalised plan and timeline are the "aha". "You can edit this anytime" lowers fear of a wrong plan.
- FIQR verdict: ADOPT as the final onboarding screen, fed by the real plan. Use macro teal for carbs and macro ochre for fat, ink for calories and protein, cream background, white tiles. Add a Geo line summarising the plan. Single orange CTA "Start with Geo". Only show a target date if it is computed from real inputs.

### IMG_6854 - Save your progress (account creation)

- What it shows: title "Save your progress". Three stacked 360 x 62 pt pills: "Sign in with Apple" (black fill), "Sign in with Google" (outline), "Continue with email" (outline). Two unchecked checkboxes: agree to Terms and Privacy Policy; send me tips and personalised offers.
- Notable craft: account wall placed after the reveal so users already have something to lose (sunk cost / endowment). Marketing consent is a separate, unchecked box.
- Why it works: endowment effect drives sign-up after value is shown; separate unchecked marketing opt-in is good practice.
- FIQR verdict: ADAPT. FIQR uses Supabase auth; if the product chooses deferred sign-up, "save your plan" framing is fine and honest. Keep marketing opt-in separate and unchecked. Apple button must follow Apple's own button guidelines (black is permitted there); everything else uses FIQR styles. This placement decision is costly to reverse and needs product sign-off.

### IMG_6855 - Google sign-in in progress

- What it shows: same screen dimmed, both checkboxes now checked (ink fill, white tick), a system spinner HUD over the Google button, and an in-app browser sheet rising from the bottom for accounts.google.com.
- Notable craft: system auth sheet; checked state of the checkbox is ink square with white tick.
- Why it works: n/a beyond showing the auth handoff is native and fast.
- FIQR verdict: ADOPT the behaviour (native auth sheet via Capacitor browser or Supabase OAuth, loading HUD while waiting). Make sure the terms checkbox is required but the marketing one is not.

---

## Flow map

1. IMG_6818 - Sex (single select, 3)
2. IMG_6819 - Workouts per week (single select, 3, two-line)
3. IMG_6820 - Date of birth (wheel picker)
4. IMG_6821 - Where did you hear about us (single select, 9+, CTA disabled until answer)
5. IMG_6822 - Tried other calorie apps (yes/no)
6. IMG_6823 - Interstitial: weight trend chart (value)
7. IMG_6824 - Height (unit toggle + wheel)
8. IMG_6825 - Current weight (unit toggle + ruler)
9. IMG_6826 - Works with trainer or dietitian (yes/no)
10. IMG_6827 - Goal (single select, 3)
11. IMG_6828 - Desired weight (ruler with shaded delta)
12. IMG_6829 - Interstitial: "Losing 5 kg starts with a plan" (reflection)
13. IMG_6830 - Pace slider with live timeline and calories
14. IMG_6831 - Pace slider, animation frame 2 (same screen)
15. IMG_6832 - Interstitial: with/without bars (value)
16. IMG_6833 - Barriers (single select, 5)
17. IMG_6834 - Diet style (single select, 8+)
18. IMG_6835 - Aspiration (single select, 4)
19. IMG_6836 - Interstitial: "great potential" chart (motivation)
20. IMG_6837 - Interstitial: "Thank you for trusting us" (bridge)
21. IMG_6838 - Add burned calories back (yes/no with worked example)
22. IMG_6839 - Sync workouts from Apple Health (yes/no with photo)
23. IMG_6840 - Connect to Apple Health (permission explainer, named CTA)
24. IMG_6841 - Coach mark: tap "Turn On All"
25. IMG_6842 - iOS Health sheet, all off (system)
26. IMG_6843 - iOS Health sheet, all on (system)
27. IMG_6844 - Apple Health connected (success)
28. IMG_6845 - Social proof: ratings, user count, reviews
29. IMG_6846 - Notification pre-prompt (fake alert mock)
30. IMG_6847 - Notification OS prompt (system, over the mock)
31. IMG_6848 - Referral code (optional, CTA is Skip)
32. IMG_6849 - "All done! Time to generate your custom plan" (anticipation)
33. IMG_6850 - Loader 19 percent
34. IMG_6851 - Loader 91 percent
35. IMG_6852 - Loader 94 percent
36. IMG_6853 - Plan reveal (editable targets, dated goal)
37. IMG_6854 - Save your progress (account)
38. IMG_6855 - Google auth in progress (system)

Count: 38 captures covering 33 distinct screens (14 is a second frame of 13; 25-26 are two states of one system sheet; 30 is the system layer over 29; 33-35 are one loader; 38 is the auth state of 37). About 18 of those are questions or choices; 7 are interstitials (value, reflection, motivation, bridge, anticipation); the rest are permissions, social proof, loader, reveal and account. No paywall appears in this set; it presumably follows sign-in.

Order of question types: identity (sex, frequency, DOB) -> marketing (source, other apps) -> value break -> body metrics (height, weight) -> segmentation (professional) -> goal (goal, target weight) -> reflection -> pace (slider) -> value break -> psychology (barriers) -> diet -> aspiration -> motivation and bridge breaks -> settings and permissions (burned calories, Health, notifications) -> social proof -> referral -> loader -> reveal -> account.

Pacing: an interstitial roughly every 3-5 questions; easy taps first, numeric inputs mid-flow, emotional questions late, all permission asks after the user is invested, account wall only after the reveal.

## Pacing and pattern summary

### Reusable patterns

1. One question per screen, fixed footer CTA. Each screen asks one thing; Continue is a fixed bottom pill. FIQR: a shared `OnboardingStep` shell in `src/components/ui/fiqr` with title, optional why-line, body slot and a fixed footer holding the single orange primary button (408 x 56 pt pill, 16 pt gutter, safe-area padding). Split today's 25-choice fitness scroll into its fields.
2. Thin progress bar plus circular back. A hairline progress bar beside a 40 pt round back button, no step numbers. FIQR: ink navy fill on a cream-darkened track (use ink at low opacity, not a new grey); progress computed from the step list so conditional skips stay honest.
3. "Why we ask" subtitle. One grey line under every sensitive question. FIQR: required for dob, sex, weight, allergies; Geo voice, under 12 words ("Geo uses this to set your daily calories.").
4. Icon card radio rows. 62 pt white cards, 40 pt icon circle, label, radio; selected = 2 pt ink border plus filled radio. FIQR: white card on cream, ink navy selected border and radio (not orange, so orange stays the one primary action). Multi-select variant uses a square check and an exclusive "None" option for injuries and allergies.
5. Disabled CTA until answered, no preselection on sensitive fields. FIQR: CTA disabled (ink at 30 percent) until valid; never preselect sex, allergies or injuries.
6. Native-feeling numeric input. Unit toggle plus wheel or ruler. FIQR: native `<input type="date">` for dob; a scroll-snap ruler plus tap-to-type field for weight and target weight; kg/lb toggle as a pill segmented control in ink and white.
7. Echo the previous answer. Target weight screen shows "Lose weight" and shades the distance from current weight. FIQR: carry `primary_goal` and `weight_kg` into the target weight screen; Geo references them by value.
8. Reflection interstitial with the user's own numbers. "Losing 5 kg starts with a plan." FIQR: 1-2 Geo comment screens max (after goal and target weight, and before consent), centred, numbers emphasised with weight not colour.
9. Live consequence preview. Slider updates timeline and calories as you drag. FIQR: on target weight (or a pace step if the backend adds one), show "about N weeks at a steady pace" computed live; persist only fields the API has.
10. Specific CTA verbs at commitment points. "Connect Apple Health", "Let's get started!". FIQR: "Continue" for questions, but "I agree" on consent, "Build my plan" before generation, "Start with Geo" on reveal.
11. Real-work loader with checklist. FIQR: drive the checklist from the actual plan API call (calories, protein, carbs in teal, fat in ochre), no fake percentage, no artificial delay.
12. Editable plan reveal. Dated goal, calorie hero tile, 3 macro tiles each with an edit affordance, "You can edit this anytime". FIQR: final screen, macro tiles use reserved teal and ochre, one orange CTA, Geo summary line.

### Proposed FIQR onboarding steps (one question or tight group per screen)

| # | Screen | FIQR field(s) | Control |
|---|---|---|---|
| 1 | What should Geo call you? | `name` | text input, autofocus |
| 2 | Sex | `sex` | 3 cards, none preselected |
| 3 | Date of birth | `dob` | native date input |
| 4 | Main goal | `primary_goal` | 3-4 cards with glyphs |
| 4b | Height | `height_cm` | type-in with stepper, cm/ft toggle |
| 5 | Current weight | `weight_kg` | ruler plus type-in, kg/lb toggle |
| 6 | Target weight (skip if maintain) | `target_weight_kg` | ruler with shaded delta, live "about N weeks" |
| 7 | Geo reflection | none | interstitial, Geo comment using steps 4-6 |
| 8 | Activity level | `activity_level` | 4 two-line cards |
| 9 | Workouts per week | `workout_frequency` | 3-4 two-line cards |
| 10 | Equipment | `equipment` | multi-select cards or chips |
| 11 | Injuries | `injuries` | multi-select, exclusive "None" |
| 12 | Allergies (required) | `allergies` | multi-select, exclusive "None", why-line on safety |
| 13 | Dietary style | `dietary_style` | single select list, neutral first |
| 14 | Foods you dislike | `dislikes` | chips plus free text |
| 15 | Cuisines you enjoy | `cuisines` | multi-select chips |
| 16 | Meals per day | `meals_per_day` | 3-5 cards |
| 17 | Review | all | summary rows, each tappable to edit |
| 18 | AI consent | existing consent step | Geo explains data use, explicit opt-in, CTA "I agree" |
| 19 | Building your plan | none | real-work checklist loader |
| 20 | Plan reveal | plan response | dated goal, calorie and macro tiles, CTA "Start with Geo" |

Optional later (post-launch, not in onboarding): notification opt-in with honest pre-prompt; HealthKit / Health Connect sync; acquisition source.

Data gaps to raise with product (do not add client-only fields): weekly pace, barriers. (Height is already collected on the Personal step; corrected by the lead agent 24 Oct 2026.)

### Dark patterns not to copy

- Steering OS permissions: the "Tap Turn On All" coach mark (IMG_6841) and the fake notification alert aligned under the real one with a pointing hand (IMG_6846-6847).
- Unsourced comparative charts: "Without a plan" rebound curve (IMG_6823) and with/without bars (IMG_6832).
- Generic flattery not based on inputs: "You have great potential to crush your goal" (IMG_6836).
- Fake progress theatre: percentage loader that crawls through 91-94 percent (IMG_6850-6852).
- Unverifiable social proof: "10 million people", ratings counts and named reviews (IMG_6845).
- Data harvesting for marketing inside the coaching flow: acquisition source, other apps, trainer question (IMG_6821, 6822, 6826).
- Watch item: account wall after the reveal (IMG_6854) uses sunk cost; acceptable only if the plan is not held hostage and sign-up is needed to save it.
