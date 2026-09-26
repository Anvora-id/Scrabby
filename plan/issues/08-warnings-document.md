# 08: Warnings and the instruction document

Status: ready-for-agent
Blocked by: 19
Wave: 1

## What to build

The plan checks and their marks on the Canvas ("!" Bob skips it, "?" worth a look) with a popover and the "‹ ⚠ N to check ›" stepper; and the instruction document: the Markdown text a Build sends Bob, which users never see.


## Parallel work

This issue runs at the same time as others, each in its own worktree. Touch only the files listed under **Files**. Every other file you need already exists (issue 19 made stubs with the final names); import from it, never edit it. If something you need is missing, stop with `## Question`.

## Read

- **Open only these files:** `spec/tdd/10.md`, `spec/tdd/18.md`, `spec/tdd/20.md`, `spec/tdd/appendix-a.md`, `spec/design/brand-and-bob.md`, `spec/design/motion.md`, `spec/design/warnings.md`, `skills/instruction-header.md`. The bullets below say what to look for inside them.
- TDD §10 (all), Appendix A, and the Warnings row of §18 plus its "Look details".
- DESIGN.md: Brand and Bob, Motion, Warnings (ignore one-click fixes and the Edit button: TDD §18).
- `skills/instruction-header.md` (it is imported as text).

## Files

Create: `src/instructions/warnings.ts`, `src/instructions/document.ts`, `src/canvas/marks.ts`, `src/canvas/Warnings.tsx`, `src/canvas/Warnings.module.css`, `src/instructions/warnings.test.ts`, `src/instructions/document.test.ts`, `src/canvas/marks.test.ts`.
Modify: `src/slots/Canvas.tsx` (warnings, marks, stops, busy item, stepper, popover, show), `src/canvas/BlockView.tsx` and `TraitPill.tsx` (`<Mark id>`).

## Steps

- [ ] `warnings.ts` exactly as TDD §10.1 (every text and todo string exact).
- [ ] `document.ts` exactly as TDD §10.2; it imports the header with `?raw`.
- [ ] `marks.ts`, `Warnings.tsx` (MarksContext, Mark, Popover, Stepper, flash) per TDD §10.3; wire into the Canvas per TDD §8.4 (busy item, stepper go, show, popover placement).
- [ ] Tests: the warnings, document (with the Appendix A snapshot: write the expected text into the test as a string built from the header file plus Appendix A, not a generated snapshot file), and marks rows of TDD §20.

## Done when

- `pnpm typecheck` and `pnpm test` pass; the demo document equals Appendix A exactly.
- In the browser: the demo shows "✓ Nothing to check"; delete the Quiz Page: both Top bar Quiz buttons get "!" and the stepper says "⚠ 1 to check"; ‹ › move the Canvas to it, unfolding if needed, and open the popover; Undo restores the Page.
