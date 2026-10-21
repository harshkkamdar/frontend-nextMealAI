# SOW FIQR Phase 2

22 September 2026

This Statement of Work (SOW) sits under the engagement described in "Revised Proposal \- Next Meal AI" and reflects the agreed re-split of the three phases to AUD 6,000 / 10,000 / 5,000. It covers Phase 2 in full and settles the outstanding Phase 1 balance.

## 1\. Background

Phase 1 (the "Brain" and web MVP) is live: the Geo coaching agent, food and workout logging, photo and menu analysis, weekly check-ins, and seven rounds of client-driven fixes through August 2026\. Phase 2 turns that product into **FIQR**, an installable iOS and Android app published on the Apple App Store and Google Play, redesigned to the FIQR design reference supplied by the client, with proactive push notifications, offline logging, wearable integration, payments, and a more reliable Geo.

**Phase 1 close-out.** The correctness fixes identified in the September 2026 audit are delivered as part of Phase 1, before the apps are submitted: plan generation uses the real profile age and body stats; tool calls that fail now say so instead of reporting success; day bucketing follows the user's local date; dietary restrictions are enforced on food logs.

## 2\. Deliverables

Every deliverable below is complete before the apps are submitted to the stores. "Complete" means the client has confirmed it works as described here (see §10).

| \# | Deliverable |
| :---- | :---- |
| D1 | **FIQR native apps** for iOS (17+) and Android (8.0+), built from the existing codebase with Capacitor, with app icon, splash screen and native navigation |
| D2 | **FIQR redesign of every screen in the app** to the FIQR design reference. Home and Check-in follow the supplied mock-ups; all other screens are designed by us in the same system and approved by the client. The full list: Home; Check-in (due, mid-week and not-enough-data states); Food diary; Log food (search, photo, menu); manual logs (weight, water, sleep, mood, energy) and the log chooser; Food database; Train; live workout session; Plans (list, detail, builders); Geo chat and the Geo companion sheet; onboarding including the consent step; login, sign-up and password reset; Settings and Profile; privacy, support and account-deletion pages. No screen is left on the old design. |
| D3 | **Push notifications**: on-device reminders (meal reminder at the chosen time, workout-day and check-in-day reminders) and Geo-initiated pushes (check-in ready, inactivity, plateau, program complete), with an in-app opt-out |
| D4 | **Offline mode**: view the last synced Home, Food, Train and Plans; log food, weight and workout sets while offline; automatic sync when back online with no duplicates |
| D5 | **Native camera and photo pipeline** for meal and menu photos, with images resized before upload and editable before logging |
| D6 | **Store compliance package**: in-app account deletion and data export, consent screen for AI processing, wellness disclaimer, "report this response" on Geo messages, privacy policy, support and account-deletion web pages, privacy manifests and permission texts, draft answers for the Play Data safety, Health apps declaration, content rating and Apple App Privacy and age-rating questionnaires |
| D7 | **Production hardening** needed for a public launch: cross-origin and rate-limit configuration, per-user AI usage cap, input validation on remaining endpoints, migration tracking, continuous integration on both repositories |
| D8 | **Store submission and approval**: store listing copy, icon and feature graphic, screenshots, review notes and a demo account; TestFlight internal test; Google Play closed test; submission to both stores; and every review fix and resubmission needed until both stores accept the app |
| D9 | **Geo reliability and understanding**: Geo carries out simple requests the first time (log this, change that, what did I eat), asks fewer clarifying questions and offers tappable options instead, verifies every action against the database before saying it is done, and admits when something failed. Failures reported by the client or by users during Phase 2 are triaged and fixed in each round. Measured with the Geo evaluation suite (the existing bank plus cases added from reported failures); the suite passes before submission and its results are shared with the client. |
| D10 | **Payments and monetisation**: subscription products set up in App Store Connect and Google Play Console; in-app purchase flow using Apple In-App Purchase and Google Play Billing \- a paywall screen in the FIQR design; restore purchases; |
| D11 | **Wearable integration**: Apple Health (HealthKit) on iOS and Health Connect on Android. Read steps, active energy, weight, sleep and workouts into FIQR so Geo and the check-in can use them; write completed FIQR workouts back to Apple Health and Health Connect; a Steps tile on Home; permission screens and the Health Connect declaration for Google Play. Not included: an Apple Watch or Wear OS app (a native watch app is a separate quote). |

## 3\. Out of scope

Social login (Google or Apple sign-in); the B2B coach dashboard (Phase 3); an Apple Watch or Wear OS app (integration included); web payments; new coaching features beyond D9 and D10; marketing website; App Store or Google Play fees; third-party service fees (\#5); ongoing store account administration after approval.

## 4\. Client responsibilities

The timeline depends on these being done when requested:

1. Create a **Google Play Console** developer account (personal, USD 25), complete identity, payments, phone and device verification, and Android developer verification when prompted.  
2. Enrol in the **Apple Developer Program** (USD 99/year), choosing individual or organisation. We will advise; Apple guideline 5.1.1(ix) prefers a legal entity for apps handling health data, and the client accepts the review risk of an individual account if chosen.  
3. Grant access to both consoles, and complete the merchant, tax and banking set-up in both (needed for D10).  
4. **Own the FIQR domain** and a monitored support email address (shown publicly on the store listing).  
5. **Recruit at least 12 Android testers** who install the closed test and stay opted in for 14 consecutive days (a Google Play requirement for new personal accounts).  
6. Decide subscription prices and what sits behind the paywall (D10) by week 6\.

## 5\. Third-party costs (estimates, paid by the client)

| Service | Now | At scale |
| :---- | :---- | :---- |
| Supabase (database, auth, storage) | Free tier | Pro from USD 25/month once limits are hit (roughly hundreds of active users) |
| Vercel (hosting, web and API) | Free (Hobby) | Pro USD 20/month if traffic or build limits are hit |
| AI model usage (Gemini via OpenRouter) | Roughly USD 5–20/month at current usage | Roughly USD 0.50–2.00 per active user per month, depending on usage |
| Apple Developer Program | USD 99/year | Same |
| Google Play Console | USD 25 once | Same |

## 6\. Data protection

Health and personal data is stored in Supabase's managed Postgres with row-level security, encrypted in transit and at rest, and accessible only to the people who run FIQR. Photos are kept in private storage tied to the user's account. Users see and agree to what is shared with the AI model providers before Geo starts, can turn it off, can download their data, and can delete their account and all of its data from within the app or from the web. Data is not sold and is not used for advertising. The build is designed to meet the Australian Privacy Principles and both stores' health-data and user-data policies; the full compliance checklist (D6) is confirmed with the client before submission, since both stores require it.

## 7\. Timeline

Twelve working weeks from kickoff to submission, plus the client-dependent 14-day Google Play closed test which runs from week 10\.

| Weeks | Milestone |
| :---- | :---- |
| 1-2 | M1 Foundations: export-ready app, design tokens and components, backend hardening, native shell booting on both platforms |
| 3-4 | M2 Core screens: Home and Check-in per the supplied designs; account deletion; consent |
| 5-6 | M3 Remaining screens redesigned; push notifications end to end |
| 7 | M4 Offline mode; Phase 1 close-out fixes; first Geo reliability round |
| 8-9 | M5 Payments (D10) and wearable integration (D11); second Geo reliability round |
| 10 | M6 Store package: assets, policies, forms; TestFlight internal build; Play closed test begins |
| 11-12 | M7 Fixes from testing; Geo evaluation suite passes; App Store submission; Play production access request once the 14-day test completes; review fixes and resubmissions until both stores approve |

## 8\. Fees and payment

| Item | AUD | Due |
| :---- | :---- | :---- |
| Phase 1 balance (50% of AUD 6,000) | **3,000** | On signing this SOW |
| Phase 2, instalment 1 (50%) | **5,000** | On signing |
| Phase 2, instalment 2 (50%) | **5,000** | On M7: submission to both stores |
| **Total under this SOW** | **13,000** |  |

Submission means the complete app (D1–D11) has been uploaded for review on both stores. Store review fixes and resubmissions after that point are included in the price and continue until both stores accept the app; they are not a change of scope. Prices exclude GST if applicable. Payment terms 7 days from invoice.

## 9\. Change control, warranty, ownership, termination

- Changes to scope, including screens or features not listed in §2, are quoted separately before work starts. Store resubmissions are included (§8).  
- **Warranty:** 60 days after each store approval, we fix defects in the delivered scope at no charge. Store policy changes after approval are not defects. Ongoing support after the warranty can be arranged under a separate annual maintenance agreement.  
- All code, designs and documentation produced under this SOW are owned by the client on final payment. We retain the right to reuse general, non-client-specific techniques.  
- Both repositories, the Vercel projects and the Supabase project remain in their current accounts during Phase 2; transfer to client-owned accounts can be scheduled at any time on request. Phase 1 code has already been provided to the client's GitHub organisation.  
- **Termination.** Either party may end this SOW with 14 days' written notice. The client pays for work completed up to the notice date, pro rata against the milestone in progress, and owes nothing further. Within 14 days of notice we hand over everything: all repositories at their latest state, documentation, credentials and account access, environment configuration, and a written handover note. If we are the party ending the work, we also find a replacement developer of equivalent capability, introduce them to the codebase, and support the transition at no charge for up to 10 hours.

## 10\. Acceptance and signatures

A deliverable is accepted when the client confirms in writing that it works satisfactory; The phase is complete when both stores have approved the app.

Client: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  Date: \_\_\_\_\_\_\_\_

Harsh Kamdar: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  Date: \_\_\_\_\_\_\_\_