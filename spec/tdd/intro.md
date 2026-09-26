<!-- Generated from TDD.md by scripts/split-specs.mjs. Do not edit. -->
# Scrabby technical design (hackathon build)

**Status:** build spec, 2026-09-26. It describes the team prototype as built (planning repo `spbob_prototype`, commit `267140d`), plus the hackathon changes: Bob runs the product through its inference endpoint, and the app is hosted on Vercel with the PRD §8 guardrails.
**Readers:** Bob and the two developers. Bob builds from this file: every name, string and number here is exact. Do not rename, reword or "improve" anything.
**Other sources:** words in [`CONTEXT.md`](CONTEXT.md), what and why in [`PRD.md`](PRD.md), the look in [`DESIGN.md`](DESIGN.md), work order in [`plan/build-map.md`](plan/build-map.md), rules for Bob in [`AGENTS.md`](AGENTS.md).
**Precedence:** this file wins over PRD.md on mechanisms. §18 wins over DESIGN.md where they differ. DESIGN.md wins on every look value §18 does not mention.

**How to read this file.** Each section lists its files and stands alone. An issue names the sections it needs; read only those. Section numbers are stable ids.
