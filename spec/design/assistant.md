<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
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
