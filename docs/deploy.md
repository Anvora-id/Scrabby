# Deploy handoff: two Vercel projects

Read this before you change Vercel settings, a `VITE_*_ORIGIN` variable, `vercel.json` or anything in `preview/`. Updated 2026-09-26.

## The two addresses

Vercel team `anvora2`, repo `Anvora-id/Scrabby`, both projects deploy `main`.

| Project | Domain | What it is | Build | Output |
|---|---|---|---|---|
| `scrabby` | https://scrabby-two.vercel.app | The app and the submitted URL. Users only ever open this one. | `pnpm build` (Framework Vite) | `dist` |
| `scrabby-preview` | https://scrabby-preview.vercel.app | Only the inside of the Preview `<iframe>`. Nobody opens it directly. | `pnpm build:preview` (Framework Other) | `dist-preview` |

| Variable | Project | Environments | Value |
|---|---|---|---|
| `AGENT_API_KEY` (Sensitive), `AGENT_BASE_URL`, `AGENT_AUTH_SCHEME`, `AGENT_MODEL`, `AGENT_LABEL`, optional `AGENT_HEADERS` and `AGENT_REASONING_EFFORT` | `scrabby` | Production, Preview | TDD §1 |
| `VITE_PREVIEW_ORIGIN` | `scrabby` | Production | `https://scrabby-preview.vercel.app` |
| `VITE_APP_ORIGIN` | `scrabby-preview` | Production | `https://scrabby-two.vercel.app` |
| `AGENT_LIMITS` | none | none | Local `.env` only (`off` switches the usage limits off). Never set it on Vercel. |

Development is never used: local dev reads `.env`. A Preview target on a `VITE_*` origin does no harm but gains nothing (see Production domains only).

Two addresses is on purpose (TDD §1, §13). The Prototype runs code Bob wrote and the user edited. On its own origin it cannot read or wipe the app's IndexedDB, where every Project lives. It needs a real origin, not a sandboxed iframe, because its Service Worker serves the site's pages and files, and a sandboxed frame cannot register one. Do not merge the two projects, add `sandbox` to the iframe or switch the Preview to `srcdoc`.

## Warnings

- **Exact origins.** Both sides check `e.origin === <origin>`. Write `https://scrabby-two.vercel.app`: `https`, no trailing slash, no path. A mismatch shows a blank Preview with no error.
- **`VITE_*` is baked in at build time.** After you change one, redeploy that project (Deployments → ⋯ → Redeploy). Saving the variable alone changes nothing.
- **Production domains only.** Per-deployment and branch URLs (`scrabby-<hash>-<team>.vercel.app`) change on every push and sit behind Deployment Protection. A blank Preview there is expected. Never point a `VITE_*` variable at one.
- **A domain change breaks the pair.** After you rename a project or add a custom domain, update the other project's variable and redeploy both.
- **Keys go on the app only.** Vercel also deploys `api/agent.ts` in the preview project. Without `AGENT_*` variables it never reaches a model, so never add a key there. Never set `AGENT_LIMITS` in production.
- **Locally, leave both `VITE_*_ORIGIN` empty.** The code then uses `localhost:5173` and `localhost:5174`. If you put the production URLs in `.env`, the local Preview breaks.
- **Ignore two type errors in the app build log.** Vercel's function build prints `TS2688: Cannot find type definition file for 'vite/client'` and the same for `'node'`. They come from Vercel type-checking `api/agent.ts` on its own. `pnpm build` has already passed at that point and the deploy succeeds.
- **Deployment Protection stays at Standard (the default).** It leaves production domains public. A stricter setting on the preview project puts a login page inside the iframe.
