<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
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
