# Slice agent brief (S3 to S9)

You are building one slice of the FIQR v2 redesign. Several agents work at the same time in the same checkout (`/Users/veddsavla/Developer/clients/frontend-nextMealAI`, branch `redesign/fiqr-v2`). The lead integrates, runs the blind critic and owns the ledger.

## Read first

1. `docs/redesign/motion-feel.md` - the WHAT / WHAT NOT / HOW / HOW NOT of motion and feel. Binding. The owner's words about the old welcome: "static, not fluid, PowerPoint slides moving left to right, not liquid glass, AI slop". Nothing you build may read that way.
2. `docs/redesign/decisions.md` (Q1-Q31b, C1-C8, D1-D4, E1-E4, F1-F6), `design-system.md`, `BRIEF.md` (rubric), `inventory.md` (the routes, overlays and states you own), `teardown.md` and the reference images it names in `/Users/veddsavla/Downloads/inspiration for FIQR/`.
3. `AGENTS.md` (laws: Archivo only, the four colours plus alpha tints and macro teal/ochre, one orange action per screen, no dark mode, no next/image, backend only via `src/lib/api`).
4. The slice 2 reference, which every slice must match: `src/components/layout/tab-bar.tsx`, `log-sheet.tsx`, `screen-header.tsx` (`LargeTitleHeader` for the four main tabs, `PushedHeader` for pushed screens), `src/components/ui/bottom-sheet.tsx` (inset glass sheet), `src/components/ui/fiqr/icons.tsx` (filled icons), `src/components/dashboard/home-cards.tsx` (card, tile, row, dashed empty slot, count-up, draw-in, skeleton patterns), `src/app/(app)/dashboard/page.tsx`. Screens: `docs/redesign/screens/slice-2/*.png`.

## Shared rules

- Keep every data hook, API call and behaviour. Layout, hierarchy, materials, motion and copy only (Q6). Behaviour changes need a signed decision; if you think one is needed, list it as a needs-owner question.
- Cards: white, no border, `shadow-[var(--shadow-card)]`, radii 24 card / 22 tile / 16 row / 14 control. Selection is a 1.5 pt ink outline, never an orange fill. Secondary text `ink-65` minimum. Tap targets 44 pt.
- Glass only on the controls layer (bars, round buttons, sheets). Content stays solid. Animate only transform and opacity. Reduced motion = 150 ms fades, count-ups jump.
- Copy in Geo's voice (Q29). Write `docs/redesign/copy/slice-<n>.md` as an old / new table.
- File ownership: edit only files that belong to your routes and overlays (their pages under `src/app/(app)/...` and components under `src/components/<area>/`). Do NOT edit shared files: `globals.css`, `icons.tsx`, `tab-bar.tsx`, `log-sheet.tsx`, `screen-header.tsx`, `bottom-sheet.tsx`, `home-cards.tsx`, `motion.ts`, `layout.tsx`, `package.json`. If you need a new shared primitive, create it as a new file under `src/components/ui/fiqr/` named for what it is, and say so in your report. If you need a change to a shared file, stop and report the exact change.
- Tests: update tests your change breaks (same assertions on behaviour, new markup), add tests for new logic. Run `npx vitest run <your test paths>`, `npx tsc --noEmit` and `npx eslint <your paths>`; errors in files you do not own are someone else's in-progress work: report them, do not fix them.
- Git: commit only your own paths with `git commit -m "..." -- <paths>` (never `git add -A` / `git add .`); retry if `index.lock` exists. Message: `feat(redesign): slice <n> <what>`, no AI co-author line, no em dash characters. Do not push.
- Do not edit `docs/redesign/LEDGER.md`, `PROGRESS.md` or `decisions.md`; report statuses instead.
- Production data (F3): the dev server on :3020 talks to a local API on :4010 backed by the production database. Captures must use the mocked API in `scripts/redesign-capture.mjs` (route interception). Do not save, delete or start anything on the real account.

## Evidence you must produce

1. Captures: add a `'slice-<n>'` entry to `SHOTS` in `scripts/redesign-capture.mjs` (add fixtures next to the slice-2 ones; keep your edits inside your own block) covering every route x state you own: default, empty / first run, loading, error, offline, long text, each overlay open. Run `node scripts/redesign-capture.mjs slice-<n>` (dev server :3020). Every shot must show axe 0, small 0, orange <= 1. Read your screenshots and fix what looks wrong.
2. Transitions: add your transitions to `scripts/redesign-transitions.mjs` (`'slice-<n>'`), record them, run `python3 scripts/redesign-framediff.py docs/redesign/screens/slice-<n>/transitions`; 0 pops.
3. A self-check against the motion-feel checklist, one line per item.

## Report back (final message)

Commit sha(s); the routes and overlays done; the capture table (shot, axe, small, orange); the framediff summary; the copy file path; the motion checklist; tests run with results; any shared-file change you need; any needs-owner question; anything you could not finish and why.
