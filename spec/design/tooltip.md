<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Tooltip

One short sentence about a Block or Trait type (PRD §11), shown when the pointer rests on it. It takes the place of an Assistant in Plan.

- **When:** after the pointer rests about 0.5s on a Block's header or a Trait sticker, in the palette or on the Canvas. It hides when the pointer leaves, a drag starts or a menu opens. Never during a drag, and only one at a time. It fades in over `--t-quick`.
- **Look:** `--surface`, 2px `--line`, radius 14px, `--shadow-menu`, padding 9px 12px, max-width 260px, with a 5px left edge in the item's `--c3`. First line: the type's icon ([Icons](#icons)) and name, weight 900 `--ink`. Second line: the sentence, `--text` `--fs` weight 600, line-height 1.4.
- **Place:** 8px below the item, left edges lined up. If there's no room below, it goes above. It always stays inside the window.
- **Text:** the type's tooltip sentence from PRD §11, kept in the type's definition, for example Hero: "The big first thing people see on a page: a headline, a picture, a button."
- **Checkpoint Block and locked Page:** titled "Checkpoint" and "Built page", with the `checkpoint` icon; the left edge is `--muted`, since they have no category.
- **Loose idea:** a third line, "Loose idea: Bob ignores it until you move it into {the Site / the Checkpoint}." (`--hint`, `--fs-sm`, italic). "the Site" becomes "the Checkpoint" once the Checkpoint Block is on the Canvas; the Page sentence swaps the same way (PRD §11).
