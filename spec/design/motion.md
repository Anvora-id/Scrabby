<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Motion

**Springy toy** (D-Q19): things overshoot a little and settle, like a plastic piece that's just been set down. One moving thing at a time; nothing loops except the Build stage, spinners and the working Build chip. Durations and curves come from the motion tokens.

| Moment | Motion |
|---|---|
| Press (any button with a bottom edge, and a Block's header on pointer down) | Moves down by its own bottom-edge height (2–5px, as each component states) as the edge shrinks to 1px, over `--t-press`. On release it springs back over 250ms with `--spring`. |
| Hover (Blocks, palette items, Library tiles) | Lifts 1px (palette items 2px) and the edge grows by the same amount, over `--t-quick`. |
| Drag start | The copy that follows the pointer scales to 1.03 over `--t-quick`, with `--shadow-drag`. |
| Drop | The dropped item lands with a squash: `scale(1.04, .94)` for 90ms, then settles to 1 over `--t-pop` with `--spring`. Items that make room slide over `--t-pop` with `--spring`. |
| A Trait is added | The sticker pops in: from `scale(.6)` to 1 over `--t-pop` with `--spring`. |
| Fold / unfold | Height animates over `--t-settle` with `--ease`; the chevron turns over `--t-quick`. |
| Step change | The new step's area fades in and rises 12px over 220ms with `--ease`. |
| Build chips | A chip that is done pops from `scale(.94)` to 1 over `--t-pop` with `--spring`. The working chip breathes in a 1.2s `--ease` loop (opacity .45 to .75, `scale(.96)` to 1). On a failed Build every chip goes back to dim at once. |
| Flash (jumped-to Block, changed page part) | A `--flash` ring that fades out, as each component says. |
| Bob | Hops only on the Build stage (loop) and once when a speech bubble appears ([Brand and Bob](#brand-and-bob)). |

**Reduced motion** (`prefers-reduced-motion: reduce`): no transforms or loops. Presses, drops, pops and step changes happen at once. Flashes still fade (opacity only). The Build stage shows the finished stack standing still and Bob standing still. The working Build chip holds at opacity .6.
