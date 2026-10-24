# Bevel teardown - part A (IMG_6856 to IMG_6887)

Source: `~/Downloads/inspiration for FIQR/BEVEL/IMG_6856.PNG` to `IMG_6887.PNG`, 32 screenshots, 1320x2868 px (iPhone, @3x, 440 x 956 pt canvas). Bevel on iOS 26 (Liquid Glass era), captured 24 Oct 2026.

All measurements are estimates in iOS points (image px / 3), read off downscaled views, so treat them as +/- 2 pt.

Global constants seen across almost every screen (referenced below instead of repeated):

- **Canvas and gutter:** 440 pt wide. Content gutter 16 pt for cards, 20 pt for full-width CTAs and form rows.
- **Primary CTA:** near-black (about #1F2023) capsule, 400 x 52 pt, fully rounded, white 17 pt semibold label, soft drop shadow (y 8, blur 24, about 15% black). It sits 40 pt above the home indicator. Disabled state is a flat 30% grey capsule with a lighter grey label.
- **Chrome buttons:** 44 pt white circles (close, back, more, calendar) at y about 62 pt. They carry a very soft wide shadow and no border. On tinted headers they take a tint of the header colour.
- **Type:** SF Pro throughout. Large title 26 to 28 pt semibold. Section header 20 pt semibold. Card title 16 to 17 pt medium. Body 15 to 16 pt regular in mid grey. Caption 13 pt grey. Numbers use SF Pro Rounded-ish tabular figures at 26 to 30 pt semibold, with units at about 55% size in grey.
- **Background:** off-white lavender-grey (about #F4F4F8), white cards on top. Separation comes from a 1 pt hairline-free soft shadow, not borders.
- **Card radius:** 24 pt for major cards, 20 to 22 pt for metric tiles, 16 to 18 pt for list rows, fully rounded for chips and pills.

---

### IMG_6856 - Splash / welcome carousel page 1

- **What it shows:** A full-bleed cool grey "foggy sky" gradient with soft horizontal banding. Centre: the Bevel "B" mark, debossed into the background (inner shadow plus top highlight), about 160 x 125 pt. Below it sits a two-line headline, "Your Connected Health Coach", also debossed (about 34 pt bold, grey-on-grey). Then come 5 page dots (about 8 pt, 16 pt pitch) at y about 820 pt and the black capsule "Continue" CTA.
- **Notable craft:** There is no colour at all, and depth comes only from emboss and deboss lighting. The type is set into the material instead of laid on top, so the logo and headline read as one object. Hierarchy: mark first, then headline, then CTA. Density is extremely low, about 70% empty canvas.
- **Why it works:** The material-as-brand moment establishes the "glass and light" identity before showing any data. It is calm and premium, and it holds one idea per screen.
- **FIQR verdict:** ADAPT for the onboarding welcome. Keep the one-idea, one-CTA, mostly-empty composition with a cream (#FDF6EC) field and the FIQR mark set large in ink navy. Make the single CTA orange. Reject the debossed grey-on-grey text: it fails contrast, and the emboss look is Bevel's signature (trade-dress risk).

### IMG_6857 - Welcome carousel page 2, "Fitness"

- **What it shows:** The same gradient field. A left-aligned title, "Fitness" (about 42 pt heavy, white with a slight translucent gradient), and a 2-line subtitle (about 18 pt, white at about 70%). Below is a bento of three frosted "glass" cards:
  - a wide live-workout card: orange heart-rate pill "123 BPM", colour zone bars either side, a swimmer illustration peeking over the top edge, and split-flap style digit tiles "00:08:52";
  - a deadlift set card: exercise icon tile, "Barbell 185 lb x 5", segmented progress bar, monospaced "00:19" timer, and stop / skip glyphs;
  - a small "Cardio load 2.63" card with a line chart and an orange pill.
- **Notable craft:** The cards are milky glass (white at about 40 to 55%, 1 pt white inner stroke, radius about 22 pt). Each digit of the timer sits on its own rounded tile, and leading zeros are dimmed. A monospace face is used for timers only. The illustration breaks the card edge for depth. Orange is reserved for the live metric.
- **Why it works:** It shows real product UI as a teaser instead of abstract illustration, so the user previews what they will actually see. The bento layout gives a sense of breadth in one glance.
- **FIQR verdict:** ADAPT for onboarding carousel slide "Train". Use a 2 to 3 tile bento of real FIQR components: a live workout set row, a rest timer with per-digit tiles, and a macro bar. Put them on white cards (not glass) over cream. Use orange only on the live timer accent. Dim the leading zeros in the timer, which is a cheap and great detail. Reject the multicolour HR zone bars (palette conflict).

### IMG_6858 - Welcome carousel page 3, "Nutrition"

- **What it shows:** Title "Nutrition" plus a subtitle about AI food logging, followed by a bento of four cards:
  - a camera-scan card: watermelon photo, scan-bracket corners (white, about 4 pt thick), a scan line, "Watermelon 85 kcal";
  - a macro card: faded stacked horizontal bars with one highlighted row "326 g", and labels Carbs 10% / Protein 51% / Fat 39% in orange, pink and blue;
  - "Live glucose 148 mg/dL": an orange-red pill over a green-yellow-orange gradient line chart with a meal marker;
  - "257 kcal Burned": a flame icon and a gradient slider over a tick ruler.
- **Notable craft:** The scan brackets sit outside the card radius and read as a viewfinder. The macro card fades background rows to about 20% and pops one row to 100%, which is a "focus row" technique. Macro labels are coloured text over neutral numbers. The ruler with ticks is a good tactile metaphor.
- **Why it works:** It sells photo logging in one frame through the bracket and food pairing. The focus-row trick shows history and the current state together without a legend.
- **FIQR verdict:** ADAPT for the onboarding "Eat" slide and the meal-log camera screen.
  - Adopt the viewfinder bracket corners on the camera capture UI, in white over the photo.
  - Adopt the focus-row bar treatment for daily macro history in the food diary: past days in navy at 15% alpha, today at full.
  - Map the macro colours to FIQR rules: protein ink navy, carbs teal #3E7C77, fat ochre #A07A3C. Do not use pink or blue.
  - Reject glucose and the gradient burn slider (out of scope, off palette).

### IMG_6859 - Welcome carousel page 4, "Wellness"

- **What it shows:** Title "Wellness" plus a subtitle. Bento of three:
  - an HRV card: blurred soft heart, "HRV" label, "72 ms" at about 28 pt, a small blue up-arrow badge;
  - a hydration card: a blue water-fill wave rising to a dashed target line, "48/64 US fl oz", white label inside the water;
  - a wide "Energy bank 81%" card: about 26 vertical green capsule segments in a white rounded track, then "Last charged to 93%".
- **Notable craft:** Segmented capsule meters run about 4 pt wide with about 6 pt gaps, and unfilled segments are light grey. The fill-to-target metaphor uses a liquid wave. The label hierarchy is a small grey label, a big number, then a muted unit.
- **Why it works:** Every metric gets a physical metaphor (battery, water, heart), so users read state without numbers. The segmented meter is more legible than a thin bar at small sizes.
- **FIQR verdict:** ADAPT. The segmented capsule meter maps well to a calorie budget remaining bar or to water intake. Fill segments in ink navy and leave the remainder at navy 10%. Use orange only when over budget, if at all. The fill-to-dashed-target metaphor suits a protein goal card. Reject the green and blue fills (palette).

### IMG_6860 - Sign in / privacy

- **What it shows:** Plain light grey background (#F5F5F8). A 44 pt white circular back button at top left. A centred title "Privacy by design" (about 20 pt semibold) and a 2-line grey subtitle. A large skeuomorphic white vault-door illustration (about 240 pt square, radius about 48 pt, deep soft shadow). Fine print with underlined "Terms of Service" and "Privacy Policy" links. A pure black "Continue with Apple" capsule (about 400 x 52 pt) and a plain grey text link, "Use email instead".
- **Notable craft:** The illustration is a white-on-white clay render that does the emotional work, so the copy stays short. The secondary path is demoted to a text-only link. The legal copy sits directly above the CTA, where it is legally visible.
- **Why it works:** It addresses the biggest sign-up anxiety (data privacy) right at the point of commitment. There is one obvious action and one escape hatch.
- **FIQR verdict:** ADAPT for the FIQR sign-in screen.
  - Keep the structure: reassurance headline, illustration, legal line, primary auth button, and a secondary auth option as a text link.
  - The Apple button must follow Apple HIG (black is allowed for the Sign in with Apple button itself), so the orange primary goes unused on this screen. Alternatively, keep "Continue with email" as the orange primary on Android.
  - Reject the 3D clay vault: asset cost is high, and it is a Bevel motif. Use a flat navy line illustration.

### IMG_6861 - iOS Health permissions sheet (system UI)

- **What it shows:** The native Apple Health access sheet. It shows a heart app icon tile, "Health" plus explanatory copy, a "Turn On All" row, an "Allow 'Bevel' to write" grouped list of toggles (Active Energy, Alcohol, Biotin, Blood Glucose, Caffeine and more), and floating "Allow" (disabled grey) and "Don't Allow" glass capsule buttons over the list, which scrolls behind them.
- **Notable craft:** iOS 26 floats the action buttons over scrolling content with a progressive blur fade. Grouped inset list with radius about 26 pt. Not Bevel's own design.
- **Why it works:** It is system-standard, trusted, and not customisable.
- **FIQR verdict:** REJECT as a design source (system UI). Note for flow: FIQR should show its own pre-permission explainer before triggering HealthKit or Health Connect via Capacitor, as Bevel does with IMG_6860. Borrow one idea: actions float over a scrolling list with a fade-out mask.

### IMG_6862 - Home with "What happened last night?" bottom sheet

- **What it shows:**
  - Behind (dimmed): the home dashboard.
  - Sheet: a floating inset card sheet (inset about 8 pt from the screen edges and bottom, corner radius about 40 pt, concentric with the device corners). Grabber, then the title "What happened last night?" (about 20 pt semibold, centred) and a 2-line grey subtitle.
  - Three rows (white, radius about 16 pt, soft shadow): "50+ dB sleeping noise" (auto-detected, so it shows a sparkle and a green check), "Device in bed", and "Late meal". Each has an emoji icon and a 3-state segmented control (x / - / check) with the neutral state selected.
  - A black "Done" capsule.
- **Notable craft:**
  - The detached floating sheet is the iOS 26 idiom.
  - The tri-state control defaults to "unknown" rather than forcing yes or no.
  - An AI-filled answer is marked with a sparkle instead of the control, which builds trust in automation.
  - Emoji serve as icons for quick scanning.
- **Why it works:** It is a fast morning check-in with zero typing, and the auto-detected rows show the system already did part of the work.
- **FIQR verdict:** ADOPT the pattern for Geo's daily or weekly check-in.
  - Use a floating sheet with radius 32 pt and an 8 pt inset.
  - Use tri-state rows such as "Hit protein?", "Late meal?", "Alcohol?".
  - Mark rows Geo inferred with a small sparkle and a pre-filled state.
  - Use an orange CTA (the one primary).
  - Swap emoji for Archivo-friendly line icons in navy, since emoji clash with the restricted palette.

### IMG_6863 - Home with "Activity Status" explainer sheet

- **What it shows:** The same dimmed home. The sheet has a 44 pt grey circular close button and the nav title "Activity Status". Hero: a 2x2 cluster of glossy jelly capsules (green runner, coral bandage, yellow bed, blue palm tree), each about 75 x 55 pt with a coloured glow halo. Then a "Activity Status" title (about 22 pt semibold), a 3-line centred explainer, and a black "Continue" button.
- **Notable craft:** The capsules are 3D-ish glass with inner highlights and a colour bloom. They are a feature-introduction sheet that fires once.
- **Why it works:** A one-time contextual explainer the first time a feature is seen beats a long onboarding.
- **FIQR verdict:** ADAPT the "first-encounter explainer sheet" pattern for Geo features (for example the first time a user opens weekly check-in). REJECT the multicolour glossy capsules: palette, perf (glow plus blur), and Bevel signature styling. Use a single navy icon tile on a cream circle.

### IMG_6864 - Home dashboard (top, loading / syncing)

- **What it shows:**
  - **Top bar:** a centred glass pill "Syncing... 61%" with a spinner (about 112 x 44 pt), and a right-hand grouped pill with share plus avatar ("VS" initials on a light blue circle).
  - **Header:** large title "Today, 24 October" plus a chevron (about 26 pt semibold), acting as a date picker.
  - **Status row:** an "Active / Until changed" status pill (green glossy icon chip, chevron) and a weather pill "33 C Mumbai".
  - **Hero card:** three ring gauges (Strain, Recovery, Sleep) about 100 pt diameter, in an empty "-%" state, with thin vertical dividers. A "COACHING" section is attached below in the same card (caps label 12 pt tracking, body 17 pt).
  - **Promo card:** "Track your blood pressure" with a pink gradient, illustration, x close, and an "Add" glass pill.
  - Section "Stress & Energy": a stress card with a dial, plus an energy segmented bar.
  - **Bottom:** a floating glass tab bar (Home / Journal / Fitness / Biology, filled glyph icons about 22 pt, 12 pt labels, selected tab in a grey capsule) and a separate circular "+" glass button on the right (about 62 pt).
- **Notable craft:**
  - The tab bar is a single capsule about 328 x 60 pt plus a detached circular action, the iOS 26 split-tab-plus-accessory layout.
  - Coaching text lives inside the score card, so the insight sits next to the data.
  - The empty state keeps the full layout with dashes instead of collapsing it.
  - Card radius is about 24 pt.
- **Why it works:** Scores come first, then an interpretation in plain English, then a deeper section. Keeping the full skeleton during sync prevents layout shift.
- **FIQR verdict:** ADOPT the structure for FIQR Today.
  - Top: a date title with a chevron date switcher.
  - Hero card: a calorie ring plus three macro mini-rings, in protein navy, carbs teal and fat ochre.
  - A "GEO SAYS" coaching block attached to the bottom of the same card.
  - Then sections below.
  - Adopt the floating tab bar with a detached circular "+" (log meal) button. That "+" is the single orange primary on Today.
  - Reject the pink gradient promo card (palette). Use a white card with a navy left icon.

### IMG_6865 - Home dashboard (scrolled, nutrition and health monitor, empty)

- **What it shows:**
  - The header collapsed into floating glass chips: calendar circle (left), syncing pill (centre), share/avatar pill (right). Content scrolls under them with a blur fade.
  - Section "Nutrition": a "Today's foods" card with a blurred empty plate disc, three macro columns with tiny icons, "0g", and a dot-matrix grid (about 8 x 5 dots per macro) as a fill meter. A "Blood glucose - mmol/L" footer row sits under a divider.
  - "Health Monitor": a 2-column grid of tiles (RR, RHR, HRV, SpO2, Temp, Sleep) with "No data" in large grey and a vertical capsule range gauge on the right.
  - "Timeline 1 event".
  - The tab bar is collapsed to a single circular Home button (left) and "+" (right).
- **Notable craft:**
  - The tab bar minimises on scroll down (the iOS 26 behaviour) to two 48 pt circles, so the content gets the full screen.
  - The dot-matrix macro meter is a distinctive and very legible fill.
  - Empty tiles keep their size, and "No data" is set at the value size in grey.
- **Why it works:** Collapsing chrome on scroll maximises reading space while keeping the two key actions (home, add) reachable.
- **FIQR verdict:**
  - ADOPT the scroll-collapsing tab bar (shrink to a home circle plus a "+" circle on scroll down, expand on scroll up). It is cheap with a transform plus opacity.
  - ADAPT the dot-matrix macro meter for the FIQR macro card: each dot is about 5 g. Protein dots are navy, carbs dots teal, fat dots ochre, and unfilled dots take the same colour at 12% alpha. This is distinctive enough to be ours if we change the grid geometry (for example 10 x 4 rounded squares).
  - REJECT the vital-sign tiles (out of scope).

### IMG_6866 - Home dashboard (loaded, tab switching)

- **What it shows:**
  - The same home, now with data: Strain 1% (striped yellow partial arc), Recovery 76% (green-yellow gradient arc), Sleep 85% (blue-violet gradient arc).
  - Numbers inside the rings are about 26 pt semibold, with "%" at about 60%.
  - Coaching text: "Excellent sleep and recovery!".
  - Stress card: "19 / 0 / 5" in teal, labelled Highest / Lowest / Average, with a circular tick dial showing "1 Low".
  - Energy bar: a green segmented bar at 87%.
  - The tab bar shows the Liquid Glass lens mid-transition: a refractive droplet distorting the "Journal" and "Fitness" glyphs as the selection slides.
- **Notable craft:** Ring gauges use a 10 pt stroke on a light grey track with a soft outer bevel ring. Gradient arcs encode the score band. The selection lens is native refraction, impossible in CSS. The stat triplet uses coloured numbers and grey labels.
- **Why it works:** Three rings give a whole-day read in under one second, and coaching text turns numbers into an action.
- **FIQR verdict:**
  - ADAPT the ring trio for the calorie and macro hero. Use solid single-colour arcs (no gradients) with round caps, a 10 pt stroke, and a navy 8% track. Percentages go inside the ring in Archivo semibold with tabular-nums.
  - REJECT the refractive lens: no WebView equivalent, and SVG displacement filters are too slow on Android. Replace it with a 200 ms sliding cream or white capsule indicator behind the active tab.

### IMG_6867 - Home dashboard (scrolled, health monitor loaded, timeline)

- **What it shows:**
  - A collapsed top bar with the centred title "Today" (17 pt semibold) between the calendar circle and the share/avatar pill, over blurred content.
  - The Health Monitor grid with values: RR 16.9 rpm, RHR 59.6 bpm, HRV 48.9 ms, SpO2 96.8 %, Temp 35.0 C, Sleep 7h 21m. Each is about 28 pt semibold with a grey unit, plus "Normal" with a green check, and a vertical range capsule with a ring marker showing the position within the normal band.
  - Timeline: a "Primary sleep" event card (moon icon on a lavender circle, time caption, inline stats) and a "View timeline" full-width grey capsule.
  - The bottom shows an "Edit Home" text centred between the home and "+" circles.
- **Notable craft:** The large title collapses into an inline nav title. The vertical mini range gauge is a compact "where am I in normal" visual. The status uses a check icon and coloured word, not a badge.
- **Why it works:** Each tile answers "what is it, is it OK" in three lines, which is very scannable. "Edit Home" at the end gives user control without cluttering the top.
- **FIQR verdict:**
  - ADOPT the collapsing large-title to inline-title behaviour (IntersectionObserver plus a class swap).
  - ADAPT the tile anatomy (label / value plus unit / status) for FIQR's weekly check-in metrics (weight, avg protein, adherence). Use navy for the "on track" status instead of green, and keep orange off the status.
  - ADOPT the event row card for the food diary meal entries: icon circle, time caption, meal name, inline kcal / protein, chevron.
  - Consider "Edit Today" at the bottom later.

### IMG_6868 - Journal tab

- **What it shows:**
  - Top right: a glass "Insights" pill with a sparkle icon, and a "..." circle.
  - Title "Journal" (about 26 pt semibold) with "Oct 2026" in grey.
  - A week strip: weekday labels in light grey, dates 18 to 24, each with a yellow check badge. Today (24) is in blue and sits in a raised white capsule. A hairline divider separates the strip.
  - "Today's Entries" plus an explainer, then a "Daytime" group: rows such as Added sugar, Alcohol (- drinks, arrow button), Caffeine (- mg), Daily mood, Hydration (- ml), Keto diet, Low carbs. Each is a white rounded row (radius about 18 pt, height about 50 pt) with an emoji and either the tri-state control or a value plus a square arrow button.
  - "Nighttime 24 Oct - 25 Oct" group, then the floating tab bar (Journal selected).
- **Notable craft:** Two row types share one row shell (toggle vs quantity). The week strip doubles as streak feedback through the checks. Today's selected state is a lifted white capsule rather than a filled colour.
- **Why it works:** Habit logging becomes a checklist that takes seconds, and streak checks reward consistency.
- **FIQR verdict:**
  - ADOPT the week strip with completion marks for the FIQR food diary header. A day is "logged" when it has at least one meal, shown as a navy check badge; today sits in a white raised capsule with an orange date numeral or underline. Do not use orange as a fill here, since it is reserved for the primary.
  - ADOPT the row shell for quick add habits (water, supplements).
  - The "Insights" glass pill maps to a "Ask Geo" pill on the diary.

### IMG_6869 - Fitness tab (rest day)

- **What it shows:**
  - A warm peach-to-yellow gradient header wash behind the top (about 160 pt tall), fading to background.
  - Calendar-clock circle (left, with a yellow tint), "..." circle (right), and a centred title "Fitness" (about 28 pt semibold).
  - A tick ruler with an orange triangle marking today.
  - A horizontally scrolling day-pill carousel: tall capsules (about 52 x 88 pt) with the weekday letter, the date, and a rest "Zz" icon circle. Future days use a dashed circle, and today's date is blue.
  - Cards:
    - "Build a Training Plan" promo: illustration, x, "0% completed", "Get started" grey pill;
    - "Today's Activity", with a weather pill and a "+" circle, and a dashed-border "Rest Day" empty card;
    - "Routines" empty state: ghost skeleton cards behind the copy and a black "Add routine +" capsule;
    - "Training Load" peeking under the tab bar.
- **Notable craft:**
  - The tab-specific ambient gradient header gives each tab its own mood.
  - Dashed borders mean "empty or slot".
  - The skeleton-ghost empty state hints at what will fill in.
  - The ruler plus triangle is a scrubber metaphor.
- **Why it works:** Even a rest day with no data feels designed: every empty state names the next action.
- **FIQR verdict:**
  - ADAPT for the FIQR Workouts tab.
    - Day-pill carousel for the plan week (today marked by an orange triangle notch).
    - A dashed "Rest day" card.
    - Ghost-skeleton empty states with one CTA (orange if it is the screen primary).
  - Header wash: use a cream-to-background vertical gradient (#FDF6EC to white) only. This is allowed, since it is a tint of an approved colour.
  - REJECT the peach and yellow gradient and the blue today numeral (palette).

### IMG_6870 - Fitness tab, "Add routine" menu open

- **What it shows:** The same screen. Tapping "Add routine" morphs the button into a floating glass context menu (about 250 x 105 pt, radius about 28 pt) with two rows: "Create strength >" (with an icon) and "Create cardio / Pro Only" (grey subtext). The background is not dimmed, and the menu has a soft shadow and a translucent material.
- **Notable craft:** The button-to-menu morph (iOS 26 menu origin animation) means the menu grows from the button. Paywalled items are shown but labelled, not hidden.
- **Why it works:** It keeps context, makes no navigation jump, and limits the choice to two.
- **FIQR verdict:** ADAPT for "Add" menus (for example log meal: Photo / Describe / Search). Build it as a popover scaling from the trigger's transform-origin (180 ms, scale 0.9 to 1 plus opacity). Use a solid white surface with a shadow instead of blur. REJECT showing locked "Pro Only" rows unless FIQR has a paywall.

### IMG_6871 - Fitness tab, nested menu expanded

- **What it shows:** The menu has expanded in place: "Create strength v" is now a header with a divider, and below it sit "Build manually", "Generate routine", and "Create with Bevel Intelligence / Pro Only". The menu grows to about 250 x 200 pt, with a stacked-card shadow below suggesting depth.
- **Notable craft:** The submenu expands inline rather than opening a second popover. Row height is about 36 pt, and the text is 17 pt regular.
- **Why it works:** Progressive disclosure inside one surface avoids menu-on-menu stacking.
- **FIQR verdict:** ADOPT inline accordion submenus in popovers (for example "Log meal > From photo / Barcode / Describe to Geo"). It is just a height transition, so it is cheap.

### IMG_6872 - Generate routine wizard: experience level

- **What it shows:**
  - A full-height pushed sheet (top radius about 40 pt) over a blurred warm header. A 44 pt close circle.
  - A 2-line centred question, "How experienced are you with strength training?" (about 22 pt semibold), plus a grey helper line.
  - Three large option cards (white, radius about 18 pt, about 400 x 128 pt): small grey glyph (flower / sprout metaphor for level), bold title, 2-line description. Listed Expert, Intermediate, Beginner.
  - A disabled "Continue" grey capsule.
- **Notable craft:** The question is centred and the options left-aligned. Icons are metaphorical (sprout to bloom) and monochrome grey. The CTA is disabled until a selection is made.
- **Why it works:** One question per screen with descriptive options reduces self-assessment errors.
- **FIQR verdict:** ADOPT for FIQR onboarding fitness questions (activity level, workout frequency, primary goal) and the workout plan generator. Use white option cards on cream, navy glyphs, and an orange "Continue" (disabled = orange at 35% alpha with white text, or navy 15% fill). Order the options beginner-first: our users skew newer, and it reads easier.

### IMG_6873 - Wizard: exercise location (single select, selected state)

- **What it shows:**
  - Back circle, then "Where do you like to exercise the most?" and a helper.
  - Four option rows (about 400 x 80 pt, radius about 18 pt): left glyph, title, and grey subtitle. Options: Large gym, Small gym, Home, Custom.
  - The selected row has a 1.5 pt black border plus a right-hand check mark, with no fill change.
  - Black enabled "Continue".
- **Notable craft:** The selection state is the border plus a check only, very restrained. Unselected rows have a faint shadow and no border.
- **Why it works:** Selection is clear without colour, so it scales to any palette.
- **FIQR verdict:** ADOPT exactly the selection mechanics for FIQR single-select onboarding (dietary style, primary goal). Use a 1.5 pt ink navy border plus a navy check. Do not use orange fill on selection, since orange is the CTA.

### IMG_6874 - Wizard: equipment multi-select

- **What it shows:**
  - Question "What kind of equipment is available to you?" plus "Select all that apply."
  - Rows: Band (unchecked); Barbell, Bodyweight, Cable, Dumbbell and EZ Bar (checked); Iso-Lateral Machine; Kettlebell; Landmine.
  - Each row has a title, optional grey detail of the weights available ("Bars: 15.0 kg, 20.0 kg. Plates: 1.25 kg...") truncated with an underlined "Edit" link, and a square checkbox on the right (black filled with a white tick when checked).
  - The selected rows get a 1.5 pt black border.
  - The "Continue" capsule floats over the list, which scrolls beneath it with a fade.
- **Notable craft:** Multi-select uses a square checkbox while single-select uses a check mark, so the conventions are correct. Inline "Edit" lets the user refine without leaving. The floating CTA has a bottom fade mask.
- **Why it works:** Defaults are pre-checked to reduce taps, and secondary detail is available but not mandatory.
- **FIQR verdict:** ADOPT for the FIQR onboarding "equipment" and "allergies / dislikes" multi-selects (square navy checkbox, navy border on selected rows, floating orange CTA with a cream fade mask). Inline "Edit" is optional for v1.

### IMG_6875 - Wizard: training goal

- **What it shows:** Back circle, then "What is your training goal?" plus a 2-line helper. Four option rows: Get stronger (selected, border plus check), Build muscle, Improve body composition, Lose weight. Each has a monochrome glyph. A black "Save and continue" capsule, then a footnote: "All responses are saved and can be updated anytime in Advanced Settings."
- **Notable craft:** The footnote under the CTA lowers commitment anxiety, and the CTA label changes on the last step ("Save and continue").
- **Why it works:** Users commit faster when told the choice is reversible.
- **FIQR verdict:** ADOPT for the final step of each FIQR onboarding module ("Personal / Fitness / Nutrition"). Final-step CTA: "Save and continue". Add the reversibility footnote "You can change this anytime in Settings." in 13 pt navy at 60%.

### IMG_6876 - Generate Routine: choose a method

- **What it shows:**
  - A sheet with a close circle, the nav title "Generate Routine", and a settings gear circle.
  - "Choose a method" (about 24 pt semibold) plus a helper.
  - Two tall option cards (about 400 x 210 pt, radius about 24 pt):
    - "Step-by-step routine": its top half shows a mini illustration of stacked option rows with a checked one;
    - "Freeform routine": its top half shows a faded chat prompt, "What kind of workout do you want today? / 30 min all core - no upper or lower body".
  - A disabled "Continue".
- **Notable craft:** The option cards preview the interaction they lead to (a form vs a chat) using real UI fragments faded at the edges.
- **Why it works:** Users choose between structured and conversational input by seeing both, not by reading labels.
- **FIQR verdict:** ADOPT for the FIQR workout plan generator and meal logging entry: "Build step by step" vs "Tell Geo" (freeform chat). The preview fragments are just our own components scaled down with a gradient mask, which is cheap. This is a strong fit for the Geo positioning.

### IMG_6877 - Generating routine (loading)

- **What it shows:** A white sheet, mostly empty. Centre: three stacked skeleton exercise cards (dumbbell icon tile, two grey bars, a circle), the bottom one fading out. Then "Generating routine" (about 17 pt semibold, grey) and a 2-line grey explanation. No spinner.
- **Notable craft:** The loader is a preview of the result shape (exercise rows), presumably animated. Muted grey type keeps it calm.
- **Why it works:** A content-shaped loader sets the expectation of what is coming and feels faster than a spinner.
- **FIQR verdict:** ADOPT for any Geo generation wait (meal plan, workout plan, photo analysis). Use 3 skeleton rows shaped like the output (meal rows or set rows) with a shimmer via an animated background-position on a linear-gradient (GPU-cheap), and copy such as "Geo is building your plan".

### IMG_6878 - Routine editor (generated result)

- **What it shows:**
  - A sheet with a warm header wash, an x circle, and a "..." circle.
  - Title "Hypertrophy Power Builder" (about 22 pt semibold) with "7 exercises, 22 sets" in grey.
  - Exercise card "Back Squat / Barbell": a thumbnail tile, a black square timer button, and a "..." square button. A column header row reads SET / KG / REPS / REST (12 pt caps grey). Rows: a warm-up set (flame icon) and sets 1 to 3. Each row has a circular set badge and three outlined pill inputs ("70 kg", "10 reps", "02:00"), about 70 x 36 pt each.
  - The card footer has "Progression" and "+ Add Set", split by a divider.
  - A link icon between exercises (superset).
  - "Bench Press" card.
  - A bottom bar pairs a "Add Exercise" grey capsule with a "Save" black capsule, then the footnote "Does this routine look correct? If not, report an issue".
- **Notable craft:**
  - A spreadsheet-like grid uses pills rather than cells, so tap targets are clear.
  - Units sit inside the pills.
  - The warm-up set has an icon instead of a number.
  - Superset links are a connector icon on the gutter line.
  - The secondary and primary CTAs are side by side, with the secondary lighter.
- **Why it works:** It is dense but tappable, and the AI output is editable in place with a feedback escape hatch.
- **FIQR verdict:** ADOPT for the FIQR workout plan detail and live workout session set table. Use navy outlined pills with Archivo tabular-nums values, the set badge circle, and the warm-up icon. "Save" is the orange primary and "Add exercise" a navy-tint secondary. Include a "Report an issue with Geo's plan" footnote.

### IMG_6879 - Exercise detail sheet (Bent Over Row)

- **What it shows:**
  - A stacked sheet (the previous sheet is visible as a lip behind it, the iOS 26 stacked-sheet look) with a grabber.
  - Title "Bent Over Row" with "Barbell" in grey.
  - A large media frame (about 400 x 225 pt, 1 pt grey border, radius about 20 pt) with an anatomical render highlighting the target muscles in red.
  - Tabs "About / Guide" using an underline indicator (2 pt black).
  - Equipment: an orange icon tile plus "Barbell". Primary muscles: a black chip "Lats". Secondary muscles: grey outlined chips (Biceps, Upper Back, Forearm, Rotator Cuff, Shoulder).
  - A dashed-border "How to log" helper button with a lightbulb icon.
- **Notable craft:** Chip hierarchy is filled black for primary and outlined grey for secondary. The dashed button signals a tip or secondary help.
- **Why it works:** Primary vs secondary information is encoded in a single component's fill state.
- **FIQR verdict:** ADOPT for the FIQR exercise detail. Use navy filled chips for primary muscles and navy-outline chips for secondary, plus underline tabs. The media frame holds our exercise GIF or illustration. Reject the red muscle highlight unless it is recoloured to orange at an alpha (allowed tint) or navy.

### IMG_6880 - Fitness tab scrolled: Training Load and Cardio grid

- **What it shows:**
  - The collapsed header: calendar circle, "Fitness" inline title, "..." circle.
  - Two "Training Load" gauge cards (Cardio / Muscular, "Calibrating"): a semicircular tick-dial gauge (about 150 pt), a green optimal-zone arc on the outer rim, a needle with a grey knob, a big centred value "9" / "10" (about 30 pt), min/max labels "0" and "39", and "Optimal: 17 - 28" with a legend swatch.
  - "Cardio" section with an "Edit" underlined link. 2-col tiles:
    - "All Activities 11:08:26 Active Duration" (a blue step-line chart vs a grey baseline, with an endpoint dot glow);
    - "3,943 kcal Active Energy";
    - "VO2 Max 36.3 Poor" (orange line);
    - "Heart Rate Recovery 52 bpm Superior" (purple);
    - "Cardio Focus 50% Low Aerobic" (horizontal bars);
    - "Heart Rate Zones Zone 2 3h 49m" (a coloured bar histogram).
  - The tab bar is collapsed to a runner circle and "+".
- **Notable craft:**
  - Every tile follows the same anatomy (label + arrow, value, qualitative word in a status colour, chart bleeding to the card edges at the bottom).
  - Charts are borderless with no axes.
  - A glowing endpoint dot marks "now".
  - The comparison baseline is drawn in grey.
- **Why it works:** A consistent tile grammar makes a dense grid scannable. The qualitative word ("Poor", "Superior") does the interpretation.
- **FIQR verdict:**
  - ADOPT the tile grammar (label + arrow / value / qualitative word / edge-bleed sparkline) for FIQR's weekly check-in and progress screens (weight trend, average kcal, protein adherence, training volume).
  - Sparkline in navy, with this period vs a navy 20% baseline for the previous period. Endpoint dot in orange only if no orange CTA is on screen; otherwise navy.
  - REJECT the multicolour status words and zone histograms (palette).
  - ADAPT the optimal-zone gauge as a "target range" band for daily calories (band in navy 15%).

### IMG_6881 - Fitness tab scrolled: Strength and Muscle Freshness

- **What it shows:**
  - The top shows the ends of the Cardio Focus and HR Zones tiles.
  - "Strength" section with "Edit": tiles "All Muscles 0 Total Sets" and "0 kg Total Volume" (a flat orange line plus a glowing endpoint).
  - A wide "Muscle Freshness" card: a 2-col list (Chest, Lats, Biceps, Triceps, Quads, Glutes), each with a small anatomical muscle thumbnail (grey, or green when active), "100% recovered", and a 10-dot capsule meter.
  - A hairline divider, then an "Edit Fitness" full-width grey capsule.
  - The collapsed tab bar circles.
- **Notable craft:** A 10-step dot meter is reused again as a design-system primitive. The muscle thumbnails are monochrome except for the highlighted state. The edit affordance sits at the end of the content.
- **Why it works:** Reuse of one meter primitive across the app builds instant literacy.
- **FIQR verdict:** ADAPT. Adopt "one meter primitive used everywhere": the FIQR segmented or dot meter goes on macros, water, workout progress and plan adherence. Muscle freshness is out of scope for v1 (REJECT for now). "Edit <tab>" at the bottom is a nice pattern for customisable dashboards later.

### IMG_6882 - Global "+" quick-action menu

- **What it shows:**
  - The background dims slightly. A "Tap and hold to edit" glass tooltip pill with an x.
  - A large floating glass panel (about 400 x 315 pt, radius about 32 pt) with a 3x3 grid of 56 pt white circular icon buttons and 15 pt labels: Describe food, Import food, Capture food, Scan food, Ask Bevel (a glowing blue-violet blob mascot with eyes), Search food, Generate routine, View routines, Log activity.
  - The "+" button morphs into an "x". The tab bar stays visible.
- **Notable craft:**
  - The panel grows from the "+" (the iOS 26 morph).
  - The AI assistant sits dead centre as a character, not an icon.
  - Food logging has 5 entry methods grouped in the top rows.
  - The grid is editable (tap and hold).
- **Why it works:** One global entry point for every "log" action, with the AI in the visual centre, teaches users that the assistant is the hub.
- **FIQR verdict:** ADOPT, as the most important pattern for FIQR.
  - The detached "+" opens a quick-action sheet: Photo meal, Describe meal, Barcode, Search food, Ask Geo (centre, Geo avatar), Quick add kcal, Start workout, Log weight, Check-in.
  - Build it as a white panel with a navy 6% backdrop instead of glass for perf.
  - Icons are navy line glyphs on cream circles. Geo's slot is the one place the orange accent appears: an orange ring, or Geo's mark.
  - REJECT copying the blob mascot look (trade dress).

### IMG_6883 - Fitness tab, past day with activity

- **What it shows:** The same Fitness tab with the day carousel scrolled back (14 to 20), and purple dancer activity icons on active days. A "Sat, 17 October" section header with a weather pill and "+". An activity card: dancer icon on a lavender circle, "9:44 PM / Dancing", and inline stats "60% (strain ring icon) / 2:18:50 (clock) / 915 kcal (flame)" with tiny 12 pt glyphs. "Routines" has "..." and "+" circles, a dashed "Edit pins" tile, and a grey "See all >" tile. A "->" arrow overlay at the carousel edge jumps to today.
- **Notable craft:** Inline stat groups use micro icons plus values in grey, separated by spacing, not dividers. The carousel edge arrow shows the way back to today.
- **Why it works:** History browsing keeps the same layout as today, so there is zero relearning.
- **FIQR verdict:** ADOPT the inline micro-icon stat line for FIQR food diary meal rows ("620 kcal / P 42g / C 55g / F 18g"), with the C and F values in teal and ochre text and the rest navy at 60%. ADOPT a "back to today" affordance on the date strip.

### IMG_6884 - Activity calendar (month view, by day)

- **What it shows:**
  - A full-screen modal: an x circle, a "By Metric >" glass pill, and a filter circle.
  - "August 2026 ^" (about 26 pt semibold).
  - Weekday headers (Sat in blue).
  - A month grid whose days with activity show a coloured activity icon in a tinted circle (about 44 pt) instead of the numeral. The selected day (13) gets a 2 pt blue ring. A "2" count badge marks a day with multiple activities.
  - The grid card has a rounded bottom (radius about 32 pt) over the list below.
  - The list below holds day sections ("Thu, 13 August" plus a weather pill and "+"), an activity card (Outdoor Run 33%, 2.06 km, 127 kcal), and dashed "Rest Day" cards.
  - A floating "Today" glass pill at bottom left and "+" at bottom right.
- **Notable craft:** The day cell becomes the data (an icon replaces the number). The calendar and list are linked. The floating "Today" pill is a return-to-now control.
- **Why it works:** The month heatmap with icons answers "how consistent was I" at a glance, and the tap-to-scroll list gives the details.
- **FIQR verdict:** ADAPT for the FIQR food diary history and workout history.
  - Month grid where logged days show a navy filled dot or mini ring (calorie adherence fill) instead of icons.
  - Selected-day ring in orange (thin, no fill), or navy if the screen has an orange CTA.
  - A floating "Today" pill.
  - REJECT the multicolour per-activity icons.

### IMG_6885 - Activity calendar, different day selected

- **What it shows:** The same calendar with Fri 21 (badminton, orange tint) selected via the blue ring, and the list scrolled to "Fri, 21 August" (Badminton 46%, 1:16:56, 626 kcal), Sat 22 (Dancing), and Sun 23 (Outdoor Cycle 22%, 5.08 km, 96 kcal). The grid stays pinned while the list scrolls.
- **Notable craft:** The calendar stays fixed as a header while the list scrolls (sticky). The selection ring and list scroll position stay in sync. Each activity type has a consistent hue across the grid and list.
- **Why it works:** Bidirectional sync between overview and detail keeps the user oriented.
- **FIQR verdict:** ADOPT the sticky month grid plus a synced scrolling day list for diary history. Use `position: sticky` and `scrollIntoView` (cheap). Use a single-hue (navy) encoding.

### IMG_6886 - "Bevel Intelligence" feature intro

- **What it shows:**
  - A soft lavender-to-white vertical gradient with a faint large circular glow behind the content.
  - "Introducing the new" (17 pt grey), then "Bevel Intelligence" (about 34 pt bold).
  - A tilted collage of white cards with 3D-ish icons ("Build workouts and training plans", "Improved food logging", "Analyze your health data"), a blue chat bubble "What's impacting my deep sleep?", a thumbs-up blue circle, and floating faded calendar, clipboard and chart icons at the edges.
  - A 3-line grey description, then a black "Continue ->" capsule.
- **Notable craft:** Slight rotations (about -3 to 4 degrees) and overlaps make a static screen feel alive. The chat bubble shows the AI's interface (a question) instead of describing it.
- **Why it works:** Showing a sample question teaches users what to ask the AI, which is the biggest barrier to adoption for chat features.
- **FIQR verdict:** ADAPT for the Geo intro screen (first open of the Geo tab, or in onboarding). Use 3 white capability cards with a slight tilt over cream, and one sample prompt as a navy chat bubble ("Hit my protein with what's in my fridge?"). CTA "Meet Geo" in orange. REJECT the lavender gradient and blue bubble (palette), and keep the tilts to static CSS transforms only (no animated 3D on Android).

### IMG_6887 - "Bevel Intelligence can:" capability list

- **What it shows:** The same lavender gradient. "Bevel Intelligence can:" (about 26 pt bold, centred). Six rows, each with a 3D-ish clay icon tile (about 64 pt) on the left, a bold 18 pt title, and a 2-line grey description: Create check ins, Understand your trends, Create workout templates, Log food, Create a training plan, Understand health records. A black "Continue ->" floats at the bottom over the last row.
- **Notable craft:** Rows are spaced about 120 pt apart with no cards, just an icon and text. Icons are rich illustrations, the copy is short and verb-led.
- **Why it works:** Verb-first capability statements set realistic AI expectations and double as a menu of prompts.
- **FIQR verdict:** ADOPT the copy structure for "Geo can:" (Log a meal from a photo, Adjust your macros, Build your workout, Run your weekly check-in, Answer nutrition questions). Use flat navy-on-cream icon tiles. Make each row tappable to start that chat with a prefilled prompt, which improves on Bevel's static list.

---

## Cross-cutting patterns (part A)

1. **Floating split tab bar plus detached action button.** A capsule tab bar (about 328 x 60 pt, 4 items, filled 22 pt glyphs, 12 pt labels, selected item in a tinted inner capsule) and a separate 60 pt circular "+" on the right. It collapses to two 48 pt circles on scroll down.
   - CSS: `position:fixed; bottom:calc(env(safe-area-inset-bottom) + 8px); border-radius:9999px; background:rgb(255 255 255 / .82); backdrop-filter:blur(16px) saturate(1.4); box-shadow:0 8px 24px rgb(17 28 53 / .12);` Collapse with `transform:scale()` and `opacity` on the labels.
   - Perf: blur one fixed element only. On low-end Android (detect via `navigator.hardwareConcurrency <= 4` or a class from Capacitor's device info), drop the blur and use `rgb(255 255 255 / .96)`. Never animate `backdrop-filter` values.

2. **Global "+" quick-action hub with the AI in the centre.** One entry point for every logging method. The panel grows from the button, and the assistant sits in the middle cell.
   - CSS: a panel with `transform-origin: bottom right; transition: transform 200ms cubic-bezier(.2,.8,.2,1), opacity 150ms;` from `scale(.6)` to `scale(1)`, plus a solid white panel and a navy/6% scrim.
   - Perf: transform and opacity only (compositor). Avoid blur on the scrim, since a full-screen blur is the most expensive thing you can do in a WebView.

3. **Card system.** A white card on an off-white background, radius 24 pt (major) / 20 pt (tile) / 16 pt (row), with a soft shadow and no borders. A selected state adds a 1.5 pt ink border, never a colour fill.
   - CSS: `--r-card:24px; --r-tile:20px; --r-row:16px; box-shadow:0 1px 2px rgb(17 28 53/.04), 0 6px 20px rgb(17 28 53/.06);`
   - Perf: static box-shadows are fine. Avoid large blur radii on hundreds of list items (use `content-visibility:auto` on long diary lists).

4. **Metric tile grammar.** Label + arrow (top), big value + small grey unit, qualitative status word, then an edge-bleed sparkline or meter at the bottom.
   - CSS: grid, `font-variant-numeric: tabular-nums`, value `font: 600 28px/1 Archivo`, unit `0.55em` navy at 55%. The sparkline is an inline SVG with `preserveAspectRatio="none"` bleeding to the card edge (`margin: 0 -16px -16px`).
   - Perf: inline SVG paths are cheap. Precompute paths server-side or in a memo, and do not use a chart library per tile.

5. **One meter primitive reused everywhere.** Segmented capsules (energy, freshness) and dot matrices (macros) instead of thin progress bars.
   - CSS: `display:grid; grid-template-columns:repeat(10,1fr); gap:4px;` children `height:8px; border-radius:9999px; background:var(--c) at 15%;` filled children at full colour.
   - Perf: plain divs, trivially cheap. Prefer a single SVG over 60+ divs when there are many dots.

6. **Ring gauges with an attached coaching text.** Rings (about 100 pt, 10 pt round-cap stroke, light track), with a number inside. A plain-language "COACHING" block lives in the same card directly below.
   - CSS: SVG `circle` with `stroke-dasharray`/`stroke-dashoffset` and `transition: stroke-dashoffset 600ms ease-out` on mount. The caps label is `12px/1 Archivo 600; letter-spacing:.06em; text-transform:uppercase`.
   - Perf: animate dashoffset once on mount only. Do not animate on every re-render. Skip gradient strokes (FIQR uses solid macro colours anyway).

7. **One-question-per-screen wizard with option cards.** A centred question (22 pt semibold) plus a helper line, large option rows (glyph, title, description), single-select by border and check, multi-select by square checkbox. The CTA is disabled until valid, a reassurance footnote sits under the final CTA, and a "Save and continue" label marks the last step.
   - CSS: `button[aria-pressed=true]{outline:1.5px solid #111C35; outline-offset:-1.5px}`. A floating CTA over the list uses a `mask-image: linear-gradient(to top, #000 70%, transparent)` fade.
   - Perf: free. Use `outline` (not border) to avoid layout shift on selection.

8. **Floating inset sheets and stacked sheets.** Sheets inset about 8 pt from the edges with a large radius (about 32 to 40 pt), concentric with the device. A grabber and a 44 pt circular close button. A previous sheet peeks behind the current one.
   - CSS: `position:fixed; inset:auto 8px calc(env(safe-area-inset-bottom)+8px); border-radius:32px; transform:translateY(100%)` to `0`. For a stacked sheet, scale the sheet behind to `.94` and translate it up 10px.
   - Perf: translate only. The dim scrim should be a solid rgba, not a blur.

9. **Scroll-collapsing chrome.** The large title (26 to 28 pt) collapses into an inline 17 pt nav title, the header actions float as glass circles over content, and the tab bar minimises.
   - CSS: an IntersectionObserver on a sentinel above the title toggles `.is-condensed`. Floating 44 pt circles use `background:rgb(255 255 255/.85)` and a small shadow.
   - Perf: use IntersectionObserver, not scroll listeners. Debounce nothing. Toggle one class.

10. **Week / day strip with completion state and a "today" marker.** Day capsules (weekday letter, date, status glyph). Today is a lifted white capsule or a triangle notch on a tick ruler, future days are dashed, completed days get a check badge, and a jump-to-today affordance is provided.
    - CSS: horizontal `overflow-x:auto; scroll-snap-type:x mandatory;` capsules `scroll-snap-align:center`. Today gets `box-shadow` and a 6px orange triangle via `::before`.
    - Perf: native overflow scroll is fine. Avoid JS-driven scroll animations, and hide the scrollbar via `scrollbar-width:none`.

11. **Content-shaped loaders and ghost empty states.** AI generation shows skeletons shaped like the output. Empty sections keep their full layout with dashes or a dashed-border slot plus one CTA, and never collapse.
    - CSS: skeleton bars with `background: linear-gradient(90deg, navy/6%, navy/10%, navy/6%) 0 0/200% 100%; animation: shimmer 1.2s linear infinite` (animating `background-position`). Empty slots use `border:1.5px dashed rgb(17 28 53/.18)`.
    - Perf: background-position animation repaints. Limit it to 3 skeleton rows and use `prefers-reduced-motion` to stop it. Alternatively animate a `transform: translateX` overlay, which is compositor-only and preferred on Android.

12. **Ambient per-tab header wash.** Each tab has a soft gradient wash behind the top 160 pt that fades into the page background, giving each tab an identity without colouring the components.
    - CSS: `body::before{content:''; position:fixed; inset:0 0 auto; height:180px; background:linear-gradient(#FDF6EC, transparent); pointer-events:none}`. FIQR is limited to cream and navy/orange alpha tints.
    - Perf: a static gradient is free. Do not blur it, and do not make it parallax.

**Patterns seen but rejected for FIQR:** native refractive lens tab selection (IMG_6866), skeuomorphic clay and emboss illustrations (IMG_6856, 6860, 6863, 6887), multicolour status palettes and gradient arcs (throughout), and the AI blob mascot styling (IMG_6882). The reasons are no WebView equivalent or too slow on Android, palette constraint, or trade-dress risk.
