<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Motion

**Springy toy** (D-Q19): things overshoot a little and settle, like a plastic piece that's just been set down. One moving thing at a time; nothing loops except the Build stage, spinners and the working Build chip. Durations and curves come from the motion tokens.

| Moment | Motion |
|---|---|
| Press (any button with a bottom edge, and a Block's header on pointer down) | Moves down by its own bottom-edge height (2–5px, as each component states) as the edge shrinks to 1px, over `--t-press`. On release it springs back over 250ms with `--spring`. |
| Hover (Blocks, palette items, Library tiles) | Lifts 1px (palette items 2px) and the edge grows by the same amount, over `--t-quick`. |
| Drag start | The copy that follows the pointer scales to 1.03 over `--t-quick`, with `--shadow-drag`. |
| Drop | The dropped item lands with a small, quick squash: `scale(1.02, .97)` for 40ms, then settles to 1 over `--t-quick` with `--ease`, no overshoot (190ms in all). Items that make room slide over `--t-pop` with `--spring`. |
| Let go where nothing takes it, or Esc during a drag | A new item's copy fades out and shrinks to 90% where it was let go, over `--t-quick` with `--ease`. A moved item's copy flies back to its spot over `--t-quick` with `--ease`; the item shows again when it arrives. Reduced motion: the new item's copy only fades, and a moved item is back at once. |
| Delete by dragging to the palette | The copy fades out and shrinks to 90% where it was let go, as above. |
| Preview full size opens | The backdrop fades in over `--t-quick`; the panel pops from 96% to full size over `--t-pop` with `--spring`. Closing is instant. Reduced motion: no pop. |
| A Trait is added | The sticker pops in: from `scale(.6)` to 1 over `--t-pop` with `--spring`. |
| Fold / unfold | Height animates over `--t-settle` with `--ease`; the chevron turns over `--t-quick`. |
| Step change | The new step's area fades in and rises 12px over 220ms with `--ease`. |
| Build chips | A chip that is done pops from `scale(.94)` to 1 over `--t-pop` with `--spring`. The working chip breathes in a 1.2s `--ease` loop (opacity .45 to .75, `scale(.96)` to 1). On a failed Build every chip goes back to dim at once. |
| Flash (jumped-to Block, changed page part) | A `--flash` ring that fades out, as each component says. |
| Bob | Hops only on the Build stage (loop) and once when a speech bubble or the greeting appears ([Brand and Bob](#brand-and-bob)). |
| Greeting leaves | The backdrop fades out while the card shrinks to `scale(.9)`, over `--t-pop` with `--ease`. |

**Reduced motion** (`prefers-reduced-motion: reduce`): no transforms or loops. Presses, drops, pops and step changes happen at once. Flashes still fade (opacity only). The Build stage shows the finished stack standing still and Bob standing still. The working Build chip holds at opacity .6.
