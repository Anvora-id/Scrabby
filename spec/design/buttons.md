<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
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
