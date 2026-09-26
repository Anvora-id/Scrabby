# 13: Build

Status: ready-for-agent
Blocked by: 08, 09, 10, 11
Wave: 2

## What to build

▶ Build: the user presses it and the Build step shows each Block's chip lighting up as Bob writes it. A finished Build saves a Checkpoint, turns the Site Block into the locked Checkpoint Block with one Built page per `.html` file, keeps loose ideas, and opens Try & tweak after 0.9 s with the new Blocks flashing in the Preview. Later Builds send only what is new and keep hand edits. A failed Build changes nothing and says why. A usage limit shows its message and starts nothing.


## Parallel work

This issue runs at the same time as others, each in its own worktree. Touch only the files listed under **Files**. Every other file you need already exists (issue 19 made stubs with the final names); import from it, never edit it. If something you need is missing, stop with `## Question`.

## Read

- **Open only these files:** `spec/tdd/11.md`, `spec/tdd/12.md`, `spec/tdd/18.md`, `spec/tdd/20.md`, `spec/design/brand-and-bob.md`, `spec/design/motion.md`, `spec/design/build-button-and-build-card.md`, `spec/design/speech-bubble.md`, `spec/design/bob-badge.md`, `spec/prd/04.md`, `spec/prd/10.md`. The bullets below say what to look for inside them.
- TDD §11 (all), the Build rows of §18 and its "Look details".
- DESIGN.md: Brand and Bob, Motion, Build button and Build card, Speech bubble (Limit message, Blocked Build), Bob badge.
- PRD §4 ("A Build consumes its Blocks"), §10 (Build failure).

## Files

Create: `src/slots/Build.module.css`, `src/build.test.ts`.
Replace: `src/build.ts` (issue 19 stub; keep its exports and add the rest).
Replace: `src/slots/BuildButton.tsx`, `src/slots/BuildCard.tsx`.
Modify: `src/slots/Checkpoints.tsx` (export the `Warning` dialog component of TDD §12 now, with its CSS in `src/slots/Checkpoints.module.css`; the tab itself stays a placeholder until issue 14).

## Steps

- [ ] `build.ts` exactly as TDD §11: `FAILURE_LINES`, `BuildRun`, the run store, `requestBlocks`, `nothingNew`, `buildProblem`, `runBuild` (with `start`/`limit` handling, all or nothing, `.builds/build-N.md`, `addCheckpoint`, `consume` with `key = null`, `flashBlocks`, 900 ms to Try & tweak), `builtBlocks`, `consume`, `pageName`.
- [ ] BuildButton and BuildCard per TDD §11, with `<BobBadge/>` in the running title. Include the Assistant's pending-change check now, with `hasPending` and `dropPending` from `src/assistant.ts` (issue 19 stubs; issue 16 fills them).
- [ ] Tests: the `build.test.ts` row of TDD §20 (mock `./db` and `./agent`; fake timers).

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser with the Bob key: load the demo, ▶ Build: chips light up, "Building …" lines appear, the Build finishes (note the time), Try & tweak opens with the site running. Back in Plan, ▶ Build is greyed and explains "Nothing new to build…". Drop a Section with a text Trait into a Built page, hand-edit `style.css`, ▶ Build: the hand edit survives. Stop the dev server's network (or point `AGENT_BASE_URL` at a bad host) and ▶ Build: "Build N did not finish", "Nothing changed…", the unreachable line, Try again and ← Back to the Blocks.
