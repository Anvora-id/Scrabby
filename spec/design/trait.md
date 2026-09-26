<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Trait

A sticker stuck onto the Block it describes. Uses its category's `--c1`–`--c3`.

**Sticker:** `--c1` fill, a 2.5px white border (the die-cut edge), then a 1.5px `--c3` ring and a 3px `--c3` bottom edge (`box-shadow: 0 0 0 1.5px var(--c3), 0 3px 0 1.5px var(--c3)`), radius `--r-pill`, padding 3px 4px 3px 10px, min-height 32px, gap 6px, weight 900, no wrap. Content: icon ([Icons](#icons)) and label, then the value field, then an optional Note field ([Note](#note)), then an optional marker (`✎` or `+`, see [Block](#block)), then a Warning badge if it has one ([Warnings](#warnings)).

**Straight** (D-Q23): stickers never tilt. Only Notes sit crooked ([Note](#note)).

**Value fields.** Values are edited in place, never in a side form.

| Kind | Look | Used by |
|---|---|---|
| Text | White pill, no border, an inner top shade (`inset 0 2px 0 #0000000f`), radius `--r-pill`, padding 3px 10px, weight 800. Width = characters + 1, from 3 to 34. Enter commits. | text, fake data, tell Bob, let Bob pick |
| Long text | Past 30 characters a `⤢` button appears. It opens a 280px textarea (radius 12px, wraps, grows with content); `⤡` shrinks it back. The sticker's radius becomes 18px. | same |
| Dropdown | `--c2` fill, no border, an inner bottom shade (`inset 0 -2px 0 #00000014`), weight 900, radius `--r-pill`, padding 3px 24px 3px 10px, an `--ink` triangle caret 9px from the right. The last two options are always "💡 Bob picks" (below) and "custom…", which swaps in a text field and a `▾` button back to the list. | font, vibe, size, position, on click, purpose, image, video |
| Color | A 20px round swatch (2.5px white border, 1.5px `--c3` ring), then the color's name ("orange") in a text-style pill, or its hex for a custom color. Clicking opens the color menu (below). | color |

**Dropdown sources.** "on click" starts with "pick one", then "go to page › Shop" for each Page Block inside the Site Block or the Checkpoint Block (locked Pages too), never loose Pages, since those aren't built; then "open popup › Sign up" for each Popup on the same page; then its actions (PRD §11). If the Page or Popup it points to was deleted, it shows "go to missing page" or "open missing popup" with `--alert-bg` fill and a 1.5px `--alert` border, the tooltip "What this pointed to was deleted. Pick another one.", and a Warning ([Warnings](#warnings)). Image lists the Library's images and video the Library's videos (empty: "pick from Library"). The sound Trait and "plays a sound" are Stretch (PRD §6): leave them out of the palette and the list until sound ships.

**Color menu** (PRD §11): the title "Colors" (weight 900), then two rows of six 26px round swatches (2.5px white border, 1.5px `#0003` ring; the chosen one gets a 2.5px `--ink` ring; each swatch's tooltip is its name), then "Any color" with a 44×26px color input. It opens under the swatch, styled like the context menu ([Menus](#menus)). Bob receives a preset as its name and hex (`mint (#A8E6CF)`) and any other color as its hex. These are the website's colors, not Scrabby's. The 12 presets (ticket 22; the default is in PRD §11):

| coral | pink | orange | sunny yellow | lime | mint |
|---|---|---|---|---|---|
| `#FF8A80` | `#F8BBD0` | `#FFB74D` | `#FFE066` | `#C5E1A5` | `#A8E6CF` |
| **sky blue** | **navy** | **lavender** | **brown** | **black** | **white** |
| `#81D4FA` | `#1E3A5F` | `#C5B3F6` | `#8D6E63` | `#111111` | `#FFFFFF` |

An empty "let Bob pick" reads "anything". Placeholders: tell Bob "like make it feel cozy", let Bob pick "like the colors".

**Bob picks** (ticket 27): the user hands one Trait's value to Bob. It is not on "tell Bob" or "let Bob pick".
- **In a dropdown:** "💡 Bob picks" is the option just before "custom…".
- **Bulb button:** a color Trait, and a text or fake data Trait while its field is empty, shows a round button after the value, in the Talk to Bob colors (`.cat-bob`): a 24px circle, `--surface` fill, 2px `--c3` border, a 2px `--c3` bottom edge, a 14px `t_bobpicks` icon in `--ink`. Hover: `--c4` fill. Tooltip: "Let Bob pick this value". One click hands the value to Bob.
- **Set:** the value turns into a sticker-style chip in the Talk to Bob colors: `--c1` fill, 2px white border, a 1.5px `--c3` ring, radius `--r-pill`, padding 3px 4px 3px 9px, gap 5px, weight 900 `--ink`: the 14px `t_bobpicks` icon, "Bob picks", then an 18px round `x` button (no border, `#0000001a` fill; tooltip "Pick it myself"). The `x` takes the value back: the app kept the old value, so it restores it.
- **Hint field,** right after the chip: a text-style pill (white, an inner top shade `inset 0 2px 0 #0000000f`, radius `--r-pill`, padding 3px 10px, weight 600 `--text`), placeholder "hint, like something warm". Width = characters + 1, from 14 to 30. It is the Trait's Note, so the Note field doesn't show beside it; it stays as the Note after `x`. It gets focus when the value is handed over. It may stay empty.
- A Trait set to "Bob picks" gets no Warning ([Warnings](#warnings)).

**Menu:** Add Note / Delete Note · Duplicate · Delete Trait. Stretch, with Custom Blocks: Use the Custom Block's version.
