# 14: Checkpoints tab

Status: done
Blocked by: 13
Wave: 3

## What to build

The Checkpoints tab in Plan: every Build, newest first, with its gist and tags; **Go back to this** and **Edit its Blocks** behind a warning; a read-only view of each Build's Blocks with "See its code"; and a Block chip in the code opens this tab at the Build that made that code.


## Parallel work

This issue runs at the same time as others, each in its own worktree. Touch only the files listed under **Files**. Every other file you need already exists (issue 19 made stubs with the final names); import from it, never edit it. If something you need is missing, stop with `## Question`.

## Read

- **Open only these files:** `spec/tdd/12.md`, `spec/tdd/18.md`, `spec/tdd/20.md`, `spec/design/brand-and-bob.md`, `spec/design/motion.md`, `spec/design/checkpoints.md`, `spec/design/menus.md`, `spec/prd/04.md`. The bullets below say what to look for inside them.
- TDD §12 (all), the Checkpoints rows of §18 and its "Look details".
- DESIGN.md: Brand and Bob, Motion, Checkpoints, Menus (Modal, The Checkpoint warning).
- PRD §4 (Checkpoints tab).

## Files

Create: `src/checkpoints.ts`, `src/checkpoints.test.ts`.
Replace: `src/slots/Checkpoints.tsx` (keep the exported `Warning` from issue 13).
Modify: `src/slots/Checkpoints.module.css`.

## Steps

- [x] `checkpoints.ts` exactly as TDD §12. Include the Assistant parts now (`hasPending` for the warning's last line, `dropPending('Code went back to Checkpoint N')` on load), imported from `src/assistant.ts`. The test for the pending line is in issue 20.
- [x] `Checkpoints.tsx` per TDD §12, including the Block chip focus (`useCheckpointFocus`) and "See its code".
- [x] Tests: the `checkpoints.test.ts` row of TDD §20.

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser (dev select → built site): two entries; Checkpoint 2 is "you are here"; hand-edit the code and it reads "you are here + hand edits"; Go back to Checkpoint 1 adds "Checkpoint 3 · saved for you" first; Edit its Blocks on Checkpoint 2 brings "Opening hours" back into Home on the Canvas; a Block chip in the code opens this tab at its Build with the Block flashing; "See its code" jumps to its line.

## Answer

- `src/checkpoints.ts` exports `sameFiles`, `holding`, `needsSave`, `unbuilt`, `applyLoad`, `loadCheckpoint`, `warning`, `gist`, `fromTag`, `buildOf` and `LoadMode`; it already uses `hasPending`/`dropPending` from `src/assistant.ts`.
- `unbuilt` also takes unlocked children of the Checkpoint Block (new Pages), so a load never drops them.
- Edit its Blocks deletes `canvas.layout`, so the next repair rebuilds it from `children` and the top keeps its index.
