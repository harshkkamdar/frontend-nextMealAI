---
register: product
---

# FIQR: product context

## What FIQR is

A coach for people who train and eat with intent. Geo, the coach, reads what you log and tells you what to do next. The app is the evidence behind Geo's word.

## Who uses it

Adults, mostly in their 20s to 40s, who train three to five times a week and want to lose fat, build muscle or hold steady. They know roughly what protein and calories are. They open FIQR in short bursts: at the kitchen bench, between sets, on the couch at night. One hand, often in a hurry, in daylight or warm indoor light. They want a straight answer and one thing to do.

## Ethos

1. **A coach, not a tracker.** Every main screen opens with Geo's read and one next action. The numbers sit underneath as evidence.
2. **Adult and calm.** Nothing cute, nothing loud. No confetti, no streak guilt, no faces, no sparkles for "AI". Praise is specific; a bad week is named plainly and without scolding.
3. **Few things, made well.** A small set of components, each excellent and placed with intent. Type and spacing do the grouping; a box is the exception, never the default. No card inside a card.
4. **Printed, not glowing.** Cream paper, navy ink, one orange for action. Flat surfaces and hairlines. No gradients, no glass, no blur, no decorative shapes.
5. **Numbers are the hero.** Big, tabular, exact. Bars, because bars compare at a glance.
6. **One orange thing per screen.** It is what Geo would tell you to do next. A screen with nothing to act on has no orange.

## Geo

Geo is the FIQR mark: a ring (Geo's attention on your week) crossed by a short orange bar (the nudge). The same mark is the app icon. Geo has no face and no body.

- **Where Geo lives:** the raised button in the centre of the nav, the line at the top of Home, the verdict card on Check-in, the start of each run of Geo's messages in chat.
- **How Geo shows state:** still when idle; the bar travels round the ring while Geo is working; a short settle when something is done. Motion is the only expression.
- **How Geo speaks:** short sentences with real numbers ("83 g protein to go"), the action first, no filler, no exclamation marks.

## Anti-references

- Generic AI fitness templates: gradient blobs, glass cards, a calorie ring next to a 2x2 stat grid, sparkle icons for AI, floating capsule tab bars, everything in a white card.
- Gamified trackers: streak flames, badges, ad-filled diaries.

## References

- **Source of truth for the visual system:** George's FIQR design reference in `../FIQR/` (`FIQR fitness app - Spec.pdf`, `FIQR Screens for Dev.dc.html`, `FIQR Logo.dc.html`). `DESIGN.md` turns it into tokens and components.
- **Feel:** a well-printed training log; a good coach's text message; the restraint of Apple Health and Things.

## Constraints

- The client approves the design (SOW D2). Home and Check-in follow his mock-ups, refined; every other screen is designed in the same system.
- iOS 17+ and Android 8+ through Capacitor; a static export in a WebView. Low-end Android must stay smooth: no backdrop-filter, transform and opacity animation only.
- Accessibility: WCAG AA text contrast, 44 pt minimum targets, reduced motion respected.
