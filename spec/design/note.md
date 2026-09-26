<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Note

Free text for Bob on a Block or a Trait. Added and removed with right-click → Add Note / Delete Note.

- **On a Block:** a sticky note under the header, with no tape (D-Q27). `--note-bg` fill, no border, radius 2px 2px 10px 2px (a curled corner), 190px wide, padding 14px 12px 10px, weight 700 `--fs` `--note-text`, line-height 1.35, tilted −1.6° (the only tilted thing in the app, D-Q23), shadow `0 4px 8px #0000001f`. Inside: a borderless, vertically resizable textarea (placeholder "Note for Bob"). A `×` button at the top right in `--note-text` at 60% opacity.
- **On a Trait:** a small field inside the sticker, straight. `--note-bg` fill, 1.5px `--note-edge` border, radius `--r-pill`, padding 3px 9px, weight 700 `--note-text` (placeholder "note for Bob"). Width = characters + 1, from 8 to 30.
