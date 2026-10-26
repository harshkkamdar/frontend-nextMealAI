# FIQR v2 redesign - review pack for slices 2 to 10

Mr. Ved, this pack is for you to approve or answer. Each question has my recommendation. Answer by number.

Branch `redesign/fiqr-v2`, from 042470d to HEAD. Source of truth: [LEDGER.md](LEDGER.md). Rubric: [BRIEF.md](BRIEF.md) and the pass bars in [decisions.md](decisions.md).

## State of play

Slices 2 to 9 are built and captured on web at 390 and 360 px. Each also has two iOS simulator shots. Slice 10 (admin) got a token pass only, as agreed in Q6. Accessibility holds on every slice: axe 0 and no small targets, with one gap in the slice 2 file noted below. No screen has more than one orange action. No slice passed the blind critic. All eight critic slices stalled at 6 to 8 out of 10 after three fix rounds. Most of what the critics still mark down are decisions you signed (Q18, C2, C3, Q12). Android is blocked: the emulator never booted, so there are no Android captures and no 60 fps trace. Lint, type-check and tests have not been run yet for this pack (see Final gates).

How to read the tables:

- Critic: score of each of the 3 runs per round. The bar is top 3 of 5 and 8/10 or more, three runs in a row.
- Checks: axe (serious or critical), small targets under 44 pt, most orange actions on one screen. Counts come from `screens/slice-n/checks.json` (both widths).
- Pops: frame-diff verdicts in the committed `screens/slice-n/transitions/report.json`.

The welcome rebuild (S1c) also has a sheet: [welcome.png](screens/review/welcome.png). Its critic stalled at r1 7/7/7, r2 6.5/7.5/7, r3 7/7.5/7.

### S2 shell and Home

| What changed | Floating 4-tab capsule with a separate orb; the orb grows into the + sheet; new Home with ring, macro dots, Geo line and Health tiles |
|---|---|
| Before/after | [slice-2-home.png](screens/review/slice-2-home.png) |
| Critic | r1 7/7/7, r2 7/7/7, r3 6/7/7 - **stalled** |
| Checks | committed file: axe 2, small 4, orange max 1 (see note) |
| Pops | 5 of 6 smooth; `plus-open-close` pop (one-frame chrome jump). Ledger S2-R4 still pending |
| iOS | [screens/slice-2/ios/](screens/slice-2/ios/) |
| Android | blocked |

Note: the ledger says axe 0 and small 0 (7ce9e45). But `screens/slice-2/checks.json` was last written in 30959c3, and it still shows 2 axe hits on `home-loading` (`aria-prohibited-attr`) and 4 small links ("View nutrition plan", "View full plan") on the old `tabs-food` and `tabs-train` shots. The Food and Train screens were rebuilt later in S5 and S6, and those pass. The slice 2 checks need a rerun before this row counts. An uncommitted re-record of `plus-open-close` in the working tree reads smooth; it is not committed yet.

### S3 logging

| What changed | Pushed headers and card lists for every log screen; search pinned under the bar; photo tray; food search on the inset sheet |
|---|---|
| Before/after | [slice-3-logging.png](screens/review/slice-3-logging.png) |
| Critic | r1 7/7/7, r2 7.5/7.5/7.5, r3 7.5/7/7.5 - **stalled** |
| Checks | axe 0, small 0, orange max 1 (140 checks) |
| Pops | 4 of 5 smooth; `photo-tray` pop (late hard cut at frame 48). Ledger S3-R4 still pending; a re-record is in progress, uncommitted |
| iOS | [screens/slice-3/ios/](screens/slice-3/ios/) |
| Android | blocked |

### S4 Geo tab

| What changed | Geo as one running conversation; chat list with an Ask Geo field; companion and resizable inset sheets |
|---|---|
| Before/after | [slice-4-geo.png](screens/review/slice-4-geo.png) |
| Critic | r1 7/7.5/7, r2 7.5/7.5/7.5, r3 7.5/7/7.5 - **stalled** |
| Checks | axe 0, small 0, orange max 1 (52 checks) |
| Pops | 5 of 6 smooth; `new-conversation` flagged (one-frame chrome jump, 14%). Ledger S4-R4 still pending |
| iOS | [screens/slice-4/ios/](screens/slice-4/ios/) |
| Android | blocked |

### S5 Food diary

| What changed | Food large title with a week strip; day hero with calories as one orange line; meals as white rows with dashed add slots |
|---|---|
| Before/after | [slice-5-food.png](screens/review/slice-5-food.png) |
| Critic | r1 8/7.5/7.5, r2 7.5/7.5/7.5, r3 7.5/7.5/7.5 - **stalled** |
| Checks | axe 0, small 0, orange max 1 (36 checks) |
| Pops | 5 of 5 smooth |
| iOS | [screens/slice-5/ios/](screens/slice-5/ios/) |
| Android | blocked |

### S6 Train and live session

| What changed | Train large title with the week strip and a Next up card; live session with digit-tile timer, set progress, rest timer and muscle diagram |
|---|---|
| Before/after | [slice-6-train.png](screens/review/slice-6-train.png) |
| Critic | r1 7.5/7.5/7, r2 7.5/7.5/7.5, r3 7.5/7/7.5 - **stalled** |
| Checks | axe 0, small 0, orange max 1 (52 checks) |
| Pops | 4 of 5 smooth; `rest-minimise` is flagged, but the ledger reads it as the clock digit changing after a capture gap, not a pop |
| iOS | [screens/slice-6/ios/](screens/slice-6/ios/) |
| Android | blocked |

### S7 Plans

| What changed | Pushed plan screens with a glass back; active plan cards; plan detail with gliding day expand; builders as one-question steps |
|---|---|
| Before/after | [slice-7-plans.png](screens/review/slice-7-plans.png) |
| Critic | r1 7/6.5/6, r2 7.5/7/7, r3 7/7.5/7 - **stalled** |
| Checks | axe 0, small 0, orange max 1 (68 checks) |
| Pops | 6 of 6 smooth |
| iOS | [screens/slice-7/ios/](screens/slice-7/ios/) |
| Android | blocked |

### S8 Check-in

| What changed | Pushed check-in on white cards; headline verdict with count-up; trend line draws in; Apply settles in place |
|---|---|
| Before/after | [slice-8-checkin.png](screens/review/slice-8-checkin.png) |
| Critic | r1 7/7.5/7.5, r2 7/7/7.5, r3 7.5/8/7.5 - **stalled** |
| Checks | axe 0, small 0, orange max 1 (38 checks) |
| Pops | 4 of 4 smooth |
| iOS | [screens/slice-8/ios/](screens/slice-8/ios/) |
| Android | blocked |

### S9 Settings and the rest

| What changed | Hairline settings groups; profile, delete sheet, paywall, public pages, 404, crash screen, confirm dialog and offline band in the v2 style |
|---|---|
| Before/after | [slice-9-settings.png](screens/review/slice-9-settings.png) |
| Critic | r1 6.5/7/6.5, r2 7/6.5/7, r3 7/7/7 - **stalled** |
| Checks | axe 0, small 0, orange max 1 (70 checks) |
| Pops | 6 of 6 smooth |
| iOS | [screens/slice-9/ios/](screens/slice-9/ios/) |
| Android | blocked |

### S10 admin

| What changed | Token pass only: old aliases swapped to v2 tokens in 8 admin files (Q6) |
|---|---|
| Before/after | none - admin was not recaptured (no route or layout change) |
| Critic | not run - outside the critic loop (Q6) - **built** |
| Checks | not rerun (token swap only, web only) |
| Pops | not applicable (no motion changed) |
| iOS | none - admin is web only |
| Android | blocked (not in the app build) |

## Questions for you

Answer each by number: yes, no, or a letter.

### Signed decisions the critics keep marking down

1. **Macro hues (Q18).** Protein is ink, carbs teal and fat ochre. Critics on S2, S5 and S1c ask for one hue. Keep the three hues, or change protein, carbs and fat to navy tints? *Recommend: keep. Separate hues read faster on Home, and this change would touch every slice.*
2. **Capsule plus separate orb (C2).** Critics on S2, S5 and S9 mark it down. Keep it? *Recommend: yes. The orb is the 2-tap path to Geo and logging.*
3. **Round glass back button (C3).** Critics on S3, S4, S7 and S9 mark it down. Pick one: (a) keep as is, (b) keep it round but drop the shadow, (c) a plain chevron with no circle. *Recommend: (b). It is cheap and answers most of the critique.*
4. **Card shadows (Q12).** Critics call the soft shadows on cards and pills heavy. Pick one: (a) keep soft shadows everywhere, (b) keep them on Home bento cards only and use hairlines elsewhere (S9 already does), (c) hairlines everywhere. *Recommend: (b).*
5. **Orange G in Geo's avatar.** The client's reference has it orange. The S8 critic marks it down. Keep orange, or change it to a cream or ink G? *Recommend: keep orange. It is the client's own reference and it is not an action.*

### Product calls

6. **S9 plan row on web.** Web cannot read the subscription, so the row always says "Free", even for a paying user. Pick one: (a) keep "Free", (b) show "In the app" on web, (c) show no value on web, only the chevron to the note. *Recommend: (b). Telling a paying user "Free" is wrong.*
7. **S6 Start colour.** Start on Train is orange; Home uses an ink play button. Pick one: (a) keep as is, (b) ink on both, (c) orange on both. *Recommend: (a). Start is the one action on Train.*
8. **S8 Health wording.** "Includes Apple Health weigh-ins" - OK? *Recommend: yes, with "Health Connect" on Android.*

### Calls agents made alone - confirm

9. **S6:** the muscle figure was removed from the Next up card (it stays in the live session). Confirm? *Recommend: yes.*
10. **S9:** switches use an ink-65 track. The r3 critic says it reads as off. Pick one: (a) keep ink-65, (b) full ink when on. *Recommend: (b).*
11. **S3:** the food search row stays pinned under the bar while you scroll. Confirm? *Recommend: yes.*
12. **S9:** picker rows replace chip rows (the 36 px chips failed 44 pt). Confirm? *Recommend: yes.*
13. **S4:** Geo's name shows once at the start of each run of Geo turns, and logged foods get one "Logged to {meal}" caption. Confirm? *Recommend: yes.*
14. **S2:** the sleep tile is one line plus a weekly average, not the 7-night strip from D1. Keep? *Recommend: yes.*
15. **S3:** the food search sheet moved to the inset sheet, with no snap levels. OK? *Recommend: yes.*
16. **S3:** /foods lost its orange Add; it is now a round + in the header. OK? *Recommend: yes.*
17. **S3:** recent logs show a right-hand value only for food and workouts. OK? *Recommend: yes.*
18. **S4:** resizable sheets settle by transform, so the pinned footer shifts slightly on release. Animating height is forbidden by the motion spec. Keep? *Recommend: yes.*
19. **S4:** inline food rows read Geo's "Logged ... N cal" text. A structured receipt from the backend would be sturdier, but that is a backend change. Ship as is and log the backend change for later? *Recommend: yes.*
20. **S4:** new Ask Geo field on /chat and a Rename/Delete sheet for chats. Approve? *Recommend: yes.*
21. **S5:** the sticky orange Log food button was removed (Add rows, dashed slots and the orb cover it). OK? *Recommend: yes.*
22. **S6:** Freestyle log moved to the header +. OK? *Recommend: yes.*
23. **S6:** the calendar sheet uses the shared week strip, so there is no tap-Today jump. OK? *Recommend: yes.*
24. **S6:** the session pager scrolls sideways only (this also fixed resume landing on exercise 1). OK? *Recommend: yes.*
25. **S7:** the new Earlier plans list adds one extra read (`getPlans()`), which does not block the page. Q6 said no data-flow change. Keep or drop? *Recommend: keep. It is read-only.*
26. **S7:** Cancel was removed from the builders; Back does the same job. OK? *Recommend: yes.*
27. **S8:** after Apply, the screen keeps showing the applied week until you leave. OK? *Recommend: yes.*
28. **S8:** the Settings button was dropped from check-in. OK? *Recommend: yes.*
29. **S9:** profile Save is a glass pill in the bar. Approve? *Recommend: yes.*
30. **S9:** every confirm button is ink, not orange. Approve? *Recommend: yes.*

### Added after the grader pass (26 Oct 2026)

39. **Consent screen on a failed read.** If the profile request fails (bad connection), the app shows the consent screen because it treats a failed read as "no consent" (`auth-gate.tsx`). Change it to an error state with Try again? *Recommend: yes. Asking for consent again on a network error is wrong.*
40. **S7 copy:** empty date fields read "Choose" (plan dates) and "Pick a date" (per-day date). Approve? *Recommend: yes.*
41. **Tab bar circle.** When the bar collapses it shows the tab you are on (Home on Home, Food on Food), as Apple does. You described "just the Home icon". Keep Apple's behaviour? *Recommend: yes.*
42. **Page motion.** Opening a page is now a native iOS push with edge swipe-back (41110bfc). You then picked 19 Spatial Depth for the whole app, where the page behind steps back in depth. The Spatial Depth prototype and the per-journey mocks are being built for your sign-off before it replaces the push.

### Copy lists

Approve each list as written? *Recommend: yes for all.* Say "yes except n" to hold one back.

31. S2 - [copy/slice-2.md](copy/slice-2.md)
32. S3 - [copy/slice-3.md](copy/slice-3.md)
33. S4 - [copy/slice-4.md](copy/slice-4.md)
34. S5 - [copy/slice-5.md](copy/slice-5.md)
35. S6 - [copy/slice-6.md](copy/slice-6.md)
36. S7 - [copy/slice-7.md](copy/slice-7.md)
37. S8 - [copy/slice-8.md](copy/slice-8.md)
38. S9 - [copy/slice-9.md](copy/slice-9.md)

S10 changed no copy.

## Blocked

- **Android.** The emulator `fiqr_lowend35` never booted; it showed a black screen. You quit it on 26 Oct 2026. The older `fiqr_lowend` emulator died under host load. So there are no Android captures for S2 to S9.
- **60 fps (F6).** There is no real low-end phone and no emulator trace. Earlier `fiqr_lowend` runs gave 4 to 17 fps under host load and were discarded. Rubric item 5 stays blocked on every slice.
- **Paywall radio spacing on iOS.** The fix that pins the plan radio to the tile edge for WebKit landed at 18:09 on 26 Oct (44c0ed2). The iOS paywall shot was taken at 17:30, before it. The fix is not yet confirmed on iOS.
- **Native-only screens.** Splash, Notifications prompt, Health connect sheet and native Health tile states render only in the app build. None were captured on a device.
- **Open evidence.** Closed: slice 2 checks were rerun (06613f69, axe 0, small 0) and the S2, S3 and S4 frame-diff rows are filled (859ea621).

## Production data

No production rows were created. The live capture on the real account was read-only, and the ledger's production-rows table is empty.

## Independent grader

A fresh grader on a different model (Sonnet) saw only the BRIEF rubric, six Bevel references and the after captures. Full notes: [GRADER-remaining.md](GRADER-remaining.md).

| Slice | Overall | Top fail | Outcome |
|---|---|---|---|
| S2 Home | 8 | Home error capture showed consent | fixed 06613f69 (capture fixture; error now in a card) |
| S3 Logging | 7 | Tray overlapped the editor card | fixed c3fd082c (editor scrolls clear of the tray) |
| S4 Geo | 7 | Toast covered the back button | fixed 50dffe1c (shared toast below the header); report sheet capture fixed 06613f69 |
| S5 Diary | 8 | Month sheet last row in the corners | fixed 328f8c4c (padding, future days dimmed) |
| S6 Train | 7 | Set rows pushed off screen | fixed 328f8c4c (compact clock, map and rest card) |
| S7 Plans | 7 | Native date inputs, textarea grip | fixed 328f8c4c (app date rows, no grip) |
| S8 Check-in | 7 | Apply below the fold | fixed 50dffe1c (decision and Apply first) |
| S9 Settings | 7 | Paywall title orphan, admin row | fixed 50dffe1c (balanced title; admin row was a capture fixture) |
| S10 Admin | not graded | no captures | ledgered: differs Q6 (token pass only) |

Fails that conflict with signed decisions were left and are listed above as questions (C3, C2, Q12, Q18, D1, C4/Q17).

## Final gates

Run on 5bb6357e after the last slice:

- Palette grep (hex outside the AGENTS.md set): 0 hits. The last 8 were `#000` in alpha fade masks, now brand ink (3eb9f808, no visual change).
- `dark:` classes: 0. `next/image`: 0.
- `npm run lint`: exit 0 (0 errors, 25 warnings).
- `npm run type-check`: exit 0.
- `npm test`: exit 0, 91 files, 539 passed, 1 skipped.
- Ledger: 0 pending rows.
