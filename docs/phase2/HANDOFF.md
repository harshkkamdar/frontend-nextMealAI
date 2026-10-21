# FIQR Phase 2 — handoff

21 October 2026. Same file in both repositories (`docs/phase2/HANDOFF.md`). The signed SOW sits next to it as `docs/phase2/SOW.md`.

## 1. In one paragraph

FIQR (formerly Next Meal AI; the AI coach is still called **Geo**) is a Next.js web app plus an Express API on Supabase. Phase 2, under the SOW signed on 22 Sep 2026, turns it into iOS and Android apps with Capacitor, redesigns every screen, and adds push, offline, payments, wearables and a more reliable Geo (deliverables D1–D11). All Phase 2 code is on branch **`phase2/fiqr`** in both repos. It has **not been deployed**: production still runs `main`. The code is written up to the device boundary. What is left is mostly device work (no Mac with Xcode or Android Studio has built it yet), the client's accounts and decisions, and store submission. Today is **week 3 of 12**; the submission target is **Fri 11 Dec 2026**.

## 2. Where everything is

| What | Where |
|---|---|
| Frontend | `github.com/harshkkamdar/frontend-nextMealAI`, branch `phase2/fiqr` (25 commits on `main` 8a059c3) |
| Backend | `github.com/harshkkamdar/backend-nextMealAI`, branch `phase2/fiqr` (14 commits on `main` d26d28b) |
| Client's copy | `github.com/FIQR-app/FIQR-front-end-` and `FIQR-app/FIQR-BACKEND` hold a squashed Phase 1 snapshot (tag `phase1`). Phase 2 is not there yet. |
| Production API | https://backend-nextmealai.vercel.app, deployed from backend `main` |
| Database | Supabase project `utvipyhgbaoenoxmoisk` (ap-northeast-1), shared by `main` and `phase2/fiqr` |
| Client | George (Australia), who signs off every deliverable and owns the store accounts |
| Owner | Harsh (eng@oximy.com) |

**The production database already carries the Phase 2 schema.** Migrations 027, 029, 030, 035–044 and 046 were applied on 20 Oct; all of them are additive, and `main` still runs on them. Only **045** (the pg_cron notification job) is held, because it needs a deployed API URL and `CRON_SECRET`. Any new migration must keep `main` working until Phase 2 is promoted.

## 3. SOW status, deliverable by deliverable

"Built" means on `phase2/fiqr`, with unit tests green. No deliverable is accepted yet: under SOW §10, George confirms each one in writing.

| # | Deliverable | Built on the branch | Left | Blocked by |
|---|---|---|---|---|
| Close-out | Phase 1 audit fixes | Age from DOB, failed tool calls reported, local-date bucketing, dietary guard on food logs | Deploy the backend to production | Harsh's OK |
| D1 | Native apps (iOS 17+, Android 8+) | Capacitor 8 iOS (SPM) and Android projects, app id `app.fiqr.mobile`, icons, splash, usage strings, `PrivacyInfo.xcprivacy`, minSdk 26, static-export build (`npm run build:native`) | First build on a simulator, an emulator and real phones, and whatever breaks there (safe areas, keyboard, back button) | A Mac with Xcode 26, Android Studio and JDK 21 |
| D2 | Redesign of every screen | Every screen in the SOW list is on the FIQR design. Home and Check-in follow George's mock-ups; the rest are our designs in the same system (`docs/phase2/screens/`) | George's review and the corrections from it; the Geo avatar decision; a visual pass on the live workout and the native-only sheets | George |
| D3 | Push notifications | Device registry (`/v1/devices`), local reminders (meal, workout day, check-in day), rule engine (check-in ready, inactive 3 days, plateau 2 weeks, program complete), hourly dispatcher with per-day dedupe, FCM sender, opt-out in Settings | Firebase project and config files, APNs key, migration 045, end-to-end test on a phone | Firebase project; Apple account; a deployed API |
| D4 | Offline mode | Persistent queue with idempotency keys, sync on reconnect and resume, cached reads for Home, Food, Train and Plans, offline banner | Airplane-mode test on a phone | Devices |
| D5 | Native camera | Native picker, resize before upload, editable estimate before logging | Test on a phone | Devices |
| D6 | Store compliance | Account deletion and export (`/v1/account`), public deletion request, consent step, wellness disclaimer, report-a-response, privacy, support and deletion pages, privacy manifest, permission texts, store questionnaire drafts | Update the store drafts for HealthKit and subscriptions; check the privacy policy's promises (§8); George's sign-off on the checklist; a live domain for the public pages | George (domain, sign-off) |
| D7 | Hardening | CORS allow-list, per-user rate limits, daily AI token cap, zod validation on the remaining controllers, SSRF guard, `schema_migrations` tracking, a CI workflow in both repos | CI first ran when this branch was pushed (21 Oct); keep it green (GitHub Actions tab) | — |
| D8 | Store submission | Listing copy and review notes drafted (`docs/phase2/store-package-draft.md`, frontend repo) | Builds, TestFlight, the Play closed test (14 days, 12 testers), device screenshots, demo account, submission, resubmissions | Everything above, plus George's accounts |
| D9 | Geo reliability | Failures from 678 real turns diagnosed into 13 clusters (`docs/phase2/geo-failure-diagnosis.md`, backend repo) and all 13 fixed in code (§4). Eval bank: 22 cases, 13 of them new | Run the bank against a local API, flip passing cases to `expected: 'pass'`, fix what still fails, share results with George | OpenRouter credit (was USD 0.90 on 20 Oct) |
| D10 | Payments | Purchases adapter on `@capgo/native-purchases` (subscribe, restore, on-device entitlement), paywall screen, Subscription section in Settings | Create the products in both consoles, sandbox purchases on phones, real benefits text and prices, decide what is gated (nothing is yet) | George: accounts, prices and paywall contents (due week 6) |
| D11 | Wearables | Health adapter on `@flomentumsolutions/capacitor-health-extended` (reads steps, active energy, weight, sleep and workouts; writes workouts), `POST /v1/health/sync`, Steps tile on Home, connect sheet, Health section in Settings, workout write-back on finish, sync on launch and resume, Info.plist strings, `App.entitlements`, Health Connect permissions and rationale activity | Turn on the HealthKit capability in Xcode, prove the plugin on real phones, the Health Connect declaration in Play Console | Devices; Play Console |

## 4. What differs from `main`

### Frontend (`phase2/fiqr`, 25 commits)

- **Static export and native shell.** An absolute API base URL, a client-side `AuthGate` in place of the middleware, query-parameter routes (`/plans/view?id=`, `/train/session?id=`, `/chat/session?id=`), two build modes (`build` for the web, `build:native` for Capacitor), error boundaries. Capacitor 8 projects in `ios/` and `android/`.
- **Platform layer** in `src/lib/platform/`: storage, network, camera, notifications, app lifecycle, `health.ts`, `purchases.ts`. Each falls back on the web.
- **Offline**: a FIFO queue with idempotency keys, the `useCachedQuery` hook, an offline banner; six mutations work offline.
- **Design system**: FIQR tokens, the Archivo font, `components/ui/fiqr/*` primitives, a five-slot nav with the raised Geo button, and a hand-drawn Coach avatar (`components/shared/geo-avatar`).
- **Every screen redesigned**: Home, Check-in, Food, Log food, the manual logs and log chooser, Food database, Train, live session, Plans (list, detail, builders), Geo chat and companion sheet, onboarding and consent, auth, Settings, Profile, the public pages and the paywall.
- **New in Phase 2**: the consent step (existing users see it once, then return to the app), report-a-response, the Data & AI settings (AI processing toggle, data export), delete account, notification and check-in-day settings, the Steps tile, the Health and Subscription settings, the paywall.
- **Dependencies**: Capacitor 8 plugins, `@capgo/native-purchases` and `@flomentumsolutions/capacitor-health-extended` were added; `supabase-js`, `socket.io-client` and `next-themes` were removed.
- **Tests**: 427 passing.

### Backend (`phase2/fiqr`, 14 commits)

- **New routes**:
  - `/v1/account`: `DELETE /`, `GET /export`, `POST /deletion-request`.
  - `/v1/feedback`: the user's response report, plus the admin list.
  - `/v1/devices`: register a device, `DELETE /:token`.
  - `POST /v1/health/sync`.
  - `GET /v1/check-in/status`.
  - `POST /v1/internal/notifications/dispatch`, guarded by `CRON_SECRET`.
- **Middleware**: CORS allow-list, per-user rate limits, the daily AI token budget (`llm_usage_daily`), `Idempotency-Key` on six write routes, zod on the remaining controllers, SSRF guard on URL fetches.
- **Migrations 035–046** in `nextmealai/packages/core/migrations/`, tracked in `schema_migrations`:
  - 036 `llm_usage_daily`, 037 `push_devices`, 038 `response_reports`, 039 `idempotency_keys`.
  - 040 consent columns on `profiles`, 041 `notification_sends`, 042–043 account deletions.
  - 044 check-in weekday, 045 notification cron (held), 046 the `steps` log type and `logs.updated_at`.
- **Notifications**: the rules engine and dispatcher, and an FCM sender (firebase-admin, behind `FIREBASE_SERVICE_ACCOUNT_JSON`).
- **Health import**: rows go into `logs` with `source: 'import'`; re-syncing a day updates the row instead of adding one. Geo's context now includes `steps_today`.
- **Geo (D9)**, by failure cluster:
  - Claim guard (F1): Geo cannot say "done" without a successful write; it retries once, then says honestly that nothing changed.
  - Never "try rephrasing" (F2).
  - A text-only final call at the tool cap, and an 8,192-token output budget.
  - Draft plans (F3): `preview_only`, `confirm_draft_id`, edits to the draft.
  - The live workout in every turn's context, and session edits that fall back to the in-progress session and propagate from the plan (F4).
  - Serialised plan writes, and retries on superseded ids (F5).
  - Day resolution for today, weekdays and rest days, and singular/plural exercise names (F6).
  - Plan-wide edits, `days_to_update` and `days_reorder` (F7).
  - Food search relevance, correct kcal, matches from the user's own log history, and `macros_per_100g` (F8).
  - Token-based log lookup (F9).
  - Nutrition labels read from chat photos, kJ to kcal (F10).
  - Act instead of asking, options as chips, and the `fit_foods_to_remaining` operation (F11).
  - `copy_meal` is idempotent and can copy a subset (F12).
  - Allergen and diet matching on word boundaries, so "Danone" no longer matches a "None" allergy (F13).
  - Unknown or unverified tools are recorded as failures.
- **Eval bank**: `nextmealai/apps/e2e-tests/aifirst-eval/cases.ts`, 22 cases, 17 still marked `expected: 'fail'`.
- **Tests**: 1,623 unit tests passing; lint and type-check clean.

## 5. Running it

**Backend** (Node 20+, pnpm):
```sh
cd backend-nextMealAI/nextmealai && pnpm install
cp .env.example .env          # ask Harsh for the values; never commit .env
cd packages/core && PORT=4010 npx tsx --env-file=../../.env src/index.ts
```
`DATABASE_URL` must use the IPv4 session pooler (`aws-1-ap-northeast-1.pooler.supabase.com:5432`, user `postgres.utvipyhgbaoenoxmoisk`); the direct host is IPv6-only. Gate: `pnpm --filter @nextmealai/core type-check`, `pnpm --filter @nextmealai/core lint`, `npx vitest run tests/unit` from `packages/core`. Migrations: the README's "Database migrations" section. `migrate.ts --dry-run` never connects and always reports everything as pending, so check `schema_migrations` with SQL.

**Frontend** (Node 20+):
```sh
cd frontend-nextMealAI && npm install --legacy-peer-deps
echo "NEXT_PUBLIC_CORE_API_URL=http://localhost:4010" > .env
npm run dev                   # http://localhost:3010 (the API allows this origin)
```
Gate: `npm run type-check`, `npm run lint`, `npx vitest run`, `npm run build`, `npm run build:native`. On a Mac with the toolchain: `npm run build:native && npx cap sync && npx cap open ios` (or `android`).

**Test account**: fishi@gmail.com / Pass@123. It lives in the production database, so whatever you do in it is real.

**Geo eval bank**: with the API on port 4010, run `cd nextmealai/apps/e2e-tests/aifirst-eval && node run.ts`. It spends OpenRouter credit, about USD 1–3 a run. F10 needs `fixtures/label-kj.jpg` (a nutrition label with energy in kJ), which does not exist yet; until then the case skips.

**Screenshots**: `docs/phase2/screens/` (frontend repo) holds five overview sheets of every screen at 390 px, taken on 20 Oct against the local API.

## 6. Decisions already made

| Decision | Why |
|---|---|
| Payments use `@capgo/native-purchases` with on-device entitlement; no RevenueCat and no server receipt validation | The signed D10 asks only for products, purchase, paywall and restore. Server enforcement can come once George decides what is gated |
| Product ids: iOS `app.fiqr.plus.monthly`, `app.fiqr.plus.yearly`; Android `fiqr_plus` with base plans `monthly` and `yearly` | Set in `src/lib/platform/purchases.ts`. The products must be created with these exact ids |
| Health plugin: `@flomentumsolutions/capacitor-health-extended` (MIT) | The only free plugin that both reads and writes workouts on both platforms. The official `@capacitor/health-fitness` can't write workouts; Capgo's can't write them either |
| Health data goes into `logs` (`source: 'import'`, new `steps` type) | Check-in and Geo read it with almost no new code |
| The Steps tile replaces the Sessions tile on Home | D11 asks for a Steps tile; there are three tile slots |
| Model: `google/gemini-2.5-flash` on OpenRouter | Benchmarked in September. The successor is Gemini 3.8 Flash (an env change); 3.5 Flash-Lite was rejected |
| Push uses our own Firebase project first and moves to George's later | We are not blocked on his account |
| Coach avatar drawn by hand | The avatar lab we tried is AGPL; whether to keep this design is still George's call |

## 7. Next steps, in order

1. **Preview for George (now).** Vercel preview deployments of both apps from `phase2/fiqr`, with `CORS_ORIGIN` on the API set to the frontend preview's origin, so George can review every screen in his phone's browser. Collect his D2 corrections.
2. **Eval run (as soon as there's credit).** Run the bank, flip passing cases, fix what fails, write up the results for George.
3. **Deploy the backend to production** once Harsh approves. That ships the Phase 1 close-out and the Geo fixes, and unblocks migration 045 (set `CRON_SECRET` and the dispatch URL first).
4. **On devices (weeks 4–5):**
   - Install the toolchain and build on the simulator, the emulator and both phones.
   - In Xcode, turn on the HealthKit, In-App Purchase and Push Notifications capabilities; `App.entitlements` exists but `project.pbxproj` is not wired yet.
   - Add `GoogleService-Info.plist` and `google-services.json` from the Firebase project, and an APNs key.
   - Fix device defects; prove the health plugin and the sandbox purchases.
   - **Get the first Android build into the Play closed test by 9 Nov**, because the 14-day clock can't be shortened.
5. **Feature complete (weeks 6–8):** George's prices and paywall contents, gating if he wants any, his design corrections, a second Geo round, a TestFlight internal build.
6. **Store package (weeks 9–10):** update the drafts (HealthKit, Health Connect and subscriptions are missing from the September drafts), device screenshots, the demo account, review notes, the Geo report to George, then promote Phase 2 to production after approval.
7. **Submit by 11 Dec**, then fix and resubmit until both stores approve (included in the price).

## 8. Open items and known gaps

- **fiqr.app does not resolve** (no website, no mail records). The privacy policy, support page and store drafts all use `support@fiqr.app` and `fiqr.app/delete-account`, and both stores need working privacy, support and deletion URLs. George owns the domain under SOW §4.4.
- **Check the privacy policy against reality**: deletion "within 24 hours", request logs "kept for 30 days", backups "roll off within 30 days".
- **Paywall copy is a placeholder.** The "Terms of use" link points to Apple's standard EULA, which is wrong on Android; it needs a terms page, or a per-platform link.
- **Nothing sits behind the paywall yet**; George decides by week 6.
- **Settings calls `/v1/admin/metrics` for every user** to decide whether to show the admin link, so non-admins log a 403 each time. It's harmless but noisy.
- **Not yet reviewed visually**: the live workout screen (starting one writes a real session), the Health connect sheet and the purchase flow (both native only).
- **Decisions to confirm with George**: calorie floors of 1,200 kcal (women) and 1,500 (men); 5 of 7 days logged before a check-in gives a verdict; the Geo avatar.
- **`docs/phase2/geo-failure-diagnosis.md` (backend repo) is the baseline from before the fixes.** Its "Fixed on phase2?" column predates them; every cluster now has a fix in code that still needs the eval run to confirm.
- **Not Phase 2**: a Vercel "eve" migration experiment lives in a local stash on the backend's `feat/eve-migration` and an untracked `nextmealai/packages/core/eve-ab/`. Ignore it.

## 9. What's needed, and from whom

**From George** (SOW §4, the client's responsibilities):
- Apple Developer and Play Console accounts, with access granted to us. Play identity and device verification take days.
- Merchant, tax and banking set-up in both consoles (needed for D10).
- The fiqr.app domain and a monitored support mailbox.
- 12 Android testers, opted in for 14 consecutive days.
- Subscription prices and paywall contents by week 6.
- His review of the redesign, and sign-off on the compliance checklist.
- Submitting the store questionnaires from our drafts.

**From Harsh**:
- Top up OpenRouter credit. Production Geo stops answering at zero.
- Approve the production deploy of the backend.
- Create the Firebase project, or give the coworker access to make it.
- Hand over the `.env` values securely.

**For the coworker to start**:
- Write access to both GitHub repos.
- Access to the two Vercel projects (frontend and backend).
- Access to the Supabase project `utvipyhgbaoenoxmoisk`.
- The OpenRouter key.
- A Mac with Xcode 26, Android Studio and JDK 21, plus an iPhone (iOS 17+) and an Android phone (8+) for the health, push, camera and purchase tests.
- App Store Connect and Play Console roles once George grants them.

## 10. Working rules on this project

- Nothing goes to production (deploys, promotions, migrations) without Harsh's OK. Preview deployments come first.
- Run the gate before every commit, and commit in groups by area.
- Never commit `.env`. Mask keys in any log or screenshot.
- New migrations take the next number (047 on), must be additive while `main` is live, and are recorded in `schema_migrations`.
- George's feedback arrives in numbered rounds. Fix by number and report back by number.

## 11. Reference

- `docs/phase2/SOW.md`: the signed SOW (both repos).
- Frontend repo:
  - `docs/phase2/store-package-draft.md`: listing copy, review notes and questionnaire answers (September; update for D10 and D11).
  - `docs/phase2/design-decisions-2026-09-17.md`: the reasoning behind the screens we designed.
  - `docs/phase2/screens/`: overview sheets of every screen.
- Backend repo: `docs/phase2/geo-failure-diagnosis.md`, the D9 study (pseudonymised users U1–U11).
- `README.md` and `AGENTS.md` in each repo: stack, layout, environment, commands.
