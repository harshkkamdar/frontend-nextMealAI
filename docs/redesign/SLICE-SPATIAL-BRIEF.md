# Screen slice brief (Spatial Depth build, 26-27 Oct 2026)

You build ONE screen slice of the FIQR redesign on top of the shared Spatial kit (slice K, c78985e7..ea698466). Read first: `docs/redesign/SPATIAL-BUILD.md` (contract, locked picks, done criteria), `AGENTS.md`, `docs/redesign/design-system.md` (Spatial sizing section), `docs/redesign/motion-feel.md`, `docs/redesign/decisions.md`, `docs/redesign/mocks/PICKS.md`, and your slice's mock in `docs/redesign/mocks/` (open it with Playwright and screenshot the picked option's phones in every state; these are the reference).

## Kit you must use (do not re-implement)
- Depth push/pop/swipe: `src/components/layout/route-frame.tsx`; geometry and springs in `src/lib/motion.ts`; sheet depth in `src/lib/depth.ts`; navigation in `src/lib/navigation.ts` (`goBack`, `TAB_ROUTES`).
- Sheets: `src/components/ui/bottom-sheet.tsx`, `src/components/ui/resizable-sheet.tsx`.
- `usePressTilt` (`src/components/ui/fiqr/press-tilt.ts`), `useTitleDrift` / `DriftLayer` (`src/components/ui/fiqr/scroll-drift.tsx`), `LargeTitleHeader` / `PushedHeader`.
- Sizing tokens in `src/app/globals.css` (text-title/hero/headline/body/body-sm/caption/label/tab, h-row/btn/chip/stepper/field/tile, radii card 22 / tile 20 / sheet 38, gutter 16) and the resized primitives in `src/components/ui/fiqr`.

## Ownership (several slice agents run at the same time)
- Edit only your slice's routes under `src/app/**` and components that only your slice uses (listed in your prompt). Put new slice-only components in your slice's component folder.
- Do NOT edit shared files: `src/components/layout/*`, `src/components/ui/*` (incl. `ui/fiqr`), `src/lib/motion.ts`, `src/lib/depth.ts`, `src/lib/navigation.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(app)/layout.tsx`, `tailwind`/`postcss` config. If you truly need a shared change, write it in your report as a request; build a local wrapper meanwhile.
- `git add` only your own paths. Never `git add -A`, never revert or stage other agents' files. Commit per logical step.

## Rules
AGENTS.md laws (Archivo only, brand colours and Q2 tints only, one orange action per screen, no dark mode, no next/image, transform/opacity motion only, Zod/API through `src/lib/api`). Data only through existing API modules; no backend changes; where a pick needs data the backend lacks, use the agreed fallback and note it. No em dashes in code comments or commit messages; no co-author or generated-by lines; no real person's name in code. Never edit `.env`, `CHANGELOG.md`, the backend repo; never call :4010 or a real account.

## Skills
Use: `impeccable`, `apple-design`, `animate`, `emil-design-eng`, `review-animations` (self-review motion, fix findings), `design-taste-frontend` (tells check; brand overrides its palette/glass bans), `break-ui` (worst-case data), `mattpocock-skills:tdd` for new logic.

## Proof (done criteria from SPATIAL-BUILD.md)
1. Side-by-side screenshots of your screens vs the picked mock phones at 390 (and 360), read by you; then a fresh reviewer subagent on a different model (`model: sonnet`) sees only the criteria, the mock screenshots and yours, and you fix what it finds.
2. `node scripts/redesign-capture.mjs <your slice shots>`: axe 0, small targets 0, orange <= 1 (update the shot tables in `scripts/shots/` for your new states; you own your slice's shot file).
3. Transitions: one static export build at the end of your slice (scratch worktree, cp -cR node_modules, `next build --webpack`, free ports, not 3050/4029/4071/4087), `scripts/redesign-transitions.mjs` + `scripts/redesign-framediff.py`, two runs, 0 real pops; read key frames. The machine is shared by 8 agents: run heavy steps one at a time and never pkill other agents' processes (kill only PIDs you started).
4. `npm run lint` 0 errors, `npm run type-check`, `npm test` exit 0 (run the full suite once at the end; focused tests while working).
5. Report: what you built (files), picks implemented, fallbacks, measurements, screenshot paths, shared-file requests, anything left.
