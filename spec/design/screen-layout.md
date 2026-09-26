<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Screen layout

From ticket 02. Three steps, and only one is on screen at a time: **1 Plan › 2 Build › 3 Try & tweak**. Under the menu bar sits the step bar ([Shell](#shell)), then the current step's area (`--page`, 10px padding, `--gap`).

| Step | What fills the screen |
|---|---|
| Plan | Canvas / Library / Checkpoints tabs ([Shell](#shell)) over one panel: the [Palette](#palette) and the [Canvas](#canvas), the [Library](#library), or the [Checkpoints](#checkpoints) list. The big Build button floats at the Canvas's bottom right, with the zoom buttons stacked above it. No code, Preview or Assistant. |
| Build | The [Build card](#build-button-and-build-card), centered. |
| Try & tweak | Three panels in a grid of `minmax(0,1.2fr) minmax(0,1fr) 320px`, gap `--gap`: [Preview](#preview), [Code editor](#code-editor), [Assistant](#assistant). If the Assistant drops (PRD §6), two panels: `minmax(0,1.2fr) minmax(0,1fr)`. |

**Moving between the steps:**
- Click Plan or Try & tweak in the step bar, or "← Back to the Blocks". While a Build runs, the step bar stays on Build.
- Pressing Build goes to the Build step. A successful Build goes on to Try & tweak by itself. A failed one stays on Build.
- **See its code:** select a Block that has code (a locked Page on the Canvas, or a Block in the Checkpoints list), then click its "See its code" button ([Block](#block)). Try & tweak opens on the file that holds the Block's code, and the Block's first line flashes ([Code editor](#code-editor)). This depends on the data-block rule in AGENTS.md.
- **Block chip:** clicking a chip in the code opens Plan on the Checkpoints tab, at the Checkpoint whose Build made that code, with that Block flashing and scrolled to the center.
- Whatever is jumped to scrolls smoothly to the center.

**First visit** (PRD §8–§9): the age check modal ([Menus](#menus)), shown once. Then Plan opens on an empty Project, with the empty hint ([Canvas](#canvas)), and the show-around starts ([Speech bubble](#speech-bubble)). Below the Site Block, **Try the demo: Maya's bake sale** loads the demo Project ([Canvas](#canvas)); so does **Demo** in the menu bar.

**Screen sizes** (D-Q6): design for 1920×1080, the demo recording. The smallest supported size is 1366×768: nothing may scroll sideways or get cut off there, and the palette folds to give the Canvas room. No tablets or phones.
