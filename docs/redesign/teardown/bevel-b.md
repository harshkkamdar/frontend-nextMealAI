# Bevel teardown, part B (IMG_6888 - IMG_6918)

Source: `/Users/veddsavla/Downloads/inspiration for FIQR/BEVEL/`, 31 screenshots, iOS 26 Liquid Glass era. Full screenshots are 1320 x 2868 px (440 x 956 pt). Crops (6902, 6908-6912, 6914) are 1320 px wide. All measurements are estimates in iOS points (px / 3).

FIQR constraints used for verdicts: Archivo only; ink `#111C35`, orange `#E8622A`, cream `#FDF6EC`, white `#FFFFFF`; teal `#3E7C77` carbs only, ochre `#A07A3C` fat only; alpha tints of the four maybe; one orange primary per screen; no dark mode; glass is CSS `backdrop-filter` inside a Capacitor WebView that must stay fast on low-end Android.

Recurring Bevel constants seen across the set (referenced below so each section stays short):
- Page gutter 20 pt. Card gap 10-12 pt. Section header to card 16 pt. Section to section 32-40 pt.
- Card radius 20 pt (list rows 18 pt, sheet top 32-36 pt, pills fully round).
- Page background is a cool off-white (about #F4F4F8); cards are pure white with a very soft, wide shadow (about 0 4 20 rgba(0,0,0,0.04)) and a 1 px near-white rim, so they read as "lifted paper", not glass.
- Glass is used only on chrome that floats over content: top nav button capsules, the bottom tab bar, the + button, the floating search field, the action menu panel.
- Type: one sans (SF Pro) in roughly 5 sizes: 34 pt numbers, 24 pt screen title, 20 pt section header, 17 pt body/row, 13-15 pt labels. Weights: semibold for titles and numbers, medium/regular grey for labels.

---

### IMG_6888 - Onboarding: Select a personality

- What it shows: full-bleed onboarding step. Lilac-to-white vertical gradient at top fading to off-white. Centered title "Select a personality" (about 24 pt semibold) at y≈168 pt. Large blurred lavender orb mascot (about 230 pt wide) with two white oval eyes, soft outer glow, faint concentric ring backgrounds behind it. A white speech bubble with tail, slightly rotated (about -2 deg), sample line "You're doing great! Small steps like this really add up." Below, the persona name "Friend" (about 24 pt semibold, grey) as a carousel label. Bottom: full-width black capsule "Get started ->" (about 52 pt tall, 20 pt side margin, white 17 pt semibold text).
- Notable craft: the mascot is the hierarchy device, not the title. The rotated bubble adds life without animation. The persona is previewed by its voice (a sample sentence), not described. Only one button; no nav chrome at all.
- Why it works: it sells the coach's personality by showing a line of its copy, which is more persuasive than a list of adjectives.
- FIQR verdict: ADAPT. Maps to onboarding "choose Geo's tone" step (and the backend `geo_personality` setting). Keep: a large Geo avatar, a sample message bubble in the chosen tone, a swipeable persona name, one bottom primary. Change: avatar uses ink + cream (an orange tint ring at most), the bubble is a white card on cream, CTA is the single orange primary. Do not copy the blurry two-eyed blob: it is Bevel's mascot trade dress. Replace the CSS blur glow with a static radial-gradient (cheaper than `filter: blur` on Android).

### IMG_6889 - Calendar sheet: month of Recovery rings

- What it shows: modal sheet (top radius about 32 pt) over a dimmed home. Header "October 2026" with chevron-down (about 22 pt semibold), prev/next round buttons (about 34 pt) on the right. Horizontal scroll of metric chips: Strain, Recovery (selected, black fill, white text), Sleep, Stress, Energy, Nu(trition) clipped at the edge. Weekday row in grey. 7-column grid of tall rounded capsules (about 40 x 76 pt, radius 20 pt, hairline border), each with a small ring (about 30 pt) above the day number. Ring colour encodes score: red, yellow, green; empty grey for no data; future days faded. Today (24) is blue text and raised with a shadow. Bottom-left floating "Today" capsule (blue text), bottom-right round info button.
- Notable craft: the clipped last chip signals horizontal scroll. The capsule-per-day keeps the grid airy while giving each day a tap target well over 44 pt tall. Score-as-ring repeats the main dashboard ring language.
- Why it works: a month of adherence becomes a scan-in-one-glance heatmap while still being a normal calendar.
- FIQR verdict: ADAPT. Maps to Food diary date picker and Weekly check-in history. Chips: Calories, Protein, Carbs, Fat, Workouts. Ring fill = % of daily target hit; colour must stay in palette: orange ring for calories/protein, teal for carbs chip, ochre for fat chip, ink for workouts; no traffic-light red/yellow/green (not in palette). Today marked with an ink outline, not blue. Use SVG `stroke-dasharray` rings; render 31 small SVGs, fine on Android.

### IMG_6890 - Nutrition detail, top (locked score)

- What it shows: pushed detail page. Top chrome: left round glass back button (about 44 pt), right glass capsule holding share, info, more (about 160 x 44 pt). Centered title "Nutrition" (about 24 pt semibold) with "Today, 24 October v" subtitle (17 pt grey) acting as a date switcher. Hero: a skeuomorphic dial (about 160 pt) with tick ring and padlock in the middle. Caption "Log 728 kcal to unlock today's Nutrition score." with the number in darker weight. Two half-width cards "Food Quality" / "Glucose Impact" with icon + label header, hairline divider, dash placeholder. "My Foods" card with a ring-binder graphic on its left edge, "0 favorites · 0 recipes · 0 foods", arrow. Promo card "Goals for nutrition" with a multicolour ring illustration over faded food icons and an outlined "Disable" button. "Nutritional Details" card starting, with a g/% segmented toggle. Bottom: floating round Home button (left, about 48 pt) and round + button (right).
- Notable craft: the empty state is a goal ("log 728 kcal to unlock"), not a blank. Bold number inside grey sentence is the hierarchy device. Cards share one radius and one shadow. Chrome capsules group 3 secondary actions into one glass pill.
- Why it works: it turns missing data into a concrete next action with a number, which drives logging.
- FIQR verdict: ADAPT. Maps to Today/home calories hero. Adopt the "Log N kcal to ..." pattern for early-day state ("Log breakfast to start today's ring" or "1,240 kcal left"). Adopt the grouped right-side action capsule. Reject the padlock/gamified lock (we should never withhold the user's own numbers). Reject the ring-binder decoration (Bevel-specific). Date subtitle as switcher: adopt.

### IMG_6891 - Nutrition detail, scrolled (macros, net energy, contributors)

- What it shows: after scroll, the title collapses into the left nav capsule ("< Nutrition", the back button and title fused into one glass pill about 44 pt tall) while the right action capsule stays. "Nutritional Details" card: three dot-matrix grids (about 14 x 8 dots, 4 pt dots, each tinted per macro: lavender Fat, amber Carbs, pink Protein), each with "0g" (22 pt semibold) and coloured label (17 pt). "Net Energy" card: "-880 kcal" (about 22 pt semibold), "Net Energy" grey, right side flame 880 / apple 0 in colour, then an orange-to-violet gradient bar with a thumb and axis ticks -900 / -450 / 0 / 450 / 900. Section header "Food Quality Contributors (i)" (20 pt semibold) then list rows (about 50 pt tall, radius 18, 10 pt gap): emoji icon, label, a mini slider track, "+0", arrow. Floating Home and + buttons; a "v" hint in the centre.
- Notable craft: dot-matrix is a quiet unit visualisation where each dot fills as you eat. Each macro owns one colour across label and dots. Nav title collapse into the back pill saves a whole header row. Rows are individual cards (not a grouped list), giving each a lift.
- Why it works: the scroll-collapse keeps context with almost no chrome, and one colour per macro makes the three numbers instantly attributable.
- FIQR verdict: ADAPT. Maps to Today macros card and Food diary day summary. Use the dot-matrix (or a simpler segmented bar) with protein = orange, carbs = teal, fat = ochre, and colour only the label, never the number. Adopt the collapsing title into the back capsule. Net-energy gradient bar: REJECT the rainbow gradient (off-palette); if wanted, a single ink track with orange marker. Emoji icons: reject (inconsistent rendering on Android; use one line-icon set).

### IMG_6892 - Nutritional Goals sheet, top (chart)

- What it shows: modal sheet (top radius about 32 pt). Header row: round X (left), centered "Nutritional Goals" (17 pt semibold), round gear (right). Large "0 kcal" (about 36 pt semibold) with "24 Oct 2026" grey beneath. Segmented chips Calories (black selected) / Fat / Carbs / Protein. Bar chart with right-aligned y-axis labels (2K, 1.33K, 667, 0) and hairline gridlines bleeding to the screen edges, short rounded bars (today's in violet, past in pale lavender), x labels 21/10 ... 24/10. Range control: round prev, grey capsule "24 Sep - 24 Oct 2026", calendar button, next. Divider, then grey section "Macronutrients" with a promo card "Track calories and macros" + black "Set nutrition goal" pill and a decorative cluster of mini rings "550 left", "80g", "20g".
- Notable craft: the selected chip is the only black element; numbers are left-aligned and huge; axis labels on the right keep the chart's start clean. Range pill reads like a single control.
- Why it works: big current value + metric chips + chart is the standard health-app trend layout and needs no explanation.
- FIQR verdict: ADOPT (structure). Maps to Weekly check-in and Food diary trends. Big number in Archivo 34-36 pt semibold ink, chips with ink selected state, bars in orange (calories/protein), teal (carbs), ochre (fat), with past days as 20% alpha tint (if alpha tints get approved; else ink at low weight). Promo card with decorative rings: adapt as the goal-setup empty state; its button is our one orange primary.

### IMG_6893 - Nutritional Goals sheet, scrolled (targets and limits)

- What it shows: the chart scrolls away; the date range control pins under the sheet header (sticky). Sections: "Macronutrients" promo card; "Target Nutrients / Aim to meet or exceed" with a skeleton-row empty state ("No Target Goals" + black "+ Add goals" pill overlaid on two ghost rows); "Limit Nutrients / Aim to stay near or below" with a gear and rows Caffeine "0% · 400mg left" and Alcohol "0% · 0 drinks left", each with a ring-around-icon (about 44 pt) and chevron. Row cards are fully pill-shaped (radius about 36 pt, about 72 pt tall).
- Notable craft: section subtitles explain the rule ("meet or exceed" vs "stay near or below") in 4 words. Skeleton ghost rows as an empty state show what will appear. "left" phrasing over "consumed".
- Why it works: framing targets vs limits separately removes ambiguity about whether more is better.
- FIQR verdict: ADOPT. Maps to Settings > Nutrition targets and the Today "remaining" phrasing. Use "X left" copy everywhere for calories and macros. Ghost-row empty state: adopt with cream ghost bars. Sticky range control: adopt with `position: sticky` (cheap).

### IMG_6894 - Nutrition detail, mid scroll (g / % toggle)

- What it shows: same Nutrition page with the "< Nutrition" collapsed capsule; content scrolls under it (the goals card ring shows blurred behind the glass). Goals card with full-width outlined "Disable" button (about 34 pt tall, radius 12). Nutritional Details now in % mode ("0%"), toggle knob moved to "%". Net Energy card and contributor rows as in 6891. Bottom Home and + float over a fading Fruit row.
- Notable craft: content visibly passes under the top chrome, which proves the glass; the chrome itself has no bar background, only the capsules. Unit toggle is a small 2-segment pill with a white knob.
- Why it works: removing the full-width navbar and keeping only floating capsules gives the page full height while staying navigable.
- FIQR verdict: ADAPT. Maps to all pushed detail pages. Floating capsules instead of a navbar: adopt, but on Android low-end, swap backdrop-filter for an opaque white 92% capsule with shadow (see part B). g/% toggle: adopt for the macros card.

### IMG_6895 - Food Quality Contributors, full list

- What it shows: long list of contributor rows: Vegetables, Whole grains, Healthy oils, Fruit, Nuts/Legumes, Omega-3s (positive, "+0") then Red meat, Excess sodium, Processed meat, Alcohol, Excess sugar (negative, "-0"), some with a threshold tick on the mini track. A "^" collapse row at the end, "Safe threshold" legend peeking. Floating Home / + buttons.
- Notable craft: a consistent row grammar (icon, label, track, value, arrow) repeated 11 times; positive and negative share layout and differ only by sign. Threshold tick on the track is a nice, minimal limit marker.
- Why it works: the same row shape for good and bad items makes the list scannable and fair.
- FIQR verdict: REJECT for now. Food-quality scoring per category is not a FIQR job and the +/- scoring risks moralising food. If a "food groups" view is ever added, reuse the row grammar and threshold tick only.

### IMG_6896 - Nutrition Trends section

- What it shows: "Trends" header and full-width cards: Nutrition Score (No data), Macro Balance ("0 gram"), Net Energy ("-880 kcal" big, "Deficit" orange, and a mini bar sparkline of 8 orange bars on the right), Morning Fasting Glucose, Average Glucose, Glucose Variability (all "No data / (x) No trends available"). Each card: small grey icon + label (15 pt), big value (about 30 pt semibold, unit in lighter grey smaller), status line, top-right arrow.
- Notable craft: value + unit split (unit at about 60% size, grey) is the core number style. Status word colour-coded under the value. Empty cards keep the exact same height and layout, so the grid never jumps.
- Why it works: identical card skeleton for empty and populated data keeps the page stable and predictable.
- FIQR verdict: ADOPT the trend card. Maps to Weekly check-in (Avg calories, Avg protein, Weight trend, Workouts done). Number in ink, unit grey-ink at 60% alpha, status line ink or orange. Sparkline bars in orange. Skip glucose cards (no data source).

### IMG_6897 - "How it works: Nutrition Score" explainer, top

- What it shows: modal sheet with a soft lilac/pink top tint. Round X top-left. Hero: a large tick-ring dial with blue gradient ticks, floating 3D food emoji tiles (sandwich, broccoli) as rounded-square chips. "How it works" (17 pt grey), "Nutrition Score" (about 28 pt semibold), centered paragraph. Then numbered step cards: badge "1" (grey circle), illustration (locked dial with ghost food rows), caption sentence in 17 pt medium centered. Card "2": three mini contributor rows showing +7, +5, -3 with green/orange tracks over faint up/down arrows.
- Notable craft: each step is a card with a number badge, a picture, and one sentence. Illustrations are made from the app's own components (dial, rows), so the explainer teaches the real UI.
- Why it works: teaching with real UI fragments transfers directly to the screen the user will see.
- FIQR verdict: ADAPT. Maps to first-run explainers ("How Geo builds your plan", "How macros are calculated"). Numbered cards with a real component snippet + one sentence. Use static SVG/HTML snippets, no 3D emoji tiles, no pastel gradient wash (use cream background).

### IMG_6898 - Explainer continued + eating-disorder note

- What it shows: step 3 card: glucose line chart (green to yellow to red gradient, dotted segment, value tags 90 / 178 / 139 in pills), "Optional" outlined pill, caption "Connect a CGM device to monitor Glucose Impact." Step 4 card: big score dial "82 optimal" between a ghost fork and knife, caption. Then a plain text block "A Note on Eating Disorders" (17 pt semibold heading, 17 pt grey body, generous line height).
- Notable craft: "Optional" pill de-pressures hardware steps. The safety note is plain text, not a card, set apart by its lack of chrome; it is calm and readable.
- Why it works: a responsible health note placed at the end of the explainer is visible without alarming.
- FIQR verdict: ADOPT the eating-disorder note pattern (copy reviewed by the client) at the end of the nutrition explainer and in Settings. ADAPT the "Optional" pill for optional onboarding steps. Reject the plate/fork illustration and the traffic-light glucose gradient.

### IMG_6899 - Calendar sheet, dark mode (sleep rings)

- What it shows: same month calendar as 6889, but in dark navy theme with sleep rings in periwinkle/violet; no metric chips row. Today ring in saturated violet; future days dim.
- Notable craft: identical geometry across themes; ring colour is the only change per metric.
- Why it works: theme and metric swap without any layout change, proving the component is well factored.
- FIQR verdict: REJECT. No dark mode in FIQR. The only takeaway (geometry independent of colour) is already covered by 6889.

### IMG_6900 - Sleep detail, top (scenic hero, dark)

- What it shows: dark sleep page over a night-mountain photo. Top chrome: glass back button, centered "Syncing..." glass capsule with spinner, right glass capsule (share, alarm). "Sleep" title + "Today, 24 October v". Big ring "85% Quality" (about 180 pt, gradient violet stroke, number about 40 pt semibold with small "%"). Two half cards Time in Bed 7h 30m / Time Asleep 7h 21m (header row with icon + label, divider, big value). "Coaching" card with a one-sentence AI note. "View insights" row with sparkle icon. Wind down 10:06 PM / Target bedtime 10:36 PM split card, and a 24 h clock-dial with a bed-to-alarm arc.
- Notable craft: sync status lives in the nav as a temporary capsule, not a toast. The coaching card is plain text under a small grey label; no avatar, no bubble. Percent sign set at about 55% of the number size.
- Why it works: the AI coach line sits right under the data it explains, so it reads as interpretation, not chat.
- FIQR verdict: ADAPT. Maps to Today page "Geo says" card: small label "Geo" + one sentence under the calories ring, linking into chat. Adopt small-% / small-unit number styling. Adopt sync/offline status as a nav capsule. Reject the photo hero and dark theme (no dark mode, image weight in WebView).

### IMG_6901 - Sleep detail, metric list (dark)

- What it shows: collapsed nav (glass back, centered "Sleep", right capsule) with content blurring underneath. Stack of metric cards (about 104 pt tall): small icon + label, big value (about 30 pt semibold), status with filled icon (green "Normal range", blue "Above normal", orange "Debt"), and on the right a sparkline with a shaded normal band and a glowing end dot.
- Notable craft: the "normal band" behind each sparkline gives instant context for the latest point; end dot marks today. Status is icon + word in colour, so it is not colour-only.
- Why it works: band + endpoint answers "is today normal for me" without axis labels.
- FIQR verdict: ADAPT. Maps to Weekly check-in rows (weight, avg protein, adherence). Sparkline with a target band (ink 8% fill) and an orange end dot; status word + icon in ink, orange only for "off target". Light theme only.

### IMG_6902 - Home footer: Edit Home / View All Categories

- What it shows: crop of the home page bottom: two full-width secondary buttons "Edit Home" and "View All Categories" (about 47 pt tall, radius about 24 pt, very light grey fill with white rim and soft shadow, 17 pt semibold ink text). Below, the collapsed tab state: round Home (about 48 pt) bottom-left, round + bottom-right, both white with soft shadow.
- Notable craft: end-of-feed actions are deliberately quiet (grey on grey). The tab bar collapses to just two orbs when scrolled, freeing the whole width.
- Why it works: the page ends with a way to customise it, placed where the user lands after scrolling everything.
- FIQR verdict: ADAPT. Maps to Today page footer ("Edit Today" later, "See full diary" now) as quiet secondary buttons on cream. The collapse-to-orbs tab bar: see 6910/6911 and part B.

### IMG_6903 - Edit Home mode (top)

- What it shows: edit mode of the home feed. Top: white "Cancel" capsule (left) and black "Save" capsule (right), both about 44 pt tall, floating. Each module is wrapped in a larger pale container (radius about 28 pt) with a round "-" remove badge on its top-left corner overlapping the edge. Modules: Daily Overview (three rings Strain 1% hatched yellow, Recovery 76% green gradient, Sleep 85% violet gradient, with "COACHING" label and sentence), Stress & Energy (stats 19/0/5 + small gauge "1 Low", energy bar of vertical green ticks 86%), Nutrition (locked dial + 3 dot-matrices + "Blood glucose - mmol/L").
- Notable craft: iOS home-screen edit grammar (remove badges) applied to cards. Coaching label in small caps grey tracking. Energy bar made of discrete ticks rather than a smooth fill.
- Why it works: it reuses a mental model everyone has from rearranging app icons.
- FIQR verdict: REJECT for v1. Customisable dashboard is out of scope and adds state/perf cost. Keep the small-caps label style ("GEO") and the tick-bar idea as a progress style for water or steps if ever needed.

### IMG_6904 - Edit Home mode (bottom)

- What it shows: Health Monitor tiles in a 2-column grid (about 200 x 106 pt each, radius 20): icon + label (RR, RHR, HRV, SpO2, Temp, Sleep), big value + small unit, green "Normal" status, a vertical mini range gauge with a dot on the right, and a 2x3 drag-handle dot grid. "Edit >" link. Timeline module with "Primary sleep" row and a full-width grey "View timeline" button. Dashed-border "Add card" placeholder (dashed 1 pt, radius 20, about 100 pt tall) with a grey + circle. "Reset to default" grey text link.
- Notable craft: the vertical range gauge is a compact "where am I in normal range" glyph. The dashed add tile is a clear affordance.
- Why it works: compact tiles show value, status and position-in-range in about 200 x 106 pt.
- FIQR verdict: ADAPT the 2-column stat tile for Workout summary (Sets, Volume, Duration, Avg RPE) with ink numbers. Dashed "Add" tile: adopt for "Add meal" slots in Food diary (empty breakfast/lunch/dinner). Reject the customisation layer.

### IMG_6905 - Add card sheet (top)

- What it shows: modal sheet "Add card" with round X. Section headers with chevrons (Daily Overview >, Stress & Energy >, Nutrition >) separated by hairlines, each followed by a live preview of the card.
- Notable craft: catalog shows real previews, not icons or names.
- Why it works: WYSIWYG choice removes guessing.
- FIQR verdict: REJECT (no dashboard customisation in scope). Principle "preview the real component" noted for any future picker.

### IMG_6906 - Add card sheet (scrolled)

- What it shows: same sheet scrolled: Health Monitor 2x3 tiles (now with filled teal-green range bars), Cardio Load card ("9 Calibrating" with a violet line + shaded band chart ending in a grey dot), Timeline card.
- Notable craft: "Calibrating" as an honest early-data state; line chart with shaded expected band.
- Why it works: it sets expectations when data is too thin, instead of showing a fake number.
- FIQR verdict: ADAPT the "Calibrating" state: first week of weight/TDEE estimates shows "Calibrating - 3 more weigh-ins" instead of a number. Rest REJECT (same as 6905).

### IMG_6907 - Home (Today), live

- What it shows: home page. Top chrome: centered green "Sync Complete" capsule (temporary), right glass capsule (share + avatar "VS" circle). Large left-aligned title "Today, 24 October v" (about 28 pt semibold) as a date switcher. Row: "Active / Until changed" status capsule with a green round icon and chevron (about 300 x 44 pt), weather capsule "33°C Mumbai". Daily Overview card with three rings and a "COACHING" sentence. "Stress & Energy" section. "Nutrition / Today's foods" card. Floating Home and + orbs.
- Notable craft: the home is a vertical feed of sections, each a header + one or two cards. Rings are the top-level summary; coaching sentence sits directly under them. Status capsule row gives context (mode, weather) without cards.
- Why it works: three rings answer "how am I today" in under a second, and the coaching line answers "so what".
- FIQR verdict: ADAPT. Maps to Today. Hero: one large calories ring (orange) + three small macro rings or bars (protein orange, carbs teal, fat ochre), then "Geo" one-liner, then meals list. Date title as switcher: adopt. Status capsule row: adapt for "Training day / Rest day" capsule. Reject weather capsule and three equal rings (we need one dominant number, not three peers).

### IMG_6908 - Collapsed nav on Today (crop)

- What it shows: scrolled home crop. Left: round glass calendar button (about 44 pt). Centered "Today" title (17 pt semibold) floating with no bar. Right: glass capsule with share and avatar. The rings and "Strain" label are visibly blurred under the chrome; a soft white gradient fades content toward the top.
- Notable craft: no navbar background; legibility comes from a top scrim gradient plus glass only under the controls.
- Why it works: maximum content, minimum chrome, still legible over busy content.
- FIQR verdict: ADOPT. Maps to all main tabs. Implement as a fixed top scrim (`linear-gradient(cream, transparent)`, no blur) + capsules. Calendar button opens the diary date sheet (6889 adaptation).

### IMG_6909 - Collapsed tab bar orbs (crop)

- What it shows: Home orb bottom-left and + orb bottom-right (each about 48 pt, white, soft shadow) floating over content ("Health Monitor" header passes under them, slightly blurred).
- Notable craft: on scroll the 4-tab bar shrinks to just the current tab icon, so content gets the full width.
- Why it works: it keeps navigation one tap away while giving reading space.
- FIQR verdict: ADAPT with caution. Collapsing tab bar is nice but adds scroll listeners and layout animation in WebView; acceptable if done with a single `IntersectionObserver` sentinel and a `transform`-only transition. The + orb maps to "Log meal" (our orange primary).

### IMG_6910 - Expanded tab bar (crop)

- What it shows: glass tab bar capsule (about 330 x 62 pt, fully round) with four items Home, Journal, Fitness, Biology (filled glyph about 22 pt over 13 pt medium label). Selected tab sits in an inner grey capsule (about 86 x 54 pt). Separate round + button (about 62 pt) to the right, same glass material, about 8 pt gap.
- Notable craft: primary create action detached from navigation, same height, so they read as siblings but different roles. Filled black icons, no colour for selection; selection is shape only.
- Why it works: shape-based selection keeps the bar monochrome and calm; the detached + makes the main action findable from every tab.
- FIQR verdict: ADOPT structure. Maps to FIQR app shell: tabs Today, Diary, Train, Geo; detached orb is "Log" in orange (the one orange primary on most screens; on screens with their own primary, demote it to white with an ink +). Selected tab = ink 8% capsule. Labels Archivo 12-13 pt medium.

### IMG_6911 - Tab bar during selection change (crop)

- What it shows: transition frame: the selected "Fitness" pill lifts and magnifies (larger icon and label) with a refractive, rainbow-edged glass lens; the bar itself merges with the + button (goo-like join between the two shapes).
- Notable craft: native Liquid Glass lensing and shape morphing; the lens over-scales the content under it.
- Why it works: playful physical feedback makes a tab switch feel tactile.
- FIQR verdict: REJECT. Refraction, chromatic edges and metaball merging are not reproducible cheaply in a WebView; faking with SVG filters would hurt Android frame rate. Use a simple 150 ms `transform: translateX` slide of the selection pill.

### IMG_6912 - + Action menu (crop)

- What it shows: tapping + turns it into an X and opens a large glass panel (about 400 x 315 pt, radius about 36 pt) above the tab bar, with background blurred and dimmed. 3x3 grid of round white buttons (about 58 pt) with black filled glyphs and grey 15 pt labels: Describe food, Import food, Capture food, Scan food, Ask Bevel (the mascot orb), Search food, Generate routine, View routines, Log activity. A "Tap and hold to edit X" tooltip capsule above.
- Notable craft: every logging method in one panel; the AI coach sits in the centre cell. Same circle size for all, so no method is favoured except by position. Fitness tab stays visible as selected.
- Why it works: a single entry point for all "add" jobs keeps the tab bar small and makes logging always one tap away.
- FIQR verdict: ADOPT. Maps to the FIQR Log menu: Describe meal, Photo, Barcode, Search food, Ask Geo (centre, Geo avatar), Quick add calories, Start workout, Log weight, Check-in. Panel = white 92% with blur(20px) on capable devices, solid white on Android low-end. Icons ink, labels ink 70%. Do not copy the centre mascot orb look.

### IMG_6913 - Fitness page with action menu in edit mode

- What it shows: Fitness tab behind a dimmed scrim: nav (calendar-clock button, centered "Fitness", more button), Cardio Focus card (50% Low Aerobic, three horizontal bars teal/blue/indigo), Heart Rate Zones (Zone 2, 3h 49m, coloured zone bars), Strength section with Edit link, All Muscles "0 Total Sets" and "0 kg Total Volume" cards with an orange line + end dot, Muscle Freshness card. Over it: the action panel in edit mode, "Add" grey pill (left) and black "Save" pill (right), each action circle with a "-" badge. Tab bar with Fitness selected, X orb.
- Notable craft: menu is customisable with the same edit grammar as the home. Strength cards use one orange accent line, otherwise grey.
- Why it works: consistent edit grammar across surfaces reduces learning.
- FIQR verdict: ADAPT the Strength summary cards (Total sets, Total volume, with one orange line) for Train tab. REJECT menu customisation (scope) and the multicolour HR zone bars (off-palette).

### IMG_6914 - Action menu edit mode (crop)

- What it shows: close crop of the edit state: each 58 pt circle gets a grey outer ring (about 4 pt) and a 22 pt white "-" badge at 10-11 o'clock; "Add" grey pill, "Save" black pill in the panel header.
- Notable craft: ring + badge clearly signals "removable" without wiggle animation.
- Why it works: static affordance is accessible and does not rely on motion.
- FIQR verdict: REJECT (customisation out of scope). If ever needed, the static ring + badge pattern is the one to use.

### IMG_6915 - Describe food sheet (text logging)

- What it shows: sheet with grabber (about 36 x 5 pt). "Preview" glass chip with a small icon top-left. Title "What are you eating?" (about 24 pt semibold) with a small number stepper "0 v" on the right (portion/meal count). Large placeholder input "(e.g. breakfast waffles with 2 eggs)" (about 20 pt, grey), with a blue caret. Secondary text actions "Capture photo" and "Import photo" with grey icons. Full-width "Continue" capsule (disabled grey, about 52 pt) docked above the keyboard.
- Notable craft: the input is the page; no field border. The example placeholder teaches the expected level of detail. Disabled CTA rides on top of the keyboard.
- Why it works: free text with a strong example is the fastest possible log and removes form friction.
- FIQR verdict: ADOPT. Maps to FIQR "Log meal" default entry (text to Geo parser). Title Archivo 24 pt semibold ink, borderless 20 pt input, example placeholder in ink 45% (must pass 4.5:1 on white; check), photo options as text rows, Continue = orange primary docked above keyboard (Capacitor Keyboard plugin `resize: body` so it sits above the keyboard on Android).

### IMG_6916 - Search food sheet (empty result)

- What it shows: sheet with grabber; "Cancel" (grey, left) and "Next" (disabled grey, right) text buttons. Underline tabs "Search" (active, ink underline about 2 pt) / "My Foods". Search field (grey fill, radius 12, about 40 pt tall) with clear button and blue "Cancel". Dashed "No items selected" tray (selection basket). Empty state centered: "No foods found" (17 pt semibold) + one explanatory line.
- Notable craft: multi-select basket shown as a dashed tray before anything is picked, so users learn they can add several items. Standard iOS search grammar otherwise.
- Why it works: the dashed basket sets up a multi-item meal flow without instructions.
- FIQR verdict: ADOPT the selection tray and the tabs Search / Recent / My foods. Maps to FIQR Search food. Replace blue system accents with ink; "Next" becomes enabled orange once one item is in the tray. Empty state should offer "Describe it to Geo instead" as a text link.

### IMG_6917 - Routines sheet

- What it shows: sheet with round X (left), "Routines" title, round + (right). Filter capsule "Traditional Strength Training". "Sort by ... Recently Added <>" row in grey. One routine card (half width, about 200 x 145 pt, radius 20) with an orange lifter glyph, orange category label (13 pt semibold, truncated), title "Hypertrophy Power Builder" (17 pt semibold, 2 lines), "7 exercises, 22 sets" grey, round "..." menu. Very faint warm tint in the card's top-left. Floating glass search field at the bottom (about 400 x 48 pt, fully round).
- Notable craft: search lives at the bottom in thumb reach as a floating glass capsule (iOS 26 pattern). Category coloured only on the label and icon.
- Why it works: bottom search is reachable one-handed and does not push content down.
- FIQR verdict: ADOPT. Maps to Workout plans list. Card: orange is not allowed as a decoration here if the screen has an orange primary, so category label in ink 60%, icon ink; "Start" is the orange primary inside the detail screen instead. Bottom floating search: adopt (white 92% capsule, shadow, no blur on Android).

### IMG_6918 - Select Activity sheet

- What it shows: sheet with round X and "Select Activity" title. Horizontal chips Running / Walking / Cycling / Strength & Gym (outlined white pills, about 40 pt tall, clipped at the edge). Grey group headers ("Most Frequent", "Running", "Walking") over grouped inset lists (white, radius 20, hairline separators inset by the icon column, rows about 57 pt). Each row: coloured activity glyph, 17 pt medium label, grey arrow. Floating bottom search capsule with content fading under it.
- Notable craft: "Most Frequent" first, then categories; chips jump to sections. Grouped lists here (vs. separate row cards in 6891) because these are pure choices, not data.
- Why it works: frequency-first ordering makes the common choice a one-tap action.
- FIQR verdict: ADOPT. Maps to "Start workout" / "Add exercise" pickers and Food search "Recent" group. Glyphs in ink (not multicolour). Grouped inset list with inset separators is the right component for any long choice list.

---

## Cross-cutting patterns (part B)

1. Floating chrome, no navbar. Back button and actions are separate 44 pt glass capsules over content; the title is centred plain text that collapses into the back capsule on scroll; a top scrim keeps it legible.
   - CSS idea: `position: fixed; top: env(safe-area-inset-top)` capsules + `.scrim { background: linear-gradient(#FDF6EC 40%, rgba(253,246,236,0)); height: 96px; pointer-events: none }`.
   - Android perf: scrim is just a gradient (free). Only the small capsules get `backdrop-filter`; on low-end use solid `rgba(255,255,255,0.92)` + shadow. Gate with `@supports (backdrop-filter: blur(1px))` plus a JS device-class flag.

2. Detached tab bar + create orb. Fully round tab capsule (about 330 x 62 pt) with 4 tabs, shape-only selection pill, and a separate same-height round + orb.
   - CSS idea: `nav { border-radius: 999px; height: 62px; background: rgba(255,255,255,.85); backdrop-filter: blur(20px) saturate(1.4) }` and `.sel { background: rgba(17,28,53,.08); border-radius: 999px; transition: transform .15s }`.
   - Android perf: one blurred element of this size is acceptable on mid devices; on low-end drop the blur. Animate only `transform`/`opacity` for the selection pill. No refraction or shape morph (6911).

3. Lifted-paper card system. White cards, radius 20 pt, 20 pt page gutter, 10-12 pt gap, ultra-soft wide shadow, optional 1 px light rim; header row "icon + grey label + arrow".
   - CSS idea: `.card { background:#fff; border-radius:20px; box-shadow: 0 4px 20px rgba(17,28,53,.05); padding:16px }` on a cream page.
   - Android perf: one blurred box-shadow per card is fine; avoid stacking multiple shadows and avoid `filter: drop-shadow`. Long lists: `content-visibility: auto`.

4. Number typography: value + small unit. Big semibold numeral (30-36 pt) with unit/percent at about 55-60% size in muted colour, status word with icon below.
   - CSS idea: `.num { font: 600 34px/1 Archivo; font-variant-numeric: tabular-nums; letter-spacing: -0.02em } .num small { font-size: .58em; color: rgba(17,28,53,.55) }`.
   - Android perf: free. Self-host Archivo with `font-display: swap` and preload the 600 weight to avoid reflow of the hero number.

5. Ring as the summary primitive. Thick round-cap rings (stroke about 12-14 pt on a 110 pt ring) with the value inside, used at three scales: hero, card, and 30 pt calendar day.
   - CSS idea: SVG `<circle stroke-dasharray>` with `stroke-linecap: round`; track at ink 8%. Colours: calories orange, carbs teal, fat ochre, protein orange or ink.
   - Android perf: SVG strokes are cheap; animate `stroke-dashoffset` once on mount only. Avoid conic-gradient rings with masks on low-end.

6. Bottom sheets with round X and centred title. Sheet top radius 32-36 pt, round 44 pt X left, optional round action right, grabber when swipe-dismissable, page behind dimmed and scaled.
   - CSS idea: `.sheet { border-radius: 34px 34px 0 0; transform: translateY(100%); transition: transform .3s cubic-bezier(.2,.8,.2,1) }` + backdrop `rgba(17,28,53,.35)`.
   - Android perf: do not scale/blur the page behind (expensive repaint); dim only. Use `will-change: transform` only while animating.

7. Action menu from the + orb. 3x3 grid of 58 pt round buttons with labels in a large rounded panel above the tab bar; + morphs to X. The AI coach sits in the centre.
   - CSS idea: grid `repeat(3, 1fr)`, `.act { width:58px; height:58px; border-radius:50%; background:#fff; box-shadow: 0 2px 10px rgba(17,28,53,.08) }`, panel `border-radius: 36px`.
   - Android perf: panel blur is the single most expensive effect in the set (large area over complex content); on low-end use opaque white panel + dim scrim. Open with opacity + translateY 8 px, 180 ms.

8. Bottom floating search capsule. Search lives in a round capsule above the home indicator on list sheets; content fades beneath.
   - CSS idea: `position: sticky; bottom: calc(12px + env(safe-area-inset-bottom)); border-radius: 999px; height: 48px` + a 40 px bottom fade gradient.
   - Android perf: sticky + gradient is cheap. Handle keyboard with Capacitor Keyboard `resize: 'body'` so it does not jump.

9. Chip filters with clipped overflow. Horizontal pill chips, selected = solid ink with white text, others light fill; last chip clipped to signal scroll.
   - CSS idea: `overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; padding-inline: 20px` and `.chip[aria-pressed=true] { background:#111C35; color:#fff }`.
   - Android perf: free. Keep native momentum scrolling; no JS scroll handlers.

10. Data-as-next-action empty states. "Log 728 kcal to unlock", ghost skeleton rows behind an "Add goals" pill, dashed "Add card" / "No items selected" trays, "Calibrating" instead of a fake number.
    - CSS idea: ghost rows as cream bars at ink 6%; dashed tray `border: 1px dashed rgba(17,28,53,.2); border-radius: 16px`.
    - Android perf: static, free. Avoid shimmer animations on many skeletons at once.

11. Coach line under the data. A small-caps "COACHING" label + one sentence directly beneath the summary rings or metric; links to the full insight.
    - CSS idea: `.label { font: 600 12px Archivo; letter-spacing: .06em; text-transform: uppercase; color: rgba(17,28,53,.5) }` + 17 px body ink.
    - Android perf: free. Fetch Geo's line async and reserve its height (min-height for 2 lines) to avoid layout shift.

12. Sparkline with target band and end dot. Small trend charts on the right of metric cards: shaded normal/target band, thin line, glowing dot for today, no axes.
    - CSS idea: inline SVG `<path>` 1.5 px ink line, `<rect>` band in ink 8%, end `<circle r=4>` orange with a 3 px white stroke (no glow filter).
    - Android perf: SVG per card is fine for 5-10 cards; avoid SVG `filter` (glow) and drop shadows on paths, which are slow in Android WebView.
