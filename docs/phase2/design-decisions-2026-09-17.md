# FIQR screens, round 3 — design decisions (Fable, 2026-09-17)

The reference gives Home (6a) and Check-in (7a–c). These six screens had no reference, so the decisions below extend the same system. Rules that carry over: cream page, 22pt gutter, `SectionLabel` above every block, white `MetricTile`s and rows with 1pt ink-12 borders, navy `FeatureCard` for the one "next thing", **one orange action per screen**, Archivo sizes from the type scale, no new colours. Every screen keeps its existing data hooks and behaviour; this is layout and hierarchy only. Provisional: Harsh can veto any of it in the review and it is a one-round change.

## 1. Food (day view) — `/food`
Hierarchy: date → the day's numbers → meals → add.
- Header: `SectionLabel`-style eyebrow with the month (`SEPTEMBER 2026`, 12/500 +1.4 uppercase ink-50) and the day's title `Thursday 17` 22/600 on the left; on the right a 40px person-glyph avatar (same as Home) is **not** repeated here; instead a calendar icon button (24px, ink-60) opens the existing month sheet.
- Week strip: seven day cells, 44px wide, `rounded-[14px]`, label `MON` 11/600 +1.4 ink-62 and number 17/600; today = `bg-ink text-cream`, selected-not-today = `border border-ink text-ink`, days with logs get a 4px `bg-accent` dot; horizontally scrollable, current day centred.
- Day summary: **four `MacroBar`s** exactly as Home (Calories, Protein, Carbs, Fat), preceded by `SectionLabel` `This day`. No ring, no gradient card. Over-target shows `over` in accent.
- Meals: for each meal type, `SectionLabel` (`Breakfast · 612 kcal` where the kcal is 11.5/600 ink-50 after a middle dot) then a white card (`rounded-[16px] border border-ink-12`) with rows `min-h-14 px-[14px] py-3 flex justify-between`: name 15.5/600 ink, sub-line `1 banana · 116 kcal` 13/400 ink-55, right side `27g C` style macros in 13/500 ink-55; tapping a row opens the existing inline edit; edit mode keeps its behaviour but the pencil becomes a 24px ink-60 icon. Empty meal = a single row `Nothing logged` in ink-50 with a `+` at the right (13.5/600 ink) that opens the log page with that meal pre-selected.
- The one orange action: `PrimaryButton` `Log food` with `+` icon and trailing `Scan · Search`, pinned above the nav (`sticky bottom-[calc(96px+var(--safe-bottom))]`) so it stays reachable while scrolling.
- Copy-meal and save-favourite stay in the row's overflow (`…`), same sheet components, restyled to pills.

## 2. Log food page — `/logs/new/food`
Hierarchy: search first, tray second, then everything else.
- Header: back chevron + `Log food` 22/600; right: meal pill (`Lunch ▾`, `rounded-full bg-ink-08 px-3 h-9 text-[13.5px] font-semibold`) opening a pill row of the four meals.
- Search field: `h-14 rounded-[15px] border border-ink-16 bg-card px-4 text-[17px]` with a leading magnifier icon, placeholder `Search foods, brands, or describe it`. Below it two secondary chips: `Photo` (camera icon) and `Menu` (document icon), `h-9 rounded-full bg-ink-08 text-ink text-[13.5px] font-semibold` — Photo runs the existing estimate flow, Menu routes to chat with the scan prefill.
- Before typing: `SectionLabel` `Recent` then rows (white card) of the last 8 foods with servings; `SectionLabel` `Favourites` then rows. Tapping a row adds it to the tray with its default serving.
- Results: rows with name 15.5/600, source tag as a `text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-55` (`Yours` / `Open Food Facts` / `USDA`), macro line 13/400 ink-55, and a `+` at the right; a tapped row expands inline to a serving stepper (`−  2 servings  +`, 15.5/600) and unit toggle pills (`servings` / `grams`).
- Tray: a navy `FeatureCard` fixed above the nav when non-empty: `TRAY` label cream-55, `3 items · 612 kcal` 17/700, a row of item chips (cream-22 fill, cream text, `×` to remove), and the one orange action **inside** the card: `PrimaryButton` `Log 3 items` (this is the only orange on the page; the header meal pill and chips are ink).
- Photo estimate result: the existing preview→edit→accept flow rendered as rows in the same card style; accept = the same orange button.

## 3. Train — `/train`
Hierarchy: next session → this week → program.
- Header: `Train` 22/600, right: calendar icon button (opens the history calendar, which moves into a sheet rather than living inline).
- `FeatureCard` Next up, identical to Home's (label, name 28/700, meta `5 exercises · 40 min`, `SecondaryButton onNavy arrow` `Start Workout`). Rest day and no-program states as on Home. The **only orange** on this screen is the `Log a freestyle session` `PrimaryButton` (icon `+`) placed under the program list, because starting the planned session is secondary-on-navy by the reference's own convention.
- `SectionLabel` `This week`: three `MetricTile`s — `Sessions` `2` sub `of 4 planned`, `Volume` `12.4` unit `t` (tonnes, from completed sessions) sub `this week`, `Last` `Tue` sub `Push · 48 min`.
- `SectionLabel` `Program` + the program name and `Day 3 of 6` 13.5 ink-55: a white card listing days as rows: index in a 24px circle (`bg-ink text-cream` for the next day, `bg-ink-08 text-ink` otherwise, tick icon for completed days this cycle), name 15.5/600, `5 exercises` 13/400 ink-55, chevron. Tapping opens the existing plan-day detail. Below the card a text link `View full plan →` 13.5/600 ink-60.
- History: `SectionLabel` `History`; rows `Thu 17 Sep · Push · 48 min · 12 sets` 15.5/500 with chevron, last 10, in a white card. The date strip is gone from the main page (it is inside the calendar sheet).

## 4. Live session — `/train/session?id=`
Hierarchy: the current exercise is the screen. Everything else is one tap away.
- Top bar (cream, safe-area padded): back chevron (opens the existing 3-button sheet), centre `Push · 24:16` (elapsed, 15.5/600 with the timer in tabular numbers), right `…` (add/remove exercise, abandon).
- Exercise pager: horizontal snap list of exercise cards; the current card is a white card `rounded-[22px] border border-ink-12 p-[22px]`: name 28/700 tracking −0.6, target line `3 × 8–10 · 90 s rest` 14/400 ink-62, then the sets table: header `SET  PREV  KG  REPS  ✓` in 11/600 +1.4 uppercase ink-62, rows 48px tall with the previous session's numbers in ink-50, inputs `h-11 rounded-[12px] bg-ink-08 text-center text-[17px] font-semibold` (no borders), and a 32px tick circle at the right: `border border-ink-16` idle, `bg-ink text-cream` done. `+ Add set` text button 13.5/600 ink-60 under the table.
- Rest timer: when running, a navy `FeatureCard` pinned above the nav: `REST` cream-55, `1:12` 36/700 tabular cream, buttons `−15` / `+15` as cream-22 pills and `Skip` as `SecondaryButton onNavy`. Minimised state = a 44px navy pill at the bottom right with the countdown. Bell and vibrate behaviour unchanged.
- Progress: under the top bar a 7px `MacroBar`-style track showing sets completed / total, fill `bg-ink`.
- The one orange action: `PrimaryButton` `Finish workout` at the end of the pager (last card) and in the `…` menu; it calls complete. Abandon stays in the back sheet as `Discard`.

## 5. Plans — `/plans`, `/plans/view`, `/plans/edit`, `/plans/new/*`
- List: `Plans` 22/600; `SectionLabel` `Active` with two white cards (Nutrition, Training): title 17/700, meta `2,600 kcal · 180 g protein` or `6 days · Push/Pull/Legs` 13.5 ink-55, small `Active` tag (11/600 uppercase +1.4 in a `bg-ink-08 rounded-full px-2 h-6`), chevron. `SectionLabel` `Previous` for the rest as rows. The one orange action: `PrimaryButton` `Ask Geo for a plan` (`+` icon) → companion sheet; the manual builders are reachable from a text link `Build one by hand →` 13.5/600 ink-60 under the button.
- View (nutrition): targets as four `MetricTile`s in a 2×2 grid, then day tabs as pills, then meals as the Food day view's meal cards. View (workout): day rows exactly like Train's program card; a day expands to exercise rows `Bench Press · 3 × 8–10 · 90 s`. Edit button = `SecondaryButton onNavy={false}` `Edit plan`; activate = orange `PrimaryButton` only when the plan is not active.
- Builders (`/plans/new/meal|workout`, `/plans/edit`): keep the logic; inputs and pills take the onboarding styles; the save is the orange `PrimaryButton`; remove buttons are text (`Remove` 13.5/600 ink-60). Changelog rows in a white card.

## 6. Manual logs, log chooser, food database
- Log chooser `/logs`: `Log` 22/600; a 2-column grid of white tiles (`MetricTile` shell) with a 24px icon and label (`Food`, `Workout`, `Weight`, `Water`, `Sleep`, `Mood`, `Energy`); Food tile is the orange `ActionCard` spanning both columns at the top. Recent logs list below as rows.
- Each manual form: title 22/600, one `GeoLine` prompt (`How much did you sleep?`), the input in the onboarding style; scales (mood/energy 1–10) are ten pills; water is a `−  3 glasses  +` stepper 28/700; weight is a numeric input with a `kg` suffix 13/500 ink-55; sleep is hours + optional bedtime. Save = orange `PrimaryButton` `Save` (label centred). Workout manual form keeps its exercise rows in the live-session row style.
- Food database `/foods`: search field as the log page, rows with name / source tag / per-100g macros, swipe or `…` for edit and delete; edit uses a sheet with the onboarding inputs; the only orange is `Add a food` `PrimaryButton`.

## Tokens to purge in these files
Every `bg-blue-50`, `bg-amber-50`, `bg-green-50`, `bg-purple-50`, `text-green-600`, `text-red-*`, `#6366F1`, `#E8663C`, gradient classes, `shadow-lg`, `hover:scale`, and any hex literal. Status colours map to: positive → `macro-teal`, caution → `macro-ochre`, destructive text → `ink` with the action in a confirm sheet, info → `ink-62`.
