# Core-job baseline (redesign Phase 0)

24 Oct 2026, code at 832302c. Two numbers per job: taps (counted from the code paths, minimum path, typing counted as one focus tap per field) and seconds (must be measured on a device).

**Status: taps are counted from code, seconds are not measured yet.** Seconds need the app running against the API with a test account (see `inventory.md` Blockers). The protocol below is what will be run once unblocked; the same script is reused for the after build and for the 5-person test in Phase 6.

## Jobs

| Job | Start | Minimum path today | Taps | Text entry | Seconds |
|---|---|---|---|---|---|
| J1 Log a meal by search | Home | Home `Log food` ActionCard -> focus search -> type "oats" -> tap result -> `Log 1 item` (meal type optional) | 4 | 1 field | not measured |
| J1b Log a meal by photo | Home | `Log food` -> `Photo` chip -> native camera shutter -> `Use photo` -> accept estimate | 5 | 0 | not measured |
| J1c Log a meal by telling Geo | Home | nav `Talk to Geo` -> focus composer -> type "had pancakes and a latte" -> send -> confirm option if Geo asks | 3-4 | 1 field | not measured |
| J2 Read today's calories and macros | App open, logged in | Home shows calories, protein, carbs, fat as four MacroBars above the fold at 390x844 | 0 | 0 | not measured (time to first meaningful paint) |
| J3 Talk to Geo | Any app screen | nav `Talk to Geo` -> focus composer -> type -> send | 3 | 1 field | not measured (incl. response time, backend-bound) |
| J4 Finish onboarding | Sign-up form | Sign-up (email, password, submit: 3) -> Personal (name, dob, sex, height, Continue: 5) -> Fitness (equipment, activity, experience, frequency, goal, Continue: 6; injuries and body measurements optional) -> Nutrition (allergies or "None", dietary style, meals/day, weight, target, Continue: 6; dislikes and cuisines optional) -> Review (Continue: 1) -> Generating (wait) -> Consent (2 checkboxes, Continue: 3) | 24 | 7 fields | not measured |

Notes from counting:
- J4 is the heaviest job by far: 4 long forms, about 25 choices on the fitness scroll (D2-23b needs-owner), and two waits (review and generating). This is where the Cal AI one-question-per-screen pattern applies.
- J1 is already short in taps; its cost is likely search latency and the result list scan, which only on-device seconds will show.
- J2 costs zero taps; its baseline is load time and whether the four numbers are legible without scrolling at 360x800.

## Measurement protocol (for seconds)

1. Build: `npm run build:native && npx cap sync ios`, run on the iOS simulator (iPhone 16 Pro, iOS 26.5) and on the low-end Android device/AVD.
2. Account: seeded returning-user account for J1-J3; a fresh sign-up per run for J4.
3. Record the screen: `xcrun simctl io booted recordVideo --codec=h264 job.mov` (Android: `adb shell screenrecord`).
4. Time from first frame of the start screen to the first frame showing the success state (logged item visible in the day, Geo's reply rendered, Home after consent). Extract with `ffmpeg -i job.mov -vf "select='gt(scene,0.02)',showinfo" -f null -`.
5. Three runs per job, report the median, and network conditions (local API on :4010).
6. Write results into the Seconds column with date and build sha.

## Target (to approve in Phase 2)

Proposed: J1 and J3 taps unchanged or lower, J1 seconds -20%, J4 taps unchanged or lower with one question group per screen and seconds -25%, J2 four numbers legible above the fold at 360x800 in under 1 s after data arrives.
