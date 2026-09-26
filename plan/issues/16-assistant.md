# 16: Assistant

Status: ready-for-agent
Blocked by: 13, 14
Lane: B

## What to build

The Assistant panel in Try & tweak: the user chats with Bob about the code at a chosen explanation level; Bob's changes come back as a diff card (Accept all, Reject all, Review in the editor's merge view, Out of date → Ask again or Dismiss). Accepted changes are hand edits and flash in the Preview. Pending changes are dropped (after a warning) by ▶ Build and by loading a Checkpoint. The Preview's **Ask Bob to fix it** asks here.

## Read

- TDD §15 (all), §14 (the CodeEditor Review bullet and MergeReview), §11 (BuildButton press), §12 (`loadCheckpoint`, `warning`).
- DESIGN.md: Assistant, Bob badge, Code editor (Bob's suggested changes).
- PRD §5 (Assistant).

## Files

Create: `src/assistant.ts`, `src/assistant.test.ts`, `src/slots/Assistant.module.css`.
Replace: `src/slots/Assistant.tsx`.
Modify: `src/slots/CodeEditor.tsx` (review files, tabs, dots, `MergeReview` with `decide`), `src/slots/BuildButton.tsx` (the `hasPending` warning and `dropPending`), `src/checkpoints.ts` (`hasPending` warning line, `dropPending('Code went back to Checkpoint N')` on load).

## Steps

- [ ] `assistant.ts` exactly as TDD §15, including `previewHooks.askBobToFix`, limits handling (`limit` returns the message; callers other than the composer add it as a chat line), and `changedBlocks`.
- [ ] `Assistant.tsx` per TDD §15 with `<BobBadge/>` in the title bar and the limit bubble over Send.
- [ ] Fill every `// issue 16` comment left by issues 11, 13 and 14.
- [ ] Tests: the `assistant.test.ts` row of TDD §20; add the "The Assistant's unaccepted changes will be dropped." case to `checkpoints.test.ts`.

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser with the Bob key, on a built site: ask "What does style.css do?" at "very simply" (a plain-words answer, no card); ask "Make the cards rounder" (a card with a summary and file names); Review opens the merge view at the first change with ✓ Accept / ✕ Reject per change; accept one: the card reads "1 of N changes accepted" and the Preview flashes; type in a file the card touches: it turns Out of date; ▶ Build with a card open asks "Build now?"; the error bar's **Ask Bob to fix it** posts a question here.
