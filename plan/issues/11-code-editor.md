# 11: Code editor

Status: ready-for-agent
Blocked by: 19
Wave: 1

## What to build

The dark code editor in Try & tweak: one tab per file, hand edits saved as the Project's code (and undoable), changed files and lines tinted against the last Build, a Block chip on the first line of each Block's code that opens the Checkpoints tab, and "See its code" jumps. Also Review: the Assistant's proposed changes in a merge view with Accept and Reject per change.


## Parallel work

This issue runs at the same time as others, each in its own worktree. Touch only the files listed under **Files**. Every other file you need already exists (issue 19 made stubs with the final names); import from it, never edit it. If something you need is missing, stop with `## Question`.

## Read

- **Open only these files:** `spec/tdd/14.md`, `spec/tdd/18.md`, `spec/tdd/20.md`, `spec/design/brand-and-bob.md`, `spec/design/motion.md`, `spec/design/code-editor.md`. The bullets below say what to look for inside them.
- TDD §14 (all), the Code editor rows of §18.
- DESIGN.md: Brand and Bob, Motion, Code editor.

## Files

Replace: `src/slots/CodeEditor.tsx`.
Create: `src/code/code.ts`, `src/code/setup.ts`, `src/code/navigation.ts`, `src/code/MergeReview.tsx`, `src/code/editor.module.css`, `src/code/code.test.ts`.

## Steps

- [ ] `code.ts` (`changedLines`, `blockMarks`, `findBlockCode`, `blockInfo`) and its tests (TDD §20).
- [ ] `setup.ts`, `navigation.ts` (all exports of TDD §14, including the Checkpoint focus store and `startReview`).
- [ ] `CodeEditor.tsx` complete per TDD §14, **including** the Review part (review files join the tabs with their dot; `MergeReview` renders for them with `decide`). Import `cardState`, `openFiles` and `decide` from `src/assistant.ts` (issue 19 stubs; issue 16 fills them, so Review has nothing to show until then).
- [ ] `MergeReview.tsx` complete per TDD §14.

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser (built site): tabs for 5 files with dots on `index.html` and `style.css`; the Opening hours lines are tinted; chips read "◧ Big welcome Block" etc.; typing a change saves (reload keeps it) and redraws the Preview; Ctrl+Z inside the editor undoes typing; switching tabs keeps each tab's cursor.
