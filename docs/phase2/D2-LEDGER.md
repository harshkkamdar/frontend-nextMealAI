# D2 craft ledger

Started 23 Oct 2026 on branch `phase2/fiqr`. One row per SOW D2 screen and state, in SOW order. Every row is captured in six states where the screen has data (default, empty, loading, error, offline, long), at 390x844 and 360x800, by `scripts/d2-capture.mjs`; screens with no data of their own (auth, public pages, builders, onboarding) are captured in the states they can reach. Baseline: `docs/phase2/screens/baseline/`. After: `docs/phase2/screens/after/`.

**Reference.** The client's original Home (6a) and Check-in (7a-c) mock-up files are not in either repo, in Downloads, or anywhere else on this machine, so the reference of "great" is Home and Check-in as built (they were built from those mock-ups). See D2-00.

**Status values.** `built <sha>` (fixed, re-captured and compared), `blocked: <item>`, `needs-owner: <question>`, `differs: <decision>` (kept on purpose per design-decisions-2026-09-17.md).

Finding tags: H hierarchy, T type scale, S spacing, 44 touch target, C contrast, O one orange action, Cp copy, E/L/Er/Off/Long state, 360 overflow at 360px. A = Assessment A (design review), B = Assessment B (detector and axe).

## Shared findings (fixed once, carried to every row)

| # | Finding | Source | Status |
|---|---|---|---|
| X1 | Secondary text in ink-50/55/60 fails 4.5:1 on cream (3.25-4.40); every screen | B axe | built bef82b2 (ink-65 token, nav), 65c198b (sweep) |
| X2 | Cream 17px label on orange is 3.15:1 in PrimaryButton and ActionCard | B axe | built bef82b2 (19px bold = large text); needs-owner: is 19px acceptable on Home and Check-in? |
| X3 | Orange text on cream (3.15:1): Geo-line emphasis, "2600 left", links, active nav label | B axe | built 65c198b (navy + orange underline, ink links); needs-owner: keep this or accept orange text at lower contrast? |
| X4 | "[object Object]" error toasts | A | built 65c198b (client always yields a string). Mostly a capture artefact: the mock used a nested error object; the API sends `{ error: true, code, message }` |
| X5 | Sonner `richColors` red, green, pink toasts | A | built 65c198b |
| X6 | No reduced-motion handling; `animate-bounce` typing dots | B detector | built 65c198b; detector re-run: only the test-fixture `<img>` (false positive) |
| X7 | MacroBar 0/0 renders a full bar | A | built 65c198b (+ test) |
| X8 | `bg-red-500` in confirm dialog | grep | built 65c198b; grep gate 0 hits |
| X9 | Controls under 44px | A, B | built across slices (see rows) |
| X10 | Three page-header patterns | A | built bef82b2 (PageHeader), carried in 3351492, 5f5ae82, 7704813 |
| X11 | `-mx-gutter` generated no CSS, so full-bleed strips never bled | found in slice | built cf2022e (`--spacing-gutter`) |
| X13 | Crash screen (error boundary, every route) printed the raw error (chunk paths) | found in capture | built b97fbe1 |
| X14 | Placeholder text in ink-35/50 under 4.5:1 | craft floor | built (placeholder commit, ink-65) |
| X12 | Error states that read as empty data | A, grader | built 64f1a39, 496e182, 11cafec, 5f5ae82, 0fbdeb6, 8eb7cbd (shared ErrorState) |

## Rows

Final checks: 350 after captures, 0 serious or critical axe violations (`docs/phase2/screens/after/axe.json`); independent grader (Sonnet, criteria + reference + after screenshots only) failures all fixed or ledgered below.

| ID | Screen / state | Baseline findings | Status |
|---|---|---|---|
| D2-00 | Source mock-ups (Home 6a, Check-in 7a-c) | Files not found on this machine | needs-owner: please send the source mock-up files for Home 6a and Check-in 7a-c so the after screens can be compared with them, not only with Home and Check-in as built |
| D2-01 | Home | C (X1, X3); Er 0/0 bars; Long next-up 4 lines; S Steps caption under nav | built 64f1a39 |
| D2-02 | Check-in, due | C; "SESS."; S Ask Geo under the Geo button; Er headerless | built 64f1a39. Headline/proposal mismatch was a capture artefact (due state forced onto a real "insufficient" verdict) |
| D2-03 | Check-in, mid-week | C; aria on plain div; Er headerless; grader: "0 weeks", footer touching cards at 360 | built 64f1a39, 71dd6ec, 3e8fd68 |
| D2-04 | Check-in, not enough data | C; aria-prohibited-attr; Er headerless | built 64f1a39 |
| D2-05 | Food diary | C, X3; 44 meal actions; sticky Log food gap; "23 Friday"; Er looks like data | built cf2022e, 0fbdeb6. Week strip running to the screen edge at 360 differs: design-decisions §1 (week strip horizontally scrollable, current day centred) |
| D2-06 | Log food, search | C; aria on "Searching"; Er silent | built a9ad74a |
| D2-07 | Log food, photo | X2, X4; name clipped at 360; grader: toast gives no next step | built a9ad74a, 0fbdeb6, 3e8fd68 (sticky tray, estimate chip above the card). Failure stays a toast (behaviour pinned by test AC06); its copy now says what to try |
| D2-08 | Log food, menu | Prompt lost (`/chat?prefill=` ignored) | built a9ad74a (new chat with prefill). Error state n/a: a new chat has no history to fail |
| D2-09 | Log weight | X10 centred title | built 3351492. Load-error state n/a: the screen loads no data; save failures toast |
| D2-10 | Log water | X10; steppers | built 3351492 (steppers already 44px). Load-error n/a as D2-09. Blank captures were a dev render race, re-shot (b97fbe1) |
| D2-11 | Log sleep | X10; "0/10" unlabelled; 44 pills | built 3351492. Load-error n/a |
| D2-12 | Log mood | X10; "0/10"; 44 pills | built 3351492. Load-error n/a |
| D2-13 | Log energy | X10; "0/10"; 44 pills | built 3351492. Load-error n/a |
| D2-14 | Log chooser | X2; Select overlap; 9/17/2026 dates; Er "No logs yet" | built 3351492, 0fbdeb6, 3e8fd68 (Select on the Recent line, chips scroll edge to edge) |
| D2-15 | Food database | 44 star and "..."; Er contradicting toast + empty; grader: placeholder clipped at 360 | built 11cafec, 0fbdeb6 |
| D2-16 | Train | Duplicate Resume banner; "1 exercises"; Er "No program yet" | built 496e182 |
| D2-17 | Live session | Er blank page; E dead Prev/Next; 44 ticks; grader: no findable orange action | built 7704813, 42a63dd (pager gutter) (ticks are 44px targets around a 32px circle). Finish workout as the orange action only on the last exercise differs: design-decisions §4 ("Finish workout at the end of the pager (last card) and in the ... menu") |
| D2-18 | Plans list | X2; Er toast + "No plan yet"; 44 edit | built 5f5ae82 |
| D2-19 | Plan detail, workout | Er dead end; Long title | built 5f5ae82 |
| D2-19b | Plan detail, meal | Er dead end | built 5f5ae82 |
| D2-20 | Builder, meal | 360 dates truncate | built 5f5ae82 |
| D2-20b | Builder, workout | 360 dates; 44 checkbox | built 5f5ae82 |
| D2-20c | Edit program | Long chip; Er toast and redirect to Plans | built 5f5ae82 (shared builder fixes). needs-owner: a failed load redirects to Plans with a toast (pinned by test "redirects to /plans on load failure"); should it stay on the edit screen with Try again? |
| D2-21 | Geo chat list | nested-interactive; 44 kebab; Er looks empty | built c2522ee, 8eb7cbd |
| D2-21b | Geo chat session | Pink Heads-up; 44 send; Er blank | built c2522ee, 8eb7cbd |
| D2-22 | Geo companion sheet | aria on handle; Off hard-coded "Online" with teal dot; 44 close/new; grader: page strip visible between composer and nav | built c2522ee, 9fea770 (cream under the nav edge, no page strip), 3e8fd68 (New shown only with a conversation) |
| D2-23 | Onboarding, personal | 44 chips | built 9438f2b |
| D2-23b | Onboarding, fitness | 44 chips; about 25 choices on one scroll | built 9438f2b. needs-owner: split fitness into two steps (equipment and injuries; activity, experience and goal)? |
| D2-23c | Onboarding, nutrition | 44 chips | built 9438f2b |
| D2-23d | Onboarding, review | "1 exercises"; grader: Geo line cut, "programme / 2 day cycle" | built 496e182, 71dd6ec |
| D2-24 | Consent | X2, X3 orange link; 44 checkboxes | built 65c198b, 9438f2b |
| D2-25 | Login | X2; Er "[object Object]" (X4) | built 65c198b |
| D2-26 | Sign-up | X2; Er login copy | built 65c198b. The login copy was a capture mock; mocks now use sign-up copy (c56db18) |
| D2-27 | Password reset, request | X5 green toast | built 65c198b |
| D2-27b | Password reset, new | Bare text link | built 3268081 |
| D2-28 | Settings | label (critical); "Manage in the FIQR app"; Er no retry; orange chips | built 4b1c550 |
| D2-29 | Profile (reference slice) | Off-system form: labels, back, orange pills and link, pink chip, small print, two calorie numbers | built bef82b2 |
| D2-30 | Privacy | C links | built 4b1c550 |
| D2-31 | Support | X3 orange links | built 65c198b |
| D2-32 | Account deletion (public) | X3; left-aligned label | built 65c198b, 4b1c550 |
| D2-32b | Account deletion (in-app sheet) | C | built 65c198b, 9fea770 |

## Gates

| Gate | Result |
|---|---|
| Ledger | No pending rows |
| Palette grep (off-palette hex, bg-(blue/amber/green/purple/red)-, gradient, shadow-lg, dark:) in src/app and src/components | 0 hits |
| axe serious/critical | 0 on 350 captures |
| Before/after screenshots, both widths | baseline/ and after/, 350 each |
| iOS simulator (`npx cap run ios`, iPhone 16 Pro) | Home, Food diary and live session: `after/ios-sim/home-iphone16pro.png`, `food-diary-iphone16pro.png`, `live-session-iphone16pro.png`. Navigated through the web view's inspector socket (ios-webkit-debug-proxy); the live session is a real session on the test account |
| lint, type-check, test | exit 0, exit 0, exit 0 (433 passed, 1 skipped) |
| Independent grader (Sonnet) | Pass 1: 26 pass, 17 fail, all fixed or ledgered. Pass 2 (fresh agent, all rows + simulator): 38 pass, 5 fail; simulator 3 of 3 pass. Pass 3 (fresh agent, the 5): 4 pass; D2-14 failed on a blank capture, re-shot and read |
| git status | Clean. Work found uncommitted in the checkout was committed unchanged in 5310bfc (splash hider, nav clearance, test dep) and 9cee606 (SPM files from cap sync) |

## Decisions taken alone (cheap to reverse; listed for the owner)

- ink-65 as the secondary-text floor (one token).
- PrimaryButton label 19px bold (X2) and navy-with-orange-underline emphasis (X3); both also asked as needs-owner above.
- Selected chips are navy, never orange (decision doc already says pills are ink).
- Shared ErrorState wording in Geo's voice.
