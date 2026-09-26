<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Speech bubble

Bob talking: the show-around, the one-time tip, the limit message and the blocked-Build message (PRD §8–§10). The show-around is **drop order 1** if Bobcoins run low (PRD §6): the first feature to go.

- **Look:** `--surface`, a 2.5px `--bob` border, radius 18px, a 5px bottom edge (`0 5px 0 color-mix(in srgb, var(--bob) 25%, transparent)`), padding 12px 14px, max-width 280px, `--ink` weight 700 `--fs-md`, line-height 1.4. A tail on the side that faces its target points at it: a 20px square with the same border on its two outer sides, turned 45°.
- **Bob:** his full figure (74px tall, [Brand and Bob](#brand-and-bob)) stands on the bubble's top corner on the side away from the target, overlapping the border by 10px. The bubble pops in ([Motion](#motion)) and Bob hops once. The limit and blocked-Build messages leave Bob out (they sit next to small buttons).
- **Target:** what the bubble points at gets a 3px `--bob` ring (offset 3px, following its corners, the rounded panel's corners when the target wraps one). The rest of the screen isn't dimmed. Show-around bubbles keep clear of the Blocks on the Canvas: beside the palette, a bubble moves up or down its side, or further out, until it covers no Block.
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
- **Limit message** (PRD §8): when a usage limit stops a question, the same bubble, with no footer, points at the Send button that was pressed, with the plain message. A limit that stops a Build shows on the Build step instead, as a failed Build card titled "Build N did not start" whose failure line is the message ([Build button and Build card](#build-button-and-build-card)), so it stays until the next press. The messages (PRD §8; N is the server's `retryAfter` in minutes): "You've used this hour's 10 Builds. Try again in N minutes." · "You've asked Bob 40 questions this hour. Try again in N minutes." · "Scrabby has reached today's limit for everyone. Please try again tomorrow." For a question nothing else happens: the step doesn't change, the typed question stays in the box, and the bubble closes on the next click anywhere.
- **Blocked Build** (PRD §10): with no Site Block or no Page Block, pressing Build doesn't start a Build. The same footer-less bubble points at the Build button: "Add a Page inside your Site first." It closes on the next click.
- **One-time tip:** the same bubble with no counter and one **Got it** button, pointing at the first Block the user drops on the Canvas: "Right-click a Block or Trait for more." It shows once, ever.
