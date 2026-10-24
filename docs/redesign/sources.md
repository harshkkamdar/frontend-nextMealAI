# FIQR redesign - primary sources

Researched 2026-10-24. Every claim carries the URL it came from. Apple HIG pages render with JavaScript, so their text was read through Apple's own JSON data endpoint for the same page (`https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`). The citations below link the human-readable page. Where Apple's text contains a long dash, the quote here uses a plain "-" instead, to follow the house rule.

## Decision summary (read this first)

1. Glass belongs only on the navigation/controls layer (tab bar, top bar, floating buttons, sheets). Apple says "Don't use Liquid Glass in the content layer" and "Use Liquid Glass effects sparingly". Cards, lists and macro rings stay solid. Sources: [HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Meet Liquid Glass 13:00](https://developer.apple.com/videos/play/wwdc2025/219/).
2. Real refraction (SVG `feDisplacementMap` in `backdrop-filter`) works only in Chromium. iOS WKWebView will not render it. The only portable layer is `backdrop-filter: blur() saturate()` plus a tint, an edge highlight and a shadow. Sources: [kube.io](https://kube.io/blog/liquid-glass-css-svg/), [BuildMVPFast](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026).
3. `prefers-reduced-transparency` is not supported in Safari or iOS, so it does not work in WKWebView. Use a native bridge (`UIAccessibility.isReduceTransparencyEnabled`) on iOS, keep a solid fallback as the default, and never animate the blur radius. Sources: [caniuse](https://caniuse.com/mdn-css_at-rules_media_prefers-reduced-transparency), [Apple docs](https://developer.apple.com/documentation/uikit/uiaccessibility/isreducetransparencyenabled), [Chrome blog](https://developer.chrome.com/blog/animated-blur/).
4. No controlled benchmark of `backdrop-filter` on low-end Android System WebView exists in what I could find. The evidence is anecdotal: older Adreno GPUs stutter, and the picture cache is invalidated on scroll. FIQR must measure this on its own low-end device. Sources: [Mozilla bug 1732817](https://bug635044.bugzilla.mozilla.org/show_bug.cgi?id=1732817), [Capacitor discussion 3899](https://github.com/ionic-team/capacitor/discussions/3899).
5. Several skills and summaries treat glassmorphism as an "AI tell": the Lenny technique 7 summary, Uncodixfy and impeccable all do. Anthropic's frontend-design skill also flags "a warm cream background ... with a terracotta or warm-clay accent" as a generated-design default, which is close to FIQR's cream #FDF6EC plus orange #E8622A. The brief pins this palette, so it stays. But glass must be functional and rare, not decoration.

---

## 1. Apple HIG: Materials and Liquid Glass

### Where glass belongs

- Glass is the controls layer. "Liquid Glass forms a distinct functional layer for controls and navigation elements - like tab bars and sidebars - that floats above the content layer." [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- No glass in content. "Don't use Liquid Glass in the content layer." Use standard materials for content-layer elements "such as app backgrounds". The one exception is transient controls such as sliders and toggles, which take on glass "when a person activates it". [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- Use it sparingly. "Use Liquid Glass effects sparingly ... Limit these effects to the most important functional elements in your app." [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- No custom bar backgrounds. "Instead of applying a solid or semi-opaque background color beneath controls, use a scroll edge effect to visually elevate controls above content." Full-screen backgrounds should "extend it underneath sidebars, toolbars, and tab bars". [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- Toolbars: "Reduce the use of toolbar backgrounds and tinted controls." [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)

### Variants: regular vs clear

- Regular "blurs and adjusts the luminosity of background content to maintain legibility". "Most system components use this variant." Use it when components carry "a significant amount of text". [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- Clear is "highly translucent" and meant for components "that float above media backgrounds - such as photos and videos". "Only use clear Liquid Glass for components that appear over visually rich backgrounds." [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- Dimming for clear: "If the underlying content is bright, consider adding a dark dimming layer of 35% opacity." [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- FIQR implication: FIQR's backgrounds are cream and white, not media, so it should approximate the regular variant everywhere. Clear fits only over the camera or a food photo in the meal-scan flow.

### Tab bar

- "A tab bar floats above content at the bottom of the screen. Its items rest on a Liquid Glass background that allows content beneath to peek through." [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- Minimise on scroll applies to tab bars with an accessory: "you can choose to minimize the tab bar and move the accessory inline with it when a person scrolls down. A person can exit the minimized state by tapping a tab or scrolling to the top of the view." [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- Search tab: "A tab bar can include a dedicated search tab at the trailing end." [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) Search fields say: "Include search as an item in the sidebar or tab bar when you want an area dedicated to discovery." [Search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields)
- Navigation only: "Use a tab bar to support navigation, not to provide actions." [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) This matters for a centre "+ log meal" tab: Apple does not want an action in the tab bar.
- Keep it visible: "Make sure the tab bar is visible when people navigate to different sections." "Don't disable or hide tab bar buttons." "Include tab labels ... Use single words whenever possible." "Prefer filled symbols or icons." [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- Colour: "Avoid applying a similar color to tab labels and content layer backgrounds." [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- Accessory rule: avoid screen-specific actions in the tab bar accessory. "A checkout button, for example, belongs with the content it supports." [WWDC25 session 356, 10:30](https://developer.apple.com/videos/play/wwdc2025/356/)

### Sheets

- iOS sheets rest at detents: "large is the height of a fully expanded sheet and medium is about half". "Include a grabber in a resizable sheet." "Support swiping to dismiss a sheet." [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- "Display only one sheet at a time from the main interface." Cancel sits on the leading edge and Done on the trailing edge. "Avoid showing all three buttons - Cancel, Done, and Back - together." [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- An interrupting sheet pairs glass with a dimming layer. When the sheet is dragged up, glass "subtly recedes, becoming more opaque". [WWDC25 session 356, 7:30-8:00](https://developer.apple.com/videos/play/wwdc2025/356/)

### Buttons

- Hit target: "a button needs a hit region of at least 44x44 pt". "Always include a press state for a custom button." [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- "Keep the number of prominent buttons to one or two per view." "Use style - not size - to visually distinguish the preferred choice." [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) This fits FIQR's rule of one orange action per screen.
- Toolbars: "Use the .prominent style for key actions such as Done or Submit ... Only specify one primary action, and put it on the trailing side." "Prefer system-provided symbols without borders." [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)

### Concentric corner radii

- "By default, standard buttons, text fields, headers, and footers have corner radii that are concentric with bar corners. If you need to create a custom component, ensure that its corner radius is also concentric with the bar's corners." [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
- There are three shape types. Fixed shapes have a constant radius. Capsules use "a radius that's half the height of the container". Concentric shapes "calculate their radius by subtracting padding from the parent's". On phones: "use a capsule with extra margin to create space near the screen edge." Watch for corners that "feel too pinched - or flared". [WWDC25 session 356, 3:30-6:00](https://developer.apple.com/videos/play/wwdc2025/356/)
- CSS rule that follows: `inner-radius = outer-radius - padding`, with a fallback radius when a component stands alone (session 356, 6:00).

### Tinting

- "By default, Liquid Glass has no inherent color, and instead takes on colors from the content directly behind it." [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- "Apply color sparingly ... To emphasize primary actions, apply color to the background rather than to symbols or text ... Refrain from adding color to the background of multiple controls." [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- "In apps with primarily monochromatic content or backgrounds, choosing your brand color as the app accent color can be an effective way" to reflect identity. [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- "Avoid tinting all your elements ... If you want to imbue color into your app, do it in the content layer instead." [WWDC25 session 219, 17:00-17:30](https://developer.apple.com/videos/play/wwdc2025/219/)

### Legibility and contrast

- Small bars flip between light and dark with the content behind them. Symbols and text "follow a monochromatic color scheme, becoming darker when the underlying content is light". Larger elements are "more opaque". [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- The resting state must be legible: "make sure its default or resting state - like the top of a screen of scrollable content - maintains clear legibility." [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- The Accessibility page lists minimum contrast ratios of 4.5:1 and 3:1 (by text size and weight). If the app does not meet them by default, it should "at least provide a higher contrast color scheme when the system setting Increase Contrast is turned on". [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

### Accessibility settings

- Settings change glass appearance: "turn on accessibility settings that reduce transparency or increase contrast". [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- What each setting does: "Reduced Transparency, makes Liquid Glass frostier and obscures more of the content behind it. Increased contrast, makes elements predominantly black or white and highlights them with a contrasting border and Reduced Motion decreases the intensity of some effects and disables any elastic properties." [WWDC25 session 219, 18:00-18:30](https://developer.apple.com/videos/play/wwdc2025/219/)
- Reduce Motion: reduce "automatic and repetitive animations, including zooming, scaling, and peripheral motion". [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

### Update since WWDC26 (June 2026)

- Press reports say iOS 27 adds a user transparency slider and "tuned Liquid Glass so it diffuses complex content behind it much more effectively". [BGR](https://www.bgr.com/2191219/ios-27-liquid-glass-fix-customization/), [macmyths](https://macmyths.com/wwdc-2026-apple-refines-liquid-glass-across-its-next-generation-operating-systems/). I did not find the WWDC26 design session itself, so this comes from press coverage only. The HIG Tab bars change log lists "June 8, 2026 - Updated terminology and art". [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- Implication: iOS 27 users can choose a frostier glass, so FIQR's CSS should lean frosted (more blur, more tint) rather than clear.

## 2. WWDC25 sessions

### "Meet Liquid Glass" (session 219)

URL: https://developer.apple.com/videos/play/wwdc2025/219/. Chapters: Introduction 0:00, Dynamics 1:29, Adaptivity 6:00, Principles 10:31, Next steps 18:53. Timestamps below are the 30-second transcript window where each line appears.

- 1:30 - "rounded, floating forms that nest neatly in the rounded curves of modern devices." Lensing is the primary visual cue.
- 2:30 - The material "bends, shapes, and concentrates light" instead of scattering it. Objects "materialize in and out" rather than fading.
- 3:30-4:00 - On interaction, glass is "instantly flexing and energizing with light". Elements "lift up into Liquid Glass temporarily" so the "resting state stay[s] visually quiet".
- 4:30-5:00 - Controls morph between states on "a singular floating plane". Menus pop open from the button that was tapped.
- 6:00-6:30 - Glass adapts: "As text scrolls underneath, shadows become more prominent". Tint and dynamic range shift for legibility.
- 7:00 - Bigger glass reads thicker: "deeper, richer shadows ... more pronounced lensing ... softer scattering of light".
- 9:00-9:30 - Scroll edge effects "gently dissolve the content into the background". Use the "hard style" for pinned accessory views.
- 11:00-12:00 - The layers are highlights, context-aware shadows (more opaque over text, lighter over solid light backgrounds) and an inner glow on touch.
- 13:00 - "best reserved for the navigation layer that floats above the content". "always avoid glass on glass". Put fills, transparency and vibrancy on top of glass instead.
- 13:30-15:00 - Regular and clear "should never be mixed". Use clear only when all three conditions are met: the content behind is media-rich, a dimming layer will not hurt the content layer, and the content on top is bold and bright.
- 15:00-15:30 - Small elements (nav bars, tab bars) flip between light and dark. Big elements (menus, sidebars) do not.
- 16:30-17:30 - Tinting generates a range of tones mapped to the brightness behind it. A solid-fill button "breaks the visual character". Tint only primary actions, for example a red "View Bag" button in a food delivery app.
- 17:30-18:00 - "avoid intersections between content and Liquid Glass" in steady states such as first launch.
- 18:00-18:30 - Accessibility modifiers, quoted in section 1.

### "Get to know the new design system" (session 356)

URL: https://developer.apple.com/videos/play/wwdc2025/356/. Chapters: Intro 0:00, Design Language 2:06, Structure 6:16, Continuity 13:34.

- 2:30 - Typography is "now bolder and left-aligned to improve readability in key moments like alerts and onboarding".
- 3:00-6:00 - Concentricity and the three shape types, quoted in section 1.
- 7:00 - Action sheets now spring from the source element. "apply the material directly to the control, not its inner views."
- 8:30 - "if you've customized your bars, now's the time to clean them up ... hierarchy should be expressed through layout and grouping" rather than extra backgrounds or borders.
- 9:00-10:00 - Group bar items by function and frequency. Do not group symbols with text. A primary action like Done "stays separate and appears tinted".
- 10:00-10:30 - iOS has a dedicated Search tab at the bottom. Accessory views are for persistent features only.
- 11:00-12:00 - "scroll edge effects are not decorative". Use one per view, and do not mix soft and hard. Soft is the iOS default.
- 15:00-15:30 - Bars rely more on symbols than text. "When there's no clear shorthand, a text label is always the better choice."

### Other relevant WWDC25 sessions (not read in full)

- "Build a SwiftUI app with the new design" (session 323) and "Build a UIKit app with the new design" (session 284). The page titles were confirmed, but I did not read the transcripts, because they cover native APIs that a WebView app cannot call. URLs: https://developer.apple.com/videos/play/wwdc2025/323/, https://developer.apple.com/videos/play/wwdc2025/284/

## 3. Approximating Liquid Glass in CSS

### Credible implementations

| Technique | What it does | Where it works | Cost | Source |
|---|---|---|---|---|
| `backdrop-filter: blur(12-30px) saturate(140-200%)` with a translucent tint, a 1px light border and a brighter top edge, an inset highlight and an outer shadow | Frosted glass, close to Apple's "regular" variant | Chrome, Android WebView (Chromium), Safari/WKWebView (use the `-webkit-` prefix too) | One extra render pass per element. Cost grows with area and radius | [BuildMVPFast (2026-08-16)](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026), [WebKit blog](https://webkit.org/blog/3632/introducing-backdrop-filters/) |
| SVG `feDisplacementMap` referenced from `backdrop-filter: url(#lens)` plus a specular rim (`feImage` + `feBlend`) | Real edge refraction modelled with Snell's law | Chromium only. Safari has an open bug. Firefox accepts the syntax but renders nothing | The displacement map must be rebuilt on most size or shape changes. Animating `scale` is cheaper | [kube.io (2025-09-04)](https://kube.io/blog/liquid-glass-css-svg/), [WebKit bug 313914](https://bugs.webkit.org/show_bug.cgi?id=313914), [BuildMVPFast](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026) |
| WebGL (Three.js) or a refracted clone of the background | Cross-browser refraction | Everywhere | A WebGL context, or a static background snapshot | [DEV: 6 ways](https://dev.to/devyatov/liquid-glass-on-the-web-6-ways-to-build-it-with-css-and-svg-3m07) (search-result summary, page not opened) |

- The base recipe from BuildMVPFast is: background `rgba(255,255,255,0.12)`, `blur(16px) saturate(180%)`, border `1px rgba(255,255,255,0.28)`, top border `0.55`, radius 24px, inset `0 1px 0 rgba(255,255,255,0.35)`, shadow `0 12px 40px rgba(0,0,0,0.35)`. The backdrop needs colour or texture: "blur over a flat color does nothing". [BuildMVPFast](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026) FIQR implication: on a flat cream background, glass is invisible until content scrolls under it. That matches Apple's intent, which is quiet at rest.
- Safari quirk: CSS custom properties reportedly do not resolve inside `-webkit-backdrop-filter`, so hard-code the values. [BuildMVPFast](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026). A related WebKit report (Safari 18.2+) was closed "RESOLVED INVALID", so treat this as unconfirmed and test it. [WebKit bug 289149](https://bugs.webkit.org/show_bug.cgi?id=289149)
- Single-user report: about 40% GPU in Chromium versus under 20% in Firefox for the SVG lens on one MacBook. This is one anecdote, not a benchmark. [hn.svelte.dev](https://hn.svelte.dev/item/45174297) (via search summary)

### Performance evidence

- Apple's WebKit team says the effect forces extra rendering passes, so limit it "to where it is most necessary". [WebKit blog](https://webkit.org/blog/3632/introducing-backdrop-filters/)
- web.dev: "`backdrop-filter` may harm performance. Test it before deploying." It recommends falling back "to an image instead of a polyfill". [web.dev](https://web.dev/articles/backdrop-filter) (last updated 2019)
- Chrome team: "Animating a blur is not really an option as it is very slow." The GPU re-blurs every frame. The fix is pre-blurred copies cross-faded by opacity, with a promoted parent. That reached 60fps on a Moto G4. [Chrome blog](https://developer.chrome.com/blog/animated-blur/) (2017)
- Android, GPU class: a Mozilla bug reports bad performance on a Nexus 5 (Adreno 330), less on a Nexus 5X (Adreno 418) and acceptable on a Pixel 2 (Adreno 540). With backdrop-filter, fixed items cannot get their own picture-cache slice, so scrolling repaints more. This is Firefox's engine (Gecko), not Android WebView. [Mozilla bug 1732817](https://bug635044.bugzilla.mozilla.org/show_bug.cgi?id=1732817), [Mozilla bug 1828248](https://bugzilla.mozilla.org/show_bug.cgi?id=1828248)
- Capacitor on Android: developers report frame drops in sliders and transitions that do not happen on iOS. None of the WebView settings they tried helped. Nobody isolates `backdrop-filter` as the cause. [Capacitor discussion 3899](https://github.com/ionic-team/capacitor/discussions/3899), [capacitor-community proposal 183](https://github.com/capacitor-community/proposals/issues/183)
- Precedent: Ionic applies its `translucent` header only in iOS mode ("This effect will only apply when the mode is "ios"") and only when the device supports backdrop-filter. [Ionic header docs](https://ionicframework.com/docs/api/header) Ionic does not ship glass on Android by default.
- Gap: I found no controlled measurement of frame time against blur radius for Android System WebView on low-end GPUs, and none specific to WKWebView. FIQR must measure this itself, for example with Chrome remote DevTools frame timing on a low-end device and Safari Web Inspector timelines on iOS.

### Mitigations

- Limit the blurred area. Use at most 3-4 glass layers per viewport, keep blur under about 20px on large surfaces, and keep glass off data-dense screens. [BuildMVPFast](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026), [React Native Skia docs](https://www.mintlify.com/shopify/react-native-skia/effects/backdrop-filters)
- Do not animate the blur radius. Animate `opacity` or `transform`, or cross-fade pre-blurred layers. [Chrome blog](https://developer.chrome.com/blog/animated-blur/), [Capgo](https://capgo.app/blog/ultimate-guide-to-animation-performance-in-capacitor-apps/). Note that emilkowalski's apple-design skill says to "animate blur radius and scale together on enter/exit". That conflicts with this evidence, so do not follow it on Android.
- Use `will-change` sparingly, because it costs VRAM. Avoid scroll-linked effects on the same glass surface. [BuildMVPFast](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026)
- Build a fallback ladder: a solid readable surface by default, frosted glass inside `@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))`, and refraction only behind a JS engine check (Chromium), because Firefox passes `@supports` but renders nothing. [BuildMVPFast](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026)
- Device tiering (inference, not sourced): gate glass on Android behind a capability check (for example `navigator.hardwareConcurrency`, `deviceMemory`, or a measured first-scroll frame time) and fall back to a solid cream/white bar with a hairline shadow.

### Media query support

| Query | Chromium / Chrome Android | Safari iOS / WKWebView | Firefox | Source |
|---|---|---|---|---|
| `prefers-reduced-transparency` | Chrome 118+. Chrome Android listed from 155 | Not supported (through 27.2) | Disabled by default | [caniuse](https://caniuse.com/mdn-css_at-rules_media_prefers-reduced-transparency), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency) |
| `prefers-contrast` | Chrome Android 156 listed. Android WebView not listed | Safari iOS 14.5+ | - | [caniuse](https://caniuse.com/mdn-css_at-rules_media_prefers-contrast) |
| `backdrop-filter` | Chrome 76+ ([web.dev](https://web.dev/articles/backdrop-filter)). Android WebView not listed on caniuse | iOS 9+ supported. Baseline unprefixed in Safari 18 | Supported | [caniuse](https://caniuse.com/css-backdrop-filter), [web.dev](https://web.dev/articles/backdrop-filter) |

- iOS bridge: `UIAccessibility.isReduceTransparencyEnabled` is "A Boolean value that indicates whether the Reduce Transparency setting is in an enabled state". `reduceTransparencyStatusDidChangeNotification` signals changes. [Apple docs](https://developer.apple.com/documentation/uikit/uiaccessibility/isreducetransparencyenabled), [notification](https://developer.apple.com/documentation/uikit/uiaccessibility/reducetransparencystatusdidchangenotification)
- I found no Capacitor plugin that exposes it. The Cordova Mobile Accessibility plugin lists `isReduceTransparencyEnabled()` as iOS-only. React Native's equivalent is iOS-only and "always resolves to false" on Android. [Ionic v3 native docs](https://www.ionicframework.com/docs/v3/native/mobile-accessibility), [React Native AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo). A small custom Capacitor plugin would be needed. That is a native code change, so it needs approval.
- Implication: make the solid surface the default and enable glass only with `@media (prefers-reduced-transparency: no-preference)` or a native flag. Add `@media (prefers-contrast: more)` with a solid 2px border. [BuildMVPFast](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026). Under WKWebView, the media query never matches `no-preference` (not supported), so the iOS path must use the native flag. Otherwise iOS loses glass entirely.

## 4. Lenny's Newsletter: "How to turn your AI into a world-class designer" (Anshu Chimala)

URL: https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world. Published 2026-09-01. It is a guest post and partly paywalled. The author "led software engineering and design teams at Apple for 12 years". [Lenny's](https://lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world)

Access status: the public page shows techniques 1-6 and only the heading of technique 7, "Remove AI tells". The paywall starts right after that heading. Technique 8 is not visible at all. I did not get the paywalled text. Anshu's X profile (https://x.com/anshuc) and his launch post (https://x.com/anshuc/status/2094783493146317230, linked from [Digg](https://digg.com/ai/y2i1rcm5)) returned HTTP 402, so they were unreachable. Search found no separate Anshu Chimala Substack.

### The 8 techniques, in three stages (Discover, Define, Deliver)

1. Use seed strings to inject variety. The agent generates a long random string with a shell script and derives colours, layout and type from it. The string never appears in the output. The method is credited to Sakana AI's String Seed of Thought. [Lenny's](https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world)
2. Be more ambitious with prompts. Name a bold inspiration. Brainstorm many ideas, visualise favourites, refine one, and ask for a concise build prompt. Keep failed prompts and retest them on newer models. [Lenny's](https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world)
3. Create feedback loops with subagents. See the critic loop below. [Lenny's](https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world)
4. Use image generation to enrich designs instead of gradients and shapes. Use a separate API key with a tight spend limit, stored in a gitignored file. [Lenny's](https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world)
5. Use video generation for motion. Generate a looping clip on a solid background and chroma-key it out, or interpolate keyframes between stills and scrub them on scroll or swipe. fal.ai is recommended. [Lenny's](https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world)
6. Cut out elements that don't add value: glows, decorative gradients, extra labels, and custom components that look worse than native ones. The calorie-tracker example improved by moving to an image-centric grid with native iOS components. [Lenny's](https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world)
7. Remove AI tells. The original is paywalled. Content comes from a secondary summary below.
8. Rewrite copy by hand. The original is not visible. Content comes from a secondary summary below.

### Techniques 7 and 8 - secondary source only

The content below comes from Mika Reyes, "8 AI Design Techniques to Break Safe Mode" (2026-09-14). It calls itself "the short version" of Anshu's piece. [mikareyes.com](https://mikareyes.com/ai/8-ai-design-techniques-to-break-safe-mode) I cannot confirm that these lists match Anshu's paywalled text word for word. Mika also mentions her own tooling (Humanizer, then Peter Yang's No AI Slop), which may be her addition.

- 7, Remove AI tells: run separate visual and copy audits.
  - Visual tells: purple gradients, three-card feature rows, glows, glassmorphism, a "we could be any startup" layout, a leftover graphic on the right side, too many fonts, too little white space, and custom buttons worse than native ones.
  - Copy tells: "It's not X, it's Y" constructions, throat-clearing openers, fake-depth verbs, and perfectly even sentence rhythm.
  - Method: for each tell, list where it appears and the smallest fix, then apply it. Keep meaning, jokes and specific facts.
- 8, Rewrite copy by hand: the model's average wording survives longest in headlines, buttons, empty states and error text. Rewrite four lines yourself: the H1, the primary button, the empty state and the error state. "If you wouldn't say it to a customer over coffee, it doesn't go on the page." "Let the agent explore, then you decide what ships."
- FIQR implication: glassmorphism is on the tell list. FIQR's glass must read as Apple's functional material (nav layer only, quiet at rest) and not as decorative frosted cards.

### Critic-subagent loop (technique 3, from the public part of the original)

Source: [Lenny's](https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world)

- Use a separate critic, because the builder is biased toward its own past decisions. Use a larger model for the critic and a cheaper one for building. The critic used under 10% of output tokens in the examples.
- Screenshots only: each critic call gets a fresh context with only a screenshot. It gets no code, no earlier iterations and no earlier critiques.
- Critic task: name the aesthetic the design is going for, imagine how a top studio would execute it, list the biggest gaps, and score it out of 10. Consider both structure and fine detail. Penalise overdone or obviously AI patterns. Be specific, bold and opinionated.
- Ranking against professional examples, the most objective framing: "Here are 5 designs: 4 professional examples and 1 screenshot of our product. Rank them by polish and taste level." The examples act as a moodboard, not a copy target.
- Stopping criteria: done when the critic independently scores 9/10 or higher. Do not tell the critic the threshold, and reuse the same critic prompt every round. Run one or two iterations first and check that the scores converge, so the agent does not chase approval the critic never gives. Vague criteria ("judge if it looks beautiful") give inconsistent scores. Use concrete, comparative criteria.

## 5. Bevel and Cal AI

### Bevel (bevel.health)

- What it is: "Your Connected Health Coach", an AI health coach that combines wearables, bloodwork and records. Features: Strain, Sleep and Recovery scores, nutrition logging with a barcode scanner, health records, and "Bevel Intelligence" chat. Integrations: Apple Watch, Oura, Garmin, Amazfit, Google Health. Shown: iOS only, 4.8 stars from 49.1K ratings, 2.5M+ members, HIPAA and SOC 2 Type 2 badges, Apple Watch Spotlight and "New and Noteworthy" graphics. [bevel.health](https://www.bevel.health/)
- App Store: [Bevel on App Store](https://apps.apple.com/us/app/bevel-all-in-one-health-app/id6456176249)
- Stack: native Swift/SwiftUI, HealthKit and WatchKit, per job posts. The design role is to "push the capabilities of iOS/watchOS". [Built In NYC iOS](https://www.builtinnyc.com/job/ios-engineer/7616571), [General Catalyst product designer](https://jobs.generalcatalyst.com/companies/bevel-2-e30dda94-2881-4062-92f1-ff7ebf98f5da/jobs/60691386-product-designer)
- Public design writeups: none from Bevel's team found, and no designer interview about Liquid Glass. The only teardown found is third-party: [screensdesign.com showcase](https://screensdesign.com/showcase/bevel-health-performance). It describes a minimalist look with gradients, subtle animation and clear type, green/yellow/red score colours, and user-selectable themes (Light/Dark, Illustrative/Minimalistic backgrounds).
- FIQR implication: Bevel's glass is native SwiftUI, so its look comes free from the OS. FIQR approximates it in a WebView, which is a different performance budget. Bevel's red/yellow/green scores and dark mode are outside FIQR's palette rules.

### Cal AI

- What it is: an AI calorie tracker. Snap a photo, scan a barcode or describe a meal to get calories and macros. It uses the depth sensor for volume. iOS and Android, Apple Health and Google Fit, 3-day free trial, claims 5M users. [calai.app](https://www.calai.app/)
- Ownership: MyFitnessPal announced its acquisition of Cal AI on 2026-03-02. Terms were not disclosed. Cal AI stays standalone. [FITT Insider](https://insider.fitt.co/myfitnesspal-acquires-rival-food-tracker-cal-ai/), [Athletech News](https://athletechnews.com/myfitnesspal-cal-ai-acquisition)
- Public design and growth writeups:
  - Superwall case study: 123 iOS A/B experiments across 160 paywall designs and 46 trigger points, 61 of them on the onboarding paywall, and a 31% lift in trial-to-paid. [Superwall](https://superwall.com/case-studies/cal-ai)
  - Adapty breakdown: onboarding runs 25+ cards (weight, habits, goals) with stats between the questions, a dynamic card for the weight gap, and a tailored plan, then a trial paywall. [Adapty](https://adapty.io/blog/how-to-personalize-onboarding-and-paywalls-in-your-mobile-app/)
  - Founder interview: adding onboarding questions raised conversion. [Founderpath](https://founderpath.com/resources/zach-yadegari-cal-ai-onboarding-tests-and-influencer-marketing)
  - Screen library: [ScreensDesign Cal AI](https://screensdesign.com/apps/cal-ai-calorie-tracker/?av=3193&id=1739&vt=1)
- No interview about Cal AI's visual design was found.
- FIQR implication: Cal AI's lesson is onboarding pacing (many short single-question steps), backed by its own A/B data. It is not a lesson about materials.

## 6. Skill repos

Checked with the GitHub API and by reading each SKILL.md. Nothing was installed. Local paths were inspected read-only.

| Name | Exists? | Source URL | Installed locally? | What it does | Recommendation |
|---|---|---|---|---|---|
| apple-design (emilkowalski/skills) | Yes. Pushed 2026-10-11 | https://github.com/emilkowalski/skills/tree/main/skills/apple-design | No (not under `~/.claude/skills` or plugins) | 290-line SKILL.md that translates Apple WWDC talks (mainly "Designing Fluid Interfaces", 2018) to the web: response on pointer-down, 1:1 drag, interruptible springs, momentum, rubber-banding, materials (`backdrop-filter: blur(20px) saturate(180%)`, scroll-edge fades, `prefers-reduced-transparency` fallback), typography. The repo also has `mobile-native`, `animation-performance` and other skills | Use it as a reading reference for motion and gestures. Override its "animate blur radius" advice on Android. Safety: markdown only. The repo has no scripts, only an empty `.pl` file (size 0). Install is `npx skills@latest add emilkowalski/skills` per the [README](https://github.com/emilkowalski/skills) |
| impeccable | Yes (pbakaus/impeccable, 85.7k stars, pushed 2026-10-24) | https://github.com/pbakaus/impeccable | Yes: `~/.claude/skills/impeccable` (SKILL.md v4.7.1). Binaries 0.1.8-0.1.16 in `~/.impeccable/bin` | Design director skill with modes (Persuade/Operate/Read/Experience), a craft floor, iOS/Android refs and a design detector. `reference/ios.md` says "no hand-rolled glassmorphism", and `craft-floor.md` bans "Glass and blur as decoration" | Useful for critique and audit. Safety note: the launcher `scripts/impeccable` downloads a binary from GitHub releases with curl and verifies a sha256 sidecar from the same origin. The `hooks` command can write PostToolUse/Stop hooks into `.claude/settings*.json`. Do not enable hooks without approval |
| ui-ux-pro-max | Yes (nextlevelbuilder/ui-ux-pro-max-skill, 139.5k stars, pushed 2026-10-23) | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | Yes: `~/.claude/skills/ui-ux-pro-max` | A searchable local CSV database (styles, palettes, fonts, UX rules, stacks) with Python search scripts and a priority table of rules (contrast 4.5:1, 44px targets, reduced motion) | Low risk. The local scripts import only stdlib modules (csv, json, re, argparse). No network calls were found in `core.py`, and `validate_data.py` uses `urllib.parse` only. Use it for checklists. Its palettes and fonts do not apply, because FIQR's are fixed |
| frontend-design (Anthropic) | Yes | https://github.com/anthropics/skills/tree/main/skills/frontend-design and https://github.com/anthropics/claude-plugins-official/tree/main/plugins/frontend-design | Yes: plugin `frontend-design@claude-plugins-official` (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/frontend-design/skills/frontend-design/SKILL.md`) | Aesthetic direction and copy guidance. It lists 5 clusters of generated-design defaults. #1 is a warm cream background with a terracotta accent, and #3 includes "hairline rules" | Safe: markdown plus a license. Read it as a warning: FIQR's pinned cream and orange palette sits near tell #1. The skill says "the brief's own words always win", so keep the palette but avoid the other tells |
| uncodixify | Yes, two variants: cyxzdev/Uncodixfy (2.7k stars, the original, spelled "Uncodixfy") and dazeb/uncodixify-skill (31 stars) | https://github.com/cyxzdev/Uncodixfy, https://github.com/dazeb/uncodixify-skill | No | Anti "Codex UI" rules: no glass effects, no pill buttons, radius 8-12px max, Linear/Stripe-style plainness. The dazeb version adds a TS audit script and evals, and pushes dark bases (`bg-zinc-950`) | Partly at odds with this brief: it bans glass and pills, and Apple uses capsules. dazeb pushes dark surfaces, but FIQR has no dark mode. cyxzdev is markdown plus images (safe). dazeb runs `npx tsx` and Python evals (review before running). Mine for its banned-pattern list only. Do not install either as an always-on rule |
| no-ai-slop | Yes (petergyang/no-ai-slop, 12.7k stars, pushed 2026-10-24) | https://github.com/petergyang/no-ai-slop | No | A writing editor that removes 20+ AI-prose patterns while keeping the writer's voice. It has an Edit mode and a Detect mode (quote the line and name the fix). It covers copy, not visuals | Good fit for technique 7/8 copy passes on FIQR strings. Safety: `scripts/build_plugin.py` imports only argparse, json, shutil, zipfile and pathlib (packaging only). There is a GitHub workflow but no install script |
| hairline | Not found as a skill. The only notable repo is lucasmarkes/hairline (2.7k stars), an npm React library of "Isometric line figures that answer the pointer". It is not an agent skill | https://github.com/lucasmarkes/hairline | No | Not a design skill. No SKILL.md found. GitHub code search for `name: hairline` in SKILL.md files and a web search ([search](https://www.superdesign.dev/blog/best-claude-code-skills)) found nothing | Ask Mr. Ved for the exact source. Do not install the npm library, because it is unrelated |

Other local items seen (not requested): `~/.claude/skills/deslop-shared-libs` and the gstack `design-review`, `plan-design-review` and `ios-design-review` skills.
