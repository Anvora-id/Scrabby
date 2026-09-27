<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Motion

**Springy toy** (D-Q19): things overshoot a little and settle, like a plastic piece that's just been set down. One moving thing at a time; nothing loops except the Build stage, spinners, the working Build chip and the greeting's toy Blocks. Durations and curves come from the motion tokens.

| Moment | Motion |
|---|---|
| Press (any button with a bottom edge, and a Block's header on pointer down) | Moves down by its own bottom-edge height (2–5px, as each component states) as the edge shrinks to 1px, over `--t-press`. On release it springs back over 250ms with `--spring`. |
| Hover (Blocks, palette items, Library tiles, the greeting's buttons) | Lifts 1px (palette items 2px) and the edge grows by the same amount, over `--t-quick`. |
| Drag start | The copy that follows the pointer scales to 1.03 (at most 8px bigger, for big Blocks) over `--t-quick`, with `--shadow-drag`. |
| Drop | Every dropped item, whatever its size, lands with the same small, quick squash: 2% wider and 3% shorter (at most 4px and 3px) for 40ms, then settles to 1 over `--t-quick` with `--ease`, no overshoot (190ms in all). Items that make room slide over `--t-quick` with `--ease`: when a Block's gap opens, moves or closes, when a dragged item lifts off, and after a drop. Reduced motion: no slides. |
| Let go where nothing takes it, or Esc during a drag | A new item's copy fades out and shrinks to 90% where it was let go, over `--t-quick` with `--ease`. A moved item's copy flies back to its spot over `--t-quick` with `--ease`; the item shows again when it arrives. Reduced motion: the new item's copy only fades, and a moved item is back at once. |
| Delete by dragging to the palette | The copy fades out and shrinks to 90% where it was let go, as above. |
| A modal opens | The backdrop fades in over `--t-quick`; the box pops in from `scale(.9)` and opacity 0 over `--t-pop` with `--spring`. Reduced motion: at once. |
| Preview full size opens | The backdrop fades in over `--t-quick`; the panel pops from 96% to full size over `--t-pop` with `--spring`. Closing is instant. Reduced motion: no pop. |
| A Trait is added | The sticker pops in: from `scale(.6)` to 1 over `--t-pop` with `--spring`. |
| Fold / unfold | Height animates over `--t-settle` with `--ease`; the chevron turns over `--t-quick`. |
| Step change | The new step's area fades in and rises 12px over 220ms with `--ease`. |
| Build chips | A chip that is done pops from `scale(.94)` to 1 over `--t-pop` with `--spring`. The working chip breathes in a 1.2s `--ease` loop (opacity .45 to .75, `scale(.96)` to 1). On a failed Build every chip goes back to dim at once. |
| Flash (jumped-to Block, changed page part) | A `--flash` ring that fades out, as each component says. |
| Bob | Hops only on the Build stage (loop) and once when a speech bubble or the greeting appears ([Brand and Bob](#brand-and-bob)). |
| Greeting leaves | The backdrop fades out while the card shrinks to `scale(.9)`, over `--t-pop` with `--ease`. |
| Greeting wordmark | A wave: each letter of "Scrabby" rises 10px and springs back (450ms, `--spring`), left to right, 60ms apart, like a worm moving through the word. Once just after Bob's hop, and again when the pointer enters the wordmark (a wave that is running finishes first). |
| Greeting toy Blocks | Each floats up and down 3px on its own slow loop (3.2–4.4s, ease-in-out, out of step). They never leave their place, but each turns in 3D (perspective 200px) so its face points at the pointer, wherever it is on the page: up to 12°, full once the pointer is 400px away. The turn follows on a smooth spring and holds while the pointer rests. When the pointer leaves the window they spring back flat with an elastic wobble. |

**Reduced motion** (`prefers-reduced-motion: reduce`): no transforms or loops (no greeting wave, float or tilt), except the Assistant's thinking dots, which fade in turn (opacity only). Presses, drops, pops and step changes happen at once. Flashes still fade (opacity only). The Build stage shows the full pile of bricks standing still and Bob standing still. The working Build chip holds at opacity .6.
