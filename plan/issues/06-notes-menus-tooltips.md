# 06: Notes, right-click menu, tooltips, Bob picks

Status: ready-for-agent
Blocked by: 05
Lane: A

## What to build

Right-click on a Block or Trait opens its menu (Add/Delete Note, Duplicate, Delete, and the Custom Block items). Notes show as a sticky on a Block and a small field in a pill. Resting the pointer 0.5 s on a Block, Trait or palette item shows its one-sentence tooltip. Every Trait can be handed to Bob ("Bob picks").

## Read

- TDD §9.2 (bulb, BobPicksChip, Dropdown's Bob picks option), §9.3, §9.5, and the Overlays row of §18 "Look details".
- DESIGN.md: Brand and Bob, Motion, Note, Menus (Context menu), Tooltip, Trait (Bob picks).
- PRD §11 (the tooltip table, for checking only).

## Files

Create: `src/canvas/Overlays.tsx`, `src/canvas/menu.ts`, `src/canvas/tooltip.ts`, `src/canvas/bobPicks.ts`, `src/canvas/menu.test.ts`, `src/canvas/tooltip.test.ts`, `src/canvas/bobPicks.test.ts`.
Modify: `src/canvas/BlockView.tsx` (BlockNote, `onContextMenu`), `src/canvas/TraitPill.tsx` (TraitNote, bulb, chip, Bob picks option, `onContextMenu`), `src/slots/Canvas.tsx` (mount `<ContextMenu/>` and `<Tooltip/>`), `src/canvas/Overlays.module.css`, `src/canvas/parts.module.css`.

## Steps

- [ ] `menu.ts`: `MenuItem`, `menuItems` (all items, including the Custom Block ones: Edit Custom Block, Bring back removed parts (N), Use the Custom Block's version, Make Custom Block), `canMakeCustom`, `deleteNote`, `duplicate`, `copyOf` (TDD §9.3).
- [ ] `Overlays.tsx`: `openMenu`, `ContextMenu`, `Tooltip`, `BlockNote`, `TraitNote` (TDD §9.3, §9.5).
- [ ] `tooltip.ts`: `Tip`, `tipFor` (TDD §9.5). `bobPicks.ts`: `bobPicksControl`, `setBobPicks`.
- [ ] Wire Bob picks into TraitPill (TDD §9.2): the dropdown option, the bulb, the green chip with ×, the hint field that is the Note and takes focus when handed over.
- [ ] Tests: `menu.test.ts`, `tooltip.test.ts`, `bobPicks.test.ts` rows of TDD §20.

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser: right-click shows only the items that apply; Add Note shows a focused empty Note; Duplicate places the copy right after (a loose copy 30px down-right); tooltips show after about 0.5 s and never during a drag; a loose Block's tooltip has the italic loose-idea line; Bob picks on a color, a dropdown and an empty text works, and × brings back the old value.
