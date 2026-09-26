# 14: Checkpoints tab

Status: ready-for-agent
Blocked by: 13
Lane: B

## What to build

The Checkpoints tab in Plan: every Build, newest first, with its gist and tags; **Go back to this** and **Edit its Blocks** behind a warning; a read-only view of each Build's Blocks with "See its code"; and a Block chip in the code opens this tab at the Build that made that code.

## Read

- TDD §12 (all), the Checkpoints rows of §18 and its "Look details".
- DESIGN.md: Brand and Bob, Motion, Checkpoints, Menus (Modal, The Checkpoint warning).
- PRD §4 (Checkpoints tab).

## Files

Create: `src/checkpoints.ts`, `src/checkpoints.test.ts`.
Replace: `src/slots/Checkpoints.tsx` (keep the exported `Warning` from issue 13).
Modify: `src/slots/Checkpoints.module.css`.

## Steps

- [ ] `checkpoints.ts` exactly as TDD §12. Skip the Assistant parts (`hasPending`, `dropPending` and the warning's last line) for now; issue 16 adds them (leave `// issue 16` comments).
- [ ] `Checkpoints.tsx` per TDD §12, including the Block chip focus (`useCheckpointFocus`) and "See its code".
- [ ] Tests: the `checkpoints.test.ts` row of TDD §20.

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser (dev select → built site): two entries; Checkpoint 2 is "you are here"; hand-edit the code and it reads "you are here + hand edits"; Go back to Checkpoint 1 adds "Checkpoint 3 · saved for you" first; Edit its Blocks on Checkpoint 2 brings "Opening hours" back into Home on the Canvas; a Block chip in the code opens this tab at its Build with the Block flashing; "See its code" jumps to its line.
