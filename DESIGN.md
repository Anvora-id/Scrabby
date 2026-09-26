# DESIGN.md: Scrabby look and screen layout

**How to use this file.** A UI task reads [Tokens](#tokens), [Brand and Bob](#brand-and-bob) and [Motion](#motion), plus the one component section it builds. Each component section stands alone and uses only token names from Tokens, plus any local colors it defines itself. Headings are stable: link to them by name.
Build from these values; don't restyle. Codes such as D-Q7, W-16, PRD-22 or "ticket 02" point at decisions recorded in the planning repo; this file already states what they decided. Vocabulary follows `CONTEXT.md` (Block, not node; Trait, not property). Framework-neutral: tokens are CSS custom properties, components are anatomy plus states.
Sources: the screen layout was settled on clickable mockups in the planning repo (`spbob_prototype/prototypes/`). The look was redone on 2026-09-26 (D-Q14 to D-Q27) on the look lab mockup, `prototypes/look-lab.html` in the planning repo, whose defaults are the values below. None of the mockups are part of the build; every value they settled is written here.
**Look in one line: a toy box on a desk.** The Blocks are chunky toy pieces with a darker bottom edge that press down when clicked. The Traits are stickers slapped onto them. The Notes are yellow sticky notes set at a slight angle, with no tape, and they are the only thing that isn't straight. It all sits on a dotted paper Canvas. Bob, a little builder robot, does the work. The layout still follows the block editor young coders know (category column, palette, Canvas, tabs), so it feels familiar, but the colors, type and shapes are our own (D-Q14). The references are Duolingo (chunky 3D buttons, bold friendly color) and Nintendo's Mario Maker (a toy-box building editor, springy motion). They are references for feel only: copy nothing of theirs.
**Never** use the word "Scratch", its logo, the Scratch Cat or Scratch's icon files anywhere in the product. Icons come from our own icon set ([Icons](#icons)).

## Tokens

Paste as-is.

```css
:root {
  /* text */
  --ink: #1F1A33;          /* strong text: Blocks, Traits, headings, labels */
  --text: #4A4560;         /* body text on chrome and white */
  --hint: #8A849E;         /* hints under headings, captions */
  --muted: #9A94AD;        /* "empty" labels, rejected states */
  --placeholder: #B5B0C4;  /* placeholders: italic, weight 600, so a hint never looks typed */
  /* surfaces */
  --surface: #FFFFFF;      /* panels, menus, text fields, the selected tab */
  --soft: #F6F4FA;         /* palette, address bar, composer, panel sub-bars */
  --page: #F1EDFF;         /* page background behind panels (the Grape tint) */
  --ws: #FFFBF2;           /* Canvas paper */
  --ws-dot: #D4CCE4;       /* Canvas dots: 1.6px radius every 24px at 100%, moving and scaling with pan and zoom */
  --idle: #E7E3F0;         /* unselected tabs, step circles not reached yet, spinner tracks, switch tracks */
  --line: #1F1A331F;       /* 2px borders of panels, tabs, buttons and fields; also their bottom edge */
  --line-soft: #1F1A3314;  /* dividers inside a panel */
  /* brand: Grape means Scrabby and the user (D-Q15) */
  --brand: #6B4EFF;        /* menu bar, primary buttons, the user's chat bubbles, current step, selected tab, focus */
  --brand-dark: #4B31D1;   /* bottom edge of brand-filled things */
  --brand-tint: #F1EDFF;   /* current step fill, menu hover */
  /* Bob blue means Bob, and only Bob (D-Q16) */
  --bob: #315DFB;          /* the mascot's own blue: Bob's title, badge, bubbles' borders, Bob's spinner */
  --bob-dark: #1F3FC4;     /* bottom edge of Bob-filled things */
  --bob-tint: #EAF0FF;     /* Bob's chat bubbles, Bob's title bar, the Build stage */
  /* Build green */
  --go: #1CA24A;           /* Build button fill; ticks, "built" and Accept outlines. White text on it only at 19px weight 900 or larger */
  --go-dark: #137A36;      /* the Build button's bottom edge */
  --flag: #4CD97A;         /* green marks on the dark code editor */
  /* problems: soft tomato, never orange (orange is a Block category) (D-Q21) */
  --alert: #FF5A4E;        /* borders and top bars of errors and warnings */
  --alert-dark: #D93A2F;   /* "!" marks and icons */
  --alert-bg: #FFECEA;     /* fill of error bars, warning boxes, a dropdown whose target is gone */
  --flash: #FFE14D;        /* ring on something jumped to, and on the page parts a Build changed */
  /* drag and drop */
  --drop: #6B4EFF;         /* drop-indicator line */
  --drop-over: #A896FF;    /* outline on the Block that will take a drop */
  --drop-gap: #1F1A3326;   /* placeholder where the dragged item will land */
  --trash: #FFECEA;        /* palette background while a drag would delete */
  /* paper */
  --note-bg: #FFE872;  --note-edge: #E5C63A;  --note-text: #5A4A00;   /* Notes */
  --edit-bar: #FA9EB5;     /* bar across the Custom Block edit view (stretch) */
  --def-ring: #FDD8E1;     /* 5px ring around a Custom Block definition (stretch) */
  /* type (D-Q17) */
  --font: "Nunito", "Arial Rounded MT Bold", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --w-body: 600;  --w-bold: 800;  --w-heavy: 900;   /* Nunito weights; nothing lighter than 600 */
  --fs: 13px;              /* base: body text, buttons, pills */
  --fs-xs: 10.5px;         /* markers and badges: ✎ changed, + only here, not built, tab counts */
  --fs-sm: 12px;           /* hints, folded chips, captions */
  --fs-md: 14px;           /* Block headers, step buttons, tabs, context menu, speech bubbles */
  --fs-lg: 16px;           /* section and panel headings */
  --fs-xl: 21px;           /* Build card title */
  --fs-logo: 24px;         /* the wordmark */
  /* shape */
  --r-block: 16px;  --r-panel: 16px;  --r-inside: 11px;  --r-btn: 12px;  --r-tab: 14px;  --r-card: 22px;  --r-pill: 999px;
  --edge: 4px;             /* a Block's bottom edge */
  --edge-btn: 3px;         /* buttons, palette Blocks, panels */
  --gap: 10px;             /* between panels and between child Blocks */
  --gap-pill: 6px;         /* between Trait stickers */
  --menubar-h: 56px;  --stepbar-h: 58px;
  --focus: 0 0 0 4px color-mix(in srgb, var(--brand) 35%, transparent);  /* keyboard focus ring */
  --shadow-menu: 0 10px 28px #1F1A3329, 0 3px 0 var(--line);             /* context menus, tooltips */
  --shadow-drag: drop-shadow(0 12px 14px #1F1A3340);                      /* the dragged copy */
  /* motion (D-Q19): see Motion */
  --spring: cubic-bezier(.34, 1.56, .64, 1);   /* overshoots a little, then settles */
  --ease: cubic-bezier(.3, .7, .4, 1);          /* plain ease-out */
  --t-press: 80ms;  --t-quick: 150ms;  --t-pop: 320ms;  --t-settle: 450ms;
}

/* Category colors. c1 frame and sticker fill, c2 dropdown fill, c3 border and bottom edge, c4 inside of a Block (never white). */
.cat-site     { --c1: #FB8B6F; --c2: #FA6742; --c3: #C34322; --c4: #FFE1D9; }  /* Site Block */
.cat-pages    { --c1: #FCD66E; --c2: #FBCA41; --c3: #C49921; --c4: #FFF5D9; }  /* Page Block */
.cat-ui       { --c1: #71ACF9; --c2: #4592F7; --c3: #2668C0; --c4: #D9EAFF; }  /* Navbar Hero Section Card grid Card Form Popup Footer */
.cat-prim     { --c1: #7BDFEF; --c2: #53D6EA; --c3: #369FB0; --c4: #D9FAFF; }  /* Textbox Frame Button Panel */
.cat-design   { --c1: #A474F6; --c2: #945CF5; --c3: #5F2ABB; --c4: #E7D9FF; }  /* color font vibe size position */
.cat-behavior { --c1: #FCB06E; --c2: #FB9841; --c3: #C46D21; --c4: #FFEBD9; }  /* on click, purpose, fake data */
.cat-content  { --c1: #F278CD; --c2: #EE4FBE; --c3: #B4318D; --c4: #FFD9F4; }  /* text image sound video */
.cat-bob      { --c1: #87E393; --c2: #62DA72; --c3: #489D54; --c4: #D9FFDE; }  /* tell Bob, let Bob pick */
.cat-my       { --c1: #F87294; --c2: #F54772; --c3: #BD284D; --c4: #FFD9E3; }  /* Custom Blocks and Instances */
```

**Fonts:** load Nunito (600, 700, 800, 900) and JetBrains Mono (500) from Google Fonts, with `display=swap`.

The category colors are "Medium" strength (D-Q18): stronger than the old pastels, softer than full toy colors, so a big plan stays readable. They follow one formula for hue `h` and saturation `s`: `c1 hsl(h s 71%)`, `c2 hsl(h s 62%)`, `c3 hsl(h s−25% 45%)`, `c4 hsl(h 100% 92.6%)`. Design's c2 is the exception, at 66% lightness, so dark text on its dropdowns stays readable. Hues and saturations: Site 12/95, Pages 44/96, UI 214/92, Primitives 188/78, Design 262/88, Behavior 28/96, Content 318/82, Talk to Bob 128/62, My Blocks 345/90. Text on every category color is `--ink` (at least 5:1 on every c1).

**Color roles** (D-Q15, D-Q16). Each color family means one thing, so a glance tells who or what is involved:
- **Grape** (`--brand`): Scrabby itself and the user: the menu bar, primary buttons, the user's own chat bubbles, the current step, the selected tab, focus and the drop line.
- **Bob blue** (`--bob`): Bob, and nothing else: Bob's chat bubbles and title bar, the [Bob badge](#bob-badge), speech bubbles, the Build card's title and stage, Bob's spinner. Never use it for a control the user presses.
- **Green** (`--go`): Build, and things that went right (ticks, "built", Accept).
- **Tomato** (`--alert`): something needs fixing.
- **Category colors**: the plan, meaning Blocks and Traits, and anything that stands for one Block (Block chips).

**Custom Block color** (Stretch, PRD §6; editor-only, not the website's colors). Each new Custom Block gets its own color: the first preset hue no other Custom Block uses (presets: hues 345, 15, 40, 90, 140, 180, 205, 235, 275, 310 at `s 90% l 71%`). Once all ten are taken, it gets the hue farthest from those in use, at `s 85% l 71%`. The user can change it to another preset or any color. From the chosen `hsl(h s l)`, set `--c1 (s, l)`, `--c2 (s, l−9)`, `--c3 (s−25, l−26)`, `--c4 (100, 92.6)` on that Block. If `l < 55`, only its header text turns white. Stickers, Notes and markers inside keep `--ink`.

## Brand and Bob

**Bob is the mascot** (D-Q20): a little builder robot in a blue hard hat with a `</>` badge on his chest. The artwork is two vector files in `assets/`, copied as-is into `public/` so the app serves them; they are never generated or redrawn: `assets/Scrabby_2.svg` → `public/bob.svg` (the full figure) and `assets/bob-head.svg` → `public/bob-head.svg` (the head, square). `assets/Scrabby.png` (1254px) is a raster copy for the video and deck, never used in the app. Its own colors are `--bob`, near-black `#020102` outlines and off-white `#F3F4F8`. They belong to the artwork only: the rest of the UI has **no black outlines** (D-Q22).

- **Never** redraw, recolor, crop the body, stretch or add poses. Bob's pose stays exactly as drawn (D-Q20). The one allowed crop is **Bob's head**, which is its own file, `bob-head.svg`. Use it for avatars: an `<img>` in a circle (`border-radius: 50%`, `object-fit: cover`) with a white fill and a 2px `--line` ring.
- **Smallest sizes:** full figure 40px tall; head 24px across.
- **Where Bob appears** (only these places, so he stays special):

  | Place | What |
  |---|---|
  | Menu bar | Full figure, 40px tall, before the wordmark ([Shell](#shell)) |
  | Assistant | Head: 28px before "Bob" in the title bar, 24px beside each of Bob's messages, 48px above the empty-chat line ([Assistant](#assistant)) |
  | Build card | Full figure, 118px tall, hopping on the Build stage ([Build button and Build card](#build-button-and-build-card)) |
  | Speech bubbles | Full figure, 74px tall, beside the bubble ([Speech bubble](#speech-bubble)) |
  | Greeting | The logo, Bob 160px tall, at the top of the greeting card ([Screen layout](#screen-layout)) |
  | Empty Library and Checkpoints | Head, 48px, above the empty line, as in the empty chat ([Library](#library), [Checkpoints](#checkpoints)) |

- **Logo** = Bob's full figure + the **wordmark** "Scrabby" in Nunito 900, letter-spacing −.01em, gap 8px, figure bottom-aligned with the text's baseline. The logo is for the app, video, deck and cover. The favicon is `bob-head.svg`.

## Motion

**Springy toy** (D-Q19): things overshoot a little and settle, like a plastic piece that's just been set down. One moving thing at a time; nothing loops except the Build stage, spinners and the working Build chip. Durations and curves come from the motion tokens.

| Moment | Motion |
|---|---|
| Press (any button with a bottom edge, and a Block's header on pointer down) | Moves down by its own bottom-edge height (2–5px, as each component states) as the edge shrinks to 1px, over `--t-press`. On release it springs back over 250ms with `--spring`. |
| Hover (Blocks, palette items, Library tiles) | Lifts 1px (palette items 2px) and the edge grows by the same amount, over `--t-quick`. |
| Drag start | The copy that follows the pointer scales to 1.03 over `--t-quick`, with `--shadow-drag`. |
| Drop | The dropped item lands with a small, quick squash: `scale(1.02, .97)` for 40ms, then settles to 1 over `--t-quick` with `--ease`, no overshoot (190ms in all). Items that make room slide over `--t-quick` with `--ease`: when a Block's gap opens, moves or closes, when a dragged item lifts off, and after a drop. Reduced motion: no slides. |
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
| `checkpoint` → `lock` (the Checkpoint Block and locked Pages) | | |

Tab icons: Canvas `puzzle-piece`, Library `image`, Checkpoints `clock-counter-clockwise`. Menu bar and zoom icons: New Project `plus`, Demo `cake`, Download code `download-simple`, Undo `arrow-counter-clockwise`, Redo `arrow-clockwise`, Show me around `question`, zoom `plus` / `minus` / `equals`, fold `caret-down`, ticks `check`, Preview full size `arrows-out` / `arrows-in`. Always icons, never characters: ✓ → `check`, × and ✕ → `x`, ↻ → `arrow-clockwise`. Plain text characters: ⟨ ⟩ ‹ › ← ✎ + ◧ ⤢ ⤡ ▾ ● ⚠, and the "!" and "?" in alert circles. A button whose spec names no icon has none.

## Shell

The frame around everything. Where each surface sits comes from [Screen layout](#screen-layout).

- **Menu bar:** height `--menubar-h`, `--brand` fill, a 4px `--brand-dark` bottom edge (`box-shadow: inset 0 -4px 0 var(--brand-dark)`), white text, padding 0 16px, gap 10px. Left to right: the logo ([Brand and Bob](#brand-and-bob): Bob 40px tall, then "Scrabby" in white `--fs-logo` weight 900), 10px space, the Project name (a chip you can type in: white at 15% fill, radius 10px, padding 6px 12px, `--w-bold` `--fs-md`; hover white at 25% fill, focus a 2px white outline; as wide as its text, up to 34 characters; it is also the Site's name, so renaming either renames both), then menu-bar buttons ([Buttons](#buttons)): **New Project** (it warns first, in a [Menus](#menus) modal), **Demo** (loads Maya's bake sale, warning first if the Project isn't empty), **Download code** (the zip), **Undo**, **Redo**, each with its icon ([Icons](#icons)). At the right end: **Show me around** (replays the show-around, [Speech bubble](#speech-bubble)).
- **Step bar** (under the menu bar): height `--stepbar-h`, `--surface`, 2px `--line-soft` bottom border, padding 0 14px, gap 8px. Three step buttons, "1 Plan › 2 Build › 3 Try & tweak", with a weight-900 "›" in `--idle` between them. Step button: 2px transparent border, no fill, `--w-bold` `--fs-md`, padding 5px 14px 5px 6px, radius `--r-pill`, gap 8px, starting with a 26px number circle (white weight-900 13px, with an inner 3px bottom shade `inset 0 -3px 0 #0000001a`). Idle: `--hint` text, `--idle` circle. Current: `--brand-tint` fill, 2px `--brand` border, `--ink` text, `--brand` circle. Done (before the current one): `--go` circle with a white ✓ icon. At the right end, in Try & tweak only: "← Back to the Blocks" (ghost, [Buttons](#buttons)). There is no Build button in Try & tweak, because the Blocks aren't on screen there (ticket 08).
- **Page:** `--page` background, 10px padding, `--gap` between panels.
- **Panel:** `--surface`, 2px `--line` border, radius `--r-panel`, a 3px bottom edge (`box-shadow: 0 3px 0 var(--line)`). Panel heading `--fs-lg` weight 900.
- **Panel sub-bar** (address bar, explanation picker, composer): `--soft` fill, 2px `--line-soft` border on the side facing the panel's content, padding 8px 10px.
- **Tabs** (Canvas, Library and Checkpoints, over the Plan panel): a 44px row. Tab: `--idle` fill, 2px `--line` border with no bottom border, radius `--r-tab` `--r-tab` 0 0, padding 0 18px, 38px tall, `--w-bold` `--fs-md`, `--hint` text, gap 4px between tabs. Selected tab: `--surface` fill, `--brand` text, 44px tall, pulled down 2px over the panel's top border so the two join. Each tab has a 20px icon ([Icons](#icons): `puzzle-piece` for Canvas, `image` for Library, `clock-counter-clockwise` for Checkpoints). The panel under the tabs has radius `0 16px 16px 16px`. Labels: "Canvas", "Library", "Checkpoints". Once there is a Checkpoint, the Checkpoints tab label is followed by a count pill (`--brand` fill, white weight-900 `--fs-xs`, radius `--r-pill`, padding 0 7px, 5px after the label).
- **Text and weights:** placeholders are `--placeholder`, italic, `--w-body`. Body text is `--w-body` (600), labels `--w-bold` (800), headings, Block names and stickers `--w-heavy` (900); the raw weights in the sections below are these three.
- **Focus:** fields and buttons show `--focus` when focused by keyboard; a focused field's border turns `--brand`.
- **While a Build runs:** New Project, Demo, Undo and Redo are disabled (opacity .4, not pressable, tooltip "Wait for Bob to finish this Build"). Download code and Show me around still work.
- Undo and Redo cover every change to the Project (Ctrl+Z, Ctrl+Y or Ctrl+Shift+Z). Inside a text field, the field's own undo wins. The Warnings stepper opening folded Blocks to show a Warning is not an undo step.

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
| Checkpoint Block (after a Build, ADR 0005) | Stands for the built site, in the Site Block's place. It isn't in a category: `--idle` fill, 2px dashed `--muted` border, radius `--r-block`, the frame's padding, no bottom edge, no separate inside fill. Header: the `checkpoint` icon, "Checkpoint N", or "Checkpoint N · <name>" once named (weight 900), then "the built site" (`--fs-sm`, `--hint`, weight 600). It holds the locked Pages, then any new Page Blocks. It moves around the Canvas like the Site Block, but can't be folded or deleted. |
| Locked Page | A page that is already built, one per `.html` file. `--surface` fill, 2px dashed `--muted` border, radius `--r-block`, no bottom edge. Header: the `checkpoint` icon, "Page "Shop"" (weight 900), then its file name (`--fs-sm`, `--hint`, weight 600, for example "shop.html"). Empty: "drop Blocks or Traits here" (`--hint`, italic). It can be dragged to reorder it inside the Checkpoint Block, but never out of it, and it can't be deleted. New Blocks and Traits dropped into it ask for changes to that page; a Trait dropped on the Checkpoint Block asks for a change to the whole site. There are no locked Blocks deeper than a page. |
| With a Warning | A 3px `--alert` ring (box-shadow, outside the bottom edge) and a badge at the end of the header: [Warnings](#warnings). |
| Flashing (jumped to from a Block chip) | A 6px `--flash` ring (box-shadow) that fades out over 1.4s. |

**Instance toggle strip** (Stretch, PRD §6): the first line inside an open Instance. A button styled like a folded chip (`--c4` fill, 2px `--c3` border, radius 8px, `--fs-sm`, hover `--ink` border). It reads "N Traits from Product card · ✎ N changed · show all", which shows every part. Then it reads "Hide what comes from Product card", which goes back to only the differences. Dropped items land at the end of the Instance.

**Header buttons.** Fold: a 24px circle, `--surface` fill, 2px `--c3` border, a 2px `--c3` bottom edge, holding a 12px `caret-down` icon that turns −90° when folded ([Motion](#motion)). Color: 24px tall, padding 0 10px, radius `--r-pill`, same style. Hover on both: `--c4` fill, `--ink` border. Edit: a pill with `--c4` fill, 2px `--c3` border and a 2px `--c3` bottom edge, weight 800, padding 3px 11px.

**Markers** (pill, `--surface`, 2px `--c3`, `--w-bold` `--fs-xs`, padding 1px 7px): `✎ changed here` on a part inside an Instance whose value, name or Note was changed (the Instance's own name is always its own, so it never counts); `+ only here` on a part added only to that Instance.

**Menu** (right-click, see [Menus](#menus)): Add Note / Delete Note · Duplicate · Delete Block. Stretch (PRD §6), with Custom Blocks: Edit Custom Block · Change color… · Bring back removed parts (N) · Use the Custom Block's version · Make Custom Block. Each item appears only when it applies.

## Trait

A sticker stuck onto the Block it describes. Uses its category's `--c1`–`--c3`.

**Sticker:** `--c1` fill, a 2.5px white border (the die-cut edge), then a 1.5px `--c3` ring and a 3px `--c3` bottom edge (`box-shadow: 0 0 0 1.5px var(--c3), 0 3px 0 1.5px var(--c3)`), radius `--r-pill`, padding 3px 4px 3px 10px, min-height 32px, gap 6px, weight 900, no wrap. Content: icon ([Icons](#icons)) and label, then the value field, then an optional Note field ([Note](#note)), then an optional marker (`✎` or `+`, see [Block](#block)), then a Warning badge if it has one ([Warnings](#warnings)).

**Straight** (D-Q23): stickers never tilt. Only Notes sit crooked ([Note](#note)).

**Value fields.** Values are edited in place, never in a side form.

| Kind | Look | Used by |
|---|---|---|
| Text | White pill, no border, an inner top shade (`inset 0 2px 0 #0000000f`), radius `--r-pill`, padding 3px 10px, weight 800. Width = characters + 1, from 3 to 34. Enter commits. | text, fake data, tell Bob, let Bob pick |
| Long text | Past 30 characters a `⤢` button appears. It opens a 280px textarea (radius 12px, wraps, grows with content); `⤡` shrinks it back. The sticker's radius becomes 18px. | same |
| Dropdown | A button as wide as its current value: `--c4` fill (a pale wash, so it reads as a control and not as the sticker), no border, an inner bottom shade (`inset 0 -2px 0 #00000014`), weight 900, radius `--r-pill`, padding 3px 24px 3px 10px, an `--ink` triangle caret 9px from the right. Hover: `--surface` fill. Clicking opens its list (below). The last two items are always "💡 Bob picks" (below) and "custom…", which swaps in a text field and a `▾` button back to the list. | font, vibe, size, position, on click, purpose, image, video |
| Color | A chip filled with the chosen color itself: radius `--r-pill`, padding 3px 9px 3px 10px, a 1.5px `#0003` ring (so white still shows on the sticker's white edge), weight 900. On it the color's name ("orange"), or its hex in uppercase `--font-mono` for a custom color, then a 9×6 caret. The text is `--ink`, or white when white has more contrast on that color (WCAG). Clicking opens the color menu (below). | color |

**Dropdown sources.** "on click" starts with "pick one", then "go to page › Shop" for each Page Block inside the Site Block or the Checkpoint Block (locked Pages too), never loose Pages, since those aren't built; then "open popup › Sign up" for each Popup on the same page; then its actions (PRD §11). If the Page or Popup it points to was deleted, it shows "go to missing page" or "open missing popup" with `--alert-bg` fill and a 1.5px `--alert` border, the tooltip "What this pointed to was deleted. Pick another one.", and a Warning ([Warnings](#warnings)). Image lists the Library's images and video the Library's videos (empty: "pick from Library"). The sound Trait and "plays a sound" are Stretch (PRD §6): leave them out of the palette and the list until sound ships.

**Dropdown list:** styled like the color menu: the Trait's label with a capital first letter as its title ("Font", "On click"), then one item per option in the context menu item look ([Menus](#menus)); the current one is weight 900 with a ✓ on the right. A 2px `--line-soft` line, then "💡 Bob picks" and "custom…". Font options show in their own font; a missing one keeps the `--alert-bg` fill, `--alert` border and tooltip. It opens under the button, on the current item. Keys: ↓, ↑, Enter or Space on the button opens it; ↑/↓ and Home/End move; Enter or Space picks; Escape or Tab closes; focus goes back to the button. It pops in like the context menu.

**Color menu** (PRD §11): the title "Colors" (weight 900), then two rows of six 26px round swatches (2.5px white border, 1.5px `#0003` ring; the chosen one gets a 2.5px `--ink` ring; each swatch's tooltip is its name), then "Any color" with a 44×26px color input and the current hex (uppercase `--font-mono`). It opens under the chip, pops in like the context menu, styled like the context menu ([Menus](#menus)). Bob receives a preset as its name and hex (`mint (#A8E6CF)`) and any other color as its hex. These are the website's colors, not Scrabby's. The 12 presets (ticket 22; the default is in PRD §11):

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

## Note

Free text for Bob on a Block or a Trait. Added and removed with right-click → Add Note / Delete Note.

- **On a Block:** a sticky note under the header, with no tape (D-Q27). `--note-bg` fill, no border, radius 2px 2px 10px 2px (a curled corner), 190px wide, padding 14px 12px 10px, weight 700 `--fs` `--note-text`, line-height 1.35, tilted −1.6° (the only tilted thing in the app, D-Q23), shadow `0 4px 8px #0000001f`. Inside: a borderless, vertically resizable textarea (placeholder "Note for Bob"). A `×` button at the top right in `--note-text` at 60% opacity.
- **On a Trait:** a small field inside the sticker, straight. `--note-bg` fill, 1.5px `--note-edge` border, radius `--r-pill`, padding 3px 9px, weight 700 `--note-text` (placeholder "note for Bob"). Width = characters + 1, from 8 to 30.

## Palette

Where Blocks and Traits come from. It sits left of the [Canvas](#canvas) inside the same panel.

- **Shape:** the category column and the palette together are one rounded square: a 2px `--line-soft` border, radius `--r-panel`, clipped. Folded, the column alone keeps that shape.
- **Category column:** 66px wide, `--surface`, padding 8px 0, gap 4px. At the top, a 28×28px fold toggle (⟨ / ⟩; `--surface`, 2px `--line`, radius 9px, a 2px bottom edge) folds the palette. Each category: 60px wide, padding 6px 2px, radius 12px, a 22px circle (`--c1` fill, 2px `--c3` border, a 2px `--c3` bottom edge) above its label (`--w-bold` 10.5px, `--text`, centered). Hover: `--brand` label. The category scrolled to gets a `--soft` fill. Clicking one scrolls the palette to it. Order: Pages, UI, Primitives, Design, Behavior, Content, Talk to Bob, My Blocks.
- **Palette:** 232px wide, `--soft` background, 2px `--line-soft` left border, padding 6px 14px 60px, a 15px weight-900 heading per category, 8px gaps. A Block shows as a small toy piece: its icon ([Icons](#icons)) and label, `--c1`, 2px `--c3`, radius 12px, a 3px `--c3` bottom edge, padding 7px 12px 15px, weight 900, with a 5px `--c4` bar 5px from the bottom and 10px from each side (the mouth). It lifts 2px on hover. A Trait shows as a straight [Trait](#trait) sticker (icon and label, padding-right 12px) with no value field.
- **Delete by dragging back:** while a Block or Trait is dragged over the palette, the palette turns `--trash`. The Site Block, the Checkpoint Block and locked Pages can't be deleted. A locked Page released outside its Checkpoint Block goes back.
- **My Blocks** (Custom Blocks are a stretch goal, PRD §6: leave this category out until the must tier ships): a "Make a Custom Block" secondary button ([Buttons](#buttons)), the hint "Or right-click a Block on the Canvas and choose "Make Custom Block".", then one row per Custom Block: its palette Block (puzzle icon and name, in its own color; tooltip "N Instances") and an **Edit** secondary button that opens its edit view.

## Canvas

The dotted paper. It sits right of the [Palette](#palette).

- Dotted paper (D-Q26): `--ws` background with the `--ws-dot` dots (`radial-gradient(var(--ws-dot) 1.6px, transparent 1.8px)`, 24px apart). Cursor: grab over empty space, grabbing while panning.
- **Pan:** drag empty space, or hold the middle button anywhere; scroll also pans. Panning stops when only a corner of the Blocks is still in view (40px). Arriving on the Canvas (back on Plan, or a new Project) shows the Site or Checkpoint Block's top-left corner 40px in from the Canvas corner, at 100%.
- **Zoom:** Ctrl + scroll or pinch, at the pointer, from 30% to 200%. Zoom buttons stacked at the bottom right: +, −, = with 8px between them. Each is a 42px circle, `--surface`, 2px `--line` border, a 3px `--line` bottom edge, with an 18px `--text` icon ([Icons](#icons)). ×1.25 per click; = goes back to 100% and shows the Site or Checkpoint Block's top-left corner 40px in. In Plan the big Build button takes the corner (20px in from the right, 22px from the bottom), and the zoom buttons stack 14px above it, right edges lined up (D-Q8).
- **Dragging:** the app's own pointer code, not the browser's drag-and-drop. A drag starts after 4px of movement. Closest-edge drop: the middle of a Block drops into it, near an edge drops beside, above or below it. Passing over things moves nothing: a Block's gap moves only after the pointer rests on a new spot for 250ms, and a chosen spot holds until the pointer is 12px past it. How things move: [Motion](#motion).
- **Drop indicator:** a 4px `--drop` line, radius 3px, a 2px white halo, at the closest edge. For a Block, a `--drop-gap` placeholder its size (radius `--r-block`, or `--r-pill` as a chip in a folded Block) opens where it will land, and the Blocks around it slide aside. A Trait opens no gap, so nothing moves: the target Block gets its highlight ring, a short line marks the spot between its stickers, and the sticker lands there on release. Where nothing can take the item (for example a Page over a Hero, or anywhere outside the definition in a Custom Block's edit view), no indicator shows, and on release (or on Esc during any drag) a new item's copy fades away where it was let go, while a moved item's copy flies back to its spot ([Motion](#motion)). Dropping an item back on its own spot changes nothing and adds no undo step.
- **Empty hint** (PRD §9): while the Site Block holds no Page Block, its inside grows to 120px and shows, centered, "Drag a Page into your Site to start." (`--hint`, `--fs-md`, weight 700, italic). It disappears once a Page is inside.
- **After a Build:** the Build's Blocks leave the Canvas. It holds the Checkpoint Block in the Site Block's place, plus any loose ideas ([Block](#block), ADR 0005).
- **Warnings:** marks on Blocks and Traits, and a stepper at the top right: [Warnings](#warnings).
- **Custom Block edit view** (Stretch, PRD §6): the Canvas shows only the definition, with the edit bar ([Menus](#menus)) across the top.

## What Bob would read

Removed: users never see what Bob reads (ticket 05).

## Tooltip

One short sentence about a Block or Trait type (PRD §11), shown when the pointer rests on it. It takes the place of an Assistant in Plan.

- **When:** after the pointer rests about 0.5s on a Block's header or a Trait sticker, in the palette or on the Canvas. It hides when the pointer leaves, a drag starts or a menu opens. Never during a drag, and only one at a time. It fades in over `--t-quick`.
- **Look:** `--surface`, 2px `--line`, radius 14px, `--shadow-menu`, padding 9px 12px, max-width 260px, with a 5px left edge in the item's `--c3`. First line: the type's icon ([Icons](#icons)) and name, weight 900 `--ink`. Second line: the sentence, `--text` `--fs` weight 600, line-height 1.4.
- **Place:** 8px below the item, left edges lined up. If there's no room below, it goes above. It always stays inside the window.
- **Text:** the type's tooltip sentence from PRD §11, kept in the type's definition, for example Hero: "The big first thing people see on a page: a headline, a picture, a button."
- **Checkpoint Block and locked Page:** titled "Checkpoint" and "Built page", with the `checkpoint` icon; the left edge is `--muted`, since they have no category.
- **Loose idea:** a third line, "Loose idea: Bob ignores it until you move it into {the Site / the Checkpoint}." (`--hint`, `--fs-sm`, italic). "the Site" becomes "the Checkpoint" once the Checkpoint Block is on the Canvas; the Page sentence swaps the same way (PRD §11).

## Speech bubble

Bob talking: the show-around, the one-time tip, the limit message and the blocked-Build message (PRD §8–§10). The show-around is **drop order 1** if Bobcoins run low (PRD §6): the first feature to go.

- **Look:** `--surface`, a 2.5px `--bob` border, radius 18px, a 5px bottom edge (`0 5px 0 color-mix(in srgb, var(--bob) 25%, transparent)`), padding 12px 14px, max-width 280px, `--ink` weight 700 `--fs-md`, line-height 1.4. A tail on the side that faces its target points at it: a 20px square with the same border on its two outer sides, turned 45°.
- **Bob:** his full figure (74px tall, [Brand and Bob](#brand-and-bob)) stands on the bubble's top corner on the side away from the target, overlapping the border by 10px. The bubble pops in ([Motion](#motion)) and Bob hops once. The limit and blocked-Build messages leave Bob out (they sit next to small buttons).
- **Target:** what the bubble points at gets a 3px `--bob` ring (offset 3px, following its corners). The rest of the screen isn't dimmed.
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

- **Context menu** (right-click): `--surface`, 2px `--line`, radius 14px, `--shadow-menu`, padding 6px, min-width 210px, `--fs-md` weight 700. Item padding 8px 12px, radius 9px; hover `--brand-tint` fill with `--brand` text. It pops in from 96% scale over `--t-quick`. Escape or a click outside closes it.
- **Modal:** a backdrop of `--brand` at 88% over the whole app. The box is centered, 100px from the top, `--surface`, radius `--r-card`, a 6px bottom edge of `#0000002e`, overflow hidden, `--text` weight 600 body text. Its header is 56px tall, `--brand` fill, with the title centered in white 18px weight 900. The body has padding 24px. Buttons sit at the bottom right, gap 8px. The box pops in ([Motion](#motion)). Used for:
  - **The New Project warning** (PRD §9). Title "Start a new Project?", body "Only one Project is saved, so this one will be replaced, Blocks and all. Download code first to keep a copy of the website's code." Buttons: **Download code** (Secondary), **Cancel** (Text), **Start a new Project** (Primary).
  - **The demo warning** (PRD-43), only if the current Project isn't empty. Title "Load the demo?", body "This replaces your current Project, Blocks and all. Download code first to keep a copy of the website's code." Buttons: **Download code** (Secondary), **Cancel** (Text), **Load the demo** (Primary).
  - **The Checkpoint warning** (ADR 0005), before **Go back to this** or **Edit its Blocks** in [Checkpoints](#checkpoints). Title "Go back to Checkpoint N?" or "Edit the Blocks of Checkpoint N?". Every "Checkpoint N" here reads "Checkpoint N · <name>" when that Checkpoint has a name. Body, one paragraph per line:
    - Go back: "Your code goes back to how it was at Checkpoint N." Edit its Blocks: "Your code goes back to how it was before the Build of Checkpoint N, and its Blocks come back so you can change them." On Checkpoint 1: "This remakes the website from scratch. Your code is cleared and the Blocks of Checkpoint 1 come back so you can change them."
    - "The next Build may come out different."
    - With hand edits not in any Checkpoint: "Your current code, with your hand edits, is saved first as a new Checkpoint, so you can come back to it." Otherwise: "Your current code is already saved as Checkpoint N."
    - Only with unbuilt Blocks on the Canvas: "Blocks you have not built yet become loose ideas."
    - Only with an Assistant change not yet accepted: "The Assistant's unaccepted changes will be dropped."
    - Buttons: **Cancel** (Text), **Go back** or **Edit its Blocks** (Primary).
  - **The unaccepted-changes warning** (ticket 08), when Build is pressed while an Assistant change is not yet accepted. Title "Build now?", body "The Assistant has changes you haven't accepted. Building drops them." Buttons: **Cancel** (Text), **Build anyway** (Primary).
- **Custom Block color menu** (Stretch, PRD §6): title "Custom Block color" (weight 900), a row of 26px round preset swatches (2.5px white border, 1.5px `#0003` ring; the chosen one gets a 2.5px `--ink` ring), then "Any color" with a 44×26px color input.
- **Custom Block edit bar** (Stretch, PRD §6): across the top of the Canvas. `--edit-bar` fill, a 3px bottom edge of `#0000001a`, `--ink` weight 800 `--fs-md`, padding 8px 14px. Text: "Editing Custom Block "X". Changes reach all N Instances, except parts an Instance changed itself." A **Done** button on the right: `--surface`, no border, radius `--r-btn`, a 3px `#0000001f` bottom edge, padding 6px 16px, weight 900.

## Buttons

Every button with a fill or a border has a bottom edge and presses down ([Motion](#motion)).

| Kind | Look | Example |
|---|---|---|
| Menu bar | No fill, no border, white weight-800 13px, icon then label, gap 6px, radius 10px, padding 7px 11px. Hover: white at 15% fill. Disabled: opacity .4. No bottom edge. | New Project, Demo, Download code, Undo, Redo, Show me around |
| Primary | `--brand` fill, white weight 900 `--fs`, radius `--r-btn`, padding 8px 16px, a 3px `--brand-dark` bottom edge. | Upload, Try again, Next, Got it |
| Secondary | `--surface`, 2px `--line`, radius `--r-btn`, padding 8px 12px, weight 800 `--text`, a 2px `--line` bottom edge. | Make a Custom Block, Download code (in modals) |
| Ghost (small secondary) | `--surface`, 2px `--line`, radius `--r-btn`, padding 5px 11px, weight 800 `--ink`, a 2px `--line` bottom edge, icon then label with gap 6px. Hover: `--brand` border. | ← Back to the Blocks, Send, Go back to this, Edit its Blocks, Reject all, Review, ↻ |
| Accept | `--surface`, 2px `--go` border, a 2px `--go` bottom edge, radius `--r-btn`, padding 5px 11px, weight 900 `--ink` label after a `--go` ✓ icon. | Accept all |
| Text | No fill, no border, `--text`, weight 700, padding 5px 6px. Hover: underline. | Skip, Cancel, Dismiss |
| Icon | See the header buttons in [Block](#block). | fold, Color |

The Build button is its own component: [Build button and Build card](#build-button-and-build-card).

**White text on color** (D-Q7): white labels sit only on `--brand`, `--bob` (both at least 5:1), `--ink`, or on `--go` at 19px weight 900 or larger. Every other green, tomato or category-colored mark is an outline, a fill behind `--ink` text, or an icon next to `--ink` text.

## Library

A tab beside Canvas ([Shell](#shell)). Assets are never dragged onto Blocks; the image and video Traits pick them from a dropdown ([Trait](#trait)). **Hackathon build: images and video.** Sound is Stretch (PRD §6); it comes with its Trait and tile icon.

- Panel padding 16px. Heading "Library" (`--fs-lg` weight 900), hint "Images and videos for this Project. Pick one inside an image or video Trait." (`--fs-sm`, `--hint`).
- A primary "Upload" button ([Buttons](#buttons)) that accepts image and video files.
- A responsive grid of tiles, gap 12px: as many columns as fit, each at least 168px wide, tiles stretching to fill the row. A tile is at least 168px tall, padding 8px: `--surface`, 2px `--line` border, a 3px `--line` bottom edge, radius `--r-panel`, centered, lifting 2px on hover. Each tile shows the image itself (fit inside, the tile's full width and 124px tall, radius 8px), then the file name (`--fs-sm` weight 700, one line, ending in "…" if long). A 40px `--hint` image icon ([Icons](#icons), duotone) stands in while an image loads or if it can't be shown. A video tile shows a 40px `--hint` `video-camera` icon (duotone), then the file name.
- **Empty:** centered in the panel, Bob's head (48px, white, 2px `--line` ring) above "Nothing here yet. Upload an image or a video." (`--hint`, `--fs-md`, weight 700), like the empty chat ([Assistant](#assistant)).

## Code editor

The middle column of Try & tweak ([Screen layout](#screen-layout)). CodeMirror 6 with the `@codemirror/merge` add-on (W-10). The editor is dark, unlike the rest of the app, and tinted toward Grape so it still belongs (D-Q25): it says "this is real code". Its panel has radius `--r-panel`, no border, and a 3px `#0000002e` bottom edge. Its local colors:

```css
.code-editor {
  --ed-bg: #1E1B2E;  --ed-text: #DCD8EA;  --ed-tabs: #16131F;  --ed-tab-text: #8F89A6;  --ed-rule: #2A2640;
  --ed-line-no: #5E587A;  --ed-flash: #4A4420;  --ed-dot: #FFE14D;
  --ed-tag: #7CC4FF;  --ed-attr: #C3A6FF;  --ed-string: #FFCF7A;  --ed-comment: #6E6890;
  --ed-add: #1E4D2F;  --ed-del: #5A2A2E;   /* Bob's suggested changes, before the user decides */
}
```

- **File tabs:** a strip in `--ed-tabs`, one tab per Prototype file. Tab: no border except a 1px `--ed-rule` right edge, `--ed-tab-text` weight 700 12.5px, padding 9px 14px. Open tab: `--ed-bg` fill, white text. A file the last Build changed gets an `--ed-dot` "●" after its name (tooltip "changed by the last Build").
- **Undo and Redo:** two small buttons at the right end of the tab strip, "↶" (tooltip "Undo (Ctrl+Z)") and "↷" (tooltip "Redo (Ctrl+Y)"), in the tab text style, acting on the open file's own history and dimmed when there is nothing to undo or redo. Ctrl+Z, Ctrl+Y and Ctrl+Shift+Z do the same inside the editor and never reach the app's Undo.
- **New file:** a "+" button after the last tab (tooltip "New file") opens an inline field in the tab strip (placeholder "name.html, .css or .js"); Enter creates the file and opens it, Escape or leaving the field cancels. A wrong or taken name shows one line under the strip in `--ed-tab-text`: "Use a name like about.html, extra.css or games.js." or "<name> already exists."
- **Before the first Build:** no file tabs; the editor area shows "No code yet. Build your website first." centered (`--ed-tab-text`, `--font`, weight 700 `--fs-md`).
- **Code:** `--font-mono` 12.5px, line-height 1.75, `--ed-text` on `--ed-bg`, 10px padding top and bottom. Line numbers: a 40px column, right-aligned, 12px right padding, `--ed-line-no`, not selectable. Syntax: tag names `--ed-tag`, attribute names `--ed-attr`, quoted values `--ed-string`, comments `--ed-comment` italic, property names `#7CC4FF`, keywords `#FF9EC7`, numbers and booleans `#FFB86B`, type and class names `#8BE9C4`, punctuation and angle brackets `--ed-line-no`. The cursor's line has a `#FFFFFF08` background; matching brackets are marked.
- **Search:** Ctrl+F opens CodeMirror's search panel at the top (Ctrl+H or Ctrl+Alt+F replace per CodeMirror defaults, F3 next). Panel on `--ed-tabs` with `--ed-text` text, fields on `--ed-bg` with a 1px `--ed-rule` border, buttons like the tab text. Matches `#F5C73D33` with a 1px `#F5C73D80` outline, the current match `#F5C73D66`. Selecting a word highlights its other uses the same way.
- **Changed lines** from the last Build: no background tint; a 3px bar in the marker gutter, `#5FD38D` at 70% opacity. A file the base does not have (every file after Build 1) gets no bars at all, only its tab dot.
- **Block marker:** a narrow gutter left of the line numbers. On the first line of each Block's code, an 8px circle in that Block's category color (`--c1` fill, 1px `--c3` ring). Tooltip: "<Name> Block · Show in Checkpoints". Clicking it opens Plan on the Checkpoints tab, at the Checkpoint whose Build made that code ([Screen layout](#screen-layout)). Finding a Block's first line depends on the data-block rule in AGENTS.md.
- **Scrollbars** in the editor, the merge view and the tab strip: dark and thin (`scrollbar-width: thin; scrollbar-color: #4A5068 var(--ed-bg)`, and for WebKit 8px, thumb `#4A5068` radius 8px, track `--ed-bg`, thumb hover `#5B6278`).
- **Flash:** the line jumped to from "See its code" gets `--ed-flash` for 1.5s and scrolls to the center.
- **Bob's suggested changes** (from the [Assistant](#assistant); its Review button opens the file on them): shown inline in the file with the add-on's unified merge view. Removed lines on `--ed-del` with struck-through text, added lines on `--ed-add`. Each change carries its own two buttons, restyled from the add-on's defaults: **✓ Accept** (no fill, 1.5px `--flag` border, `--ed-text` label after a `--flag` ✓, weight 800 11px `--font`, radius 9px, padding 2px 9px) and **✕ Reject** (no fill, 1.5px `--ed-line-no` border, `--ed-text`, same size). This is the only place to decide change by change (PRD-22). Bob's diff card then shows what happened. A decided change leaves the merge view: accepted text stays as normal code, rejected text disappears.

## Preview

The left and widest column of Try & tweak ([Screen layout](#screen-layout)): the live, clickable Prototype.

- **Address bar:** a panel sub-bar ([Shell](#shell)), gap 8px, weight 700 12.5px `--text`. Left to right: a ↻ ghost button (reload, [Buttons](#buttons)); once built, the full-size ghost button (`arrows-out`, or `arrows-in` in full size); the address pill (`--surface`, 2px `--line-soft`, radius `--r-pill`, padding 4px 12px, fills the space), for example "mayas-bake-sale / index.html"; the current Checkpoint, "Checkpoint N" or "Checkpoint N · <name>" once named; then the **Pause live updates** switch.
- **Before the first Build:** the page area is `--ws` with the dots, and in its center "Press Build to make your website." (`--hint`, `--fs-md`, weight 700). The address pill reads "not built yet" and the Checkpoint and the full-size button are left out.
- **Page:** the Prototype (plain HTML, CSS and JS, W-9) fills the rest on white, in a sandboxed `srcdoc` frame. Its page links, popups and fake form submits work, as on a real website. It redraws by itself a moment after the user stops typing (W-16). There is no phone/desktop width switch (W-17). The Prototype's own look is whatever the Blocks asked for; Scrabby's tokens never leak into it.
- **Full size:** the full-size button lifts the whole Preview panel (address bar, paused strip, page, error bar) out of Try & tweak. It floats 24px inside the window on every side, with the panel's 2px `--line` border, `--r-panel` radius and 3px bottom edge, over the app dimmed by the dialogs' backdrop (`--brand` at 88%). The page doesn't reload. The button (now `arrows-in`, "Back to normal size"), a click on the backdrop or Esc goes back; Esc only works while the app has focus, since keys pressed inside the website stay in the website. **Ask Bob to fix it** goes back first, so Bob's answer shows. How it moves: [Motion](#motion).
- **Pause live updates switch** (W-16): the label "Pause live updates" (`--fs-sm`, `--text`), then a 32×18px switch: an `--idle` track with a 14px white knob (a 2px `#0000001f` bottom edge) on the left when off; a `--brand` track with the knob on the right when on. The knob slides with `--spring`. Off by default. It's there so a quiz or to-do list can be tried out without resetting at every keystroke.
- **Paused state:** a strip under the address bar, `--note-bg` fill, 1.5px `--note-edge` bottom border, padding 5px 10px, `--note-text` weight 700 `--fs-sm`: "Live updates are paused. Press ↻ to see your latest code." While code has changed since the last redraw, ↻ carries a 7px `--brand` dot. Builds, accepted Bob changes and page switches still redraw, and turning the switch off redraws once.
- **What changed** (W-17): after a Build or an accepted Bob change redraws the page, each changed part of the page gets a 4px `--flash` outline (offset 3px, radius 14px) that fades out over 1.5s, once. The changed parts are the innermost Blocks whose markup changed, found through the data-block rule in AGENTS.md. A change to CSS or JS alone flashes nothing, and typing never flashes.
- **Error bar** (PRD §10; **drop order 2** if Bobcoins run low): when the page throws an error, a bar is pinned to the bottom of the page area. `--alert-bg` fill, a 2px `--alert` top border, padding 8px 10px, gap 8px. It holds a 22px `--alert-dark` circle with a white "!" (weight 900), "Something on this page isn't working" (weight 900 `--ink`), then the error itself (`--fs-sm`, `--text`), then at the right an **Ask Bob to fix it** ghost button (or **Open the file** if the Assistant drops). It slides up over `--t-pop` with `--spring`, and goes away once the page runs without an error.

## Assistant

**Drop order 3** if Bobcoins run low (PRD §6): it goes after the show-around and the Preview error bar. The right column of Try & tweak, 320px wide. It appears nowhere else (ticket 08: Plan has tooltips instead). What it sees and can change belongs to the PRD lane (ticket 08, `docs/prd.md` §5). In the UI it is always called **Bob** (W-14).

- **Title bar:** `--bob-tint` fill, 2px `--line-soft` bottom border, padding 10px 12px. Bob's head (a 28px avatar, [Brand and Bob](#brand-and-bob)), 8px, "Bob" (weight 900 `--fs-lg`, `--bob`), then the [Bob badge](#bob-badge) (its own 8px gap).
- **Explanation picker** (PRD §5), right under the title bar: a panel sub-bar ([Shell](#shell)), padding 8px 12px so it lines up with the title and the chat. "Explain:" (weight 700 `--fs-sm`, `--text`), then a segmented control: one pill with a 2px `--line` border and three segments, **very simply · simply · in detail** (weight 700 `--fs-sm`, padding 3px 10px, `--text`). The chosen segment gets `--brand` fill and white text (the user's choice, so Grape). The default is "simply". No ages are shown.
- **Chat:** `--surface`, padding 12px, gap 10px, scrolls. When already at the bottom, it stays pinned there as messages arrive. It is saved with the Project, so it's still there after a reload. New messages pop in ([Motion](#motion)).
- **Empty chat:** centered in the chat area, Bob's head (a 48px avatar), then 10px below it "Ask Bob what a part of your code does, or ask for a change." (`--hint`, `--fs-md`, weight 700).
- **Bob is answering:** from the moment Send is pressed, the question shows and under it a Bob message (same look as Bob's messages, with his head) holding three 9px `--bob` dots, then 8px, "Bob is thinking…" (`--hint`). Until the server accepts, these two live in the panel only; a limit message removes them and puts the text back in the input. The dots bounce in turn: each rises 4px and settles, 0.15s apart, in a 1s loop (reduced motion: the dots fade in turn). The first words replace them; from then until the answer ends, three 7px dots bounce the same way under Bob's text, so it's clear he's still working. The Send button is disabled until the answer ends.
- **Messages:** padding 9px 12px, radius 16px, weight 700 `--fs`, line-height 1.45. The user's: max-width 90%, right-aligned, `--brand` fill, white text, the bottom-right corner 5px, a 3px `--brand-dark` bottom edge. Bob's: left-aligned with his head (a 24px avatar) 6px to the left, level with the bubble's bottom, the two together at most 95% wide; `--bob-tint` fill, `--ink` text, the bottom-left corner 5px, a 3px bottom edge of `--bob` at 20%. What's inside Bob's bubble (text, dots, diff card) stacks 8px apart.
- **Diff card** (inside a message from Bob, 8px below its text, as wide as the bubble): `--surface`, 2px `--line`, radius `--r-btn`, padding 10px, gap 6px, `--font`. It shows **no code** (PRD-22):
  1. **Summary:** 1–3 short lines in plain words, written by Bob, weight 800 `--ink`, line-height 1.45 (for example "Makes the treat cards rounder, with a small hop on hover").
  2. **Files:** one line, `--fs-sm` weight 700, `--text`, the file names in `--font-mono` ("style.css, treats.html").
  3. **Buttons** (under a 2px `--line-soft` line, 8px above and below it, gap 6px, wrapping): **Accept all** (Accept button), **Reject all** and **Review** (ghost buttons, [Buttons](#buttons)). Review opens the [Code editor](#code-editor) on the changes, where each one is accepted or rejected on its own.

  | State | The buttons row becomes |
  |---|---|
  | Open | Accept all · Reject all · Review |
  | Accepted | A `--go` ✓ icon, then "Accepted, in your code now" (weight 900 `--ink`). The Preview reloads. |
  | Rejected | "Rejected" (weight 900 `--muted`) |
  | Some changes accepted, in Review | "N of M changes accepted" (weight 900 `--ink`) |
  | Out of date (a file this card touches changed after Bob suggested it, by a Build or by the user's typing, PRD-23) | An "Out of date" tag at the top of the card (`--alert-bg`, 1.5px `--alert`, `--ink` `--fs-xs` weight 900, radius `--r-pill`, padding 1px 8px), then an **Ask again** ghost button and a quiet **Dismiss** text button ([Buttons](#buttons)). Accept and Review are gone. Dismiss means the same as Reject, and the card then reads "Rejected". |
- **Composer:** a panel sub-bar ([Shell](#shell)), padding 8px 12px, gap 8px. A pill input (`--surface`, 2px `--line`, radius `--r-pill`, padding 8px 14px, min-width 120px, placeholder "Ask about your code, or ask for a change"), then a ghost **Send** button. Enter sends.

## Bob badge

The product always calls its agent Bob. This badge names the model actually doing Bob's work (W-14).

- **Look:** a pill right after the word "Bob" or the title it sits in, gap 8px. `--bob` fill, 2px `--bob-dark` border, white weight-700 `--fs-sm`, radius `--r-pill`, padding 2px 9px.
- **Text:** "running on " + the model's plain name, for example "running on Gemini" or "running on IBM Bob". The server reports the name. The user never picks it.
- **Tooltip:** "Bob's answers come from Gemini right now." (with the model named).
- **Where:** Bob's title bar in Try & tweak ([Assistant](#assistant)), and the Build card's title row while a Build runs ([Build button and Build card](#build-button-and-build-card)). Nowhere else.

## Build button and Build card

**Build button:** `--go` fill, a white flag icon ([Icons](#icons), `flag`) then "Build" in white weight 900, letter-spacing .01em, gap 9px, no border, a `--go-dark` bottom edge. It presses down like every button ([Motion](#motion)). The label is at least 19px weight 900 in every size, so white on `--go` stays readable (D-Q7).

| Size | Look | Where |
|---|---|---|
| Big | 22px, padding 14px 30px 13px, 24px flag, radius 16px, a 5px bottom edge | Plan: the bottom right of the Canvas, with the zoom buttons stacked above it. The Build card before the first Build |

While a Build runs, every Build button reads "Building…", can't be pressed, and has opacity .6. There is no Stop.

**Nothing new to build** (ticket 08): after a Build, while no new Blocks or Traits are on the Canvas, the Build button is greyed: `--placeholder` fill, a `--muted` bottom edge. Pressing it starts nothing; a footer-less [Speech bubble](#speech-bubble) points at it: "Nothing new to build. To redo a Build, open **Checkpoints**". The word Checkpoints is a link that opens the Checkpoints tab.

**Build card:** the whole Build step ([Screen layout](#screen-layout)). Centered on the page, 560px wide (at most 100%), `--surface`, 2px `--line`, radius `--r-card`, a 6px `--line` bottom edge, padding 24px 28px 26px, gap 14px, `--ink`. Top to bottom:

1. **Title** (`--fs-xl` weight 900, gap 12px):

   | State | Title |
   |---|---|
   | No Build yet | "Nothing built yet", with a big Build button below. The Build stage shows the full stack with Bob standing still (no loop), and there are no chips. |
   | Running | a spinner, then "Bob is building your website" in `--bob`, with the [Bob badge](#bob-badge) at the right end of the title row |
   | Done | "✓ Build N done" (the ✓ in `--go`), with "Opening your website…" below. After 0.9s the step moves to Try & tweak by itself |
   | Failed | a 26px `--alert-dark` circle with a white "!", then "Build N did not finish" (`--ink`), with "Nothing changed: your code and Blocks are as they were." below (`--fs`, `--text`, weight 600). The card gets a 5px `--alert` top border. A failed Build writes nothing (ticket 29). |

2. **Build stage** (D-Q24): the thing that shows Bob is working, even when the runtime can't say which Block he's on. 150px tall, radius `--r-panel`, `--bob-tint` fill with dots (`--ws-dot`, 1.4px radius, 18px apart), an inner top shade (`inset 0 3px 0 #0000000d`), overflow hidden, `aria-hidden`. A caption at its top left, "Bob is putting your Blocks together…" (weight 800 `--fs-sm`, `--hint`). Bob (118px tall) stands at the right, 26px in, hopping ([Motion](#motion): a 1.2s loop that squashes to `scale(1.06, .93)`, jumps 12px, and lands with a small squash). A small stack builds itself in an 8s loop, on a 292px-wide base whose left edge is 32px from the stage's left and whose bottom is 14px up: the Site Block lands first as a lot, then small bricks drop inside it one after another, 0.28s apart, from 190px above, course by course from left to right, stacking into towers whose tops make a skyline. Each piece lands with a squash (`scale(1.12, .8)`), bounces up 6px (`scale(.95, 1.06)`) and settles, all with `--ease`. From 88% of the loop they pop away one by one (up to `scale(1.1)`, then to 0) and the loop starts over. Every piece sits inside the shape it stacks on: nothing overlaps, nothing covers the lot's header strip or the caption, even mid-bounce. Listed in drop order as category, then left, bottom, width × height, all straight:

   | # | Piece | Place and size |
   |---|---|---|
   | 1 | Site lot | 0, 0, 292×96 |
   | 2–6 | Page, Page, UI, Page, UI bricks | 8, 60, 120, 176, 240 at 8; 44, 52, 48, 56, 44 wide, 12 tall |
   | 7–11 | Primitives, UI bricks; Content sticker; Behavior, My Blocks bricks | 12 (36×12), 64 (44×12), 130 (28×8), 180 (48×12), 244 (36×12), at 22 |
   | 12–15 | Design sticker; Primitives, My Blocks bricks; Talk to Bob sticker | 18 (24×8), 68 (36×12), 186 (36×12), 250 (24×8), at 36 |
   | 16–17 | Behavior brick; Content sticker | 72 (28×12), 194 (20×8), at 50 |
   | 18 | Design sticker | 78, 64, 16×7 |

   Site lot: `--c4` fill, 2px `--c3` border, a 3px `--c3` bottom edge, radius 10px, a 14px `--c1` header strip with a 56×4px `--c4` bar standing for its name. Bricks: `--c1` fill, 1.5px `--c3` border, a 2px `--c3` bottom edge, radius 4px, a 2px `--c4` bar 2px from the bottom. Stickers: `--c1` fill, 1.5px white border, 1px `--c3` ring. **Done:** the loop stops with the full stack standing and Bob does one big hop (24px). **Failed:** the loop stops with the full stack standing, the stage turns `--alert-bg`, the top piece slides off the stack and drops out of view over 600ms (no spin), and Bob stops hopping. **Reduced motion:** the full stack and Bob stand still.
3. **Block chips:** one sticker per Block in this Build (every Block inside the Site Block or the Checkpoint Block that asks for something; the top Block itself gets none), wrapping, gap 7px. Each is in its category colors (`--c1` fill, 2.5px white border, 1.5px `--c3` ring and a 3px `--c3` bottom edge), weight 900, radius `--r-pill`, padding 4px 11px, with the Block's icon. A chip waits at opacity .3 and `scale(.94)`. A chip lights once Bob has written its Block's HTML (this depends on the data-block rule in AGENTS.md), and Bob stays on the newest lit chip until the next one lights: that chip is **working**, with a 2px `--bob` ring, breathing between opacity .45 and .75 ([Motion](#motion)), dimmer than done. The chips lit before it are **done** and pop to full ([Motion](#motion)). When the Build finishes, every chip is done, lit or not, and the Build stage carries the waiting. If the Build fails, every chip goes back to dim. **More than 12 chips** fold into one row (a ghost button, full width, 2px `--line`, radius `--r-btn`, weight 800 `--fs-md`): a fold chevron, "14 Blocks · 5 done", and at the right end the working chip while folded. It starts folded; a click unfolds the chip list below it and turns the chevron ([Motion](#motion), Fold / unfold).
4. **Notes and failure line** (no checklist): under the chips, the app writes what the Build skipped, not Bob: a problem in the plan that the Build skips (PRD §10: the Build still runs, so this is quieter than a failure), starting "Skipped:" (for example "Skipped: the Order button goes to a page that no longer exists."), and loose ideas on the Canvas, "1 loose idea skipped". Each: a `--note-edge` "–" in a 20px slot, gap 10px, then the line in weight 600 `--fs-md` `--text`, line-height 1.6. A failed Build adds its failure line below them: the 20px `--alert-dark` "!" circle, then the line in weight 900 `--ink` on `--alert-bg` (radius 8px, padding 2px 8px). The failure lines (ticket 29): the time cap, "Bob took too long, so this Build was stopped." · the step cap, "Bob ran out of steps before finishing, so this Build was stopped." · the model can't be reached or returns an error, "Bob couldn't be reached. Check your connection and try again." · a broken or incomplete answer, "Bob's answer came back broken, so this Build was stopped."
5. **After a failure:** **Try again** (Primary) and **← Back to the Blocks** (ghost) ([Buttons](#buttons)), gap 6px, 6px above. Try again runs the same Blocks again. ← Back to the Blocks opens Plan, where the Blocks are still on the Canvas and can be changed.

There is no progress bar: the runtime can't tell how far along a Build is, so the card never pretends to (D-Q24).

**Spinner:** a circle with a 4px `--idle` ring whose top quarter is `--bob`, turning once a second. 26px in a title; 15px with a 3px ring in a line.

**After a Build**, outside the card: its Blocks leave the Canvas, which now holds the Checkpoint Block ([Block](#block)); the [Checkpoints](#checkpoints) list gets a new entry; and each file it changed gets a dot on its tab and tinted lines ([Code editor](#code-editor)).

## Screen layout

From ticket 02. Three steps, and only one is on screen at a time: **1 Plan › 2 Build › 3 Try & tweak**. Under the menu bar sits the step bar ([Shell](#shell)), then the current step's area (`--page`, 10px padding, `--gap`).

| Step | What fills the screen |
|---|---|
| Plan | Canvas / Library / Checkpoints tabs ([Shell](#shell)) over one panel: the [Palette](#palette) and the [Canvas](#canvas), the [Library](#library), or the [Checkpoints](#checkpoints) list. The big Build button floats at the Canvas's bottom right, with the zoom buttons stacked above it. No code, Preview or Assistant. |
| Build | The [Build card](#build-button-and-build-card), centered. |
| Try & tweak | Three panels in a grid of `minmax(0,1.2fr) minmax(0,1fr) 320px`, gap `--gap`: [Preview](#preview), [Code editor](#code-editor), [Assistant](#assistant). If the Assistant drops (PRD §6), two panels: `minmax(0,1.2fr) minmax(0,1fr)`. Two 8px drag handles sit between the panels (`role="separator"`, `aria-orientation="vertical"`, title `Drag to resize, double-click to reset`): transparent, `cursor: col-resize`, a 2px `--line` bar in the middle that turns `--brand` on hover and while dragging. Dragging sets the columns in px, with minimums Preview 320, Code 320, Assistant 260; the rest stays with the Preview. While dragging, the handle has pointer capture, `body` gets `user-select: none` and the Preview iframe `pointer-events: none`. Left/Right arrow keys on a focused handle move it by 16px. Double-click resets to the default grid. The widths are kept in `localStorage['scrabby.tryCols']` (no storage = the default grid). |

**Moving between the steps:**
- Click Plan or Try & tweak in the step bar, or "← Back to the Blocks". While a Build runs, the step bar stays on Build.
- Pressing Build goes to the Build step. A successful Build goes on to Try & tweak by itself. A failed one stays on Build.
- **See its code:** select a Block that has code (a locked Page on the Canvas, or a Block in the Checkpoints list), then click its "See its code" button ([Block](#block)). Try & tweak opens on the file that holds the Block's code, and the Block's first line flashes ([Code editor](#code-editor)). This depends on the data-block rule in AGENTS.md.
- **Block chip:** clicking a chip in the code opens Plan on the Checkpoints tab, at the Checkpoint whose Build made that code, with that Block flashing and scrolled to the center.
- Whatever is jumped to scrolls smoothly to the center.

**Greeting** (PRD §9): when a page load finds the saved Project empty, a card sits over Plan, behind the same `--brand` backdrop as the replace warnings ([Menus](#menus)). A click on the backdrop does nothing. The card is 560px wide, radius `--r-card`, padding 32px 40px 36px, centered text. From the top: the logo big (Bob 160px tall, hopping once, and the wordmark 64px in `--brand`), the slogan "Ideas are best blocked out." (28px, weight 900, `--ink`), the line "Snap your idea together. Bob builds it for real." (`--fs-lg`, weight 700), then, in a centered column 12px apart, the big primary **Take me through the demo: Maya's bake sale** (`--brand` fill, white weight-900 16px, radius `--r-btn`, padding 12px 24px, a 4px `--brand-dark` bottom edge) and a Secondary **Start my own site**. The demo button loads the demo Project, then runs the Plan show-around ([Speech bubble](#speech-bubble)); **Demo** in the menu bar does the same, with a warning first when the Project isn't empty. Start my own site, or Escape, leaves the empty Project on the Canvas with the empty hint ([Canvas](#canvas)), and the show-around starts on the first visit. The card leaves as [Motion](#motion) says.

**Scrollbars:** thin and light app-wide (`scrollbar-width: thin; scrollbar-color: var(--placeholder) transparent`, and for WebKit 8px, thumb `--placeholder` radius 8px, transparent track, thumb hover `--hint`). The code editor has its own dark ones ([Code editor](#code-editor)); the Preview's page scrollbars belong to the user's website.

**Screen sizes** (D-Q6): design for 1920×1080, the demo recording. The smallest supported size is 1366×768: nothing may scroll sideways or get cut off there, and the palette folds to give the Canvas room. No tablets or phones.

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

## Warnings

Marks on the Canvas for problems in the plan (ticket 24). There is no list panel. Warnings never stop a Build: only a plan with no Site or no Page does ([Speech bubble](#speech-bubble)), and the Build card still lists what Bob skipped ([Build button and Build card](#build-button-and-build-card)).

- **What is checked:** only unbuilt Blocks and Traits inside the Site Block, or inside the Checkpoint Block after a Build. Built code is never scanned. The Checkpoint Block and locked Pages are valid link targets and are never marked. Loose ideas are never marked; their "not built" badge already says it. A new or focused Block or Trait gets its mark only once the user clicks or drags somewhere else. Everything else updates live.
- **Mark:** a 3px `--alert` ring (box-shadow) on the Block or Trait, plus a badge: a 20px `--alert-dark` circle with a white weight-900 12px character, "!" for "Bob skips it" and "?" for "worth a look". On a Block, the badge sits at the end of the header; on a Trait, at the end of the sticker, 2px after the last part. Its tooltip is the problem in words.
- **Popover** (click a badge): 300px wide, `--surface`, 2px `--line`, a 4px `--alert` top border, radius 14px, `--shadow-menu`, `--fs`. It opens 6px below the badge and stays inside the window, popping in ([Motion](#motion)). Inside, padding 10px 12px, gap 8px: the badge character in its circle, then:
  1. **Where:** a pill button (`--soft` fill, no border, radius `--r-pill`, padding 2px 9px, weight 800 `--fs-sm`, `--ink`; hover `--idle`) with the path, for example "Home › Big welcome › See the sale". Tooltip "Show it on the Canvas". Clicking it does what Show does.
  2. **What is wrong:** weight 900 `--ink`, line-height 1.4. For example: "Nothing opens the "Sign up" popup, so visitors never see it."
  3. **What to do:** `--text` weight 600, line-height 1.4, 2px above.
  4. **Buttons** (6px above, gap 6px, wrapping): ghost buttons ([Buttons](#buttons)). **Show** moves the Canvas to the item and flashes it ([Block](#block)); **Pick one** focuses its dropdown or field; one-click fixes, in `--alert-bg` with an `--alert` border, for example **Remove the link**, **Add it to "Top bar"**, **Let Bob fill it**; then **Close**. A click outside also closes it.
- **Stepper:** 12px from the top right of the Canvas. A pill: `--surface`, 2px `--alert` border, a 3px `--alert` bottom edge, radius `--r-pill`, padding 3px, weight 900 `--ink`: a ‹ button, "⚠ N to check" (padding 0 8px), a › button. The buttons are 26px circles, no border, `--alert-bg` fill, 14px glyph; tooltips "Previous" and "Next". Each press moves the Canvas to the next Warning in reading order (the Site first, then each Page, top to bottom through the Block tree) and opens its popover.
- **Nothing to check:** with no Warnings, a pill in the stepper's place: `--surface`, 2px `--go` border, a 3px `--go` bottom edge, radius `--r-pill`, padding 6px 12px, a `--go` `check` icon then "Nothing to check" in weight 900 `--ink`.
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

## Look decisions, 2026-09-26

Settled with the user on the look lab mockup (`prototypes/look-lab.html`). D-Q1 to D-Q13 are earlier decisions already written into the sections above. These decisions change the look only: what each screen holds and does (Checkpoints, Warnings, Bob picks, the Traits) follows PRD.md and TDD.md.

- **D-Q14** Direction: inspired by the block editor young coders know, but with its own identity, so it doesn't read as a clone. The problem with the old look was that it was washed-out and pastel. The personality is a mix of a chunky tactile toy (Blocks you could pick up and press) and crafty paper and stickers (sticker Traits, sticky-note Notes, a paper Canvas). References: Duolingo and Nintendo's Mario Maker.
- **D-Q15** Brand color Grape `#6B4EFF`: Scrabby and the user.
- **D-Q16** Bob blue `#315DFB` (the mascot's own blue) is Bob's color: it marks Bob and only Bob, next to Grape.
- **D-Q17** Nunito for the whole app; JetBrains Mono for code.
- **D-Q18** Category colors at Medium strength (71% lightness), replacing the 82% pastels.
- **D-Q19** Springy toy motion. The chunky bottom edges stay as in the mockup: 4px on Blocks, 5px on the big Build button (4px on the normal one), 3px on panels and primary buttons, 2px on small buttons, and they press down on click.
- **D-Q20** The mascot is Bob, the builder robot in `assets/Scrabby_2.svg` (a clean vector). The logo is Bob plus the "Scrabby" wordmark. Bob's pose stays exactly as drawn.
- **D-Q21** Problems are soft tomato `#FF5A4E`, not orange.
- **D-Q22** No black cartoon outlines in the UI; they stay on Bob's artwork.
- **D-Q23** Only Notes tilt (−1.6°). Everything else is straight: Blocks, Trait stickers, loose ideas, dragged items, chips, the Build stage and Bob. (Tilted stickers and a tilted loose idea were tried in the mockup and dropped.)
- **D-Q24** The Build step shows a Build stage (Bob hopping beside a stack of Blocks that builds itself), so even when a Build can't light up each Block or Trait as it goes, you can still see that Bob is working. There is no progress bar.
- **D-Q25** The code editor stays dark, tinted toward Grape.
- **D-Q26** The Canvas is dotted paper (`--ws` with `--ws-dot`), not graph paper or kraft paper.
- **D-Q27** Notes have no tape: a plain sticky note with a curled corner and a soft shadow.
