# Exercise form images - source research

Date: 2026-10-24. All facts below were checked against live sources on this date (API calls, repo trees, vendor pages). Prices are vendor list prices and should be re-confirmed at purchase time.

Brief: find exercise form images that fit FIQR (Archivo, ink navy #111C35, orange #E8622A, cream #FDF6EC, white). Wanted: clean, consistent, modern line or flat art, transparent or plain background, recolourable to ink on cream, SVG ideal. Already rejected: yuhonas/free-exercise-db (dated red-wall gym photos).

Target lifts used for coverage checks: barbell bench press, back squat, deadlift, pull-up, overhead press, bent-over row, dumbbell lunge, Romanian deadlift, lat pulldown, plank.

Contact sheet (raw vs recoloured): `/private/tmp/claude-501/-Users-veddsavla-Developer-clients-frontend-nextMealAI/de2bcb4f-22d6-46de-9e25-c9a4aa31caa7/scratchpad/eximg/sheet.png` (HTML next to it: `sheet.html`). This is scratch output, not committed.

## Summary table

| Source | Licence | Paid app OK | Cost | Exercises | 10 targets | Format | Verdict |
|---|---|---|---|---|---|---|---|
| Everkinetic open data (also the line art inside wger) | CC-BY-SA 4.0 | Yes, with attribution and ShareAlike on the images | Free | 293 listed, about 270 with SVG pairs | 10 of 10 movement families, 6 exact, 4 off-variant | SVG (traced), PNG | Usable, not premium |
| WorkoutLabs exercise illustrations | Proprietary written licence | Yes, once licensed | From $1,200/yr full library, $3,500+ perpetual, or $15-$25 per image | 679 strength + 146 yoga | 10 of 10 | SVG, alpha PNG, GIF, MP4 | Best fit, needs licence that allows recolour |
| MuscleWiki API | MuscleWiki API Terms | Yes on paid plans | $10-$199.99/mo | 1,900+ / 7,700+ videos | Likely all (not checked per lift) | Streamed video, bodymap images | Fails: no storage, branded video, wrong medium |
| ExerciseDB (AscendAPI) | Proprietary API terms; code AGPL-3.0 | Only while subscribed | Not published | 1,500 (V1) to 11,000+ | Likely all | GIF, video, images | Fails: no caching, licence ends with subscription |
| Noun Project icons | Noun Project Pro royalty-free licence | Yes | $9.99/mo or $3.33/mo yearly | Thousands, per-creator | Mixed | SVG, PNG | Icons only, not form guides; inconsistent across creators |
| Muscle-map SVG libraries (fallback) | MIT | Yes | Free | n/a | n/a | Inline SVG React | Good fallback for "target muscle" |

## 1. Everkinetic open data (and wger.de)

- URL: https://github.com/everkinetic/data (repo pushed 2026-01-21). The same drawings are what wger.de serves as its "line" style images: https://wger.de/api/v2/exerciseimage/
- Licence: Creative Commons Attribution-ShareAlike 4.0 International (CC-BY-SA 4.0), repo `LICENSE.md`, text at https://creativecommons.org/licenses/by-sa/4.0/legalcode. Note: wger labels the same Everkinetic images as CC-BY-SA 3.0 (wger licence id 1, https://creativecommons.org/licenses/by-sa/3.0/). Use the repo copy under 4.0.
- Commercial use in a paid app: allowed.
- Attribution: required. Credit "Everkinetic" plus licence name and link, and state that images were modified (recoloured). Put it on an in-app credits or about screen.
- ShareAlike: recoloured images are adaptations, so the recoloured image files must also be offered under CC-BY-SA 4.0. This does not extend to FIQR app code (the images are separate works), but anyone can reuse our recoloured set. Acceptable, but note it.
- Cost: free.
- Coverage: `exercises.json` lists 293 exercises; `src/exercises/NNNN/` holds start (`-relaxation.svg`) and end (`-tension.svg`) SVGs for about 270 of them. wger as a whole has 932 exercises but only 383 images (279 exercises), of which about 100 are line style and most of the rest are user photos in mixed styles - wger is not useful beyond the Everkinetic subset.
- Target lifts (SVG id_num checked by download):
  - Barbell bench press: yes (0042)
  - Back squat: yes (0122 Barbell Squat)
  - Deadlift: yes (0099 Barbell Dead Lifts)
  - Pull-up: yes (0087)
  - Overhead press: partial - only Seated Military Press (0004); no standing barbell press
  - Bent-over row: partial - standard "Bent Over Row with Barbell" (0298) has no SVG; Reverse Grips Bent Over Barbell Rows (0026) does
  - Dumbbell lunge: yes (0115)
  - Romanian deadlift: yes (0118)
  - Lat pulldown: partial - Wide Grip Lat Pull Down (0097) has no SVG; Underhand Pull downs (0093) does
  - Plank: partial - Side Plank (0113) only; no front plank
- Format: SVG traced from raster (Potrace style filled paths), 24-44 KB each, two fills only (`#333333` lines, `#FFFFFF` fill). Some files have an opaque white box, others are transparent. Two frames per exercise (start/end).
- Recolourable: yes, trivially. Replace `#333333` with `#111C35` and `#FFFFFF` with `#FDF6EC` (or none), or use a CSS/SVG duotone filter. The sheet shows a clean ink-on-cream result.
- Style and quality: consistent with itself, but it is a realistic, muscle-striated bodybuilder in a 2010-era textbook style. Male only. Line weight varies with scale; canvas sizes and crops differ per file. Reads as dated clip art next to a minimal UI, even after recolour.
- Access: bulk download from GitHub (raw files or clone). No API needed, no rate limits. Bundle the SVGs as static assets; about 25-45 KB each, roughly 15 MB for the full set uncompressed (much less gzipped).

## 2. WorkoutLabs exercise illustrations (commercial)

- URL: https://workoutlabs.com/exercise-illustrations-licensing/ ; usage rules: https://workoutlabs.com/use-of-illustrations/ (page dated 2026-07-22).
- Licence: proprietary written licence from WorkoutLabs LLC (no public licence text; terms come with the quote). Work is copyrighted, partly registered (VA0001972444).
- Commercial use in a paid app: yes with a written licence. Without one, any use beyond linking is prohibited.
- Attribution: not stated on the public page; ask. Attribution alone does not grant permission.
- Modification: the public usage page says do not alter images without a licence. Recolouring to ink must be written into our licence explicitly.
- Cost (list, "starting from"): $15 per image per year or $25 per image perpetual (volume discount from 15+); full 679-exercise library from $1,200/yr or $3,500+ perpetual; API $195 setup + $50/mo during development. Animated formats and extra characters cost extra.
- Coverage: 679 strength/gym exercises plus 146 yoga. All 10 targets exist as guide pages: barbell-bench-press, barbell-squats, barbell-deadlifts, pullups, standing-overhead-military-barbell-shoulder-press, bent-over-barbell-rows, dumbbell-lunges, romanian-deadlifts, wide-grip-lat-pulldowns, plank. Male and female variants.
- Format: vector SVG (static and "animation-ready" layered), alpha PNG (1919x1280 in the sample), GIF, MP4. Also an outline (black and white) style option.
- Background: transparent.
- Recolourable: yes. The art is full colour (300-600 distinct fills per SVG, 110-230 KB each), so a straight duotone looks washed out, but a flat-ink silhouette (all fills to `#111C35`, alpha kept) looks crisp and modern on cream - see sheet section B. Their black-and-white outline style may suit ink-on-cream better still; ask for samples of it.
- Style and quality: consistent across the library, contemporary flat illustration, multiple characters, multi-frame per movement. The strongest visual fit found.
- Access: bulk files delivered on licence, or API. Self-host the files. SVGs are heavy for inline use; pre-flatten to a single-colour SVG or export small WebP at build time.
- Samples downloaded: the free `exercise-formats-sample.zip` (13 files). It does not include any of the 10 target lifts, so the sheet shows other exercises for style only.

## 3. MuscleWiki API

- URL: https://api.musclewiki.com/pricing ; terms https://api.musclewiki.com/api-terms
- Licence: MuscleWiki API Terms of Use; fitness apps only; no ML training.
- Commercial use: all paid plans.
- Cost: Free playground (500 calls, playground only), Testing $10/mo (1,000 calls), Growth $39.99/mo (30,000), Professional $99.99/mo (100,000, includes bodymap images), Enterprise $199.99/mo (300,000). 25% off annual.
- Coverage: 1,900+ exercises, 7,700+ videos.
- Format: streamed video plus thumbnails and bodymap images. Real-person video, not illustration.
- Attribution: "Exercise data and videos provided by MuscleWiki.com" must appear verbatim in ToS or privacy policy; MuscleWiki branding in videos must not be cropped or hidden.
- Recolourable: no (video, and altering is restricted).
- Access and hosting: API only. Video may only be cached transiently; thumbnails and bodymaps for 24 hours; no re-hosting, no offline. Bad fit for a Capacitor app that works offline and for the visual system.
- Verdict: fails style and hosting.

## 4. ExerciseDB (AscendAPI)

- URL: https://exercisedb.dev/ (free V1, 1,500 exercises with GIFs, no key), paid API with 11,000+ exercises; repo https://github.com/exercisedb/exercisedb-api (code AGPL-3.0).
- Licence: AscendAPI ExerciseDB API Terms of Use (https://exercisedb.notion.site/ExerciseDB-API-Terms-of-Use-226983b728ca8090bf7be79564e4b356). AscendAPI owns all media; licence is non-transferable, revocable, and lasts only while subscribed; storing any data or media is prohibited. No explicit media licence found for the free V1 GIFs. A Gumroad listing (exercisedb.gumroad.com) sells a one-time "commercial rights" dataset up to $300, but its tie to AscendAPI could not be confirmed.
- Cost: paid API pricing not published on the pages checked.
- Format: animated GIFs of 3D-rendered figures (style not re-checked visually this round).
- Recolourable: not practically (raster GIF, shaded 3D).
- Access: API, no caching allowed. AGPL code is irrelevant to media rights.
- Verdict: fails licence (no storage, revocable) and style.

## 5. Icon packs (Noun Project, IconScout, Icons8, GetIllustrations)

- Noun Project: https://thenounproject.com/pricing/ - Noun Pro $9.99/mo or $3.33/mo billed yearly; royalty-free commercial licence; no attribution with Pro; recolour editor included. Thousands of weight-lifting icons (about 1,300 under "weight lifting"), but each icon is by a different creator, so a matching set of 10 form poses in one style is unlikely. They are pictograms, not form guides.
- IconScout / Icons8 / GetIllustrations (All Access $295/yr, standard licence with no attribution per their FAQ): stock "fitness" sets are lifestyle scenes, not a consistent per-exercise library; none found covering all 10 lifts in one style.
- Verdict: good for small badges (e.g. equipment icons), not for exercise form.

## 6. Open SVG muscle maps (target muscle diagram)

- react-muscle-highlighter: https://github.com/soroojshehryar/react-muscle-highlighter - MIT, v1.2.0 (2026-01-06), peer deps React 18/19 and react-dom, so it works in the Next.js 16 / React 19 web build that Capacitor wraps.
- react-native-body-highlighter: https://github.com/HichamELBSI/react-native-body-highlighter - MIT, 298 stars, v3.2.0 (2026-04-13). React Native only, not usable directly here, but its SVG paths are the common ancestor of the web ports.
- body-highlighter (framework-agnostic): https://github.com/lahaxearnaud/body-highlighter - MIT, npm v3.0.2, zero dependencies.
- react-body-highlighter: https://github.com/giavinh79/react-body-highlighter - MIT, last npm release 2021 (stale).
- All are plain SVG polygons with per-muscle fill props, so front/back body outlines in ink, primary muscle in orange and secondary in a lighter ink tint are a props change. MIT needs only the licence notice in credits. Before adopting, check the library's colour props can be limited to the FIQR palette and that it has no runtime dependencies we do not want; if not, copy its MIT SVG paths into a FIQR component under `src/components/ui/fiqr`.

## Recommendation

- Honest bar: none of the free sources meets a premium bar. Everkinetic is the only free, legally clean, recolourable SVG set that covers all 10 movement families, and the ink-on-cream recolour is tidy, but the drawing style (striated bodybuilder, textbook look, male only, mismatched crops, 4 of 10 off-variant) reads dated next to FIQR. Shipping it would lower the perceived quality of the product.
- The only source that clears the premium bar is WorkoutLabs, recoloured to flat ink silhouettes (or their outline style) on cream. It covers all 10 lifts, has male and female figures and transparent SVGs. Condition: the written licence must allow recolouring and bundling in an offline mobile app. Budget about $150-$250 per year for the 10 starters (per-image annual) or from $1,200/yr for the whole library.
- Decision for the client (costly to reverse, needs a yes): either (a) license WorkoutLabs with recolour rights, or (b) none passes - ship without form images for now.
- Recommended now: ship without exercise images and use a target-muscle diagram instead. Build it from an MIT muscle map (react-muscle-highlighter or the body-highlighter SVG paths), drawn in ink #111C35 line on cream with the primary muscle in orange #E8622A. This matches the visual system, costs nothing, works offline, and needs only an MIT notice. Revisit WorkoutLabs when exercise form guidance becomes a priority.

## Sources

- https://github.com/everkinetic/data and its LICENSE.md
- https://wger.de/api/v2/exerciseimage/ and https://wger.de/api/v2/license/
- https://workoutlabs.com/exercise-illustrations-licensing/ and https://workoutlabs.com/use-of-illustrations/
- https://workoutlabs.com/exercise-guide/
- https://api.musclewiki.com/pricing and https://api.musclewiki.com/api-terms
- https://exercisedb.dev/ , https://github.com/exercisedb/exercisedb-api , https://exercisedb.notion.site/ExerciseDB-API-Terms-of-Use-226983b728ca8090bf7be79564e4b356
- https://thenounproject.com/pricing/
- https://getillustrations.com/
- https://github.com/soroojshehryar/react-muscle-highlighter , https://github.com/HichamELBSI/react-native-body-highlighter , https://github.com/lahaxearnaud/body-highlighter , https://github.com/giavinh79/react-body-highlighter
