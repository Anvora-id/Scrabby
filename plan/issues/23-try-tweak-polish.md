# 23: Try & tweak polish: resizable panels, scrollbars, fewer Bobs

Status: ready-for-agent
Blocked by: 21, 22
Wave: 6 (after wave 5 is merged; one agent)

## What to build

Three fixes the team asked for after using the app (2026-09-26): the Try & tweak panels can be resized, the app's scrollbars match the look, and Bob's picture appears in fewer places.

## Read

- **Open only these files:** `spec/tdd/07.md` (TryStep bullet), `spec/design/screen-layout.md`, `spec/design/brand-and-bob.md`, `src/tokens.css`.

## Files

Modify: `src/shell/Steps.tsx`, `src/shell/Steps.module.css`, `src/App.module.css`, `src/slots/Assistant.tsx` (+ its CSS), `src/slots/Preview.tsx`, `src/canvas/BlockView.tsx`, `DESIGN.md` (Brand and Bob, Screen layout, a Scrollbars note), `TDD.md` §7.

## Steps

- [ ] **Resizable panels** in Try & tweak: two 8px drag handles between Preview | Code | Assistant (between the grid columns). Handle: transparent, `cursor: col-resize`, a 2px `--line` bar in its middle that turns `--accent` on hover and while dragging; `role="separator"`, `aria-orientation="vertical"`, title `Drag to resize, double-click to reset`. Dragging sets the grid columns in px with minimums Preview 320, Code 320, Assistant 260 (the rest stays with the Preview). Pointer capture on the handle; `user-select: none` on `body` while dragging; the Preview iframe gets `pointer-events: none` while dragging (else it swallows the pointer). Double-click resets to the default `minmax(0,1.2fr) minmax(0,1fr) 320px`. Remember the widths in `localStorage['scrabby.tryCols']` (inside try/catch; no storage = defaults). Left/Right arrow keys on a focused handle move it by 16px.
- [ ] **Scrollbars** app-wide (light UI; the code editor has its own dark ones from 22): in `App.module.css` `:global(*) { scrollbar-width: thin; scrollbar-color: var(--line-strong, #C9C3DA) transparent }` plus `::-webkit-scrollbar` 8px, thumb in the same color with radius 8px, transparent track, thumb hover `--hint`. Use a token from `src/tokens.css` if one fits better; do not add colors outside it. The Preview's page scrollbars belong to the user's website and stay as they are.
- [ ] **Fewer Bobs**: keep Bob only in the menu bar logo, the Build card and the show-around speech bubbles. Remove the head in the Assistant title bar (keep the word "Bob" and the badge), the head above the empty chat line, the figure on the empty Preview, and the figure on the empty Canvas hint (`BlockView.tsx`, the empty Site). Update DESIGN.md's "Where Bob appears" table to exactly those three places.
- [ ] Update DESIGN.md Screen layout (the resize handles) and TDD §7 (TryStep) in the same words.

## Done when

- `pnpm check` passes.
- In the browser: drag both handles, reload (widths kept), double-click (reset); scrollbars are thin and match; Bob shows only in the menu bar, the Build card and the tour bubbles.
