# Scrabby

Young developers learn to code in Scratch, but what they make stays inside Scratch. AI tools can now build real websites, but only if you can describe what you want in words, and kids find it hard to put their ideas into a clear prompt.
Scrabby lets them plan the way they already know from Scratch. They snap their idea together as Blocks and Traits on a Canvas, and it feels like a game. Bob turns the plan into a real website they can click through. Then they open the real code, change it, and ask Bob what it does.

The product's Bob runs on IBM Bob's inference endpoint (`AGENT_BASE_URL`).

## Run locally

1. `pnpm install`
2. Copy `.env.example` to `.env` and fill in your `AGENT_API_KEY` and other values.
3. `pnpm dev` — app on http://localhost:5173, preview shell on http://localhost:5174.
4. `pnpm test` — run the test suite.

## Vercel projects

Two Vercel Hobby projects are deployed from this repo:

| Project | Build command | Output | Environment variables |
|---|---|---|---|
| `scrabby` (the app) | `pnpm build` | `dist` | `AGENT_API_KEY` (Sensitive), `AGENT_BASE_URL`, `AGENT_MODEL`, `AGENT_AUTH_SCHEME`, `AGENT_LABEL`, optional `AGENT_HEADERS`; `VITE_PREVIEW_ORIGIN` = the preview project URL |
| `scrabby-preview` | `pnpm build:preview` | `dist-preview` | `VITE_APP_ORIGIN` = the app project URL |

Live app: https://scrabby-two.vercel.app. Domains and deploy warnings: [`docs/deploy.md`](docs/deploy.md).
