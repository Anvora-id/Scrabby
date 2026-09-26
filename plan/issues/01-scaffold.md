# 01: Scaffold and deploy skeleton

Status: done
Blocked by: none
Lane: A

## What to build

An empty Vite + React + TypeScript app that runs locally with `pnpm dev` (app on 5173, Preview origin on 5174) and builds for both Vercel projects. No features yet.

## Read

- TDD §1 (all of it).
- DESIGN.md: Tokens.

## Files

Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vercel.json`, `index.html`, `.env.example`, `.gitignore`, `.bobignore`, `README.md`, `src/main.tsx`, `src/App.tsx`, `src/tokens.css`, `preview/vite.config.ts`, `preview/index.html`, `preview/shell.ts`, `preview/sw.ts`, `preview/public/helper.js`, `api/agent.ts`.

## Steps

- [x] `package.json` exactly as TDD §1 (name, type, scripts, dependencies, devDependencies, packageManager). Run `pnpm install`.
- [x] `tsconfig.json`, `index.html`, `vercel.json`, `.gitignore`, `.bobignore`, `.env.example` exactly as TDD §1.
- [x] `src/tokens.css` = the whole CSS block of DESIGN.md Tokens, pasted as-is (both the `:root` block and the nine `.cat-*` rules).
- [x] `vite.config.ts` with `react()`, `previewServer()`, `agentApi()` as TDD §1 (use the middleware code given there; import `Readable` from `node:stream`, `defineConfig`, `createServer`, `loadEnv`, `Plugin` from `vite`).
- [x] `preview/vite.config.ts` exactly as TDD §1.
- [x] Placeholders, to be replaced by later issues (each file one comment line naming its issue): `preview/index.html` (title `Scrabby Preview`, module script `/shell.ts`), `preview/shell.ts` (issue 10), `preview/sw.ts` (issue 10), `preview/public/helper.js` (issue 10), `api/agent.ts` exporting `export default { fetch: async () => new Response('issue 09', { status: 501 }) }`.
- [x] `src/main.tsx` imports `./tokens.css` and renders `<App/>` into `#root` in `StrictMode`; `src/App.tsx` renders the text `Scrabby` for now (issue 03 replaces it).
- [x] `README.md`: what Scrabby is (two sentences from PRD §2's pitch), that the product's Bob runs on IBM Bob's inference endpoint, how to run (`pnpm install`, `.env` from `.env.example`, `pnpm dev`, `pnpm test`), and the two Vercel projects. No keys.

## Done when

- `pnpm dev` serves `Scrabby` on http://localhost:5173 and the preview shell on http://localhost:5174.
- `pnpm typecheck`, `pnpm build` and `pnpm build:preview` succeed (`dist/` and `dist-preview/sw.js` exist).
- Humans then do build-map step 0 item 5 (the two Vercel projects).

## Do not

- Add any dependency not in TDD §1. Commit `.env`.

## Answer

Scaffold is complete. `pnpm typecheck`, `pnpm build` (→ `dist/`) and `pnpm build:preview` (→ `dist-preview/sw.js`) all pass. `src/main.tsx` does **not** call `startStore()` yet — that is added in issue 06 when `store.ts` exists. `src/App.tsx` renders the text `Scrabby` as a placeholder; issue 03 replaces it. The two Vercel projects still need to be created by a human (build-map step 0 item 5).
