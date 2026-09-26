# 21: Parity fixes from the prototype audit

Status: ready-for-agent
Blocked by: 20
Wave: 5 (runs with 22 and 24)

## What to build

Fix the gaps a line-by-line audit found between this rebuild and the team prototype (`spbob_prototype`, commit `267140d`). Each item names the file, what is wrong, and what to do. Behavior only: keep the new look.

## Parallel work

Runs at the same time as 22 and 24, each in its own worktree. Touch only the files named below. `src/slots/CodeEditor.tsx` and `src/code/*` belong to 22; `api/agent.ts` and `src/agent.ts` to 24.

## Read

- **Open only these files:** `spec/tdd/08.md`, `spec/tdd/09.md`, `spec/tdd/10.md`, `spec/tdd/11.md`, `spec/tdd/12.md`, `spec/tdd/13.md`, `spec/tdd/15.md`, `spec/tdd/16.md`, `spec/tdd/17.md`. Open a section only when the item you are on needs it.

## Items (most visible first)

- [ ] **Preview shows the site unstyled** (reported: fonts and layout missing after a Build). Likely cause: `src/slots/Preview.tsx:36,149,59-61` mounts the iframe at load 0 and answers its `ready` with an empty pending load (`projectId ''`, no files). The Service Worker then wipes its cache while the real page is loading, so `style.css` and images 404. Fix: render the iframe only when `load > 0`, and answer `ready` only when a pending load exists (TDD §13). Confirm in DevTools → Network that `style.css` is 200 `text/css` after a Build.
- [ ] `preview/public/helper.js:5`: post `page` at once when the helper runs (it is first in `<head>`), not on `load`. Otherwise the `page` message clears errors thrown while the page loads, and the error bar never shows them.
- [ ] `src/slots/Preview.tsx:19`: `fileOf` must use `decodeURI` inside try/catch (return the input on failure).
- [ ] `src/shell/MenuBar.tsx:49,52`: lower-case `e.key` before comparing, so Ctrl+Shift+Z redoes and Caps Lock does not break Ctrl+Z.
- [ ] `src/onboarding.ts:30-35`: in `replaceProject`, set `a.bytes = blob.size` for each drawn demo photo.
- [ ] `src/model/library.ts:31`: `formatBytes` returns `+n.toFixed(1)` for values under 10 ("1 KB", "5 MB", not "1.0 KB").
- [ ] `src/slots/Library.tsx:84-86`: show the storage line only when `quota` is set. `:88`: reload the tiles after `putAsset` resolves (a `saved` counter in the effect deps), so a new upload shows its image.
- [ ] `src/store.ts:78`: call `navigator.storage?.persist?.()` without awaiting it (errors ignored).
- [ ] `src/canvas/Overlays.tsx:147-149`: add the tooltip's hide listeners (`pointerdown`, `contextmenu`, `wheel`, `keydown`) in the capture phase, and do not show while a press is pending or a menu is open (TDD §9.5). `:167-171`: measure the tooltip in a layout effect and keep it 8px inside the window on every side (8px below the item, else above).
- [ ] `src/canvas/tree.ts:292-295`: `onClickOptions` lists every Popup inside the Trait's Page, nested Popups included (same walk as `popupsIn`).
- [ ] `src/canvas/Warnings.tsx:60`: the `where` pill does what Show does, including closing the popover.
- [ ] `src/slots/Canvas.tsx:295`: call `droppedBlock` only for a new Block from the palette (`item.kind === 'newBlock'`), not for an Instance.
- [ ] `src/canvas/BlockView.tsx:164`: "drop Blocks or Traits here" only on an empty locked Page, not the Checkpoint Block. `:42`: remove the leftover `issue 07` comment.
- [ ] `src/canvas/Overlays.tsx:231-236`: the big Trait Note textarea gets placeholder `note for Bob`.
- [ ] `src/instructions/document.ts`: `:79-81,97` add the Instance tag and list the definition only when `p.defs[b.inst]` exists; `:88` build the Already built line with `heading()` (no `(undefined)` for a missing file); `:102` leave out `N s` when `seconds` is falsy.
- [ ] `src/assistant.ts`: `:81-84` if the reply is stopped before `start`, still add the user message and a Bob message reading `Stopped.`; `:201` `dropPending` only sets `stopped` (the token clears when the reader stops); `:167` `rejectAll` does nothing on a done proposal; `:179` `decide` returns early when the path is not in the proposal or it is done; `:108` leave out `N s` when `seconds` is falsy.
- [ ] `src/slots/Assistant.tsx:134,140`: call `startReview` only when `openFiles(pr)[0]` exists.
- [ ] `src/slots/BuildButton.tsx:40-43`, `src/slots/BuildCard.tsx:162-165`: `runBuild().catch(e => console.error('The Build failed to run', e))`.
- [ ] `src/slots/Checkpoints.tsx:20,35,110`: one entry open at a time (`open: number | null`); a chip focus replaces it (or closes all when no Build made that Block).
- [ ] `src/shell/Onboarding.tsx:23,93`: render the tip only when no tour runs.
- [ ] `preview/vite.config.ts`: add `envDir: here('..')` so a root `.env` `VITE_APP_ORIGIN` works for local preview builds.
- [ ] `src/fixtures/fixtures.ts:209` (and menu, quiz): end each built-site HTML file with `\n`.
- [ ] `vite.config.ts` (root): set `test: { exclude: ['**/node_modules/**', '.*/**'] }` so Vitest never runs the worktree copies.
- [ ] Tests: `onClickOptions` offers a nested Popup; `formatBytes(1024) === '1 KB'`; the demo document test also checks the three "on click" line forms (page, popup, action); assistant: a reply dropped before `start` leaves the question plus `Stopped.`, and after a drop no proposal is added and the code is unchanged.

## Done when

- `pnpm check` passes.
- In the browser: after a Build the Preview is styled; a `throw` at the top of `script.js` shows the error bar; Ctrl+Shift+Z redoes; the demo Library shows real sizes; the tooltip never shows during a drag or under the right-click menu.
