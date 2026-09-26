# 20: Integration after the parallel waves

Status: done
Blocked by: 08, 09, 10, 11, 12, 13, 14, 15, 16
Wave: 4 (one agent, on `rough-implementation` after every wave is merged)

## What to build

Nothing new. Prove the parallel pieces fit: no stub is left, the cross-issue tests pass, and the app runs end to end.

## Read

- **Open only these files:** `spec/tdd/20.md`, `spec/tdd/12.md` (the `warning` and `loadCheckpoint` bullets), `spec/tdd/15.md` (the `dropPending` bullet).

## Files

Modify: `src/assistant.test.ts`, `src/checkpoints.test.ts`. Any other file only to fix a real integration bug, and name it in the Answer.

## Steps

- [x] Search `src/` for leftover stubs and markers: `issue 19`, `issue 16`, `issue 15`, `issue 13`, `issue 12`, `issue 09`, `issue 08`, functions that only `return null` or do nothing. Every one must be gone or filled. List what you fixed.
- [x] `src/assistant.test.ts`: add "loading a Checkpoint warns first, then drops it with the line "Code went back to Checkpoint N"" (TDD §20 assistant row).
- [x] `src/checkpoints.test.ts`: add the case where the Assistant has a pending proposal, so `warning(...)` includes "The Assistant's unaccepted changes will be dropped."
- [x] `pnpm check` passes (typecheck, tests, both builds, the safety rules).

## Done when

- `pnpm check` passes on `rough-implementation`.
- The human then runs `pnpm dev` and walks: demo → Build (with the Bob key) → Try & tweak (Preview, code editor, Assistant) → Checkpoints, and reports anything broken back into this issue as a new `## Question`.

## Answer

- No `issue NN` markers or empty stubs were left in `src/`. `previewHooks.askBobToFix` is filled by `assistant.ts`.
- Removed the unused placeholder `src/slots/Slot.tsx` and `src/slots/slot.module.css` (issue 03's slot stub; nothing imported it).
- Added the Checkpoint-load case to `src/assistant.test.ts` and the pending-proposal warning case to `src/checkpoints.test.ts`.
- `pnpm check` passes (typecheck, tests, both builds, deploy checks).
