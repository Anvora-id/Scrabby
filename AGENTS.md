# AGENTS.md: rules for Bob in the Scrabby repo

Scrabby is a web IDE: users plan a website as nested Blocks and Traits on a Canvas, Bob (IBM Bob, through its inference endpoint) builds real HTML, CSS and JS from the plan, and users try it in a Preview, edit the code and ask Bob about it. You are building Scrabby itself, from written specs.

## Read only what the task needs

1. The issue you were given (`plan/issues/NN-*.md`). It lists its files, the spec sections to read, the steps and the checks.
2. Only the sections the issue names: `TDD.md §N` (find them with the heading `## N.`) and `DESIGN.md` sections by heading. Do not read whole documents. Do not read `PRD.md` unless the issue names it.
3. Words: `CONTEXT.md`. Use its terms in code, UI text and commits (Block, not node; Trait, not property).

## Do exactly what the spec says

- Every name, string, number, color and file path in the TDD is exact. Copy UI text character for character, including curly quotes, `…`, `›` and `×`.
- `TDD.md` wins over `PRD.md` on mechanisms. `TDD.md §18` wins over `DESIGN.md`; DESIGN.md wins on every other look value.
- Build only what the issue asks. No extra features, options, abstractions, files or comments.
- No new dependencies. The list is in TDD §1.
- Other issues run in parallel. In shared files (`store.ts`, `Steps.tsx`, `MenuBar.tsx`, `types.ts`, `package.json`) only add; never rename, move or reshape what is there.
- If the spec is unclear, contradicts itself, or a check still fails after two honest attempts: stop. Add a `## Question` section to the issue with the exact problem, set `Status: needs-info`, and end the task. Never guess.

## Code style

- TypeScript strict, React function components, one CSS Module per component, tokens from `src/tokens.css`. No component library, no Tailwind, no inline styles except computed positions and Custom Block colors.
- Small plain modules. Pure logic in `.ts` files, UI in `.tsx`. Functions that change a Project are recipes run inside `updateProject`.
- Comments say why, briefly. A deliberate shortcut gets a `ponytail:` comment naming its limit (TDD §21).
- Tests: Vitest, next to the module (`x.test.ts`), for pure logic only. The cases each test file needs are in TDD §20.

## Finish a task

1. `pnpm typecheck` and `pnpm test` both pass. Fix what you broke; do not edit tests of other issues to make them pass.
2. Tick the issue's checkboxes, set `Status: done`, and add a short `## Answer` with anything the next issue must know.
3. Commit with a Conventional Commits message: `feat: <what the user can now do> (issue NN)`.
4. The human saves this task's session summary screenshot and exported history in `bob_sessions/` (`scrabby_taskNN_<slug>_summary.png`).

## Safety rules

- Never commit a key. Secrets live only in `.env` (git-ignored) and Vercel Sensitive environment variables. Never give a secret a `VITE_` prefix: Vite puts those in the browser bundle.
- Never log `AGENT_API_KEY` or request headers.
- Never use the word "Scratch", its logo, the Scratch Cat or Scratch's icon files in the product.
- The Preview shell accepts files only from the app origin (TDD §13). The app loads no remote scripts; the Google Fonts stylesheet is its only outside file.

## The data-block rule

Scrabby links every Block to its code with marks the product's Bob writes into each Prototype (ADR 0004): `data-block="<id>"` on the outermost HTML tag of a Block's code, and `/* block <id> */` above that Block's CSS rules and scripts. Parts Bob adds that the user never placed carry their parent Block's id; marks are never removed. The instruction document and `skills/code-rules/SKILL.md` teach this to the product's Bob. The app relies on it for Block chips, "See its code", lighting chips during a Build and the Preview flash (TDD §11, §13, §14, §15).

## Commands

- `pnpm dev`: the app on http://localhost:5173 (with `/api/agent`) and the Preview origin on http://localhost:5174. Needs `.env` with `AGENT_API_KEY`.
- `pnpm test`, `pnpm typecheck`, `pnpm build` (app → `dist`), `pnpm build:preview` (→ `dist-preview`).
- `pnpm build-demo`: one real Build through the agent server, written to `tmp/demo-site/`.
