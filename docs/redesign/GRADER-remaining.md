# Grader: slices 2 to 9 (slice 10 not graded)

Method: stills only (390 captures, one 360, one ios/ capture per slice) against six Bevel references (IMG_6862, 6904, 6915 viewed in detail). No code, ledgers or other docs read.

Rubric note: BRIEF.md "Grading rubric" lists 6 items, not 8. They are: (1) taps/seconds at or below baseline, (2) every inventory state captured, (3) WCAG AA contrast and 44pt targets, (4) transitions with zero pops, 60fps, (5) critic at or above references, (6) lint/type/tests plus AGENTS.md rules (no next/image, no dark mode, no new colours, one orange action).
Items 4 and 6 (tests part) cannot be judged from stills: marked N/V (not verifiable), not counted as pass or fail. Item 5 is my own single-pass proxy: pass only at overall 8 or above. Baseline taps for item 1 are unknown to me; judged by visible steps only.
Slice 10 (admin): folder screens/slice-10 does not exist, so nothing graded.
General note: all ios/ captures show the web app inside Mobile Safari (localhost bar, Safari toolbar), not a native simulator app run. They clip content under the tab bar and browser chrome, so they do not prove native iOS behaviour.

## Slice 2 - Home and quick log
Files: home-390, plus-sheet-390, home-error-390, home-first-run-390, home-360, ios/home.
1. Taps: pass - the + opens a sheet with a text box and 9 shortcuts, 2 taps to a log.
2. States: FAIL - home-error-390.png is the "Before Geo starts" consent screen, not a Home error state.
3. Contrast/targets: pass - dark navy on cream, 44pt-plus round buttons; grey captions are readable.
4. Transitions: N/V.
5. Critic: pass (8) - calm hierarchy, big 860 ring and one coach line, close to Bevel's tidy card stack.
6. Rules: N/V for lint/tests; visible rules ok (one orange fill action; orange ring and underline are decoration).
Overall: 8/10.
Fails:
1. home-error-390.png shows the consent screen; capture a real Home error state.
2. home-390.png: "Next up Upper A" card is cut off under the tab bar at first view, so the start-workout action is not visible without scrolling.
3. home-360.png: coach line wraps to three lines and pushes the tiles down; card top inconsistent with 390 spacing.
4. home-first-run-390.png: four tiles each show a lone dash plus caption; four near-empty cards read as filler (Bevel uses one empty ring with a single prompt).
5. ios/home.png: Safari chrome hides the Water and Sleep footers; macro rows lose their dot bars in this capture, so the layout differs from 390 (real layout drift or a stale capture).

## Slice 3 - Log flows (food, water, weight, sleep, mood, energy, workout)
Files: food-results-390, food-selected-390, food-error-390, food-photo-result-390, energy-filled-390, food-selected-360, ios/food-selected.
1. Taps: pass - result row, adjust, Log meal. (The extra "Add to tray" step is duplicated by the tray below; see fails.)
2. States: pass - results, selected, error, photo estimating and result, energy filled are all captured.
3. Contrast/targets: pass - pill and stepper targets are large; USDA labels are light grey but legible.
4. Transitions: N/V.
5. Critic: fail (7) - the editor card is dense and the bottom tray overlaps it.
6. Rules: N/V for lint/tests; Log meal and Save are the single orange action per screen.
Overall: 7/10.
Fails:
1. food-selected-390.png and food-photo-result-390.png: the bottom tray (1 item, chip, Log meal) overlaps the bottom of the editor card, cutting off the "Add to tray" / "Ask Geo to estimate" row; two competing actions (Add to tray, Log meal) with no clear order.
2. food-photo-result-390.png: the "Ask Geo to estimate" row is half hidden behind the tray and the long name truncates to "Grilled salmon, Brown r..." in the chip.
3. ios/food-selected.png: the Carbs tile is blank (value missing) and the tray cuts through the tile row; focused input shows a stray blue caret at the header under the search field.
4. food-error-390.png: the error is plain text at the top with a text link and a huge empty screen below; Bevel-level polish would use an icon plus a bordered button.
5. food-selected-360.png: the search bar and Photo/Menu buttons overlap (Photo/Menu are clipped by a scroll collapse), a sloppy intermediate state.

## Slice 4 - Geo chat
Files: list-390, session-reply-390, session-send-failed-390, list-first-run-390, session-report-390, session-360, ios/session.
1. Taps: pass - Ask Geo field on the list, chips for answers, logged meal card inline.
2. States: pass - list, empty, thread, error, report sheet, photo and offline captured.
3. Contrast/targets: FAIL - timestamps and "Logged to lunch" captions are small mid-grey; the "..." row menu is a small dot cluster; error toast text is clipped (see fails).
4. Transitions: N/V.
5. Critic: fail (7) - clean but plain next to Bevel's layered cards; header is a flat text strip.
6. Rules: N/V for lint/tests; Send report is orange, fine.
Overall: 7/10.
Fails:
1. session-send-failed-390.png: the toast "That didn't send..." sits over the back button and header with text touching the top and bottom of its pill; it wraps to two lines in a one-line pill.
2. ios/session.png: the meal card shows "Breakfast" labels over macro rows that overlap (card rows clipped at the top under the header), and chips wrap as a full-width "Not sure" button, unlike the 390 layout.
3. session-reply-390.png: the user bubble and Geo reply share one flat cream with no avatar on the second Geo message; the macro dot labels "34 g P" are tiny.
4. session-report-390.png: "Wrong or misleading" is pre-selected, so Send report can fire with one tap; the orange button is the wrong weight for a destructive-ish report.
5. list-390.png: row titles truncate with ellipsis ("Swap squats for something kne...") while the preview truncates too; time stamps mix "10:58 pm", "Sat", "14 Oct" in one column.

## Slice 5 - Food diary
Files: food-390, month-sheet-390, row-actions-390, food-empty-390, food-error-390, food-360, ios/food.
1. Taps: pass - Add food inside each meal card, one tap.
2. States: pass - empty, error, loading, future, past, month sheet, long and many captured.
3. Contrast/targets: pass - day strip digits are large; light grey dots on the macro rows are decoration only.
4. Transitions: N/V.
5. Critic: pass (8) - the 1,090 summary card, week strip and meal cards are tidy and close to the Bevel layout.
6. Rules: N/V for lint/tests; the orange fill bar and orange marker add colour but not a second action.
Overall: 8/10.
Fails:
1. month-sheet-390.png: the last calendar row (27 to 31) is cut off by the sheet bottom and day numbers have no future-day dimming; the sheet shows a partial row.
2. row-actions-390.png: a cream sliver shows below the bottom sheet (sheet does not reach the screen bottom).
3. food-error-390.png: the error leaves the screen empty below and the week strip stays tappable above; same plain text-link pattern as other slices.
4. ios/food.png: the week strip shows "Su Tu Th Sa" while 390 shows single letters (inconsistent), and Safari chrome covers the lunch card.
5. food-390.png: the date strip, summary card, "Your nutrition plan" link and meal list stack to over 4 sections before the first log row; the macro dot rows duplicate the numbers above them.

## Slice 6 - Train and workout session
Files: train-390, session-mid-390, session-rest-390, train-no-program-390, session-finished-390, session-mid-360, ios/session-mid.
1. Taps: FAIL - the core job (log a set) sits below a tall timer card and a muscle diagram; only sets 1 to 3 are visible at 390 and on iOS the set table header is the only thing visible above the Previous/Next bar (ios/session-mid.png).
2. States: pass - train, calendar, rest day, session mid/rest/finished, error, offline, loading captured.
3. Contrast/targets: pass - Done checkmarks and Next/Previous are well over 44pt; digit tiles high contrast.
4. Transitions: N/V.
5. Critic: fail (7) - the session screen spends the top 35 percent on chrome; Bevel keeps the active data above the fold.
6. Rules: N/V for lint/tests; orange is used for one fill action plus muscle highlight.
Overall: 7/10.
Fails:
1. session-mid-390.png, session-mid-360.png, ios/session-mid.png: timer card (Time, Volume, six digit tiles, segmented bar) plus muscle diagram push the set rows off screen; the user must scroll to log a set.
2. session-mid-390.png: "Time" label left and "Volume 1,880 kg" right are misaligned vertically with the digit row; the first two digit tiles ("0 0") are grey so the clock reads oddly.
3. session-rest-390.png: the dark rest timer panel covers the set rows being logged (rows show under its bottom edge).
4. ios/session-mid.png: set table cut off to its header row by the Previous/Next bar; same fault, worse.
5. train-390.png: bar chart shows only two bars and a stub, with "Volume 10,960 kg" and "Sessions 2 of 4" right-aligned in different baselines.

## Slice 7 - Plans
Files: plans-390, view-meal-390, new-meal-filled-390, new-workout-days-invalid-390, plans-none-390, plans-360, ios/view-workout.
1. Taps: pass - Ask Geo for a plan is one tap; build flows are stepped with a progress bar.
2. States: pass - none, error, offline, loading, invalid, saving captured.
3. Contrast/targets: pass - inputs and CTAs large; the disabled Save plan is intentionally dim.
4. Transitions: N/V.
5. Critic: fail (7) - form screens use unstyled browser controls.
6. Rules: N/V for lint/tests; the single orange CTA holds on plans-390.
Overall: 7/10.
Fails:
1. new-meal-filled-390.png: Start date and End date show the native browser "dd/mm/yyyy" with calendar glyphs; the Notes box has a visible resize grip in the corner.
2. new-workout-days-invalid-390.png: huge empty gap between the toggle and the footer; the error line "Day 1 needs at least one exercise" is small grey text above a disabled button.
3. ios/view-workout.png: three equal stat tiles (5 days, 4 training, 18 exercises) are generic AI-style tiles with little value; the title reads "Training plan" while the nutrition view reads "Nutrition plan" with different date formats.
4. plans-390.png: the pencil icons are thin mid-grey on white, low emphasis and unlabelled; "Earlier" list is cut by the tab bar.
5. plans-none-390.png: dashed empty cards both say "Build one, or ask Geo below" (repeated copy), and the empty page is half blank.

## Slice 8 - Weekly check-in
Files: mid-week-390, due-390, insufficient-390, error-390, due-apply-error-390, due-360, ios/due.
1. Taps: FAIL - "Apply new targets" is below the fold on the due screen (visible only after scrolling past the chart and four tiles in due-apply-error-390.png).
2. States: pass - due, due-applied, apply-error, first-week, insufficient, mid-week, offline, loading captured.
3. Contrast/targets: FAIL - the mid-week-390.png weight line and bars are light grey (about 2:1 on white), under the 3:1 graphic threshold.
4. Transitions: N/V.
5. Critic: fail (7) - strong number-led hero, but the lower half is a repetitive tile grid.
6. Rules: N/V for lint/tests; one orange CTA (Apply new targets).
Overall: 7/10.
Fails:
1. due-390.png: the decision (what changes, Apply) is placed below the weight chart and four stat tiles; the core job is off-screen on first view.
2. due-apply-error-390.png: the toast "That didn't save. Try again." overlaps the back button and clips its text to the pill edges.
3. mid-week-390.png: the whole screen is dimmed grey in the chart and the sessions and sleep progress bars, so it reads disabled while holding live data.
4. insufficient-390.png: "Days logged 2 of 7 days" plus a 7-segment bar, plus text, plus a trend chart: four elements for a "not enough data" message.
5. ios/due.png: the weight trend and tiles are partly hidden by Safari chrome and tab bar; "-0.8 kg" hero is 3x larger than any other number, out of scale with the rest.

## Slice 9 - Settings, profile, paywall, delete, errors
Files: settings-390, paywall-390, profile-390, delete-sheet-typed-390, paywall-error-390, crash-390, settings-360, ios/paywall.
1. Taps: pass - Settings rows and the paywall CTA are one tap each.
2. States: pass - settings error/loading/long, paywall loading/purchasing/subscribed/web/error, profile states, delete sheet and crash captured.
3. Contrast/targets: FAIL - the Push notifications toggle (settings-390.png) is slate on white with a white knob, so on and off read similarly; Free value and chevrons are light grey.
4. Transitions: N/V.
5. Critic: fail (7) - tidy grouped lists, but a plain iOS-settings clone with no signature.
6. Rules: N/V for lint/tests; the paywall has one orange CTA.
Overall: 7/10.
Fails:
1. ios/paywall.png: the Monthly and Yearly labels collide with their radio dots; the "Start FIQR Plus" CTA is half hidden behind the tab bar on a purchase screen.
2. paywall-390.png: the title wraps to three lines with a lone "do" on the third line and the G avatar sits beside the heading; the legal copy runs past the screen with Privacy/Terms cut at the bottom edge.
3. delete-sheet-typed-390.png: Delete account is navy, same as every primary button, not a distinct destructive style; the sheet sits over a dimmed settings list with the tab bar bleeding through.
4. profile-390.png: input values are bare text right-aligned with unit labels, no field affordance; Save is a pill that looks like a back button.
5. settings-390.png: the Reminder time value "07:30 AM" has no chevron or picker control, unlike Check-in day (spinner arrows), so it reads inconsistent; an "Admin dashboard" row shows for the capture user in delete-sheet-typed-390.png.

## Slice 10 - Admin
Not graded: docs/redesign/screens/slice-10 does not exist.
