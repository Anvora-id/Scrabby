# 03: Store, storage, fixtures and shell

Status: ready-for-agent
Blocked by: 02
Lane: A

## What to build

The app frame and state: menu bar, step bar and the three Steps with empty named slots for every panel; the Project store with Undo/Redo; IndexedDB saving (one Project survives a reload); the demo and built-site fixtures with a dev-only loader.

## Read

- TDD §6, §7, §19; §17 only the `replaceProject` bullet and `dev.ts`.
- DESIGN.md: Shell, Screen layout, Buttons (Menu bar row).

## Files

Create: `src/store.ts`, `src/history.ts`, `src/db.ts`, `src/fixtures/fixtures.ts`, `src/fixtures/dev.ts`, `src/onboarding.ts` (only `replaceProject` and `placeholderPhoto` for now), `src/App.tsx`, `src/App.module.css`, `src/shell/MenuBar.tsx`, `src/shell/StepBar.tsx`, `src/shell/Steps.tsx` (+ `.module.css` each), and one placeholder component per panel in `src/slots/`: `Canvas.tsx`, `Palette.tsx`, `Library.tsx`, `Checkpoints.tsx`, `BuildButton.tsx`, `BuildCard.tsx`, `Preview.tsx`, `CodeEditor.tsx`, `Assistant.tsx`. Tests: `src/store.test.ts`, `src/history.test.ts`, `src/fixtures/fixtures.test.ts`.
Modify: `src/main.tsx` (await `startStore()` before rendering).

## Steps

- [ ] `history.ts`, `store.ts`, `db.ts` exactly as TDD §6.
- [ ] `fixtures.ts`: `DEMO_PHOTOS`, `demoProject()`, `builtSite()` exactly as TDD §19 (keep the construction order: the ids must match TDD Appendix A).
- [ ] `onboarding.ts`: `replaceProject(project, checkpoints)` and the placeholder photo drawing (TDD §17). `dev.ts`: `FIXTURES`, `loadFixture`.
- [ ] Shell per TDD §7: App, MenuBar (New Project, Demo and Show me around are disabled placeholders until issue 15; Download code disabled until issue 12; Undo/Redo and keyboard shortcuts work; the dev fixture select works), StepBar, PlanStep with the three tabs, BuildStep, TryStep. Each panel slot renders a centered muted label with its name and the issue that fills it (Canvas 05, Palette 05, Library 12, Checkpoints 14, Build button 13, Build card 13, Preview 10, Code editor 11, Assistant 16). Keep every `data-tour` attribute from TDD §7.
- [ ] Tests: store, history, fixtures rows of TDD §20; add the "demo's Top bar" case to `src/model/project.test.ts`.

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In the browser: the three Steps switch from the step bar; the dev select loads the demo and the built site; a reload keeps the loaded Project.

## Do not

- Build any panel's contents (later issues own them).
