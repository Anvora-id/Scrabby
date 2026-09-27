<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Icons

**Phosphor** (D-Q10; MIT, no credit line needed). No emoji anywhere, except "💡 Bob picks" in a dropdown list: a native list option can't hold an icon ([Trait](#trait)). Research: `docs/research/icon-sets.md`.

- **Weights:** `fill` at small sizes (16px next to labels on stickers, Block headers, palette items and chips; 20px in tabs; 19–24px on the Build button). `duotone` at 40px, with its second layer painted in the category's `--c3` (in the SVG or React output, the second layer is the path with `opacity="0.2"`: set its fill to `var(--c3)` and opacity to 1). Outside a category, the second layer is `--idle`.
- **Color:** `currentColor`, which is `--ink` on Blocks and Traits and `--text` on the frame.
- **Spacing:** 6px before the label, nudged 3px down (`vertical-align: -3px`).
- **How to load:** `@phosphor-icons/react` (the app is React, W-8): `<GlobeIcon weight="fill" />`, the name in PascalCase plus `Icon`. Don't use the `@phosphor-icons/web` font: its duotone layers are CSS pseudo-elements and can't be recolored.
- The keys are ours (each Block and Trait type's definition names its key), and each maps to one Phosphor name. Every name below exists in `@phosphor-icons/core` 2.1.1.

| Key → Phosphor name | Key → Phosphor name | Key → Phosphor name |
|---|---|---|
| `site` → `globe` | `page` → `file-text` | `navbar` → `list` |
| `hero` → `flag-banner` | `section` → `rows` | `cardgrid` → `squares-four` |
| `card` → `cards` | `form` → `clipboard-text` | `popup` → `picture-in-picture` |
| `footer` → `square-half-bottom` | `text` → `text-t` | `image` → `image` |
| `button` → `cursor-click` | `box` → `square` | `custom` → `puzzle-piece` |
| `t_color` → `palette` | `t_font` → `text-aa` | `t_vibe` → `sparkle` |
| `t_size` → `arrows-out` | `t_position` → `push-pin` | `t_onclick` → `lightning` |
| `t_purpose` → `gear` | `t_fakedata` → `dice-five` | `t_text` → `pencil-simple-line` |
| `t_image` → `image-square` | `t_sound` → `speaker-high` (Stretch) | `t_video` → `video-camera` |
| `t_tellbob` → `chat-circle-dots` | `t_bobpicks` → `lightbulb` | `flag` → `flag` (the Build button) |
| `checkpoint` → `lock` (locked Pages; the Checkpoint Block uses `site`) | | |

Tab icons: Canvas `puzzle-piece`, Library `image`, Checkpoints `clock-counter-clockwise`. Menu bar and zoom icons: New Project `plus`, Demo `cake`, Download code `download-simple`, Undo `arrow-counter-clockwise`, Redo `arrow-clockwise`, Show me around `question`, zoom `plus` / `minus` / `equals`, fold `caret-down`, ticks `check`, Preview full size `arrows-out` / `arrows-in`. Always icons, never characters: ✓ → `check`, × and ✕ → `x`, ↻ → `arrow-clockwise`. Plain text characters: ⟨ ⟩ ‹ › ← ✎ + ◧ ⤢ ⤡ ▾ ● ⚠, and the "!" and "?" in alert circles. A button whose spec names no icon has none.
