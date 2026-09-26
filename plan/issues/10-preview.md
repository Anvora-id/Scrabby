# 10: Preview origin and Preview panel

Status: ready-for-agent
Blocked by: 03
Lane: B

## What to build

The live, clickable Prototype in Try & tweak. It runs on its own origin (a second Vercel project, or port 5174 locally) where a Service Worker serves the site's files, so the Prototype can never touch the app's storage. It redraws 400 ms after the code stops changing (with "Pause live updates"), flashes changed Blocks on request, shows an error bar when the page throws, and says "This page has no file yet." for a missing page.

## Read

- **Open only these files:** `spec/tdd/13.md`, `spec/tdd/18.md`, `spec/tdd/20.md`, `spec/design/brand-and-bob.md`, `spec/design/motion.md`, `spec/design/preview.md`. The bullets below say what to look for inside them.
- TDD §13 (all), the Preview rows of §18.
- DESIGN.md: Brand and Bob, Motion, Preview (ignore `srcdoc`: TDD §18).

## Files

Replace: `preview/index.html`, `preview/shell.ts`, `preview/sw.ts`, `preview/public/helper.js`, `src/slots/Preview.tsx`.
Create: `preview/serve.ts`, `preview/serve.test.ts`, `src/preview.ts`, `src/slots/Preview.module.css`.

## Steps

- [ ] `serve.ts` pure and tested (TDD §13, §20 serve rows).
- [ ] `sw.ts`, `shell.ts` (origin check against `VITE_APP_ORIGIN`; registers `/sw.ts` in dev and `/sw.js` in a build), `helper.js`.
- [ ] `src/preview.ts`: `flashBlocks`, `previewHooks` (default `askBobToFix` does nothing until issue 16), `onRedraw`, `takeFlash`.
- [ ] `Preview.tsx` per TDD §13: redraw rules, messages (only from `VITE_PREVIEW_ORIGIN` and the iframe's window), address bar, pause switch and strip, error bar, no-worker card.

## Done when

- `pnpm typecheck` and `pnpm test` pass; `pnpm build:preview` still produces `dist-preview/sw.js`.
- In the browser (dev select → built site, then Try & tweak): the site runs; links, the Order popup and the quiz work; a link to a missing page shows "This page has no file yet."; a `throw` added to `script.js` (via the dev tools on the Project, or after issue 11 by hand) shows the error bar.
