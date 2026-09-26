# Scrabby hackathon build map

Label: build-map. Owner: the two developers. Executor: IBM Bob (Agent mode), one fresh task per issue.

## Destination

A live Scrabby on Vercel (`*.vercel.app`) that does everything the team prototype does, rebuilt in a fresh public MIT repo during the lablab IBM Bob 2.0 Hackathon (2026-09-25 15:00 UTC → 2026-09-27 15:00 UTC), with three changes from the prototype:

1. **Bob runs the product.** Builds and the Assistant call IBM Bob's OpenAI-compatible inference endpoint through our own tool loop (TDD §5). Gemini is gone; any fallback model is a settings change.
2. **Hosted, not local.** Two Vercel Hobby projects from one repo: the app (with the `/api/agent` function) and the Preview origin (TDD §1).
3. **PRD §8 guardrails and the Bob kit**, which the team prototype cut: the age check, the Bob badge, usage limits, and the Bob kit in the Download (TDD §5.2, §16, §17).

Done = issue 17's walk passes on the live URL, and the PRD §7 checklist passes.

## Sources (all in the new repo)

| File | Holds | Who reads it |
|---|---|---|
| `AGENTS.md` | Rules for Bob: what to read, how to finish a task, safety, the data-block rule | Bob, every task (auto-loaded) |
| `TDD.md` | The build spec: every module, name, string and number. §18 lists where DESIGN.md is overridden | Bob, only the sections an issue names |
| `DESIGN.md` | The look (copied word for word from the planning repo) | Bob, only the sections an issue names |
| `PRD.md` | What and why, demo script, guardrails, submission | Humans; Bob only when an issue says so |
| `CONTEXT.md` | Vocabulary | Bob, when naming things |
| `skills/` | The four Skills and `instruction-header.md` the product's Bob reads | Copied as-is; the server and the Download read them |
| `scripts/demo-instructions.md` | A ready instruction document for `pnpm build-demo` | Issue 09 |
| `plan/issues/NN-*.md` | One task per issue | Bob, one per task |

## Step 0: humans, before Bob's first task (about 30 minutes)

1. **Repo.** Create a public GitHub repo `scrabby` with an MIT `LICENSE` (copyright the two developers). Copy the contents of `hackathon/docs/` from the planning repo to the repo root (`AGENTS.md`, `CONTEXT.md`, `DESIGN.md`, `PRD.md`, `TDD.md`, `skills/`, `scripts/demo-instructions.md`) and `hackathon/plan/` to `plan/`. Commit `docs: add the specs and the build plan`. Add `bob_sessions/` with a `.gitkeep`.
2. **Bob key.** On one hackathon account (Bob web portal → API keys), create a key with Scope **Inference**. Every product Build and Assistant answer spends that account's Bobcoins, so pick the developer with more left and watch its balance (Bob IDE → Settings → General). If no Inference key can be made, ask in the hackathon Discord (`#ineedhelp`) and meanwhile use the fallback variables (TDD §1).
3. **Day-1 endpoint check** (proves the key, the auth scheme and tool calls in one request):

   ```bash
   curl -sS https://api.us-east.bob.ibm.com/inference/v1/chat/completions \
     -H "authorization: Apikey $BOB_KEY" -H "content-type: application/json" \
     -d '{"model":"premium","tool_choice":"auto","messages":[{"role":"user","content":"Call the ping tool once."}],"tools":[{"type":"function","function":{"name":"ping","description":"Ping.","parameters":{"type":"object","properties":{}}}}]}'
   ```

   Pass: JSON whose `choices[0].message.tool_calls[0].function.name` is `ping`. A 403 or an HTML page from a firewall: retry with `-H "user-agent: <the value IBM or the Discord gives>"` and put that header in `AGENT_HEADERS`. A reply with no `tool_calls`: try `AGENT_MODEL` values `ultra` or `fast`. Still failing: use the fallback variables and tell the team; the video line changes (PRD §7).
4. **Local env.** Each developer creates `.env` (never committed) with `AGENT_API_KEY`, and `AGENT_LIMITS=off`.
5. **Vercel** (after issue 01 is merged): import the repo twice as Hobby projects, `scrabby` and `scrabby-preview`, with the settings and variables in TDD §1 (`AGENT_API_KEY` as Sensitive). Put each project's URL into the other's `VITE_*` variable and redeploy both.
6. **Bob IDE.** Use v2.0.2 or later, signed in to the hackathon instance. Open the repo folder. For each issue: start a **new** task in Agent mode and paste only: `Do plan/issues/NN-<slug>.md. Follow AGENTS.md.` A fresh task per issue keeps context small (long tasks past about 120k tokens cost far more Bobcoins).

## Lanes and order

Two developers, each driving Bob on one lane. Merge each issue to `main` as soon as its checks pass; pull before starting the next.

| Order | Lane A (Canvas) | Lane B (engine) |
|---|---|---|
| 1 | 01 Scaffold and deploy skeleton | Step 0 items 2–4 |
| 2 | 02 Project model and catalogue | (waits for 02) |
| 3 | 03 Store, storage, fixtures, shell | 09 Agent route and Bob model client |
| 4 | 04 Canvas logic | 10 Preview |
| 5 | 05 Canvas UI | 11 Code editor |
| 6 | 06 Notes, menus, tooltips, Bob picks | 12 Library and Download with the Bob kit |
| 7 | 07 Custom Blocks UI | (waits for 08) |
| 8 | 08 Warnings and the instruction document | |
| 9 | 15 Onboarding, demo, age check | 13 Build |
| 10 | | 14 Checkpoints tab |
| 11 | | 16 Assistant |
| 12 | 17 Deploy and done walk (both) | 17 |

Hour 34 (Sun 01:00 UTC): one developer moves to the submission package (PRD §13). Hour 40 (Sun 07:00 UTC): feature freeze; only fixes after. Submit at 13:00 UTC.

**Drop order if time or Bobcoins run low** (PRD §6): the show-around (in 15), then the Preview error bar (in 10), then the Assistant (16). If 16 drops: the error bar button becomes **Open the file**, the Try & tweak grid loses its third column, the show-around loses its Assistant bubble, and Build/Checkpoints skip the pending-change checks.

## Issues

| # | Title | Blocked by | TDD | Budget |
|---|---|---|---|---|
| [01](issues/01-scaffold.md) | Scaffold and deploy skeleton | — | §1 | ~3 |
| [02](issues/02-model.md) | Project model and catalogue | 01 | §2, §3, §4 | ~5 |
| [03](issues/03-store-shell.md) | Store, storage, fixtures and shell | 02 | §6, §7, §19 | ~5 |
| [04](issues/04-canvas-logic.md) | Canvas logic: layout tree, drops, targeting | 02 | §8.1–§8.3 | ~4 |
| [05](issues/05-canvas-ui.md) | Canvas UI: Blocks, Traits, palette, drag, pan, zoom | 03, 04 | §8.4, §9.1, §9.2, §9.6 | ~6 |
| [06](issues/06-notes-menus-tooltips.md) | Notes, right-click menu, tooltips, Bob picks | 05 | §9.2, §9.3, §9.5 | ~4 |
| [07](issues/07-custom-blocks-ui.md) | Custom Blocks UI | 06 | §9.4, §8.4 | ~3 |
| [08](issues/08-warnings-document.md) | Warnings and the instruction document | 05 | §10 | ~5 |
| [09](issues/09-agent.md) | Agent route and Bob model client | 02 | §5 | ~5 |
| [10](issues/10-preview.md) | Preview origin and Preview panel | 03 | §13 | ~4 |
| [11](issues/11-code-editor.md) | Code editor | 03 | §14 | ~4 |
| [12](issues/12-library-download.md) | Library and Download with the Bob kit | 03 | §4 (library), §16 | ~3 |
| [13](issues/13-build.md) | Build | 08, 09, 10, 11 | §11 | ~4 |
| [14](issues/14-checkpoints.md) | Checkpoints tab | 13 | §12 | ~4 |
| [15](issues/15-onboarding.md) | Onboarding, demo and age check | 05, 12 | §17 | ~3 |
| [16](issues/16-assistant.md) | Assistant | 13, 14 | §15, §14 | ~5 |
| [17](issues/17-deploy-done-walk.md) | Deploy and done walk | all | §1, §20 | ~3 |

Budget = rough Bobcoins per fresh task (about 70 total of the team's 80). Re-plan if an issue costs double.

## Standing decisions (do not reopen)

- Replicate the team prototype as specified in TDD.md; no prototype code is copied. Where DESIGN.md differs, TDD §18 wins.
- Runtime: IBM Bob inference endpoint, `Authorization: Apikey`, model `premium`, our own `view`/`create`/`str_replace`/`insert` tools, 40 rounds and 240 s per run, non-streaming model calls (Assistant text arrives per round).
- Hosting: Vercel Hobby, two projects, `maxDuration` 300, skills shipped with `includeFiles`.
- Guardrails: age check (18+), Bob badge naming `AGENT_LABEL`, keys server-only, per-browser and daily limits in function memory (PRD §8).
- Adults only; Scratch's name, logo and Cat never in the product.
- Plain CSS with DESIGN.md tokens, Phosphor icons, CodeMirror 6, IndexedDB, fflate. No other dependencies.

## Out of scope

Stretch items in PRD §6 (Project list, the post-Build check, sound), accounts and cloud saves, real backends in Prototypes, users under 18, users' own keys, a Report button.
