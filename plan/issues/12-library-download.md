# 12: Library and Download with the Bob kit

Status: done
Blocked by: 19
Wave: 1

## What to build

The Library tab (upload images and videos, rename, delete, storage use) that the image and video Traits pick from, and **Download code**: a zip of the site that runs by double-clicking `index.html`, with a Bob kit (`AGENTS.md` and `.bob/skills/`) so the user can keep building in the IBM Bob IDE.


## Parallel work

This issue runs at the same time as others, each in its own worktree. Touch only the files listed under **Files**. Every other file you need already exists (issue 19 made stubs with the final names); import from it, never edit it. If something you need is missing, stop with `## Question`.

## Read

- **Open only these files:** `spec/tdd/16.md`, `spec/tdd/04.md`, `spec/tdd/18.md`, `spec/tdd/20.md`, `spec/design/brand-and-bob.md`, `spec/design/motion.md`, `spec/design/library.md`, `spec/prd/05.md`. The bullets below say what to look for inside them.
- TDD §16 (all), §4 "Library" (the model functions already exist), the Library row of §18 and its "Look details".
- DESIGN.md: Brand and Bob, Motion, Library.
- PRD §5 **Download** bullet.

## Files

Replace: `src/slots/Library.tsx`.
Create: `src/slots/Library.module.css`, `src/download.test.ts`.
Replace: `src/download.ts` (issue 19 stub; keep the `downloadCode` signature). MenuBar is already wired (issue 19): do not edit it.

## Steps

- [x] `Library.tsx` per TDD §16 (upload, measure, problems, tiles, rename with `renameProblem` and confirm, delete with `deleteWarning`, storage line).
- [x] `download.ts`: `zipDownload(project, assets)` with the Bob kit (exact `AGENTS.md` text from TDD §16) and `downloadCode(project)`.
- [x] Tests: the zip cases in TDD §20 (code at the top, Assets under `assets/`, no `.builds/`, the kit files).

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser: upload a png and an mp4 (tiles show; a reload keeps them); an SVG is refused with its message; pick the image in an image Trait; rename it; delete it (the Trait shows "missing file"). Download code on the built site gives `Mayas bake sale.zip`; unzipped, `index.html` opens with a double-click, and `AGENTS.md` plus `.bob/skills/*/SKILL.md` are inside.

## Answer

- `zipDownload` / `downloadCode` live in `src/download.ts`; the kit's plan lists `.builds/build-N.md` in numeric N order, each text trimmed at the end.
- MenuBar needed no change: issue 19 already wired **Download code** to `downloadCode`.
- Library tiles lift 2px on hover (DESIGN Library) rather than Motion's 1px; the panel pads 6px because the tab panel already pads `--gap`.
- Undo of an upload leaves its Blob in IndexedDB (harmless; the Asset is gone from the Project).
