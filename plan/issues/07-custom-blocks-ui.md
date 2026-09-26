# 07: Custom Blocks UI

Status: ready-for-agent
Blocked by: 06
Lane: A

## What to build

Custom Blocks on screen (ADR 0003): My Blocks in the palette (make one, place Instances, open its edit view), the edit view with its bar, Instances in their own color with a dashed border and an Edit pill, and the `✎ changed here` / `+ only here` markers. The logic already exists in `src/model/project.ts` and `menu.ts`.

## Read

- TDD §9.4, §9.1 (Instance and definition bits), §8.4 (Render in the edit view, Reset view, EditBar), and the §18 rows "Block header" and "Block, Instance".
- DESIGN.md: Block (Instance state, Custom Block definition state, Markers), Palette (My Blocks), Menus (Custom Block edit bar). Ignore the toggle strip, the Color button and the color menu (TDD §18).

## Files

Modify: `src/slots/Palette.tsx` (My Blocks), `src/slots/Canvas.tsx` (edit view, EditBar), `src/canvas/BlockView.tsx` (Instance/definition look, Edit pill, markers, `customColor`), `src/canvas/TraitPill.tsx` (short markers), `src/canvas/Overlays.tsx` (ContextMenu `edit` items call `setEditing`), CSS Modules as needed.

## Steps

- [ ] `customColor` exported from BlockView (TDD §9.1); Instances and definitions wear it.
- [ ] Palette My Blocks (TDD §9.4): Make a Custom Block (opens its edit view), the hint, one row per Custom Block (drag → a new Instance; Edit).
- [ ] Canvas edit view: only the definition, the EditBar with Done, the view saved and restored; nothing lands outside the definition; no Warnings there.
- [ ] Markers on Instance parts; the Edit pill on an Instance header; the definition is not draggable and reads "Custom Block".

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser (demo): edit "Top bar" and rename its Menu button: all three Instances follow; rename it in one Instance first: that one keeps its name and shows `✎ changed here`; delete a part from one Instance and "Bring back removed parts (1)" restores it; Make Custom Block on a Hero puts "… 1" in its place.
