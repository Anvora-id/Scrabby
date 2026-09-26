<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
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
   | No Build yet | "Nothing built yet", with a big Build button below. The Build stage shows the full stack with Bob standing still (no loop), and there are no chips and no checklist. |
   | Running | a spinner, then "Bob is building your website" in `--bob`, with the [Bob badge](#bob-badge) at the right end of the title row |
   | Done | "✓ Build N done" (the ✓ in `--go`), with "Opening your website…" below. After 0.9s the step moves to Try & tweak by itself |
   | Failed | a 26px `--alert-dark` circle with a white "!", then "Build N did not finish" (`--ink`), with "Nothing changed: your code and Blocks are as they were." below (`--fs`, `--text`, weight 600). The card gets a 5px `--alert` top border. A failed Build writes nothing (ticket 29). |

2. **Build stage** (D-Q24): the thing that shows Bob is working, even when the runtime can't say which Block he's on. 150px tall, radius `--r-panel`, `--bob-tint` fill with dots (`--ws-dot`, 1.4px radius, 18px apart), an inner top shade (`inset 0 3px 0 #0000000d`), overflow hidden, `aria-hidden`. A caption at its top left, "Bob is putting your Blocks together…" (weight 800 `--fs-sm`, `--hint`). Bob (118px tall) stands at the right, 26px in, hopping ([Motion](#motion): a 1.2s loop that squashes to `scale(1.06, .93)`, jumps 12px, and lands with a small squash). A small stack builds itself in a 7s loop, on a 236px-wide base whose left edge is 32px from the stage's left and whose bottom is 14px up: ten mini pieces in the category colors drop in one after another, 0.55s apart, from 190px above. Each lands with a squash (`scale(1.12, .8)`), bounces up 6px (`scale(.95, 1.06)`) and settles, all with `--ease`. From 88% of the loop they pop away one by one (up to `scale(1.1)`, then to 0) and the loop starts over. The pieces sit on a 236px-wide base, listed bottom-up as category, then left, bottom, width × height, all straight:

   | # | Piece | Place and size |
   |---|---|---|
   | 1 | Site Block | 0, 0, 236×22 |
   | 2 | UI Block | 8, 25, 220×18 |
   | 3–4 | two Page Blocks | 8 and 122, 46, 106×40 |
   | 5 | Primitives Block | 16, 89, 54×20 |
   | 6 | Content sticker | 74, 89, 34×16 |
   | 7 | Design sticker | 128, 89, 44×16 |
   | 8 | Behavior Block | 176, 89, 46×20 |
   | 9 | Talk to Bob sticker | 40, 112, 60×16 |
   | 10 | My Blocks Block | 140, 112, 64×22 |

   Mini Blocks: `--c1` fill, 2px `--c3` border, a 3px `--c3` bottom edge, radius 8px, a 3px `--c4` bar 3px from the bottom. Mini stickers: `--c1` fill, 2.5px white border, 1.5px `--c3` ring. **Done:** the loop stops with the full stack standing and Bob does one big hop (24px). **Failed:** the loop stops with the full stack standing, the stage turns `--alert-bg`, the top piece slides off the stack and drops out of view over 600ms (no spin), and Bob stops hopping. **Reduced motion:** the full stack and Bob stand still.
3. **Block chips:** one sticker per Block in this Build (every Block inside the Site Block or the Checkpoint Block that asks for something; the top Block itself gets none), wrapping, gap 7px. Each is in its category colors (`--c1` fill, 2.5px white border, 1.5px `--c3` ring and a 3px `--c3` bottom edge), weight 900, radius `--r-pill`, padding 4px 11px, with the Block's icon. A chip sits at opacity .3 and `scale(.94)` until Bob builds that Block, then pops to full ([Motion](#motion)). If the runtime can't report Blocks as it goes, every chip lights at the end, and the Build stage carries the waiting. If the Build fails, every chip goes back to dim.
4. **Checklist:** the app writes the lines from what happens during the Build, not Bob. Reading the Blocks → "Reading your Blocks (17 Blocks, 1 loose idea skipped)"; Bob starting on a Block → that Block's chip lights up and "Building <name>" is added (this depends on the data-block rule in AGENTS.md); a check after the files are written → "Checking the pages open and the links work" (only once that check ships: it's stretch, PRD-47); a problem in the plan that the Build skips → a warning line; a failure → its failure line. Each line: weight 700 `--fs-md`, `--text`, line-height 1.6, gap 10px, a 20px mark, then plain words. Done: a 20px `--go` circle with a white ✓ and a 2px `--go-dark` bottom edge. Current: a 15px spinner centered in the 20px mark slot, and the line in `--ink`. Failed: the 20px `--alert-dark` "!" circle, and the line in weight 900 `--ink` on `--alert-bg` (radius 8px, padding 2px 8px). Warning (PRD §10: the Build still runs, so this is quieter than a failure): a `--note-edge` "–", then the line in weight 600 `--text`, starting "Skipped:" (for example "Skipped: the Order button goes to a page that no longer exists."). Example lines: "Reading your Blocks (14 Blocks, 1 loose idea skipped)" · "Building Top bar and Big welcome" · "Checking the pages open and the links work". The failure lines (ticket 29): the time cap, "Bob took too long, so this Build was stopped." · the step cap, "Bob ran out of steps before finishing, so this Build was stopped." · the model can't be reached or returns an error, "Bob couldn't be reached. Check your connection and try again." · a broken or incomplete answer, "Bob's answer came back broken, so this Build was stopped."
5. **After a failure:** **Try again** (Primary) and **← Back to the Blocks** (ghost) ([Buttons](#buttons)), gap 6px, 6px above. Try again runs the same Blocks again. ← Back to the Blocks opens Plan, where the Blocks are still on the Canvas and can be changed.

There is no progress bar: the runtime can't tell how far along a Build is, so the card never pretends to (D-Q24).

**Spinner:** a circle with a 4px `--idle` ring whose top quarter is `--bob`, turning once a second. 26px in a title; 15px with a 3px ring in a line.

**After a Build**, outside the card: its Blocks leave the Canvas, which now holds the Checkpoint Block ([Block](#block)); the [Checkpoints](#checkpoints) list gets a new entry; and each file it changed gets a dot on its tab and tinted lines ([Code editor](#code-editor)).
