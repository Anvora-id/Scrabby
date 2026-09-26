# 16: Assistant

Status: done
Blocked by: 09, 11
Wave: 2

## What to build

The Assistant panel in Try & tweak: the user chats with Bob about the code at a chosen explanation level; Bob's changes come back as a diff card (Accept all, Reject all, Review in the editor's merge view, Out of date → Ask again or Dismiss). Accepted changes are hand edits and flash in the Preview. Pending changes are dropped (after a warning) by ▶ Build and by loading a Checkpoint. The Preview's **Ask Bob to fix it** asks here.


## Parallel work

This issue runs at the same time as others, each in its own worktree. Touch only the files listed under **Files**. Every other file you need already exists (issue 19 made stubs with the final names); import from it, never edit it. If something you need is missing, stop with `## Question`.

## Read

- **Open only these files:** `spec/tdd/15.md`, `spec/tdd/14.md`, `spec/tdd/11.md`, `spec/tdd/12.md`, `spec/tdd/20.md`, `spec/design/brand-and-bob.md`, `spec/design/motion.md`, `spec/design/assistant.md`, `spec/design/bob-badge.md`, `spec/design/code-editor.md`, `spec/prd/05.md`. The bullets below say what to look for inside them.
- TDD §15 (all), §14 (the CodeEditor Review bullet and MergeReview), §11 (BuildButton press), §12 (`loadCheckpoint`, `warning`).
- DESIGN.md: Brand and Bob, Motion, Assistant, Bob badge, Code editor (Bob's suggested changes).
- PRD §5 (Assistant).

## Files

Replace: `src/assistant.ts` (issue 19 stub; keep every export and add the rest), `src/slots/Assistant.tsx`.
Create: `src/assistant.test.ts`, `src/slots/Assistant.module.css`.
Do not edit: CodeEditor (issue 11 wired Review), BuildButton (13), `checkpoints.ts` (14). `src/build.ts` may still be issue 19's stub while you work: use only `FAILURE_LINES`, `FailReason`, `BuildRun` and `getBuild` from it.

## Steps

- [x] `assistant.ts` exactly as TDD §15, including `previewHooks.askBobToFix`, limits handling (`limit` returns the message; callers other than the composer add it as a chat line), and `changedBlocks`.
- [x] `Assistant.tsx` per TDD §15 with `<BobBadge/>` in the title bar and the limit bubble over Send.
- [x] Tests: the `assistant.test.ts` row of TDD §20, except the case "loading a Checkpoint warns first, then drops it", which needs issue 14: it moves to issue 20.

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser with the Bob key, on a built site: ask "What does style.css do?" at "very simply" (a plain-words answer, no card); ask "Make the cards rounder" (a card with a summary and file names); Review opens the merge view at the first change with ✓ Accept / ✕ Reject per change; accept one: the card reads "1 of N changes accepted" and the Preview flashes; type in a file the card touches: it turns Out of date; ▶ Build with a card open asks "Build now?"; the error bar's **Ask Bob to fix it** posts a question here.

## Answer

- `assistant.ts` also exports `ask`, `turnContext`, `propose`, `acceptAll`, `rejectAll`, `askAgain`, `changedBlocks`, `useLevel`/`setLevel`, `useReplying`; `hasPending` now counts a running reply.
- `dropPending` clears the reply store at once; the stopped turn's Bob text is set when its next event arrives.
- Importing `assistant.ts` sets `previewHooks.askBobToFix` (Assistant.tsx and CodeEditor.tsx import it).
- Issue 20 still owes the "loading a Checkpoint warns first, then drops it" test.
