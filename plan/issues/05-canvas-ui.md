# 05: Canvas UI: Blocks, Traits, palette, drag, pan and zoom

Status: ready-for-agent
Blocked by: 03, 04
Lane: A

## What to build

The Plan Canvas the user works on: the palette with its category column, Blocks as C-shaped frames that nest and grow, Trait pills with values edited in place, dragging with the drop shadow and indicator line (onto the Canvas, between Blocks, back onto the palette to delete), folding, pan and zoom.

## Read

- TDD §8.4, §9.1, §9.2, §9.6, and the Palette, Canvas, Block, Trait, Dragging rows of §18 "Look details".
- DESIGN.md: Brand and Bob, Motion, Canvas, Palette, Block (Anatomy, States: Open, Folded, Loose idea, Drop target, Being dragged, Site Block, Checkpoint Block, Locked Page, Header buttons), Trait (Sticker, Straight, Value fields, Dropdown sources, Color menu).

## Files

Replace: `src/slots/Canvas.tsx`, `src/slots/Palette.tsx`.
Create: `src/canvas/BlockView.tsx`, `src/canvas/TraitPill.tsx`, `src/canvas/Canvas.module.css`, `src/canvas/parts.module.css`, `src/canvas/Overlays.module.css` (fold, chips, loose badge only for now), `src/slots/Palette.module.css`.

## Steps

- [ ] Canvas.tsx per TDD §8.4 without: Warnings (marks, stepper, popover: issue 08), the edit view and EditBar (issue 07), ContextMenu and Tooltip (issue 06), `droppedBlock` (issue 15), the Demo button (issue 15). Leave one `// issue NN` comment where each goes.
- [ ] BlockView per TDD §9.1 without Notes, markers, the Edit pill and `<Mark>` (issues 06, 07, 08).
- [ ] TraitPill with every value field of TDD §9.2 (TextField, LongText, Dropdown with `custom…` and `▾`, ColorField and ColorMenu). Show the `💡 Bob picks` option in dropdowns but leave its handler, the bulb and the chip to issue 06.
- [ ] Palette per TDD §9.6 without My Blocks (issue 07). Sound is hidden.
- [ ] Every change goes through `updateProject`. A drop that changes nothing adds no undo step.

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser (dev select → demo): drag a Hero into a Page, beside another Block (the line and the grey shadow show where), out onto the Canvas (it fades as a loose idea with "not built"), and back onto the palette (the palette turns pink and the Block is deleted). A Page will not go into a Hero. Values change in place; a 31-character text shows ⤢. Fold and unfold. Scroll pans, Ctrl+scroll zooms at the pointer, the zoom buttons work, panning stops with 40px still in view. Undo and Redo undo each of these.
