# 04: Canvas logic: layout tree, drops, targeting

Status: done
Blocked by: 02
Lane: A

## What to build

The pure logic under the Canvas: the rows-and-columns layout tree inside a Block, dropping and removing Blocks and Traits, the drop rules, closest-edge drop targeting, the "on click" options, and the drag store.

## Read

- **Open only these files:** `spec/tdd/08.md`, `spec/tdd/20.md`. The bullets below say what to look for inside them.
- TDD §8.1, §8.2, §8.3.

## Files

Create: `src/canvas/tree.ts`, `src/canvas/target.ts`, `src/canvas/drag.ts`, `src/canvas/cx.ts`, `src/canvas/tree.test.ts`, `src/canvas/target.test.ts`.

## Steps

- [x] `tree.ts`: types and every function of TDD §8.1.
- [x] `target.ts`: `Rect`, `DragRects`, `targetAt` (TDD §8.2).
- [x] `drag.ts`, `cx.ts` (TDD §8.3, §8).
- [x] Tests: the `tree.test.ts` and `target.test.ts` rows of TDD §20 (the target scene numbers are given there; use `demoProject()` and `builtSite()` from `src/fixtures/fixtures.ts`).

## Done when

- `pnpm typecheck` and `pnpm test` pass.

## Answer

`tree.ts` exports `repairLayout`, `insertInto`, `leafList`, `parentMap`, `canDrop`, `canTrash`, `dropItem`, `removeItem`, `onClickOptions`, `isTraitItem`, and all types (`DragItem`, `Drop`, `Slot`, `Option`, `NewBlockType`). `target.ts` exports `targetAt`, `Rect`, `DragRects`. `drag.ts` exports `getDrag`, `setDrag`, `useDrag`, `dragSource`, `takePending`, `peekPending`, and types `DragState`, `Pending`. `cx.ts` exports `cx`.
