<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Checkpoints

The third tab in Plan ([Shell](#shell)), after Canvas and Library (ADR 0005). Every Build saves a Checkpoint: the code, and the Blocks that made it. The list only grows. Loading a Checkpoint never changes the Library.

- **Panel:** `--surface`, padding 14px, entries stacked with gap 10px, newest first. Empty: centered in the panel, Bob's head (48px, white, 2px `--line` ring) above "No Checkpoints yet. Every Build saves one here." (`--hint`, `--fs-md`, weight 700), like the empty chat ([Assistant](#assistant)).
- **Entry:** `--surface`, 2px `--line` border, a 3px `--line` bottom edge, radius `--r-panel`, padding 12px 14px, `--ink`.
  1. **Title row** (gap 8px, baseline): "Checkpoint N" (`--fs-lg` weight 900), or "Checkpoint N · Menu page" once named; right after it a 24px rename button (14px pencil, `--hint`, radius 8px, `--soft` fill and `--ink` on hover); then the time (`--fs`, `--hint`) and tags. Renaming puts a field after "Checkpoint N" (`--fs-md` weight 800, `--ink`, 2px `--line` border, radius 8px, padding 1px 6px, 24ch wide, up to 40 characters): Enter saves, Escape or clicking away cancels, an empty name removes it. A Checkpoint's name shows wherever that Checkpoint is named: its tags, the "Before loading" gists, the Checkpoint warning, the chat lines, the Checkpoint Block and the Preview bar.
  2. **Gist** (4px above, 8px below, `--fs`): "Built the site: N pages." for a first Build or a remake; "Added: Footer, Contact form." (its request Blocks' names) for a later Build; "Before loading Checkpoint N: your code with its hand edits." (with that Checkpoint's name when it has one) for a saved one.
  3. **Buttons** (ghost, [Buttons](#buttons), gap 6px): **Go back to this**, then **Edit its Blocks**. A "Before loading" Checkpoint has only Go back to this. Both open the Checkpoint warning ([Menus](#menus)).
- **Tags:** `--fs-sm` weight 800, radius `--r-pill`, padding 1px 8px, `--soft` fill, `--ink`:
  - "from Checkpoint N" or "remade from scratch", on a Build made after an older Checkpoint was loaded;
  - "saved for you", on a "Before loading Checkpoint N" entry, in `--note-bg`;
  - "you are here", on the current entry, in `--brand` with white text. It reads "you are here + hand edits" while the code has changed since that Checkpoint.
- **Current entry:** 2px `--brand` border and bottom edge, plus a 3px ring of `--brand` at 25% (`box-shadow: 0 3px 0 var(--brand), 0 0 0 3px color-mix(in srgb, var(--brand) 25%, transparent)`).
- **From a Block chip** ([Code editor](#code-editor)): the entry of the Build that made that code opens and shows that Build's Blocks, read-only, in their Folded look ([Block](#block)), with the chip's Block flashing. Its "See its code" button works there.
