# Slice 1 blind critic (onboarding goal step vs 4 Cal AI references)

Fresh Claude Fable subagent per run (implementer: Opus), same prompt every run, screenshots only, positions shuffled (keys in the scratchpad). Pass bar: FIQR top 3 of 5 and >= 8/10, three runs in a row.

| Round | Change before the round | Run | FIQR rank | FIQR score |
|---|---|---|---|---|
| 1 | first build | 1 / 2 / 3 | 1 / 1 / 1 | 6.5 / 6.5 / 7.0 |
| 2 | no card shadows, hairline cards, single radio dot, balanced headings, flat back button, 8% minimum progress | 4 / 5 / 6 | 1 / 1 / 1 | 6.5 / 7.0 / 7.0 |
| 3 | why-line rewritten, lighter heading weight, darker hints, radio on the title line | 7 / 8 / 9 | 1 / 1 / 1 | 7.0 / 6.5 / 7.0 |

Result: ranked first in 9 of 9 runs, above every Cal AI reference (which scored 3.0-6.0). The score plateaued at 6.5-7.0 across three honest attempts: **stalled below the 8/10 bar**.

Notes the critics repeat in round 3 (candidates for a fourth pass, or for Ved's call):
- Empty cream between the last option and the CTA on short lists (bottom-anchor the list, or taller rows).
- Selected card: outline alone reads heavy; add a faint tint or soft shadow (contradicts round 1's "no shadows").
- The orange CTA's pill radius versus the 16 pt card radius.
- Captures have no status bar, so chrome cannot be judged; device captures would fix that.
- Contradictory asks across runs (heavier vs lighter selection, more vs less subtitle) suggest the critic's ceiling for a single onboarding screen sits near 7.
