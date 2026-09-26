# 17: Deploy and done walk

Status: ready-for-agent
Blocked by: 23, 24
Wave: 6
Lane: both (a human runs the walk; Bob fixes what fails)

## What to build

Nothing new. The live URL passes the walk below and PRD §7's checklist. Anything that fails is fixed here; a large failure becomes a new issue with the next free number (`19-…`).

## Read

- **Open only these files:** `spec/tdd/01.md`, `spec/tdd/20.md`, `spec/prd/07.md`, `spec/prd/13.md`. The bullets below say what to look for inside them.
- TDD §1 (Hosting), §20.
- PRD §7 (Checklist before submitting), §13 (the package).

## Steps

- [ ] Both Vercel projects deploy from `main`; the app's `VITE_PREVIEW_ORIGIN` and the preview's `VITE_APP_ORIGIN` point at each other; `AGENT_*` set on the app only (`AGENT_API_KEY` Sensitive); `AGENT_LIMITS` not set in production.
- [ ] `pnpm check` passes on `main` (typecheck, test, both builds and the deploy checks of issue 18), and so does the `check` workflow on GitHub.
- [ ] Run the walk in Chrome on the live URL, then steps 1, 7, 8 and 15 again in Firefox. Record each step's result under `## Answer`.

## The walk

1. Fresh private window: an empty Project on Plan with the empty hint, the demo button and the show-around.
2. Load the demo: "✓ Nothing to check". Hover a Block and a Trait: tooltips.
3. Drag a Block into a Page, change a Trait value, set one Trait to Bob picks, add a Note, fold a Block, Undo and Redo.
4. Edit the "Top bar" Custom Block: every Instance follows.
5. Delete the Quiz Page: a "!" on the Quiz buttons; the stepper finds it. Undo.
6. Upload an image and a video; pick them in Traits.
7. ▶ Build: the badge says "running on IBM Bob", chips light up, the Build finishes in under 4 minutes (target under 2), Try & tweak opens.
8. In the Preview: every link, the popup, the fake form and the quiz work.
9. Hand-edit a line: the Preview redraws. Click a Block chip: the Checkpoints tab opens at Checkpoint 1.
10. Ask the Assistant for a change; Review it; accept one change; the Preview flashes it.
11. Back in Plan: the Checkpoint and Built page tooltips; a loose Block's tooltip says "the Checkpoint". Drop a new Section with a text Trait into a Built page; ▶ Build. The hand edit survives.
12. Checkpoints: Go back to Checkpoint 1 (the "Before loading" entry appears), Edit its Blocks, then Go back to the latest.
13. Make a Build fail (temporarily set a wrong `AGENT_MODEL` on a preview deployment, or go offline in dev tools): "Build N did not finish", "Nothing changed…", the failure line, Try again and ← Back to the Blocks.
14. Reload: the Project, Checkpoints, Library and chat are still there.
15. Download code; unzip; double-click `index.html`: the site runs; `AGENTS.md` and `.bob/skills/` are in the zip.
16. Limits: `api/agent.test.ts` covers the counts (a live check would spend 10 Builds of Bobcoins). On the live URL, confirm only that `AGENT_LIMITS` is unset.
17. The repo has no keys (`git log -p | grep -i apikey` finds none), has `LICENSE`, and the README names the model that runs Bob.
