# 15: Onboarding, demo and age check

Status: ready-for-agent
Blocked by: 05, 12
Lane: A

## What to build

The first visit: the age check ("Welcome to Scrabby", 18 or older), then an empty Project on Plan with the empty hint, the **Try the demo: Maya's bake sale** button and the show-around. **Demo** and **New Project** in the menu bar (with their warnings), **Show me around** to replay, and the one-time "Right-click a Block or Trait for more." tip.

## Read

- **Open only these files:** `spec/tdd/17.md`, `spec/tdd/18.md`, `spec/tdd/20.md`, `spec/design/brand-and-bob.md`, `spec/design/motion.md`, `spec/design/speech-bubble.md`, `spec/design/menus.md`, `spec/design/canvas.md`, `spec/prd/08.md`, `spec/prd/09.md`. The bullets below say what to look for inside them.
- TDD §17 (all), the Onboarding row of §18 "Look details".
- DESIGN.md: Brand and Bob, Motion, Speech bubble, Menus (Modal: the age check, the New Project warning, the demo warning), Canvas (Empty hint, Demo button).
- PRD §8 item 1, §9.

## Files

Modify: `src/onboarding.ts` (everything else of TDD §17), `src/slots/Canvas.tsx` (DemoButton under an empty Site; `droppedBlock` after dropping a new Block), `src/shell/MenuBar.tsx` (enable New Project, Demo, Show me around), `src/App.tsx` (mount `<Onboarding/>`).
Create: `src/shell/Onboarding.tsx`, `src/shell/Onboarding.module.css`, `src/onboarding.test.ts`.

## Steps

- [ ] `onboarding.ts`: `isEmptyProject`, `loadDemo`, `newProject`, the ask store, `TOURS` (texts exactly as PRD §9), tour store, `once`, the tip store and `droppedBlock`, `placeBubble` (TDD §17).
- [ ] `Onboarding.tsx`: the age check first (nothing else renders until it is accepted), then the tours, the tip and the replace warnings; `SpeechBubble`; exported `DemoButton`.
- [ ] Tests: the `onboarding.test.ts` row of TDD §20.

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- In a private window: the age check shows first and only once; then the show-around steps through palette, Canvas, Build button and step bar; the empty hint and the demo button show; the demo loads without a warning (empty Project) and with the warning otherwise; New Project always warns; the first dropped Block gets the one-time tip; opening Try & tweak the first time runs its two bubbles.
