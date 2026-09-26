# 12: Library and Download with the Bob kit

Status: ready-for-agent
Blocked by: 03
Lane: B

## What to build

The Library tab (upload images and videos, rename, delete, storage use) that the image and video Traits pick from, and **Download code**: a zip of the site that runs by double-clicking `index.html`, with a Bob kit (`AGENTS.md` and `.bob/skills/`) so the user can keep building in the IBM Bob IDE.

## Read

- TDD §16 (all), §4 "Library" (the model functions already exist), the Library row of §18 and its "Look details".
- DESIGN.md: Library.
- PRD §5 **Download** bullet.

## Files

Replace: `src/slots/Library.tsx`.
Create: `src/slots/Library.module.css`, `src/download.ts`, `src/download.test.ts`.
Modify: `src/shell/MenuBar.tsx` (enable Download code).

## Steps

- [ ] `Library.tsx` per TDD §16 (upload, measure, problems, tiles, rename with `renameProblem` and confirm, delete with `deleteWarning`, storage line).
- [ ] `download.ts`: `zipDownload(project, assets)` with the Bob kit (exact `AGENTS.md` text from TDD §16) and `downloadCode(project)`.
- [ ] Tests: the zip cases in TDD §20 (code at the top, Assets under `assets/`, no `.builds/`, the kit files).

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser: upload a png and an mp4 (tiles show; a reload keeps them); an SVG is refused with its message; pick the image in an image Trait; rename it; delete it (the Trait shows "missing file"). Download code on the built site gives `Mayas bake sale.zip`; unzipped, `index.html` opens with a double-click, and `AGENTS.md` plus `.bob/skills/*/SKILL.md` are inside.
