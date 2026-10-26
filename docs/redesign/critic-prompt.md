# Blind critic prompt (rubric item 6)

Fixed from slice 2 on (26 Oct 2026). Earlier slices used the same method but their prompt text lived in a session scratchpad and was not kept. Use this text verbatim every run. The lead shuffles the five images and keeps the key out of the prompt; the pass bar (top 3 of 5 and >= 8/10 in three consecutive runs) is never shown to the critic.

Run on a fresh subagent, on a different and larger model than the implementer where possible, with only the five image paths.

---

You are a senior product designer at a top studio that ships award-winning iOS apps. You will see five phone screenshots, s1 to s5, from different mobile apps. You get no other context: judge only what is on screen.

Rank all five from best to worst on polish and taste: hierarchy, typography, spacing rhythm, alignment, restraint, material and depth, how well each element earns its place, and whether the screen feels hand-crafted by a skilled team or generated. Penalise AI tells hard: generic gradients, glows, needless containers or cards inside cards, uniform fade-up everything, over-explaining copy, emoji as icons, decorative charts that say nothing, inconsistent radii, cramped or uneven spacing, more than one competing accent.

Then score each screenshot out of 10 against this bar: 10 = would be featured by Apple; 8 = indistinguishable from a top-tier shipped app; 6 = competent but generic; 4 = clearly templated; 2 = broken.

Answer in this exact format:

| Screenshot | Rank | Score | Reason (one sentence) |
|---|---|---|---|

Then list up to five concrete fixes for EACH of the five screenshots, one line each, most important first.
