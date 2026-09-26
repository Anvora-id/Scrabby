# 22: Code editor upgrade

Status: done
Blocked by: 20
Wave: 5 (runs with 21 and 24)

## What to build

Make the Try & tweak code editor feel like a real editor for a beginner: search with highlighted matches, visible Undo and Redo, calmer Block markers and change marks, dark scrollbars, and a way to add a new file. Requested by the team after using it (2026-09-26); these replace the matching lines of DESIGN.md Code editor and TDD §14.

## Parallel work

Runs at the same time as 21 and 24, each in its own worktree. Touch only: `src/slots/CodeEditor.tsx`, `src/code/*` (`setup.ts`, `code.ts`, `navigation.ts`, `MergeReview.tsx`, `editor.module.css`, `code.test.ts`), `package.json` + `pnpm-lock.yaml` (one dependency), and the Code editor sections of `DESIGN.md` and `TDD.md` (§14). Do not run `scripts/split-specs.mjs`; the orchestrator does after merging.

## Read

- **Open only these files:** `spec/tdd/14.md`, `spec/design/code-editor.md`, `src/tokens.css`.

## Steps

- [x] **Dependency:** `pnpm add @codemirror/search` (CodeMirror's own search package; the only new dependency). Add it to TDD §1's dependency list.
- [x] **Search and highlight** (`setup.ts`): add `search({ top: true })`, `highlightSelectionMatches()`, `searchKeymap` (Ctrl+F find, Ctrl+H or Ctrl+Alt+F replace per CodeMirror defaults, F3 next), `highlightActiveLine()`, `highlightActiveLineGutter()`, `bracketMatching()`. Style the search panel dark (`--ed-tabs` background, `--ed-text` text, fields on `--ed-bg` with a 1px `--ed-rule` border, buttons like the tab text), matches `#F5C73D33` with a 1px `#F5C73D80` outline, the current match `#F5C73D66`, the active line `#FFFFFF08`. Richer syntax colors: `attributeName` `#C3A6FF`, `propertyName` `#7CC4FF`, `keyword` `#FF9EC7`, `number` and `bool` `#FFB86B`, `typeName`/`className` `#8BE9C4`, `punctuation`/`angleBracket` `--ed-line-no`.
- [x] **Undo and Redo**: two small buttons at the right end of the tab strip, `↶` (title `Undo (Ctrl+Z)`) and `↷` (title `Redo (Ctrl+Y)`), acting on the open file's editor history (`undo(view)`, `redo(view)` from `@codemirror/commands`), disabled when `undoDepth`/`redoDepth` is 0, and focusing the editor after the click. Keymap: make sure Ctrl+Z, Ctrl+Y and Ctrl+Shift+Z all work inside the editor (add explicit `{ key: 'Mod-y', run: redo, preventDefault: true }` and `{ key: 'Mod-Shift-z', run: redo, preventDefault: true }` before `historyKeymap`). Keep `keepUndoInside` so these never reach the app's Undo.
- [x] **New file**: a `+` button after the last tab (title `New file`). It opens an inline input in the tab strip (placeholder `name.html, .css or .js`); Enter creates, Escape or blur cancels. Rules: trim, lower-case; must match `/^[a-z0-9][a-z0-9-]*\.(html|css|js)$/`; must not exist. Otherwise show a one-line message under the strip in `--ed-tab-text`: `Use a name like about.html, extra.css or games.js.` or `<name> already exists.` Create with `updateProject(d => { d.files[name] = '' })` (a hand edit, undoable with the app's Undo) and open it. A new `.html` becomes a Built page at the next Build (`consume` already does this).
- [x] **Calmer Block markers**: replace the inline "◧ … Block" pills with a narrow gutter left of the line numbers: on each Block's first line a 8px circle in that Block's category color (`--c1` fill, 1px `--c3` ring). Hover: the native tooltip `<Name> Block · Show in Checkpoints`. Click: `openCheckpointsAtBlock(id)` as before. Only Blocks `blockInfo` knows get one.
- [x] **Calmer change marks**: no background tint. Changed lines get a 3px bar in the same gutter, color `#5FD38D` at 70% opacity. A file the base does not have (every file after Build 1) gets no bars at all, only its tab dot. The tab dot title stays `changed by the last Build`.
- [x] **Dark scrollbars** in the editor and merge view: `scrollbar-width: thin; scrollbar-color: #4A5068 var(--ed-bg)` on `.cm-scroller` and the tab strip, plus `::-webkit-scrollbar` rules (8px, thumb `#4A5068` radius 8px, track `--ed-bg`, thumb hover `#5B6278`).
- [x] From the audit (move here because this issue owns these files): `src/slots/CodeEditor.tsx:105-109,128-132` clear the jump at once (`clearJump()` before scrolling) and clear the flash decoration before saving a tab's state; `src/code/navigation.ts:22` `startReview` keeps the other editor UI fields (`{ ...editorUi.get(), review, file }`).
- [x] Update DESIGN.md Code editor (Block chip → gutter marker; Changed lines → bars; add Search, Undo/Redo buttons, New file, Scrollbars) and TDD §14 to match, in the same words as above.
- [x] Tests (`code.test.ts`): the new-file name rule (valid, invalid, taken) as a pure `newFileProblem(name, files): string | null` exported from `src/code/code.ts`.

## Done when

- `pnpm check` passes.
- In the browser: Ctrl+F finds and highlights; selecting a word highlights its other uses; ↶ ↷ and Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z work in the editor; `+` adds `about.html` and opens it; Block markers are small dots in the gutter; after Build 1 nothing is tinted; scrollbars are dark.

## Answer

- `scripts/guard.ts` `DEPENDENCIES` also got `@codemirror/search ^6.7.2` (the guard test mirrors TDD §1 and fails otherwise).
- `--ed-changed` is gone; `--ed-attr` is now `#C3A6FF`. Change bars and Block dots share one gutter (`lineMarks` in `CodeEditor.tsx`).
- The tab strip is now `.strip` (tablist + `+` + ↶ ↷); 23 adds its scrollbar/resizing polish on top.
- DESIGN.md outside Code editor (Checkpoints "From a Block chip", Plan "Block chip" line) still says "chip" for the gutter dot; rename when that section is next edited.
- Search panel keys are CodeMirror's `searchKeymap` as shipped; no extra Ctrl+H binding was added.
