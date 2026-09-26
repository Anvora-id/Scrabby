# 09: Agent route and Bob model client

Status: ready-for-agent
Blocked by: 19
Wave: 1

## What to build

The one server function, `/api/agent`: it checks the usage limits, then runs Bob (IBM Bob's OpenAI-compatible inference endpoint) in a tool loop over an in-memory copy of the site's files, and streams events back as SSE. Plus the browser side (`runAgent`), the Bob badge, and `pnpm build-demo`, which proves a real Build end to end.


## Parallel work

This issue runs at the same time as others, each in its own worktree. Touch only the files listed under **Files**. Every other file you need already exists (issue 19 made stubs with the final names); import from it, never edit it. If something you need is missing, stop with `## Question`.

## Read

- **Open only these files:** `spec/tdd/05.md`, `spec/tdd/01.md`, `spec/tdd/07.md`, `spec/tdd/20.md`, `spec/design/bob-badge.md`, `skills/instruction-header.md`. The bullets below say what to look for inside them.
- TDD §5 (all), §1 (Environment variables, vercel.json, the dev plugin), §7 (BobBadge).
- `skills/instruction-header.md` (the prompt ending is read from it).

## Files

Replace: `api/agent.ts`, `src/agent.ts` (keep issue 19's types exactly; fill the bodies and add `readAgentStream`, `browserId`), `src/shell/BobBadge.tsx`.
Create: `src/shell/BobBadge.module.css`, `scripts/build-demo.ts`, `api/agent.test.ts`, `src/agent.test.ts`.

## Steps

- [ ] `src/agent.ts`: the types of TDD §5.1, `runAgent`, `readAgentStream`, `browserId`, `useAgentLabel` (TDD §5.3).
- [ ] `api/agent.ts` (one file, TDD §5.2): constants, skills loading with `process.cwd()`, roles and levels (exact text), `prompt`, `TOOLS`, `runTool`, `blockIds`, `runLoop`, `bobModel`, `createLimits`, `agentHandler`, `export default { fetch: agentHandler(bobModel) }`. Import from `src/` with `import type` only.
- [ ] `BobBadge.tsx` (TDD §7; look: DESIGN.md Bob badge).
- [ ] `scripts/build-demo.ts` (TDD §5.4).
- [ ] Tests: the `api/agent.test.ts` and `src/agent.test.ts` rows of TDD §20, with a fake `Model` (an async function returning scripted `ModelReply`s and recording the messages it got). Limits tests use their own `createLimits()` and fixed `now` values; set and restore `process.env.AGENT_LIMITS` around the "off" case.

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- With `.env` holding the Bob key: `pnpm build-demo` prints "Building b…" lines and `Done: …`, and `tmp/demo-site/index.html` opens as a bake-sale site. Note the seconds it took in the issue's Answer (PRD §7 wants a demo Build under 2 minutes).
- `curl http://localhost:5173/api/agent` returns `{"model":"IBM Bob"}` while `pnpm dev` runs.

## Do not

- Add an AI SDK or any dependency; use `fetch`. Log the key or headers. Split `api/agent.ts` into more files (Vercel makes every file in `api/` a function).
