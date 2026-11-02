# FIQR design system

The rules every screen follows. Source: George's FIQR design reference (`../FIQR/FIQR fitness app - Spec.pdf`), refined where marked "refined". Ethos and Geo: `PRODUCT.md`. All sizes in pt at a 390 pt wide screen.

## 1. Colour

| Token | Value | Use |
|---|---|---|
| `ink` | `#111C35` | All text, the Next Up and Geo's-read cards, the Geo button, protein bars |
| `accent` | `#E8622A` | The one primary action per screen, the calories bar, the active nav item, Geo's bar |
| `accent-ink` | `#BD4A19` | Orange **text** smaller than 19 pt bold (refined: plain orange on cream is 3.1:1 and fails AA for small text) |
| `cream` | `#FDF6EC` | Every screen background; text on navy and on orange |
| `card` | `#FFFFFF` | Tiles and grouped lists only |
| `macro-teal` | `#3E7C77` | Carbs, nothing else |
| `macro-ochre` | `#A07A3C` | Fat, nothing else |

Ink opacities (over cream): `ink-80` Geo's line; `ink-65` secondary text (5.3:1); `ink-62` labels, the lightest allowed for any text (4.6:1); `ink-50` icons and inactive nav only; `ink-16` button outlines; `ink-12` tile borders; `ink-10` bar tracks and the nav border; `ink-09` dividers; `ink-08` quiet fills. Cream over navy: `cream-60` meta, `cream-55` labels, `cream-22` the circle behind the + on the primary action.

No other colours, no gradients, no `#000` or `#fff` literals, no dark mode.

## 2. Type

Archivo only, normal width. Tabular figures on every number.

| Role | Size / weight | Tracking | Where |
|---|---|---|---|
| display | 28 / 700, lh 1.1 | -0.6 | Workout name, the hero number on a screen |
| title | 24 / 700 | -0.5 | Screen titles, the Home greeting (refined from 22 / 600) |
| geo-read | 21 / 600, lh 1.3 | -0.3 | Geo's verdict on navy (Check-in) |
| metric | 19 / 600 | -0.3 | Tile values |
| button | 19 / 700 | | Orange primary label (refined from 17: cream on orange needs 19 pt bold to pass AA as large text) |
| button-2 | 18 / 700 | | Secondary button label |
| geo-line | 17 / 500, lh 1.42 | -0.2 | Geo's line on Home, ink (refined: Geo's voice reads above the data) |
| body | 15.5 / 500, lh 1.4 | | Row labels, macro names (600) |
| meta | 14 / 400 | | Workout meta, supporting lines |
| readout | 13.5 / 400 and 600 | | Bar readouts: current value 600 ink, `/ target` 400 ink-65 |
| unit | 13 / 500 | | kg, h, g after a value |
| date | 12 / 500, uppercase | +1.4 | Date line, card eyebrow |
| section | 11.5 / 600, uppercase | +1.8 | Section labels |
| tile-label | 11 / 600, uppercase | +1.4 | Tile labels |
| nav | 11 / 500, active 600 | | Nav labels (refined from 10.5) |

## 3. Space

Screen gutter 22. Gap between major blocks 16; after a section label 10; between tiles 10; macro rows 13; name row to its bar 6. Padding: tiles 13 x 14, grouped rows 0 x 16, feature cards 22, primary action 16 x 18. Spacing comes from this set only.

## 4. Shape and elevation

Radius: tiles and grouped lists 16, primary action 18, feature cards 22, secondary buttons 15, sheets 28, chips full.

Neutral surfaces never cast a shadow: a white tile (the `tile` class, with `rounded-card`) sits on cream with a 1 pt `ink-12` edge. Only two things are raised: the orange primary action (`0 8 20 accent/.26`) and the Geo button (`0 6 16 ink/.28`). Sheets carry `0 -8 24 ink/.12`; a popover menu `0 8 24 ink/.12`. The status capsule has no shadow: navy on cream needs none.

## 5. Components

The whole app is built from these. A screen that needs something else needs a reason.

1. **Screen header.** Every tab root, Home included: a `date` eyebrow, a `title`, and one 44 pt round profile button on the right (`ink-08` fill, 1 pt `ink-16` border). Home carries no wordmark: the mark already sits in Geo's line and the nav (refined). The header starts 10 below the safe area; on the web the safe area is at least 20, a stand-in status bar. Pushed screens: a plain back chevron (44 pt target) and a 17 / 600 centred title; it gains a cream bar with an `ink-09` hairline once content scrolls under it.
2. **Geo's line.** The bare 26 pt Geo mark (ink ring), then Geo's sentence in `geo-line` ink, two lines max; emphasised numbers 600 in `accent-ink`. The mark makes one `done` turn as the screen opens. An optional action sits under it as a text button. Tapping the line opens Geo.
3. **Primary action.** Full gutter width, 64 tall, `accent`, radius 18, action shadow. A 32 pt `cream-22` circle with +, the label in `button` cream, optional trailing text 13.5 / 600 in ink. One per screen at most.
4. **Feature card (navy).** Radius 22, padding 22. `date` eyebrow `cream-55`, a `display` title in cream, `meta` in `cream-60`, then a secondary button: cream fill, ink text, 56 tall, radius 15, trailing arrow. Used for Next Up and Geo's read.
5. **Macro bars.** Name in `body` 600 left, readout right on the same baseline, the bar 6 below: 7 tall, radius 4, track `ink-10`, fill capped at 100%. Calories `accent` (readout adds `· N left` in `accent-ink` 600), protein `ink`, carbs `macro-teal`, fat `macro-ochre`. Calories leads and may run 9 tall (refined).
6. **Metric strip.** One white tile container split into columns by `ink-09` hairlines (refined from separate tiles: fewer boxes). Each column: `tile-label`, then the value in `metric` with its unit, then an optional `meta` line. Tapping a column opens its detail.
7. **Grouped list.** A white container, radius 16, `ink-12` border; rows 56 tall, `body` label left, value right in `ink-65`, chevron `ink-50`; `ink-09` hairlines inset 16. Settings, plan days, food lists.
8. **Section label.** `section` style in `ink-62`, 20 above, 10 below.
9. **Sheet.** Solid cream, inset 8 from the screen edges and the safe area, radius 28, the sheet shadow, a 36 x 5 `ink-16` grabber, scrim ink at .35. Drag down to close.
10. **Nav bar.** See section 6.
11. **Buttons beyond the primary.** Secondary: cream fill, 1 pt `ink-16` border, ink text, radius 15, 56 tall. Navy solid for a committing action that is not the screen's next step (Keep current targets). Text buttons: 15 / 600 ink, 44 pt target.
12. **Status capsule.** One message at a time under the header, 22 from the edges: a navy pill, cream 14 / 500 text, a cream dot (a ring for errors), an optional Undo in 14 / 700. The offline band uses the same capsule with the Geo mark (dimmed offline, working while syncing).
13. **Chat.** Geo's messages are plain `body` text on cream with the bare Geo mark at the start of each run of Geo turns (working while Geo writes, one turn when a reply lands); the user's are navy bubbles with cream text, radius 18. A logged or changed item shows as a compact grouped-list row with Undo.

## 6. Nav bar

Five equal columns: Home, Food, **Geo** (centre), Train, Check-in. Cream background, 1 pt `ink-10` top border, padding 10 top, 8 sides, 22 bottom plus the safe area. Icons 24 pt, stroke 1.75, round caps, no fill. Active: `accent` icon and label. Inactive: `ink-50` icon, `ink-62` label.

The Geo button is the app icon in miniature: a 56 pt navy circle holding the FIQR mark (cream ring, orange bar), raised 24 pt above the bar's top edge, `0 6 16 ink/.28`, labelled "Geo" beneath. It never changes colour; while Geo is working, its bar travels round the ring.

Scrolling content always clears the bar and the raised button (`--tabbar-clearance`).

## 7. The Geo mark

A stroked circle with a short bar crossing its lower-right edge at -45 deg. Stroke 9% of the outer diameter, bar 33% of the diameter, round caps. Cream ring and orange bar on navy; ink ring and orange bar on cream. Smallest size 16.

Geo's only expression is the bar (`GeoMark`). Nine expressions, no more; the live reference is `/geo`:

| Expression | What it is | Used for |
|---|---|---|
| Rest | Bar at the lower right, still | The icon, the nav, anywhere Geo has nothing to add |
| Speak | Bar turns to point at the words (420 ms) | A new chat, the companion sheet |
| Listening | Bar sways 10 deg either side, 1.1 s each way | While the user types to Geo |
| Working | Bar travels round the ring, 1.4 s a turn | Chat replies, photo reads (the nav's Geo, chat's anchor) |
| Done | One turn, 760 ms, back to rest | A Geo task landed; Geo's line on Home as it opens |
| Nudge | 16 deg out and back once, 560 ms | Something new to look at (a suggestion, check-in ready) |
| Up | Bar to the upper right | Check-in for a week that went to plan; a new best |
| Down | Bar straight down | Check-in for a week that didn't; a failure |
| Offline | Ring at 35%, bar still | The offline capsule, the companion sheet offline |

Rules: Geo moves only in answer to something; one Geo moves at a time; Working is the only loop; no face, eyes or limbs. Reduced motion: poses change instantly and Working dims the bar instead of orbiting.

## 8. Motion

Transform and opacity only, ease-out-quart (`cubic-bezier(.25,1,.5,1)`), 180 to 320 ms. Bars fill once on first paint (600 ms). Numbers change by ticking, never by fading. Pages push and swipe back as on iOS; sheets rise and drag down. No ambient motion, no parallax, no tilt. Reduced motion: short crossfades.

## 9. Never

Gradients and gradient text, glass and backdrop blur, decorative shapes or blobs, shadows on neutral cards, cards inside cards, rings for macros, sparkle or magic icons, emoji in UI, a second orange action, side-stripe borders, em dashes in copy.
