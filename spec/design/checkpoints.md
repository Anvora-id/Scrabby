<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Checkpoints

The third tab in Plan ([Shell](#shell)), after Canvas and Library (ADR 0005). A Checkpoint is the code and the whole Canvas at one moment. Every Build saves one before Bob starts, and **Save Checkpoint** saves one by hand. The list only grows.

- **Header:** like the [Library](#library)'s: "Checkpoints" with the hint "Saved versions of your Blocks and code. Every Build saves one first." on the left, **Save Checkpoint** (the Upload button's look) on the right. Save Checkpoint is at 50% opacity and not clickable while the Project matches a Checkpoint (title "Nothing new to save.") or a Build runs.
- **Panel:** `--surface`, padding 14px, entries stacked with gap 10px, newest first. Empty: centered in the panel, Bob's head (48px, white, 2px `--line` ring) above "No Checkpoints yet. Save one, or Build, and it shows up here." (`--hint`, `--fs-md`, weight 700), like the empty chat ([Assistant](#assistant)).
- **Entry:** `--surface`, 2px `--line` border, a 3px `--line` bottom edge, radius `--r-panel`, padding 12px 14px, `--ink`.
  1. **Title row** (gap 8px, baseline): "Checkpoint N" (`--fs-lg` weight 900), or "Checkpoint N · Menu page" once named; right after it a 24px rename button (14px pencil, `--hint`, radius 8px, `--soft` fill and `--ink` on hover); then the time (`--fs`, `--hint`) and tags. Renaming puts a field after "Checkpoint N" (`--fs-md` weight 800, `--ink`, 2px `--line` border, radius 8px, padding 1px 6px, 24ch wide, up to 40 characters): Enter saves, Escape or clicking away cancels, an empty name removes it. A Checkpoint's name shows wherever that Checkpoint is named: its tags, the "Saved before restoring" gists, the Checkpoint warning, the chat lines, the Checkpoint Block and the Preview bar.
  2. **Gist** (4px above, 8px below, `--fs`): "Before Build: the whole site." for a Build from the Site; "Before Build: adds Footer, Contact form." (the names of the Blocks that Build asked for) for a later Build; "Saved by you." or "Saved before restoring Checkpoint N." (with that Checkpoint's name when it has one) for a saved one.
  3. **Buttons** (ghost, [Buttons](#buttons), gap 6px): **Restore**, which opens the Checkpoint warning ([Menus](#menus)); at 50% opacity while a Build runs.
- **Tags:** `--fs-sm` weight 800, radius `--r-pill`, padding 1px 8px, `--soft` fill, `--ink`:
  - "from Checkpoint N", on a Checkpoint saved after an older one was restored;
  - "you are here", on the current entry, in `--brand` with white text. It reads "you are here + changes" while the code or the Canvas has changed since that Checkpoint.
- **Current entry:** 2px `--brand` border and bottom edge, plus a 3px ring of `--brand` at 25% (`box-shadow: 0 3px 0 var(--brand), 0 0 0 3px color-mix(in srgb, var(--brand) 25%, transparent)`).
- **From a Block chip** ([Code editor](#code-editor)): the entry of the Build that made that code opens and shows that Build's Blocks, read-only, in their Folded look ([Block](#block)), with the chip's Block flashing. Its "See its code" button works there.
