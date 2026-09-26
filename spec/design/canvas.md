<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Canvas

The dotted paper. It sits right of the [Palette](#palette).

- Dotted paper (D-Q26): `--ws` background with the `--ws-dot` dots (`radial-gradient(var(--ws-dot) 1.6px, transparent 1.8px)`, 24px apart). Cursor: grab over empty space, grabbing while panning.
- **Pan:** drag empty space, or hold the middle button anywhere; scroll also pans. Panning stops when only a corner of the Blocks is still in view (40px).
- **Zoom:** Ctrl + scroll or pinch, at the pointer, from 30% to 200%. Zoom buttons stacked at the bottom right: +, −, = with 8px between them. Each is a 42px circle, `--surface`, 2px `--line` border, a 3px `--line` bottom edge, with an 18px `--text` icon ([Icons](#icons)). ×1.25 per click; = resets to 100%. In Plan the big Build button takes the corner (20px in from the right, 22px from the bottom), and the zoom buttons stack 14px above it, right edges lined up (D-Q8).
- **Dragging:** the app's own pointer code, not the browser's drag-and-drop. A drag starts after 4px of movement. Closest-edge drop: the middle of a Block drops into it, near an edge drops beside, above or below it. How things move: [Motion](#motion).
- **Drop indicator:** a 4px `--drop` line, radius 3px, a 2px white halo, at the closest edge. A `--drop-gap` placeholder the size of the dragged item (radius `--r-block`, or `--r-pill` for stickers) opens where it will land. Nothing else moves during a drag. Where nothing can take the item (for example a Page over a Hero, or anywhere outside the definition in a Custom Block's edit view), no indicator shows, and on release (or on Esc during any drag) a new item's copy fades away where it was let go, while a moved item's copy flies back to its spot ([Motion](#motion)). Dropping an item back on its own spot changes nothing and adds no undo step.
- **Empty hint** (PRD §9): while the Site Block holds no Page Block, its inside grows to 120px and shows, centered, "Drag a Page into your Site to start." (`--hint`, `--fs-md`, weight 700, italic). It disappears once a Page is inside.
- **Demo button** (PRD-43), shown under the same condition: 24px below the Site Block, left edges lined up, moving with the Canvas. A big primary button: `--brand` fill, white weight-900 16px, radius `--r-btn`, padding 12px 24px, a 4px `--brand-dark` bottom edge, "Try the demo: Maya's bake sale". It loads the demo Project (warning first only if the current Project isn't empty, [Menus](#menus)). The menu bar's **Demo** button does the same ([Shell](#shell)).
- **After a Build:** the Build's Blocks leave the Canvas. It holds the Checkpoint Block in the Site Block's place, plus any loose ideas ([Block](#block), ADR 0005).
- **Warnings:** marks on Blocks and Traits, and a stepper at the top right: [Warnings](#warnings).
- **Custom Block edit view** (Stretch, PRD §6): the Canvas shows only the definition, with the edit bar ([Menus](#menus)) across the top.
