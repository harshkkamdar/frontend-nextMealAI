# FIQR store package — drafts for George to submit (2026-09-17)

Everything below is written from the shipped app on `phase2/fiqr`. Placeholders in `{braces}` need George's details. Keep answers consistent across both stores; reviewers cross-check the privacy policy, the data-safety form and observed network traffic.

## 1. Listing copy (both stores)

**App name:** FIQR
**Subtitle / short description (30 chars Apple, 80 chars Play):** Food, training and check-ins with Geo, your coach.
**Category:** Health & Fitness. **Age rating target:** 9+ (Apple: Health or Wellness Topics) / IARC equivalent.

**Full description**
```
FIQR is a fitness and nutrition coach that works from what you actually do.

Log food by typing, by photo, or by scanning a menu. Geo, your coach, turns it into today's calories, protein, carbs and fat against targets built from your own body stats and goal.

Train with a program Geo builds around your equipment and experience. Run sessions live: sets, reps, weight and rest, with last session's numbers carried forward.

Check in weekly. Geo reads the week — weight trend, logged days, sessions, sleep — and proposes exactly what changes, or tells you honestly when there isn't enough data to decide.

Works offline. Log on the train or in the gym; it syncs when you're back online.

Built for how people really eat: servings, not grams; Australian supermarket and café foods; batch cooking and logging ahead.

FIQR is a wellness app, not a medical device. Geo does not diagnose or treat conditions or advise on medication. Check any plan with your doctor or a registered dietitian.
```

**Keywords (Apple, ≤100 chars):** `nutrition,macro tracker,food log,calorie,workout,coach,check-in,meal plan,fitness,AI coach`

**Support URL:** `{https://fiqr-domain}/support` · **Privacy policy URL:** `{https://fiqr-domain}/privacy` · **Marketing URL:** optional. Until the domain exists, both resolve on the Vercel web app.

**Screenshots (make from the TestFlight/closed-test build):** Home (targets + Log food), Check-in due state, Food day view, live session, Geo chat with option chips, Settings › Data & AI. Sizes: iPhone 6.9" and 6.5"; Android phone ≥1080 px, at least four; feature graphic 1024×500 (navy background, reversed wordmark, "Your coach, Geo." in cream).

## 2. Apple App Review — Notes for Review

```
FIQR is a native iOS app (Capacitor shell) with bundled UI assets, native camera and photo picker, push notifications via APNs, offline logging with background sync, haptics, and deep links. It is not a website wrapper: the app functions without network for viewing and logging, and all coaching, plan generation and photo analysis run through our own API.

Demo account: {demo email} / {demo password}. The account has a completed profile, an active nutrition and training plan, and a week of logs so the Check-in tab shows a verdict.

AI disclosure: before first use the app asks for explicit consent to send logs, photos and messages to our model providers (Google Gemini via OpenRouter), and shows a not-medical-advice notice. Both can be revisited in Settings › Data & AI. Every Geo reply has a "Report" action.

Account deletion: Settings › Delete account (in app), and {domain}/delete-account on the web.

Health data: entered by the user (weight, measurements, food, sleep, workouts). No HealthKit in this version. Nothing is used for advertising; there are no ads or trackers.

Push notifications are optional, requested after onboarding with an explanation, and can be turned off in Settings. They are coaching nudges only (check-in ready, inactivity, plateau, program complete); no marketing.
```

## 3. Apple App Privacy (App Store Connect "nutrition labels")

Data linked to the user, not used for tracking:
- Contact Info → Email Address (App Functionality).
- Health & Fitness → Health (weight, body measurements, dietary info), Fitness (workouts) (App Functionality).
- User Content → Photos or Videos (meal/menu photos), Other User Content (messages to Geo) (App Functionality).
- Identifiers → User ID (App Functionality).
- Usage Data → none collected for analytics (request logs are operational; declare **Diagnostics → Crash Data: No**, **Performance Data: No**).
Tracking: **No**. Third-party SDKs with their own collection: Firebase Cloud Messaging (device token only).

## 4. Apple age rating questionnaire (2025 format)
- Medical/Treatment Information: **Infrequent/Mild** (Geo declines medical advice; wellness topics only) → expect 9+ or 13+.
- Health or Wellness Topics: **Yes** (calorie tracking, dieting advice, exercise).
- Unrestricted Web Access: **No** (no in-app browser; links open the system browser).
- User-generated content shared between users: **No**.
- Gambling, violence, mature themes, contests: **No**.

## 5. Google Play — Health apps declaration
- App is a health app: **Yes**. Categories: **Activity and fitness**; **Nutrition and weight management**. Not: medical, clinical, emergency, human-subject research.
- Health Connect: **Not used** (no permissions requested).
- Disclosures present in app: purpose, benefits and limits (onboarding consent + Settings › About), "not a medical device" statement, "consult a doctor" reminder. Health data not used for employment/insurance decisions: confirm.

## 6. Google Play — Data safety form
Collected (transmitted off device), all **required for app functionality**, **encrypted in transit**, **deletable by the user in app**:
- Personal info: Email address, Name, User IDs.
- Health and fitness: Health info (weight, body measurements, diet, sleep, mood), Fitness info (workouts).
- Photos and videos: Photos (meal/menu photos the user chooses).
- Messages: Other in-app messages (chat with Geo).
- App activity: In-app actions (logs) — optional to declare; recommended for consistency.
- Device or other IDs: **Yes** (push token) if notifications enabled.
Shared with third parties: **No** — model providers, Supabase, Vercel and Firebase are service providers processing on our instructions. Data collection is **not** optional for core features except photos and push token. Independent security review: No. Account deletion URL: `{domain}/delete-account`.

## 7. Google Play — AI-generated content
In scope (chat is a central feature). In-app reporting: yes, "Report" on every Geo reply → `response_reports`, viewable in the admin dashboard. Prohibited-content safeguards: system prompt safety block (no medical/medication advice, calorie floors, self-harm and eating-disorder redirect with Lifeline 13 11 14 and Butterfly Foundation 1800 33 4673).

## 8. Content rating (IARC) answers
Violence, sexuality, language, controlled substances, gambling: **No**. User interaction: **No** (no user-to-user). Shares location: **No**. Digital purchases: **No** (no IAP at launch). Health/fitness content: Yes where asked.

## 9. Permissions the build requests
- Android: `INTERNET`, `POST_NOTIFICATIONS` (via the push plugin, requested at runtime after an in-app explanation), camera via the system picker (no `CAMERA` or `READ_MEDIA_*` permission declared). No foreground service.
- iOS: Camera and Photo Library purpose strings (in `Info.plist`), Push Notifications capability (enable in Xcode Signing & Capabilities), Associated Domains once the FIQR domain exists.

## 10. Client to-do before either submission
1. Google Play Console personal account (USD 25): ID, payments profile, phone, **device verification** on an Android 10+ phone; developer verification when prompted.
2. Apple Developer Program (USD 99/yr): individual or organisation (Oximy's written note on guideline 5.1.1(ix) is in the plan). Accept agreements as Account Holder.
3. Add Harsh as Admin on both consoles, or create the APNs key yourself and share it securely; create/own the Firebase project (or delegate) and share `google-services.json`, `GoogleService-Info.plist`, and a service-account JSON.
4. Domain for FIQR (recommend `fiqr.app` or `.au`) and a monitored support email; give both to Harsh for the policy pages and env.
5. Twelve or more Android testers who will stay opted in for 14 consecutive days.
6. Review and submit sections 3–8 above in the consoles.
