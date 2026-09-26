# Domain docs

How to use this repo's domain documentation.

## Read these

- **`CONTEXT.md`** at the repo root: the vocabulary.
- **`TDD.md` §0**: the fixed decisions (ADRs 0001–0006). There is no `docs/adr/` folder; the ADRs live there.
- **`PRD.md`** (what and why) and **`DESIGN.md`** (the look) only when an issue names them.

## Use the glossary's vocabulary

In issue titles, code, tests, UI text and commits, use the terms as `CONTEXT.md` defines them (Block, not node; Trait, not property). Don't use the words it lists under *Avoid*.

If a concept you need isn't in the glossary, you are probably inventing language the project doesn't use. Stop and ask in the issue (`## Question`).

## Flag ADR conflicts

Never silently override a decision in `TDD.md` §0. If work would contradict one, stop, write it in the issue's `## Question`, and set `Status: needs-info`.
