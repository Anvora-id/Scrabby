# DESIGN.md: Scrabby look and screen layout

**How to use this file.** A UI task reads [Tokens](#tokens) plus the one component section it builds. Each component section stands alone and uses only token names from Tokens, plus any local colors it defines itself. Headings are stable: link to them by name.
Build from these values; don't restyle. Codes such as D-Q7, W-16, PRD-22 or "ticket 02" point at decisions recorded in the planning repo; this file already states what they decided. Vocabulary follows `CONTEXT.md` (Block, not node; Trait, not property). Framework-neutral: tokens are CSS custom properties, components are anatomy plus states.
Sources: the look and the screen layout were settled on clickable mockups in the planning repo (`spbob_prototype`), which are not part of the build; every value they settled is written here. Scratch 3's exact values come from [`docs/research/scratch-look.md`](docs/research/scratch-look.md). Look in one line: **Scratch 3, copied** (layout, menu bar, grays, tabs, green flag, orange alerts), for nostalgia. The Blocks and Traits are pastels in Scratch's own category hues, with dark text (D-Q12): our Blocks are big boxes that hold other Blocks, and full-strength colors on them were too loud.
**Never** use the word "Scratch", its logo, the Scratch Cat or Scratch's icon files anywhere in the product. Copying values and layout is fine; the icons come from our own icon set ([Icons](#icons)).

## Tokens

Paste as-is.

```css
:root {
  /* text */
  --text: #575E75;         /* body text on chrome and white */
  --ink: #2F3446;          /* text on pastel Blocks and Traits */
  --hint: #8A8FA3;         /* hints under headings */
  --muted: #9A9FB0;        /* "empty" labels */
  --placeholder: #B3B7C4;  /* placeholders: italic, normal weight, so a hint never looks typed */
  /* surfaces (Scratch 3's own values) */
  --surface: #FFFFFF;      /* panels, menus, text fields, the selected tab */
  --ws: #F9F9F9;           /* Canvas and palette (Scratch's workspace and flyout) */
  --ws-dot: #DDDDDD;       /* Canvas dot grid: 2px dots every 27px at 100%, moving and scaling with pan and zoom */
  --ui2: #E5F0FF;          /* page background behind panels; help box (Scratch ui-primary) */
  --ui3: #D9E3F2;          /* unselected tabs; step circles not reached yet (Scratch ui-tertiary) */
  --line: #00000026;       /* every 1px border of panels, tabs, buttons and fields (Scratch: black at 15%) */
  --accent: #4C97FF;       /* menu bar, selected tab text: Scratch 3's blue, 2019–2023 (D-Q13) */
  --accent-strong: #3373CC;  /* fill of buttons with small white labels, focus ring (Scratch's darker blue) */
  --cat-active: #E9EEF2;   /* selected category in the category column */
  --cat-hover: #4C97FF;    /* hovered category label (blue in both Scratch eras) */
  --bar: #FBFCFD;          /* panel title bars, Bob's composer */
  --bar2: #F4F5F8;         /* the Preview's address bar, a diff card's file row */
  /* Build: Scratch's green flag */
  --go: #45993D;           /* Build button fill; ticks, spinner and Accept outlines. White text on it only at 19px bold or larger */
  --go-dark: #389438;      /* the Build button's 2px bottom edge */
  --flag: #4CBF56;         /* the flag icon's green where it sits on white or on the dark code editor */
  /* alerts: Scratch shows errors in orange, not red */
  --alert: #FF8C1A;        /* borders and top bars of errors and warnings; the ring of a Warning mark */
  --alert-dark: #DB6E00;   /* "!" icons and marks */
  --alert-bg: #FFF0DF;     /* fill of error bars, warning boxes, and a dropdown whose target is gone */
  --flash: #FFF200;        /* ring on a Block jumped to from a Block chip (Scratch's running-script glow) */
  /* drag and drop */
  --drop: #3388FF;         /* drop-indicator line */
  --drop-over: #8ABBFF;    /* outline on the Block that will take a drop (Scratch's drop highlight) */
  --drop-gap: #00000033;   /* grey placeholder where the dragged item will land (Scratch's insertion marker, black at 20%) */
  --trash: #FAEBEB;        /* palette background while a drag would delete */
  /* states */
  --note-bg: #FEF49C;  --note-border: #BCA903;  --note-x: #8A7A00;    /* Notes (Scratch's comment colors) */
  --edit-bar: #E3A0B1;     /* bar across the Custom Block edit view (stretch) */
  --def-ring: #F5D6DE;     /* 5px ring around a Custom Block definition (stretch) */
  /* type */
  --font: "Helvetica Neue", Helvetica, Arial, sans-serif;   /* Scratch's stack */
  --font-mono: ui-monospace, monospace;
  --fs: 12px;              /* base; the menu bar, Block headers, pills, tabs and buttons are this size in bold */
  --fs-xs: 10px;           /* markers: ✎ changed, + only here, not built */
  --fs-sm: 11px;           /* hints, folded chips; category labels use 10.4px */
  --fs-md: 13px;           /* context menu, edit bar */
  --fs-lg: 14px;           /* section headings */
  --fs-xl: 20px;           /* product name in the menu bar */
  /* shape */
  --r-panel: 8px;  --r-inside: 6px;  --r-btn: 4px;  --r-tab: 16px;  --r-pill: 999px;  --r-note: 4px;
  --gap: 8px;              /* between panels and between child Blocks */
  --gap-pill: 4px;         /* between Trait pills */
  --menubar-h: 48px;
  --focus: 0 0 0 4px color-mix(in srgb, var(--accent-strong) 35%, transparent);  /* focus ring on fields and buttons (Scratch) */
  --shadow-menu: 0 4px 12px #0003;        /* context menus */
  --shadow-drag: drop-shadow(0 6px 10px #0004);  /* the dragged copy, with opacity .95 */
}

/* Category colors. c1 frame and pill fill, c2 dropdown fill, c3 border, c4 inside of a Block (never white). */
.cat-site     { --c1: #FABCA8; --c2: #F2A288; --c3: #D88164; --c4: #FFF0EB; }  /* Site Block */
.cat-pages    { --c1: #FAE7A8; --c2: #F2D988; --c3: #D8BD64; --c4: #FFFAEB; }  /* Page Block */
.cat-ui       { --c1: #A8CAFA; --c2: #88B4F2; --c3: #6494D8; --c4: #EBF3FF; }  /* Navbar Hero Section Card grid Card Form Popup Footer */
.cat-prim     { --c1: #A8EFFA; --c2: #88E4F2; --c3: #64C9D8; --c4: #EBFCFF; }  /* Textbox Frame Button Panel */
.cat-design   { --c1: #C6A8FA; --c2: #AF88F2; --c3: #8F64D8; --c4: #F2EBFF; }  /* color font vibe size position */
.cat-behavior { --c1: #FAD1A8; --c2: #F2BD88; --c3: #D89E64; --c4: #FFF5EB; }  /* on click, purpose, fake data */
.cat-content  { --c1: #FAA8F4; --c2: #F288E9; --c3: #D864CF; --c4: #FFEBFD; }  /* text image sound video */
.cat-bob      { --c1: #A8FAAF; --c2: #88F291; --c3: #64D86E; --c4: #EBFFEC; }  /* tell Bob, let Bob pick */
.cat-my       { --c1: #FAA8BC; --c2: #F288A2; --c3: #D86481; --c4: #FFEBF0; }  /* Custom Blocks and Instances */
```

The category colors all follow one formula for hue `h`: `c1 hsl(h 90% 82%)`, `c2 hsl(h 80% 74%)`, `c3 hsl(h 60% 62%)`, `c4 hsl(h 100% 96%)`. Hues: Site 15, Pages 46, UI 215, Primitives 188, Design 262, Behavior 30, Content 305, Talk to Bob 125, My Blocks 345. Each is the hue of a Scratch category, so the palette feels familiar: Site ≈ Lists, Pages ≈ Events, UI ≈ Motion, Primitives ≈ Sensing, Design ≈ Looks, Behavior ≈ Variables, Content ≈ Sound, Talk to Bob ≈ Operators, My Blocks ≈ My Blocks.

**Custom Block color** (Stretch, PRD §6; editor-only, not the website's colors). Each new Custom Block gets its own color: the first preset hue no other Custom Block uses (presets: hues 345, 15, 40, 90, 140, 180, 205, 235, 275, 310 at `s 90% l 82%`). Once all ten are taken, it gets the hue farthest from those in use, at `s 85% l 80%`. The user can change it to another preset or any color. From the chosen `hsl(h s l)`, set `--c1 (s, l)`, `--c2 (s, l−8)`, `--c3 (s−20, l−22)`, `--c4 (s, 96)` on that Block. If `l < 55`, only its header text turns white. Pills, Notes and markers inside keep `--ink`.

## Icons

**Phosphor** (D-Q10; MIT, no credit line needed). No emoji anywhere, except "💡 Bob picks" in a dropdown list: a native list option can't hold an icon ([Trait](#trait)). Research: `docs/research/icon-sets.md`.

- **Weights:** `fill` at small sizes (14px next to labels on pills, Block headers, palette items and chips; 22px in tabs; 18–22px on the Build button). `duotone` at 40px, with its second layer painted in the category's `--c3` (in the SVG or React output, the second layer is the path with `opacity="0.2"`: set its fill to `var(--c3)` and opacity to 1). Outside a category, the second layer is `--ui3`.
- **Color:** `currentColor`, which is `--ink` on Blocks and Traits and `--text` on the frame.
- **Spacing:** 4px before the label, nudged 2px down.
- **How to load:** `@phosphor-icons/react` (the app is React, W-8): `<GlobeIcon weight="fill" />`, the name in PascalCase plus `Icon`. Don't use the `@phosphor-icons/web` font: its duotone layers are CSS pseudo-elements and can't be recolored.
- The keys are ours (each Block and Trait type's definition names its key), and each maps to one Phosphor name. Every name below was checked against `@phosphor-icons/core` 2.1.1 by the research, except `flag`, `gear` and `lock`: check them there before use.

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
| `checkpoint` → `lock` (the Checkpoint Block and locked Pages) | | |

Small UI marks (↶ ↷ ↻ ⟨ ⟩ ✓ ! ? ✎ + ◧ ‹ › × ⚠) stay plain text characters.

## Shell

The frame around everything. Where each surface sits comes from [Screen layout](#screen-layout).

- **Menu bar** (Scratch's): height `--menubar-h`, `--accent` fill, white bold `--fs` text, padding 0 16px, gap 18px. Menu items get a black-15% (`#00000026`) background on hover. Left to right: product name ("Scrabby", `--fs-xl` bold, letter-spacing .02em; our own name, never Scratch's logo), the Project name, then menu-bar buttons ([Buttons](#buttons)): **New Project** (it warns first, in a [Menus](#menus) modal), **Demo** (loads Maya's bake sale, warning first if the Project isn't empty), **Download code** (the zip), **↶ Undo**, **↷ Redo**. At the right end: **Show me around** (replays the show-around, [Speech bubble](#speech-bubble)).
- **Step bar** (under the menu bar): `--surface`, 1px `--line` bottom border, padding 8px 12px, gap 6px. Three step buttons, "1 Plan › 2 Build › 3 Try & tweak", with a `--placeholder` "›" between them. Step button: no border, no fill, bold `--fs-md`, padding 6px 10px, radius `--r-pill`, gap 6px, starting with a 22px number circle (white text). Idle: `--text` text (Scratch's own text color; D-Q7), `--ui3` circle. Current: `--ui2` fill, `--ink` text, `--accent` circle. Done (before the current one): `--go` circle with a white ✓. At the right end, in Try & tweak only: "← Back to the Blocks" (ghost, [Buttons](#buttons)). There is no Build button in Try & tweak, because the Blocks aren't on screen there (ticket 08).
- **Page:** `--ui2` background, 8px padding, `--gap` between panels.
- **Panel:** `--surface`, 1px `--line` border, radius `--r-panel`. Panel heading `--fs-lg` bold.
- **Panel title bar** (on the Assistant): `--bar` fill, 1px `--line` bottom border, padding 6px 10px, gap 8px, bold `--ink`.
- **Tabs** (Scratch's Code / Costumes / Sounds tabs): a 44px row on top of their panel. Tab: `--ui3` fill, 1px `--line` border, no bottom border, radius `--r-tab` `--r-tab` 0 0, padding 2px 20px 0, `--fs` bold, `--text` at 75% opacity, 80% of the row's height. Tabs overlap by 8px, and the left one sits on top. Selected tab: `--surface` fill, `--accent` text, 90% of the row's height. Each tab has a 22px icon ([Icons](#icons)), grey unless selected. The panel under the tabs has radius `0 8px 8px 8px`. Labels: "Canvas", "Library", "Checkpoints". Once there is a Checkpoint, the Checkpoints tab label is followed by a count pill (`--accent-strong` fill, white `--fs-xs` bold, radius `--r-pill`, padding 0 6px, 4px after the label).
- **Focus:** fields and buttons show `--focus` when focused by keyboard; a focused field's border turns `--accent-strong`.
- Undo and Redo cover every change to the Project (Ctrl+Z, Ctrl+Y or Ctrl+Shift+Z). Inside a text field, the field's own undo wins. The Warnings stepper opening folded Blocks to show a Warning is not an undo step.

## Block

A C-shaped frame (Scratch C-block). Uses its category's `--c1`–`--c4`.

**Anatomy**, top to bottom:
1. **Frame:** `--c1` fill, 1px `--c3` border, radius `--r-panel`, padding 4px 10px 12px, min-width 170px, `--ink` text. Width fits the content. No manual resize.
2. **Header** (one line, gap 6px, bold): fold button · type icon ([Icons](#icons)) and type label (normal weight, opacity .85) · name field (a [Trait](#trait) text field, bold) · the Edit or Color button, if any · markers. There is no ⋯ button: the Block menu opens on right-click only (D-Q9). The only visible edit buttons are Edit on an Instance and Color on a Custom Block definition.
3. **Note** (optional): see [Note](#note).
4. **Trait row:** pills, wrapping, gap `--gap-pill`, max-width 600px.
5. **Inside:** `--c4` fill, radius `--r-inside`, padding 8px, gap `--gap`, min-width 150px. Child Blocks lay out as a split-pane tree of rows and columns. Empty: a thin mouth, 12px tall and 60px wide.

**States**

| State | Look |
|---|---|
| Open | As above. The fold chevron points down. |
| Folded | The header, then small chips that wrap (`--c4`, radius 5px, `--fs-sm`, padding 2px 6px, max-width 360px): icon and label per Trait, icon and name per child Block, or "empty". Blocks 4 levels deep start folded. |
| Instance (Stretch, PRD §6) | In its Custom Block's own color. 2px dashed `--c3` border. The header shows the puzzle icon, the Custom Block's name as the type label, then the Instance's own name (new Instances get "Product card 2", "Product card 3"…; renaming the Custom Block doesn't rename them), then an **Edit** pill button. Opens like any Block, but shows only what differs from its Custom Block: parts added here and parts changed here. Above them sits a toggle strip (see below). |
| Custom Block definition (Stretch, PRD §6) | Only in the edit view. 5px `--def-ring` ring (box-shadow). Its type label reads "Custom Block", and a **Color** button opens the Custom Block color menu ([Menus](#menus)). |
| Loose idea (outside the Site Block) | Opacity .82 and saturation .8, both back to full on hover. A "not built" badge at the end of the header (`--surface`, 1px dashed `--c3`, radius `--r-pill`, `--fs-xs`). Its tooltip adds the loose-idea line ([Tooltip](#tooltip)). A loose Trait gets the same opacity and saturation, but no badge. |
| Drop target | 3px `--drop-over` outline, offset 1px. |
| Being dragged | It leaves its place and the gap closes. A copy follows the pointer with `--shadow-drag`. |
| Selected (a click without a drag) | 3px `--drop` outline, offset 2px. A "</> See its code" button sits on its top-right corner (top −14px, right −6px): `--ink` fill, white bold, radius `--r-pill`, padding 4px 10px, shadow `0 2px 6px #0003`. It opens that Block's code ([Screen layout](#screen-layout)), so it shows only on a Block that has code: a locked Page, or a Block in the [Checkpoints](#checkpoints) list. Clicking the Block again or empty Canvas unselects it. |
| Site Block | A bounded box around the pages, drawn like the Checkpoint Block so it doesn't read as one more Block: `--ui3` fill, 1px dashed `--muted` border, the Block frame's radius and padding, no separate inside fill. Header as usual: the `site` icon, "Site", the name field. It moves around the Canvas but can't go inside a Block or be deleted. |
| Checkpoint Block (after a Build, ADR 0005) | Stands for the built site, in the Site Block's place. It isn't in a category: `--ui3` fill, 1px dashed `--muted` border, the Block frame's radius and padding, no separate inside fill. Header: the `checkpoint` icon, "Checkpoint N" (bold), then "the built site" (`--fs-sm`, `--hint`, normal weight). It holds the locked Pages, then any new Page Blocks. It moves around the Canvas like the Site Block, but can't be folded or deleted. |
| Locked Page | A page that is already built, one per `.html` file. `--surface` fill, 1px dashed `--muted` border. Header: the `checkpoint` icon, "Page "Shop"" (bold), then its file name (`--fs-sm`, `--hint`, normal weight, for example "shop.html"). Empty: "drop Blocks or Traits here" (`--hint`, italic). It can be dragged to reorder it inside the Checkpoint Block, but never out of it, and it can't be deleted. New Blocks and Traits dropped into it ask for changes to that page; a Trait dropped on the Checkpoint Block asks for a change to the whole site. There are no locked Blocks deeper than a page. |
| With a Warning | A 3px `--alert` ring (box-shadow) and a badge at the end of the header: [Warnings](#warnings). |
| Flashing (jumped to from a Block chip) | A 6px `--flash` ring (box-shadow) that fades out over 1.4s. |

**Instance toggle strip** (Stretch, PRD §6): the first line inside an open Instance. A button styled like a folded chip (`--c4` fill, 1px `--c3`, radius 5px, `--fs-sm`, hover `--ink` border). It reads "N Traits from Product card · ✎ N changed · show all", which shows every part. Then it reads "Hide what comes from Product card", which goes back to only the differences. Dropped items land at the end of the Instance.

**Header buttons.** Fold: 22×22px, radius `--r-btn`, 1.5px `--c3` border, `--surface` fill, a 10px chevron SVG that rotates 90° in .15s. Color: 22px tall, padding 0 8px, same style. Hover on both: `--c4` fill, `--ink` border. Edit: a pill with `--c4` fill and 1px `--c3` border, padding 3px 10px.

**Markers** (pill, `--surface`, 1px `--c3`, `--fs-xs`): `✎ changed here` on a part inside an Instance whose value, name or Note was changed (the Instance's own name is always its own, so it never counts); `+ only here` on a part added only to that Instance.

**Menu** (right-click, see [Menus](#menus)): Add Note / Delete Note · Duplicate · Delete Block. Stretch (PRD §6), with Custom Blocks: Edit Custom Block · Change color… · Bring back removed parts (N) · Use the Custom Block's version · Make Custom Block. Each item appears only when it applies.

## Trait

A pill. Uses its category's `--c1`–`--c3`.

**Pill:** `--c1` fill, 1px `--c3` border, radius `--r-pill`, padding 3px 4px 3px 10px, min-height 28px, gap 5px, bold, no wrap. Content: icon ([Icons](#icons)) and label, then the value field, then an optional Note field ([Note](#note)), then an optional marker (`✎` or `+`, see [Block](#block)), then a Warning badge if it has one ([Warnings](#warnings)).

**Value fields.** Values are edited in place, never in a side form.

| Kind | Look | Used by |
|---|---|---|
| Text | White oval, 1px `#00000026` border, radius `--r-pill`, padding 3px 9px. Width = characters + 1, from 3 to 34. Enter commits. | text, fake data, tell Bob, let Bob pick |
| Long text | Past 30 characters a `⤢` button appears. It opens a 280px textarea (radius 10px, wraps, grows with content); `⤡` shrinks it back. The pill's radius becomes 16px. | same |
| Dropdown | `--c2` fill, 1px `--c3` border, bold, padding 3px 22px 3px 10px, a dark triangle caret 8px from the right. The last two options are always "💡 Bob picks" (below) and "custom…", which swaps in a text field and a `▾` button back to the list. | font, vibe, size, position, on click, purpose, image, video |
| Color | A 20px round swatch (2px `--c3` border), then the color's name ("mint"), or its hex for a custom color. Clicking opens the color menu (below). | color |

**Dropdown sources.** "on click" starts with "pick one", then "go to page › Shop" for each Page Block inside the Site Block or the Checkpoint Block (locked Pages too), never loose Pages, since those aren't built; then "open popup › Sign up" for each Popup on the same page; then its actions (PRD §11). If the Page or Popup it points to was deleted, it shows "go to missing page" or "open missing popup" with `--alert-bg` fill and an `--alert` border, the tooltip "What this pointed to was deleted. Pick another one.", and a Warning ([Warnings](#warnings)). Image lists the Library's images and video the Library's videos (empty: "pick from Library"). The sound Trait and "plays a sound" are Stretch (PRD §6): leave them out of the palette and the list until sound ships.

**Color menu** (PRD §11): the title "Colors" (bold), then two rows of six 24px round swatches (2px white border, 1px `#0003` ring; the chosen one gets a 2px `--ink` ring; each swatch's tooltip is its name), then "Any color" with a 44×26px color input. It opens under the swatch, styled like the context menu ([Menus](#menus)). Bob receives a preset as its name and hex (`mint (#A8E6CF)`) and any other color as its hex. The 12 presets (ticket 22; the default is in PRD §11):

| coral | pink | orange | sunny yellow | lime | mint |
|---|---|---|---|---|---|
| `#FF8A80` | `#F8BBD0` | `#FFB74D` | `#FFE066` | `#C5E1A5` | `#A8E6CF` |
| **sky blue** | **navy** | **lavender** | **brown** | **black** | **white** |
| `#81D4FA` | `#1E3A5F` | `#C5B3F6` | `#8D6E63` | `#111111` | `#FFFFFF` |

An empty "let Bob pick" reads "anything". Placeholders: tell Bob "like make it feel cozy", let Bob pick "like the colors".

**Bob picks** (ticket 27): the user hands one Trait's value to Bob. It is not on "tell Bob" or "let Bob pick".
- **In a dropdown:** "💡 Bob picks" is the option just before "custom…".
- **Bulb button:** a color Trait, and a text or fake data Trait while its field is empty, shows a round button after the value, in the Talk to Bob colors (`.cat-bob`): 22px circle, 1.5px `--c3` border, `--surface` fill, a 13px `t_bobpicks` icon in `--ink`. Hover: `--c4` fill. Tooltip: "Let Bob pick this value". One click hands the value to Bob.
- **Set:** the value turns into a chip in the Talk to Bob colors: `--c1` fill, 1px `--c3` border, radius `--r-pill`, padding 3px 4px 3px 9px, gap 4px, bold `--ink`: the 13px `t_bobpicks` icon, "Bob picks", then an 18px round × button (no border, `#0000001a` fill; tooltip "Pick it myself"). × takes the value back: the app kept the old value, so × restores it.
- **Hint field,** right after the chip: a pill field, 1px `--c3` border (Talk to Bob), `--surface` fill, radius `--r-pill`, padding 3px 9px, normal weight `--text`, placeholder "hint, like something warm". Width = characters + 1, from 14 to 30. It is the Trait's Note, so the Note field doesn't show beside it; it stays as the Note after ×. It gets focus when the value is handed over. It may stay empty.
- A Trait set to "Bob picks" gets no Warning ([Warnings](#warnings)).

**Menu:** Add Note / Delete Note · Duplicate · Delete Trait. Stretch, with Custom Blocks: Use the Custom Block's version.

## Note

Free text for Bob on a Block or a Trait. Added and removed with right-click → Add Note / Delete Note.

- **On a Block:** a sticky under the header. `--note-bg` fill, 1px `--note-border`, radius `--r-note`, 180px wide, padding 12px 4px 0, normal weight, `--text`. A borderless, vertically resizable textarea (placeholder "Note for Bob"). A `×` button at the top right in `--note-x`.
- **On a Trait:** a small field inside the pill. `--note-bg` fill, 1px `--note-border`, radius `--r-pill`, padding 3px 9px, normal weight (placeholder "note for Bob"). Width = characters + 1, from 8 to 30.

## Palette

Where Blocks and Traits come from. It sits left of the [Canvas](#canvas) inside the same panel.

- **Category column** (Scratch's): 60px wide, `--surface`, `--line` right border. At the top, a 26×26px toggle (⟨ / ⟩) folds the palette. Each category: padding 6px 0, a 20px circle (`--c1` fill, 1px `--c3` border, 2px below it) above its label (10.4px, `--text`). Hover: `--cat-hover` label. The category scrolled to gets `--cat-active`. Clicking one scrolls the palette to it. Order: Pages, UI, Primitives, Design, Behavior, Content, Talk to Bob, My Blocks.
- **Palette:** 250px wide, `--ws` background, `--line` right border, padding 4px 12px 60px, a `--fs-lg` bold heading per category. A Block shows as a small C-block: its icon ([Icons](#icons)) and label, `--c1`, 1px `--c3`, radius `--r-panel`, padding 8px 12px 16px, bold, with a 6px `--c4` bar 5px from the bottom and 10px from each side. A Trait shows as a plain [Trait](#trait) pill (icon and label) with no value field.
- **Delete by dragging back:** while a Block or Trait is dragged over the palette, the palette turns `--trash`. The Site Block, the Checkpoint Block and locked Pages can't be deleted. A locked Page released outside its Checkpoint Block goes back.
- **My Blocks** (Custom Blocks are a stretch goal, PRD §6: leave this category out until the must tier ships): a "Make a Custom Block" secondary button ([Buttons](#buttons)), the hint "Or right-click a Block on the Canvas and choose "Make Custom Block".", then one row per Custom Block: its palette Block (puzzle icon and name, in its own color; tooltip "N Instances") and an **Edit** secondary button that opens its edit view.

## Canvas

The dotted surface. It sits right of the [Palette](#palette).

- `--ws` background with the `--ws-dot` grid. Cursor: grab over empty space, grabbing while panning.
- **Pan:** drag empty space, or hold the middle button anywhere; scroll also pans. Panning stops when only a corner of the Blocks is still in view (40px).
- **Zoom:** Ctrl + scroll or pinch, at the pointer, from 30% to 200%. Zoom buttons (Scratch's), stacked at the bottom right, 20px from the edges: +, then − 4px below it, then = 12px below that. Each is a 36px white circle with a 2px ring of `#231F20` at 15% opacity, and a `--text` glyph drawn with a 1.5px stroke at 75% opacity. No shadow. ×1.25 per click; = resets to 100%. In Plan the big Build button takes the corner (18px in), and the zoom buttons stack above it: same right edge, 14px above the Build button (D-Q8).
- **Dragging:** the app's own pointer code, not the browser's drag-and-drop. A drag starts after 4px of movement. Closest-edge drop: the middle of a Block drops into it, near an edge drops beside, above or below it.
- **Drop indicator:** a 4px `--drop` line, radius 3px, a 2px white halo, at the closest edge. A `--drop-gap` placeholder the size of the dragged item (radius 8px, or `--r-pill` for pills) opens where it will land. Nothing else moves during a drag. Where nothing can take the item (for example a Page over a Hero, or anywhere outside the definition in a Custom Block's edit view), no indicator shows, and on release the item goes back to where it came from. Dropping an item back on its own spot changes nothing and adds no undo step.
- **Empty hint** (PRD §9): while the Site Block holds no Page Block, its inside grows to 56px and shows, centered, the `page` icon and "Drag a Page into your Site to start." (`--hint`, `--fs-md`, italic). It disappears once a Page is inside.
- **Demo button** (PRD-43), shown under the same condition: 24px below the Site Block, left edges lined up, moving with the Canvas. A big pill: `--accent-strong` fill, white bold 16px, padding 12px 24px, "Try the demo: Maya's bake sale". It loads the demo Project (warning first only if the current Project isn't empty, [Menus](#menus)). The menu bar's **Demo** button does the same ([Shell](#shell)).
- **After a Build:** the Build's Blocks leave the Canvas. It holds the Checkpoint Block in the Site Block's place, plus any loose ideas ([Block](#block), ADR 0005).
- **Warnings:** marks on Blocks and Traits, and a stepper at the top right: [Warnings](#warnings).
- **Custom Block edit view** (Stretch, PRD §6): the Canvas shows only the definition, with the edit bar ([Menus](#menus)) across the top.

## What Bob would read

Removed: users never see what Bob reads (ticket 05).

## Tooltip

One short sentence about a Block or Trait type (PRD §11), shown when the pointer rests on it. It takes the place of an Assistant in Plan.

- **When:** after the pointer rests about 0.5s on a Block's header or a Trait pill, in the palette or on the Canvas. It hides when the pointer leaves, a drag starts or a menu opens. Never during a drag, and only one at a time.
- **Look:** `--surface`, 1px `--line`, radius `--r-panel`, `--shadow-menu`, padding 8px 10px, max-width 260px, with a 4px left edge in the item's `--c3`. First line: the type's icon ([Icons](#icons)) and name, bold `--ink`. Second line: the sentence, `--text` `--fs`, line-height 1.4.
- **Place:** 8px below the item, left edges lined up. If there's no room below, it goes above. It always stays inside the window.
- **Text:** the type's tooltip sentence from PRD §11, kept in the type's definition, for example Hero: "The big first thing people see on a page: a headline, a picture, a button."
- **Checkpoint Block and locked Page:** titled "Checkpoint" and "Built page", with the `checkpoint` icon; the left edge is `--muted`, since they have no category.
- **Loose idea:** a third line, "Loose idea: Bob ignores it until you move it into {the Site / the Checkpoint}." (`--hint`, `--fs-sm`, italic). "the Site" becomes "the Checkpoint" once the Checkpoint Block is on the Canvas; the Page sentence swaps the same way (PRD §11).

## Speech bubble

The show-around, the one-time tip, the limit message and the blocked-Build message (PRD §8–§10), drawn like a sprite's speech bubble on Scratch's stage. The show-around is **drop order 1** if Bobcoins run low (PRD §6): the first feature to go.

- **Look:** `--surface`, 2px `--line` border, radius 16px, `--shadow-menu`, padding 12px 14px, max-width 280px, `--ink` `--fs-md` text, line-height 1.45. A 12px tail on the side that faces its target points at it.
- **Target:** what the bubble points at gets a 3px `--accent-strong` ring (offset 2px, following its corners). The rest of the screen isn't dimmed.
- **Show-around footer:** "2 of 4" (`--fs-sm`, `--hint`) on the left. On the right, **Skip** (Text button) and **Next** (Primary). On the last bubble, Next reads **Got it**.
- **Show-around steps** (words from PRD §9). **Show me around** in the menu bar replays it from the start.

  | When | Points at | Says |
  |---|---|---|
  | First visit, Plan | the palette | "These are your Blocks and Traits. Drag one onto the Canvas to use it." |
  | | the Canvas | "This is your plan. Put Blocks inside Blocks, and drop a Trait into the Block it describes. Where things sit doesn't matter." |
  | | the Build button | "When your plan is ready, press Build. Bob turns it into a real website." |
  | | the step bar | "You move through three steps: Plan, Build, Try & tweak. You can come back to Plan any time." |
  | First time in Try & tweak | the Preview | "This is your website. Click around: links, buttons and forms work." |
  | | Bob's panel (left out if the Assistant drops) | "Ask Bob about the code, or ask for a change. You decide whether to keep each change." |
- **Limit message** (PRD §8): when a usage limit stops a Build or a question, the same bubble, with no footer, points at the Build or Send button that was pressed, with the plain message (PRD §8; N is the server's `retryAfter` in minutes): "You've used this hour's 10 Builds. Try again in N minutes." · "You've asked Bob 40 questions this hour. Try again in N minutes." · "Scrabby has reached today's limit for everyone. Please try again tomorrow." Nothing else happens: the step doesn't change, and the typed question stays in the box. It closes on the next click anywhere.
- **Blocked Build** (PRD §10): with no Site Block or no Page Block, pressing Build doesn't start a Build. The same footer-less bubble points at the Build button: "Add a Page inside your Site first." It closes on the next click.
- **One-time tip:** the same bubble with no counter and one **Got it** button, pointing at the first Block the user drops on the Canvas: "Right-click a Block or Trait for more." It shows once, ever.

## Menus

- **Context menu** (right-click): `--surface`, 1px `#00000026`, radius `--r-btn`, `--shadow-menu`, padding 4px 0, min-width 200px, `--fs-md`. Item padding 7px 14px; hover `rgba(77,151,255,.25)`. Escape or a click outside closes it.
- **Modal** (Scratch's): a backdrop of `#4C97FF` at 90% over the whole app. The box is centered, 100px from the top, `--surface`, a 4px border of white at 25%, radius 8px, `--text` body text, padding 24px. Its header is 50px tall, `--accent` fill, with the title centered in white 16px normal weight. Buttons sit at the bottom right, gap 8px. Used for:
  - **The first-visit age check** (PRD §8), shown once before Plan; the answer is remembered. Title "Welcome to Scrabby". Text: "This early version of Scrabby is for grown-ups: teachers, parents and new coders." One Primary button, **I'm 18 or older, let's go**. Below it, `--fs-sm` `--hint`: "A version for young coders is on its way, through schools and parents." There is no close button and no "No": closing the tab is the way out.
  - **The New Project warning** (PRD §9). Title "Start a new Project?", body "Only one Project is saved, so this one will be replaced, Blocks and all. Download code first to keep a copy of the website's code." Buttons: **Download code** (Secondary), **Cancel** (Text), **Start a new Project** (Primary).
  - **The demo warning** (PRD-43), only if the current Project isn't empty. Title "Load the demo?", body "This replaces your current Project, Blocks and all. Download code first to keep a copy of the website's code." Buttons: **Download code** (Secondary), **Cancel** (Text), **Load the demo** (Primary).
  - **The Checkpoint warning** (ADR 0005), before **Go back to this** or **Edit its Blocks** in [Checkpoints](#checkpoints). Title "Go back to Checkpoint N?" or "Edit the Blocks of Checkpoint N?". Body, one paragraph per line:
    - Go back: "Your code goes back to how it was at Checkpoint N." Edit its Blocks: "Your code goes back to how it was before Checkpoint N's Build, and its Blocks come back so you can change them." On Checkpoint 1: "This remakes the website from scratch. Your code is cleared and the Blocks of Checkpoint 1 come back so you can change them."
    - "The next Build may come out different."
    - With hand edits not in any Checkpoint: "Your current code, with your hand edits, is saved first as a new Checkpoint, so you can come back to it." Otherwise: "Your current code is already saved as Checkpoint N."
    - Only with unbuilt Blocks on the Canvas: "Blocks you have not built yet become loose ideas."
    - Only with an Assistant change not yet accepted: "The Assistant's unaccepted changes will be dropped."
    - Buttons: **Cancel** (Text), **Go back** or **Edit its Blocks** (Primary).
  - **The unaccepted-changes warning** (ticket 08), when Build is pressed while an Assistant change is not yet accepted. Body: "The Assistant has changes you haven't accepted. Building drops them." Buttons: **Cancel** (Text), **Build anyway** (Primary).
- **Custom Block color menu** (Stretch, PRD §6): title "Custom Block color" (bold), a row of 24px round preset swatches (2px white border, 1px `#0003` ring; the chosen one gets a 2px `--ink` ring), then "Any color" with a 44×26px color input.
- **Custom Block edit bar** (Stretch, PRD §6): across the top of the Canvas. `--edit-bar` fill, `--ink` bold `--fs-md`, padding 8px 14px. Text: "Editing Custom Block "X". Changes reach all N Instances, except parts an Instance changed itself." A **Done** button on the right: `--surface`, no border, radius `--r-btn`, padding 6px 16px, bold.

## Buttons

| Kind | Look | Example |
|---|---|---|
| Menu bar (Scratch's) | No fill, no border, white bold `--fs`, padding 0 12px, the bar's full height. Hover: a black-15% (`#00000026`) fill. Disabled: opacity .4. | New Project, Demo, Download code, ↶ Undo, ↷ Redo, Show me around |
| Primary | `--accent-strong` fill, white bold, radius `--r-pill`, padding 8px 16px. | Upload, Try again |
| Secondary | `--surface`, 1px `--line`, radius `--r-btn`, padding 8px 12px, bold, `--text`. | Make a Custom Block |
| Ghost (small secondary) | `--surface`, 1px `--line`, radius `--r-btn`, padding 5px 10px, bold, `--ink`. Hover: `--accent-strong` border. | ← Back to the Blocks, Send, Go back to this, Edit its Blocks, Reject all, Review, ↻ |
| Accept | `--surface`, 1px `--go` border, radius `--r-btn`, padding 4px 10px, bold `--ink` label after a `--go` ✓. | Accept all |
| Text | No fill, no border, `--text`, normal weight, padding 5px 6px. Hover: underline. | Dismiss |
| Icon | See the header buttons in [Block](#block). | fold, Color |

The Build button is its own component: [Build button and Build card](#build-button-and-build-card).

**White text on color** (D-Q7): Scratch's own greens and blues are too light for small white text. White labels sit only on `--accent-strong`, or on `--go` at 19px bold or larger. Every other green or orange mark is an outline or an icon next to `--ink` text.

## Library

A tab beside Canvas ([Shell](#shell)). Assets are never dragged onto Blocks; the image and video Traits pick them from a dropdown ([Trait](#trait)). **Hackathon build: images and video.** Sound is Stretch (PRD §6); it comes with its Trait and tile icon.

- Panel padding 16px. Heading "Library" (`--fs-lg` bold), hint "Images and videos for this Project. Pick one inside an image or video Trait." (`--fs-sm`, `--hint`).
- A primary "Upload" button ([Buttons](#buttons)) that accepts image and video files.
- A grid of 120×120px tiles, gap 12px: 2px `--line` border, radius `--r-panel`, centered. Each tile shows the image itself (fit inside, 84px tall), then the file name (`--fs-sm`, one line, ending in "…" if long). A 40px `--hint` image icon ([Icons](#icons)) stands in while an image loads or if it can't be shown. A video tile shows a 40px `--hint` `video-camera` icon, then the file name.

## Code editor

The middle column of Try & tweak ([Screen layout](#screen-layout)). CodeMirror 6 with the `@codemirror/merge` add-on (W-10). The editor is dark, unlike the rest of the app. Its local colors:

```css
.code-editor {
  --ed-bg: #1F2330;  --ed-text: #D7DBE6;  --ed-tabs: #171A24;  --ed-tab-text: #9AA0B4;  --ed-rule: #2A2F3E;
  --ed-line-no: #5B6278;  --ed-changed: #2B3A2B;  --ed-flash: #4A4420;  --ed-dot: #F5C73D;
  --ed-tag: #7CC4FF;  --ed-string: #FFCF7A;  --ed-comment: #6B7390;
  --ed-add: #1E4D2F;  --ed-del: #5A2A2E;   /* Bob's suggested changes, before the user decides */
}
```

- **File tabs:** a strip in `--ed-tabs`, one tab per Prototype file. Tab: no border except a 1px `--ed-rule` right edge, `--ed-tab-text`, padding 7px 12px. Open tab: `--ed-bg` fill, white text. A file the last Build changed gets an `--ed-dot` "●" after its name (tooltip "changed by the last Build").
- **Code:** `--font-mono` 12px, line-height 1.6, `--ed-text` on `--ed-bg`, 6px padding top and bottom. Line numbers: a 36px column, right-aligned, 10px right padding, `--ed-line-no`, not selectable. Syntax: tag names `--ed-tag`, quoted values `--ed-string`, comments `--ed-comment` italic.
- **Changed lines** from the last Build: `--ed-changed` background.
- **Block chip:** on the first line of each Block's code, 12px after the code: a pill in that Block's category colors (`--c1` fill, 1px `--c3`, `--ink`), bold 11px `--font` (not mono), padding 0 8px, reading "◧ " + the Block's name + " Block" (for example "◧ Top bar Block"). Tooltip: "Show this Block in Checkpoints". Clicking it opens Plan on the Checkpoints tab, at the Checkpoint whose Build made that code ([Screen layout](#screen-layout)). Finding a Block's first line depends on the data-block rule in AGENTS.md.
- **Flash:** the line jumped to from "See its code" gets `--ed-flash` for 1.5s and scrolls to the center.
- **Bob's suggested changes** (from the [Assistant](#assistant); its Review button opens the file on them): shown inline in the file with the add-on's unified merge view. Removed lines on `--ed-del` with struck-through text, added lines on `--ed-add`. Each change carries its own two buttons, restyled from the add-on's defaults: **✓ Accept** (no fill, 1px `--flag` border, `--ed-text` label after a `--flag` ✓, bold 11px `--font`, radius `--r-btn`, padding 2px 8px) and **✕ Reject** (no fill, 1px `--ed-line-no` border, `--ed-text`, same size). This is the only place to decide change by change (PRD-22). Bob's diff card then shows what happened. A decided change leaves the merge view: accepted text stays as normal code, rejected text disappears.

## Preview

The left and widest column of Try & tweak ([Screen layout](#screen-layout)): the live, clickable Prototype.

- **Address bar:** `--bar2` fill, 1px `--line` bottom border, padding 5px 8px, gap 6px. Left to right: a ↻ ghost button (reload, [Buttons](#buttons)); the address pill (`--surface`, 1px `--line`, radius `--r-pill`, padding 3px 10px, `--text`, fills the space), for example "sneaker-shop / shop.html"; "Build N"; then the **Pause live updates** switch.
- **Page:** the Prototype (plain HTML, CSS and JS, W-9) fills the rest on white, in a sandboxed `srcdoc` frame. Its page links, popups and fake form submits work, as on a real website. It redraws by itself a moment after the user stops typing (W-16). There is no full-size button and no phone/desktop width switch (W-17).
- **Pause live updates switch** (W-16): the label "Pause live updates" (`--fs-sm`, `--text`), then a 28×16px switch: an `--ui3` track with a 12px white knob on the left when off; an `--accent-strong` track with the knob on the right when on. Off by default. It's there so a quiz or to-do list can be tried out without resetting at every keystroke.
- **Paused state:** a strip under the address bar, `--note-bg` fill, 1px `--note-border` bottom border, padding 4px 10px, `--ink` `--fs-sm`: "Live updates are paused. Press ↻ to see your latest code." While code has changed since the last redraw, ↻ carries a 6px `--accent-strong` dot. Builds, accepted Bob changes and page switches still redraw, and turning the switch off redraws once.
- **What changed** (W-17): after a Build or an accepted Bob change redraws the page, each changed part of the page gets a 3px `--flash` outline (offset 2px) that fades out over 1.5s, once. The changed parts are the innermost Blocks whose markup changed, found through the data-block rule in AGENTS.md. A change to CSS or JS alone flashes nothing, and typing never flashes.
- **Error bar** (PRD §10; **drop order 2** if Bobcoins run low): when the page throws an error, a bar is pinned to the bottom of the page area. `--alert-bg` fill, 1px `--alert` top border, padding 6px 10px, gap 8px. It holds an `--alert-dark` "!" icon, "Something on this page isn't working" (bold `--ink`), then the error itself (`--fs-sm`, `--text`), then at the right an **Ask Bob to fix it** ghost button (or **Open the file** if the Assistant drops). It goes away once the page runs without an error.

## Assistant

**Drop order 3** if Bobcoins run low (PRD §6): it goes after the show-around and the Preview error bar. The right column of Try & tweak, 300px wide. It appears nowhere else (ticket 08: Plan has tooltips instead). What it sees and can change belongs to the PRD lane (ticket 08, `docs/prd.md` §5). In the UI it is always called **Bob** (W-14).

- **Title bar:** a panel title bar ([Shell](#shell)) reading "Bob", then the [Bob badge](#bob-badge).
- **Explanation picker** (PRD §5), right under the title bar: a row with `--bar` fill, 1px `--line` bottom border, padding 6px 10px. "Explain:" (`--fs-sm`, `--text`), then a segmented control: one pill with a 1px `--line` border and three segments, **very simply · simply · in detail** (`--fs-sm` bold, padding 3px 10px, `--text`). The chosen segment gets `--accent-strong` fill and white text. The default is "simply". No ages are shown.
- **Chat:** `--surface`, padding 10px, gap 8px, scrolls. When already at the bottom, it stays pinned there as messages arrive. It is saved with the Project, so it's still there after a reload.
- **Messages:** max-width 92%, padding 7px 10px, radius 10px, line-height 1.45. The user's: right-aligned, `--accent` fill, white text. Bob's: left-aligned, `--ui2` fill, `--ink` text.
- **Diff card** (inside a message from Bob, 6px below its text): 1px `--line`, radius `--r-btn`, `--surface`, padding 8px 10px, `--font`. It shows **no code** (PRD-22):
  1. **Summary:** 1–3 short lines in plain words, written by Bob, `--ink`, line-height 1.45 (for example "Makes the product cards rounder").
  2. **Files:** one line, `--fs-sm`, `--text`, the file names in `--font-mono` ("style.css, shop.html").
  3. **Buttons** (8px above, gap 6px, wrapping): **Accept all** (Accept button), **Reject all** and **Review** (ghost buttons, [Buttons](#buttons)). Review opens the [Code editor](#code-editor) on the changes, where each one is accepted or rejected on its own.

  | State | The buttons row becomes |
  |---|---|
  | Open | Accept all · Reject all · Review |
  | Accepted | A `--go` ✓, then "Accepted, in your code now" (bold `--ink`). The Preview reloads. |
  | Rejected | "Rejected" (bold `--muted`) |
  | Some changes accepted, in Review | "N of M changes accepted" (bold `--ink`) |
  | Out of date (a file this card touches changed after Bob suggested it, by a Build or by the user's typing, PRD-23) | An "Out of date" tag at the top of the card (`--alert-bg`, 1px `--alert`, `--ink` `--fs-xs` bold, radius `--r-pill`, padding 1px 7px), then an **Ask again** ghost button and a quiet **Dismiss** text button ([Buttons](#buttons)). Accept and Review are gone. Dismiss means the same as Reject, and the card then reads "Rejected". |
- **Composer:** `--bar` fill, 1px `--line` top border, padding 8px, gap 6px. A pill input (1px `--line`, radius `--r-pill`, padding 7px 12px, min-width 120px, placeholder "Ask about your code, or ask for a change"), then a ghost **Send** button. Enter sends.

## Bob badge

The product always calls its agent Bob. This badge names the model actually doing Bob's work (W-14).

- **Look:** a pill right after the word "Bob" or the title it sits in, gap 6px. `--surface` fill, 1px `--line` border, `--text`, `--fs-sm` normal weight, radius `--r-pill`, padding 1px 8px.
- **Text:** "running on " + the model's plain name, for example "running on Gemini" or "running on IBM Bob". The server reports the name. The user never picks it.
- **Tooltip:** "Bob's answers come from Gemini right now." (with the model named).
- **Where:** Bob's title bar in Try & tweak ([Assistant](#assistant)), and the Build card's title row while a Build runs ([Build button and Build card](#build-button-and-build-card)). Nowhere else.

## Build button and Build card

**Build button** (Scratch's green flag, made into a button): `--go` fill, a white flag icon ([Icons](#icons), `flag`) then "Build" in white bold, no border, radius `--r-pill`, a 2px `--go-dark` bottom edge (`box-shadow: 0 2px 0 var(--go-dark)`). The label is at least 19px bold in every size, so white on `--go` stays readable (D-Q7).

| Size | Look | Where |
|---|---|---|
| Big | 20px, padding 12px 28px, 22px flag | Plan: the bottom right of the Canvas, 18px in, with the zoom buttons stacked above it. The Build card before the first Build |

While a Build runs, every Build button reads "Building…", can't be pressed, and has opacity .6. There is no Stop.

**Nothing new to build** (ticket 08): after a Build, while no new Blocks or Traits are on the Canvas, the Build button is greyed: fill `#B9BDC8`, bottom edge `#A3A8B5`. Pressing it starts nothing; a footer-less [Speech bubble](#speech-bubble) points at it: "Nothing new to build. To redo a Build, open **Checkpoints**". The word Checkpoints is a link that opens the Checkpoints tab.

**Build card:** the whole Build step ([Screen layout](#screen-layout)). Centered on the page, 520px wide (at most 100%), `--surface`, 1px `--line`, radius 12px, padding 20px 24px, `--ink`. Top to bottom:

1. **Title** (18px bold, gap 10px):

   | State | Title |
   |---|---|
   | No Build yet | "Nothing built yet", with a big Build button below the checklist |
   | Running | a spinner, then "Bob is building your website", with the [Bob badge](#bob-badge) at the right end of the title row |
   | Done | "✓ Build N done", with "Opening your website…" below. After 0.9s the step moves to Try & tweak by itself |
   | Failed | an `--alert-dark` "!" icon, then "Build N did not finish" (`--ink`), with "Nothing changed: your code and Blocks are as they were." below (`--fs`, `--text`, normal weight). The card gets a 4px `--alert` top border. A failed Build writes nothing (ticket 29). |

2. **Block chips:** one pill per Block in this Build, wrapping, gap 6px, 10px above and below. Each is in its category colors (`--c1` fill, 1px `--c3`), bold, radius `--r-pill`, padding 3px 10px. A chip sits at opacity .35 until Bob builds that Block, then turns fully opaque. If the Build fails, every chip goes back to .35.
3. **Checklist:** the app writes the lines from what happens during the Build, not Bob. Reading the Blocks → "Reading your Blocks (17 Blocks, 1 loose idea skipped)"; Bob starting on a Block → that Block's chip lights up and "Building <name>" is added (this depends on the data-block rule in AGENTS.md; if the runtime can't report Blocks as it goes, every chip lights at the end); a check after the files are written → "Checking the pages open and the links work" (only once that check ships: it's stretch, PRD-47); a problem in the plan that the Build skips → a warning line; a failure → its failure line. Each line: `--fs`, line-height 1.7, gap 8px, a 14px icon, then plain words. Done: a bold `--go` "✓". Current: a small spinner. Failed: an `--alert-dark` "!" and the whole line in bold `--ink` on `--alert-bg`. Warning (PRD §10: the Build still runs, so this is quieter than a failure): a `--note-x` "–", then the line in normal-weight `--text`, starting "Skipped:" (for example "Skipped: the Shop now button goes to a page that no longer exists."). Example lines: "Reading your Blocks (17 Blocks, 1 loose idea skipped)" · "Building Top bar and Big welcome" · "Checking the pages open and the links work". The failure lines (ticket 29): the time cap, "Bob took too long, so this Build was stopped." · the model can't be reached or returns an error, "Bob couldn't be reached. Check your connection and try again." · a broken or incomplete answer, "Bob's answer came back broken, so this Build was stopped."
4. **After a failure:** **Try again** (Primary) and **← Back to the Blocks** (ghost) ([Buttons](#buttons)), gap 6px, 6px above. Try again runs the same Blocks again. ← Back to the Blocks opens Plan, where the Blocks are still on the Canvas and can be changed.

**Spinner:** a circle with a 3px `--ui3` ring whose top quarter is `--go`, turning once a second. 22px in a title; 14px with a 2px ring in a line.

**After a Build**, outside the card: its Blocks leave the Canvas, which now holds the Checkpoint Block ([Block](#block)); the [Checkpoints](#checkpoints) list gets a new entry; and each file it changed gets a dot on its tab and tinted lines ([Code editor](#code-editor)).

## Screen layout

From ticket 02. Three steps, and only one is on screen at a time: **1 Plan › 2 Build › 3 Try & tweak**. Under the menu bar sits the step bar ([Shell](#shell)), then the current step's area (`--ui2`, 8px padding, `--gap`).

| Step | What fills the screen |
|---|---|
| Plan | Canvas / Library / Checkpoints tabs ([Shell](#shell)) over one panel: the [Palette](#palette) and the [Canvas](#canvas), the [Library](#library), or the [Checkpoints](#checkpoints) list. The big Build button floats at the Canvas's bottom right, with the zoom buttons stacked above it. No code, Preview or Assistant. |
| Build | The [Build card](#build-button-and-build-card), centered. |
| Try & tweak | Three panels in a grid of `minmax(0,1.2fr) minmax(0,1fr) 300px`, gap `--gap`: [Preview](#preview), [Code editor](#code-editor), [Assistant](#assistant). If the Assistant drops (PRD §6), two panels: `minmax(0,1.2fr) minmax(0,1fr)`. |

**Moving between the steps:**
- Click Plan or Try & tweak in the step bar, or "← Back to the Blocks". While a Build runs, the step bar stays on Build.
- Pressing Build goes to the Build step. A successful Build goes on to Try & tweak by itself. A failed one stays on Build.
- **See its code:** select a Block that has code (a locked Page on the Canvas, or a Block in the Checkpoints list), then click its "See its code" button ([Block](#block)). Try & tweak opens on the file that holds the Block's code, and the Block's first line flashes ([Code editor](#code-editor)). This depends on the data-block rule in AGENTS.md.
- **Block chip:** clicking a chip in the code opens Plan on the Checkpoints tab, at the Checkpoint whose Build made that code, with that Block flashing and scrolled to the center.
- Whatever is jumped to scrolls smoothly to the center.

**First visit** (PRD §8–§9): the age check, a Scratch-style modal ([Menus](#menus)), shown once. Then Plan opens on an empty Project, with the empty hint ([Canvas](#canvas)), and the show-around starts ([Speech bubble](#speech-bubble)). Below the Site Block, **Try the demo: Maya's bake sale** loads the demo Project ([Canvas](#canvas)); so does **Demo** in the menu bar.

**Screen sizes** (D-Q6): design for 1920×1080, the demo recording. The smallest supported size is 1366×768: nothing may scroll sideways or get cut off there, and the palette folds to give the Canvas room. No tablets or phones.

## Checkpoints

The third tab in Plan ([Shell](#shell)), after Canvas and Library (ADR 0005). Every Build saves a Checkpoint: the code, and the Blocks that made it. The list only grows. Loading a Checkpoint never changes the Library.

- **Panel:** `--surface`, padding 12px, entries stacked with gap 8px, newest first. Empty: "No Checkpoints yet. Every Build saves one here." (`--hint`, italic).
- **Entry:** 1px `--line` border, radius `--r-panel`, padding 10px 12px, `--ink`.
  1. **Title row** (gap 8px, baseline): "Checkpoint N" (`--fs-lg` bold), the time (`--fs`, `--hint`), then tags.
  2. **Gist** (4px above, 8px below, `--fs`): "Built the site: N pages." for a first Build or a remake; "Added: Footer, Contact form." (its request Blocks' names) for a later Build; "Before loading Checkpoint N: your code with its hand edits." for a saved one.
  3. **Buttons** (ghost, [Buttons](#buttons), gap 6px): **Go back to this**, then **Edit its Blocks**. A "Before loading" Checkpoint has only Go back to this. Both open the Checkpoint warning ([Menus](#menus)).
- **Tags:** `--fs-sm`, radius `--r-btn`, padding 1px 6px, `--ui2` fill, `--ink`:
  - "from Checkpoint N" or "remade from scratch", on a Build made after an older Checkpoint was loaded;
  - "saved for you", on a "Before loading Checkpoint N" entry, in `--note-bg`;
  - "you are here", on the current entry, in `--accent-strong` with white text. It reads "you are here + hand edits" while the code has changed since that Checkpoint.
- **Current entry:** 1px `--accent` border, plus a 2px ring of `--accent` at 25% (`box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent)`).
- **From a Block chip** ([Code editor](#code-editor)): the entry of the Build that made that code opens and shows that Build's Blocks, read-only, in their Folded look ([Block](#block)), with the chip's Block flashing. Its "See its code" button works there.

## Warnings

Marks on the Canvas for problems in the plan (ticket 24). There is no list panel. Warnings never stop a Build: only a plan with no Site or no Page does ([Speech bubble](#speech-bubble)), and the Build card still lists what Bob skipped ([Build button and Build card](#build-button-and-build-card)).

- **What is checked:** only unbuilt Blocks and Traits inside the Site Block, or inside the Checkpoint Block after a Build. Built code is never scanned. The Checkpoint Block and locked Pages are valid link targets and are never marked. Loose ideas are never marked; their "not built" badge already says it. A new or focused Block or Trait gets its mark only once the user clicks or drags somewhere else. Everything else updates live.
- **Mark:** a 3px `--alert` ring (box-shadow) on the Block or Trait, plus a badge: an 18px `--alert-dark` circle with a white bold 12px character, "!" for "Bob skips it" and "?" for "worth a look". On a Block, the badge sits at the end of the header; on a Trait, at the end of the pill, 2px after the last part. Its tooltip is the problem in words.
- **Popover** (click a badge): 300px wide, `--surface`, 1px `--line`, a 3px `--alert` top border, radius `--r-panel`, shadow `0 4px 14px #0003`, `--fs`. It opens 6px below the badge and stays inside the window. Inside, padding 8px 10px, gap 8px: the badge character in its circle, then:
  1. **Where:** a pill button (`--ui2` fill, no border, radius `--r-pill`, padding 1px 8px, `--fs-sm`, `--ink`; hover `--ui3`) with the path, for example "Home › Big welcome › See the sale". Tooltip "Show it on the Canvas". Clicking it does what Show does.
  2. **What is wrong:** bold `--ink`, line-height 1.4. For example: "Nothing opens the "Sign up" popup, so visitors never see it."
  3. **What to do:** `--text`, line-height 1.4, 2px above.
  4. **Buttons** (6px above, gap 6px, wrapping): pills with `--surface` fill, 1px `--line` border, radius `--r-pill`, padding 3px 10px, bold `--ink`, hover `--ink` border. **Show** moves the Canvas to the item and flashes it ([Block](#block)); **Pick one** focuses its dropdown or field; one-click fixes, in `--alert-bg` with an `--alert` border, for example **Remove the link**, **Add it to "Top bar"**, **Let Bob fill it**; then **Close**. A click outside also closes it.
- **Stepper:** 12px from the top right of the Canvas. A pill: `--surface`, 1px `--alert` border, radius `--r-pill`, shadow `0 2px 8px #0002`, padding 3px, bold `--ink`: a ‹ button, "⚠ N to check" (padding 0 8px), a › button. The buttons are 26px circles, no border, `--alert-bg` fill, 14px glyph; tooltips "Previous" and "Next". Each press moves the Canvas to the next Warning in reading order (the Site first, then each Page, top to bottom through the Block tree) and opens its popover.
- **Nothing to check:** with no Warnings, a pill in the stepper's place: `--surface`, 1px `--go` border, radius `--r-pill`, padding 6px 12px, shadow `0 2px 8px #0002`, a `--go` ✓ then "Nothing to check" in bold `--ink`.
- **Custom Blocks** (Stretch, PRD §6): a problem in a definition marks every Instance but counts once in the stepper; its popover adds "Comes from the Custom Block "Product card"" and an **Edit** button. In the edit view, the stepper sits below the edit bar and steps only through that Custom Block's Warnings.

| Warning | Badge |
|---|---|
| "on click" goes to a deleted page, opens a deleted popup, or has nothing picked | ! (Bob skips it) |
| an image or video Trait with no file picked, or whose file was deleted from the Library | ! (Bob skips it) |
| a Popup that nothing opens; a Page nothing links to (not the home Page); an empty Page | ? (worth a look) |
| an empty text or fake data, or a dropdown left blank on "custom…" | ? (worth a look) |
| an empty "tell Bob" | always marked |
| an empty "let Bob pick", or a Trait set to "Bob picks" | never marked |

A Note on the item, or a "tell Bob" or "let Bob pick" on its Block, clears a "worth a look" Warning. "Bob skips it" Warnings stay until fixed. There is no Ignore button. An "on click" set to "Bob picks" doesn't count as a link, so a Page or Popup that only it linked to keeps its Warning.
