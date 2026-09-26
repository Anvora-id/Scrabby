# 02: Project model and catalogue

Status: ready-for-agent
Blocked by: 01
Lane: A

## What to build

The data model every other issue uses: types, the catalogue of Block and Trait types, icons, the Project functions (ids, Page files, Custom Blocks with overrides, `applyChange`), and the Library rules. Pure TypeScript with tests; no UI.

## Read

- TDD §2, §3, §4.
- DESIGN.md: Icons (only to check the icon names).

## Files

Create: `src/model/types.ts`, `src/model/catalogue.ts`, `src/icons.ts`, `src/model/project.ts`, `src/model/library.ts`, `src/model/project.test.ts`, `src/model/library.test.ts`.

## Steps

- [ ] `types.ts`: copy the types in TDD §2 exactly.
- [ ] `catalogue.ts`: `Category`, `CATEGORIES`, `BlockTypeDef`, `BLOCK_TYPES` (all 15 non-canvas types, TDD §3 table, texts exact), `BUILT_PAGE`, `LOOSE_IDEA_TOOLTIP`, `ValueKind`, `TraitTypeDef`, `COLOR_PRESETS`, `PLAYS_A_SOUND`, `ON_CLICK_CHOICES`, `TRAIT_TYPES` (all 14, texts exact, `stretch: true` on sound, `hint` on tellbob and letbobpick), `acceptsBlock`.
- [ ] `icons.ts`: `ICONS` and `IconKey` (TDD §3).
- [ ] `project.ts`: every function in TDD §4 with the exact algorithms, including the id order in `copyBlock` (parent id first).
- [ ] `library.ts`: every function in TDD §4 "Library", strings exact.
- [ ] Tests: the `project.test.ts` cases in TDD §20 except "the demo's Top bar" (it needs the fixture from issue 03; add it there), and the Library cases of `library.test.ts`.

## Done when

- `pnpm typecheck` and `pnpm test` pass.

## Do not

- Add fields to the types. Put UI code here.
