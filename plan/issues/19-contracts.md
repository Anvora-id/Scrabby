# 19: Contracts for parallel work (wave 0)

Status: done
Blocked by: 07
Wave: 0 (one agent, before everything else)

## What to build

Nothing a user sees. Merge `origin/main` into `rough-implementation`, then create the small stub modules and the wiring that the later issues import, so issues 08–16 can be built at the same time by separate agents in separate worktrees without touching each other's files. Each stub has its final exported names and types; its owner issue replaces only the bodies.

## Read

- **Open only these files:** `spec/tdd/05.md` (§5.1 types only), `spec/tdd/07.md`, `spec/tdd/11.md` (the `FAILURE_LINES`, `FailReason`, `BuildRun` block and the run store bullet), `spec/tdd/13.md` (the `src/preview.ts` bullet), `spec/tdd/15.md` (`CardState`, `cardState`, `hasPending`, `openFiles`, `decide`, `dropPending` bullets), `spec/tdd/17.md` (the export names only).
- Match the repo's existing style: imports end in `.ts`/`.tsx`, components are default exports (see `src/slots/*.tsx`).

## Files and owners

| File | Create in this issue | Owner issue that fills it later |
|---|---|---|
| `src/agent.ts` | TDD §5.1 types exactly; `runAgent(req)` = an async generator that yields `{ type: 'error', reason: 'unreachable' }`; `readAgentStream` omitted; `useAgentLabel()` returns `null` | 09 |
| `src/shell/BobBadge.tsx` | `export default function BobBadge() { return null }` | 09 |
| `src/preview.ts` | **Complete** per TDD §13's `src/preview.ts` bullet (`flashBlocks`, `previewHooks` with a no-op `askBobToFix`, `onRedraw`, `takeFlash`). About 20 lines. | none (10 and 16 only use it) |
| `src/build.ts` | `FailReason`, `FAILURE_LINES` (exact strings), `BuildRun` type, the run store with `useBuild` and `getBuild` (initially `undefined`). Nothing else. | 13 |
| `src/assistant.ts` | `CardState` type; `cardState(pr, files)` complete per TDD §15 (5 lines); `openFiles(pr)` complete; `hasPending(p)` returns `p.chat.some(m => m.proposal && !m.proposal.done)`; `dropPending(line?)`, `decide(time, path, code, proposed)` as no-ops with the final signatures | 16 |
| `src/download.ts` | `export async function downloadCode(project: Project): Promise<void> {}` | 12 |
| `src/onboarding.ts` | Add, beside what is there: `askDemo()`, `askNewProject()`, `startTour(which: 'plan' \| 'try')`, `droppedBlock(id: string)` as no-ops | 15 |
| `src/shell/Onboarding.tsx` | `export default function Onboarding() { return null }` and `export function DemoButton() { return null }` | 15 |

## Wiring (done here, so wave-1 issues never touch these shared files)

- [x] `git fetch; git merge origin/main` (brings issue 18's `pnpm check`, hook and CI). Resolve conflicts by keeping both sides; `plan/build-map.md`: keep `rough-implementation`'s version plus main's added lines.
- [x] Every stub in the table above.
- [x] `src/App.tsx`: render `<Onboarding/>` after `<main>` (TDD §7).
- [x] `src/shell/MenuBar.tsx`: enable New Project (`askNewProject`), Demo (`askDemo`), Download code (`downloadCode(project).catch(e => console.error('Download code failed', e))`), Show me around (disabled on the Build step; `startTour(step === 'try' ? 'try' : 'plan')`). Remove their `disabled` placeholders.
- [x] `src/slots/Canvas.tsx`: replace the two `issue 15` comments with `{p.blocks[id]?.type === 'site' && !p.blocks[id].children.length && <DemoButton />}` and, for a dropped new Block, `droppedBlock(newId)` (make `dropItem`'s return value available). Leave every `issue 08` comment as it is.
- [x] `pnpm typecheck` and `pnpm test` pass.

## Done when

- Typecheck and tests pass; the app still runs; the menu buttons call the stubs (they do nothing yet).
- Commit `chore: contracts for parallel work (issue 19)` on `rough-implementation`, and push.

## Answer

- `origin/main` was already merged into `rough-implementation` (a25019c); nothing new to merge.
- `createStore` in `src/store.ts` is now exported, so owner modules (`build.ts`, and later others) make their stores with it.
- `Canvas.tsx` keeps the dropped item's id in `newId` after `updateProject`; issue 08 can use it for the busy mark.
- `hasPending` only checks open proposals; issue 16 adds the running reply.
- On this machine, run pnpm from Bash with `export PATH="/c/Program Files/nodejs:$PATH"` first, or scripts fail with `'node' is not recognized`.
