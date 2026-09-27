<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Block

A C-shaped toy piece. Uses its category's `--c1`–`--c4`.

**Anatomy**, top to bottom:
1. **Frame:** `--c1` fill, 2px `--c3` border, radius `--r-block`, a `--edge` bottom edge in `--c3` (`box-shadow: 0 4px 0 var(--c3)`), padding 6px 10px 12px, gap 7px, min-width 170px, `--ink` text. Width fits the content. No manual resize.
2. **Header** (one line, gap 7px, weight 900 `--fs-md`, no wrap): fold button · type icon ([Icons](#icons)) and type label (`--w-bold` 13px, opacity .72) · name field (a white pill: radius `--r-pill`, padding 3px 11px, weight 900, an inner top shade `inset 0 2px 0 #0000000f`) · the Edit or Color button, if any · markers. There is no ⋯ button: the Block menu opens on right-click only (D-Q9). The only visible edit buttons are Edit on an Instance and Color on a Custom Block definition.
3. **Note** (optional): see [Note](#note).
4. **Trait row:** stickers ([Trait](#trait)), wrapping, gap `--gap-pill`, max-width 560px.
5. **Inside:** a recessed slot. `--c4` fill, radius `--r-inside`, padding 9px, gap `--gap`, an inner top shade (`inset 0 3px 0 #00000012`), min-width 150px. Child Blocks lay out as a split-pane tree of rows and columns. Empty: a thin mouth, 12px tall and 60px wide.

**States**

| State | Look |
|---|---|
| Open | As above. The fold chevron points down. |
| Folded | The header, then small chips that wrap (`--c4`, radius 8px, `--w-bold` `--fs-sm`, padding 3px 8px, max-width 360px, gap 5px): icon and label per Trait, icon and name per child Block, or "empty". Blocks 4 levels deep start folded. The chevron points right. |
| Hover | Lifts 1px ([Motion](#motion)). |
| Instance (Stretch, PRD §6) | In its Custom Block's own color. Its 2px `--c3` border is dashed (the bottom edge stays). The header shows the puzzle icon, the Custom Block's name as the type label, then the Instance's own name (new Instances get "Product card 2", "Product card 3"…; renaming the Custom Block doesn't rename them), then an **Edit** pill button. Opens like any Block, but shows only what differs from its Custom Block: parts added here and parts changed here. Above them sits a toggle strip (see below). |
| Custom Block definition (Stretch, PRD §6) | Only in the edit view. 5px `--def-ring` ring (box-shadow, outside the bottom edge). Its type label reads "Custom Block", and a **Color** button opens the Custom Block color menu ([Menus](#menus)). |
| Loose idea (outside the Site Block) | Opacity .85 and saturation .75, both back to full on hover. A "not built" badge at the end of the header (`--surface`, 2px dashed `--c3`, radius `--r-pill`, `--w-bold` `--fs-xs`, padding 1px 8px). Its tooltip adds the loose-idea line ([Tooltip](#tooltip)). A loose Trait gets the same opacity and saturation, but no badge. |
| Drop target | 3px `--drop-over` outline, offset 2px, and it lifts 2px. |
| Being dragged | It leaves its place and the gap closes ([Motion](#motion)). A copy follows the pointer, scaled 1.03, with `--shadow-drag`. |
| Selected (a click without a drag) | 3px `--brand` outline, offset 3px. A "</> See its code" button sits on its top-right corner (top −14px, right −6px): `--ink` fill, white weight-800 12px, radius `--r-pill`, padding 5px 12px, a 3px bottom edge of `#000`. It opens that Block's code ([Screen layout](#screen-layout)), so it shows only on a Block that has code: a locked Page, or a Block in the [Checkpoints](#checkpoints) list. Clicking the Block again or empty Canvas unselects it. |
| Site Block | A bounded box around the pages, drawn like the Checkpoint Block so it doesn't read as one more Block: `--idle` fill, 2px dashed `--muted` border, radius `--r-block`, the frame's padding, no bottom edge, no separate inside fill. Header as usual: the `site` icon, "Site", the name field. It moves around the Canvas but can't go inside a Block or be deleted. |
| Checkpoint Block (after a Build, ADR 0005) | Stands for the built site, in the Site Block's place. It isn't in a category: `--idle` fill, 2px dashed `--muted` border, radius `--r-block`, the frame's padding, no bottom edge, no separate inside fill. Header as on the Site Block: the `site` icon, "Site (Checkpoint N)", or "Site (Checkpoint N · <name>)" once named, then the name field (the Project name). It holds the locked Pages, three to a row, then any new Page Blocks. It moves around the Canvas like the Site Block, but can't be folded or deleted. |
| Locked Page | A page that is already built, one per `.html` file. `--surface` fill, 2px dashed `--muted` border, radius `--r-block`, no bottom edge. Header: the `checkpoint` icon, "Page "Shop"" (weight 900), then its file name (`--fs-sm`, `--hint`, weight 600, for example "shop.html"). Empty: "drop Blocks or Traits here" (`--hint`, italic). It can be dragged to reorder it inside the Checkpoint Block, but never out of it, and it can't be deleted. New Blocks and Traits dropped into it ask for changes to that page; a Trait dropped on the Checkpoint Block asks for a change to the whole site. There are no locked Blocks deeper than a page. |
| With a Warning | A 3px `--alert` ring (box-shadow, outside the bottom edge) and a badge at the end of the header: [Warnings](#warnings). |
| Flashing (jumped to from a Block chip) | A 6px `--flash` ring (box-shadow) that fades out over 1.4s. |

**Instance toggle strip** (Stretch, PRD §6): the first line inside an open Instance. A button styled like a folded chip (`--c4` fill, 2px `--c3` border, radius 8px, `--fs-sm`, hover `--ink` border). It reads "N Traits from Product card · ✎ N changed · show all", which shows every part. Then it reads "Hide what comes from Product card", which goes back to only the differences. Dropped items land at the end of the Instance.

**Header buttons.** Fold: a 24px circle, `--surface` fill, 2px `--c3` border, a 2px `--c3` bottom edge, holding a 12px `caret-down` icon that turns −90° when folded ([Motion](#motion)). Color: 24px tall, padding 0 10px, radius `--r-pill`, same style. Hover on both: `--c4` fill, `--ink` border. Edit: a pill with `--c4` fill, 2px `--c3` border and a 2px `--c3` bottom edge, weight 800, padding 3px 11px.

**Markers** (pill, `--surface`, 2px `--c3`, `--w-bold` `--fs-xs`, padding 1px 7px): `✎ changed here` on a part inside an Instance whose value, name or Note was changed (the Instance's own name is always its own, so it never counts); `+ only here` on a part added only to that Instance.

**Menu** (right-click, see [Menus](#menus)): Add Note / Delete Note · Duplicate · Delete Block. Stretch (PRD §6), with Custom Blocks: Edit Custom Block · Change color… · Bring back removed parts (N) · Use the Custom Block's version · Make Custom Block. Each item appears only when it applies.
