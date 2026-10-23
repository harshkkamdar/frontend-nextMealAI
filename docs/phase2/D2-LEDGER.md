# D2 craft ledger

Started 23 Oct 2026 on branch `phase2/fiqr`. One row per SOW D2 screen and state, in SOW order. Every row is captured in six states where the screen has data (default, empty, loading, error, offline, long), at 390x844 and 360x800, by `scripts/d2-capture.mjs`; screens with no data of their own (auth, public pages, builders, onboarding) are captured in the states they can reach. Baseline: `docs/phase2/screens/baseline/`. After: `docs/phase2/screens/after/`.

**Reference.** The client's original Home (6a) and Check-in (7a-c) mock-up files are not in either repo, in Downloads, or anywhere else on this machine, so the reference of "great" is Home and Check-in as built (they were built from those mock-ups). See D2-00.

**Status values.** `pending` (not started), `built <sha>` (fixed, re-captured and compared), `blocked: <item>`, `needs-owner: <question>`, `differs: <decision>` (kept on purpose per design-decisions-2026-09-17.md).

Finding tags: H hierarchy, T type scale, S spacing, 44 touch target, C contrast, O one orange action, Cp copy, E/L/Er/Off/Long state, 360 overflow at 360px. A = Assessment A (design review), B = Assessment B (detector and axe).

## Shared findings (fixed once, carried to every row)

| # | Finding | Source | Status |
|---|---|---|---|
| X1 | Secondary text in ink-50/55/60 fails 4.5:1 on cream (3.25-4.40); every screen | B axe | pending |
| X2 | Cream 17px label on orange is 3.15:1 (needs 18.66px bold for 3:1 large text) in PrimaryButton and ActionCard | B axe | pending |
| X3 | Orange text on cream (3.15:1): Geo-line emphasis, "2600 left", inline links, active nav label | B axe | pending |
| X4 | Error toasts read "[object Object]" (ApiException message is an object) | A | pending |
| X5 | Sonner `richColors` paints red, green and pink toasts, off-palette | A | pending |
| X6 | No `prefers-reduced-motion` handling; typing dots use `animate-bounce` | B detector | pending |
| X7 | MacroBar renders 0/0 as a full bar and "0 left" on error | A | pending |
| X8 | `bg-red-500` in confirm dialog, off-palette | grep | pending |
| X9 | Controls under 44px: chips h-9, scale pills, row "+", kebabs, ticks, steppers, checkboxes | A, B | pending |
| X10 | Three page-header patterns (left title, centred title, "<- More") | A | pending |

## Rows

| ID | Screen / state | Baseline findings | Status |
|---|---|---|---|
| D2-00 | Source mock-ups (Home 6a, Check-in 7a-c) | Files not found on this machine | needs-owner: please send the source mock-up files for Home 6a and Check-in 7a-c so the after screens can be compared with them, not only with Home and Check-in as built |
| D2-01 | Home | C (X1, X3); Er targets render 0/0 full bars (X7); Long next-up title wraps 4 lines; S Steps tile caption clipped by nav | pending |
| D2-02 | Check-in, due | C; Cp "SESS." abbreviation; S "Ask Geo about this" under the Geo button; Er page loses its header; Off apply stays enabled. Note: the headline/proposal mismatch A saw is a capture artefact (due state forced onto a real "insufficient" verdict) | pending |
| D2-03 | Check-in, mid-week | C; aria-label on a plain div (SegmentsBar); Long eyebrow wraps; Er headerless | pending |
| D2-04 | Check-in, not enough data | C; aria-prohibited-attr; S "Ask Geo" under the Geo button; Er headerless | pending |
| D2-05 | Food diary | C, X3; 44 meal "..." and "+" 24px; S sticky Log food covers the last meal; Cp title "23 Friday" vs decision "Friday 23"; 360 week strip clips edge cells; Er looks like data (X7) | pending |
| D2-06 | Log food, search | C; aria-label on a plain div ("Searching"); 44 result "+" ~20px; Er no message | pending |
| D2-07 | Log food, photo | C, X2; Er "[object Object]" (X4); 360 name field truncates, "g" suffix outside field | pending |
| D2-08 | Log food, menu | H Menu routes to `/chat?prefill=`, which ignores prefill, so the prompt is lost; nested-interactive chat rows; 44 kebab | pending |
| D2-09 | Log weight | C; X10 centred title; "kg" suffix floats top-right | pending |
| D2-10 | Log water | C; X10; 44 steppers ~34px | pending |
| D2-11 | Log sleep | C; X10; Cp "0/10" shown before a choice and unlabelled; 44 scale pills | pending |
| D2-12 | Log mood | C; X10; Cp "0/10" before a choice; 44 pills | pending |
| D2-13 | Log energy | C; X10; Cp "0/10"; 44 pills | pending |
| D2-14 | Log chooser | C, X2; 360 "Select" overlaps the filter chips; Cp dates as 9/17/2026; Er shows "No logs yet" | pending |
| D2-15 | Food database | C, X2; 44 star and "..." ~20px; Er toast plus "No saved foods yet" contradict | pending |
| D2-16 | Train | C; H "Resume · Push" banner repeats the Resume CTA; Cp "1 exercises"; Er shows "No program yet" | pending |
| D2-17 | Live session | C; Er blank page (`router.back()` on load failure, nothing rendered); E dead Prev/Next; 44 set ticks 32px | pending |
| D2-18 | Plans list | C, X2; Er "[object Object]" plus "No plan yet"; 44 pencil and chevron; T "by hand" links small | pending |
| D2-19 | Plan detail, workout | C; Er dead end with no header or back; Long title 4 lines | pending |
| D2-19b | Plan detail, meal | C; Er dead end | pending |
| D2-20 | Builder, meal | C; 360 date inputs truncate | pending |
| D2-20b | Builder, workout | C; 360 dates; 44 native checkbox | pending |
| D2-20c | Edit program | C; Long exercise chip overflows card; Er "[object Object]" | pending |
| D2-21 | Geo chat list | C; nested-interactive rows; 44 kebab 28px; Er looks empty | pending |
| D2-21b | Geo chat session | C; "Heads up" pink tint (X5-like); 44 send button 32px | pending |
| D2-22 | Geo companion sheet | C; aria-prohibited-attr; Off hard-coded "Online" with a teal dot (teal is reserved for carbs); 44 close/new 32px | pending |
| D2-23 | Onboarding, personal | C; 44 sex chips 36px | pending |
| D2-23b | Onboarding, fitness | C; 44 chips; H about 25 choices on one scroll | pending |
| D2-23c | Onboarding, nutrition | C; 44 chips | pending |
| D2-23d | Onboarding, review | C, X2; Cp "1 exercises" | pending |
| D2-24 | Consent | C, X2, X3 orange "Read the privacy policy"; 44 native checkboxes | pending |
| D2-25 | Login | C, X2; Er "[object Object]" (X4) | pending |
| D2-26 | Sign-up | C, X2; Er "[object Object]" | pending |
| D2-27 | Password reset, request | C, X2; X5 green success toast | pending |
| D2-27b | Password reset, new password | C; "Request a new link" is a bare text link | pending |
| D2-28 | Settings | C, X2; label: reminder time input unlabelled (critical); Cp "Manage in the FIQR app" inside the app; Er no retry | pending |
| D2-29 | Profile (worst screen, reference slice) | C; H sentence-case 11px labels, "<- More" back, orange selected pills plus orange reset link (O), pink live-preview chip, 10px help text, two contradicting calorie numbers, save at the very bottom | pending |
| D2-30 | Privacy | C | pending |
| D2-31 | Support | C, X3 two orange links (destructive link in orange) | pending |
| D2-32 | Account deletion (public) | C, X2, X3; left-aligned primary label | pending |
| D2-32b | Account deletion (in-app sheet) | C | pending |
