# Instruction document header and prompt ending

Text the app pastes into every Build prompt, word for word. It is not a Skill. The Skills tell Bob how to write code; this header tells Bob how to read the instruction document (ticket 23: the reading rules live in the document, so every `.builds/build-N.md` explains itself to the Assistant).

## Header: every Build

The app puts this at the top of every instruction document.

```markdown
## How to read this

This is the user's request for their website, written as Blocks and Traits.

- Each Block line ends with the Block's id, like `#b4`. Mark that Block's code with `data-block="b4"`.
- Nesting shows what sits inside what. The order of Blocks and where they sat on the Canvas mean nothing: you choose the layout.
- "Block types used" says what each kind of Block is for.
- Each Trait line reads `label (meaning): value`. A Trait describes its Block as a whole, including what's inside it. Keep nested Blocks consistent with it without copying it: a playful Section has playful contents, and Cards in a navy Section match navy. A Trait set on a nested Block decides that Block.
- When a Block has several Traits of one kind, use them together where you can: two colors make a palette, two images make a gallery, two fonts make a heading font and a body font, two "on click" steps both run. Where they clash, pick one. Going to a page always happens last.
- `(Instance of "Product card")` marks a copy of a Custom Block. Build one shared pattern for all its Instances and vary only what differs.
- `Note: "…"` and `The user says: "…"` are the user's own words about the website. Follow them.
- `You choose: <field>` lets you decide that field, boldly: a striking style, playful wording, parts the user never placed. `You choose: anything in this Block` covers the Block and everything inside it. Traits the user set stay as set.
- `label (meaning): you choose` means the user wants that one thing and leaves the choice to you. Make a deliberate choice. A Note under that Trait guides the choice.
- Fill anything the user left unset simply but finished: simple wording, colors that match the rest, only the parts needed, placed where the Skills say.
- A Popup stays closed unless an "on click" opens it, a Note or `The user says` says when it opens, or `You choose` covers it.
- `go to missing page` means the page was deleted. Make that link do nothing and leave a comment saying so.
- The Library lists every Asset the user uploaded. Use an Asset that no Trait names only under `You choose`, or for an image, sound or video Trait set to `you choose`. If no Asset fits, use a placeholder.
```

## Header: extra line after Build 1

From Build 2 on, the app adds this line to the end of the header. The document then lists the "Already built" pages with their file names, and the request Blocks and Traits under their page.

```markdown
- "Already built" lists the pages that exist. Add or change only what's below. Keep all other code as it is, including the user's edits.
```

## Prompt ending

The app ends every Build prompt with these two lines, after the current files.

```text
Keep every `data-block` mark.
Change only what the request asks.
```
