<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
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
