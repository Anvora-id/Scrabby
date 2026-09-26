# 11: Code editor

Status: ready-for-agent
Blocked by: 03
Lane: B

## What to build

The dark code editor in Try & tweak: one tab per file, hand edits saved as the Project's code (and undoable), changed files and lines tinted against the last Build, a Block chip on the first line of each Block's code that opens the Checkpoints tab, and "See its code" jumps. Also the merge-view component that issue 16's Review uses.

## Read

- TDD §14 (all), the Code editor rows of §18.
- DESIGN.md: Code editor.

## Files

Replace: `src/slots/CodeEditor.tsx`.
Create: `src/code/code.ts`, `src/code/setup.ts`, `src/code/navigation.ts`, `src/code/MergeReview.tsx`, `src/code/editor.module.css`, `src/code/code.test.ts`.

## Steps

- [ ] `code.ts` (`changedLines`, `blockMarks`, `findBlockCode`, `blockInfo`) and its tests (TDD §20).
- [ ] `setup.ts`, `navigation.ts` (all exports of TDD §14, including the Checkpoint focus store and `startReview`).
- [ ] `CodeEditor.tsx` per TDD §14 without the Review part (issue 16 adds it; leave a `// issue 16` comment where review files join the tabs and where `MergeReview` renders).
- [ ] `MergeReview.tsx` complete per TDD §14 (not yet used).

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser (built site): tabs for 5 files with dots on `index.html` and `style.css`; the Opening hours lines are tinted; chips read "◧ Big welcome Block" etc.; typing a change saves (reload keeps it) and redraws the Preview; Ctrl+Z inside the editor undoes typing; switching tabs keeps each tab's cursor.
