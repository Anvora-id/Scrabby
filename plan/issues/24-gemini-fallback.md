# 24: Gemini fallback when Bob fails

Status: ready-for-agent
Blocked by: 20
Wave: 5 (runs with 21 and 22)

## What to build

If a call to Bob's endpoint fails (network error, firewall 403, 429, 5xx), the same run switches to a fallback model (Gemini) and carries on, and the Bob badge says so. Bob stays the first choice for every new run. Configured only by environment variables; with no fallback set, nothing changes.

## Parallel work

Runs at the same time as 21 and 22, each in its own worktree. Touch only: `api/agent.ts`, `api/agent.test.ts`, `src/agent.ts`, `src/agent.test.ts`, `.env.example`, `README.md` (the env section), and TDD.md §1 (env table) and §5. Do not run `scripts/split-specs.mjs`; the orchestrator does after merging.

## Read

- **Open only these files:** `spec/tdd/05.md`, `spec/tdd/01.md` (Environment variables table only).

## Environment variables (new, all optional)

| Name | Default | Meaning |
|---|---|---|
| `FALLBACK_API_KEY` | none | Turns the fallback on. Server only (Vercel: Sensitive). |
| `FALLBACK_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` | OpenAI-compatible base URL. |
| `FALLBACK_AUTH_SCHEME` | `Bearer` | |
| `FALLBACK_MODEL` | `gemini-3.8-flash` | |
| `FALLBACK_HEADERS` | `{}` | Extra headers, JSON. |
| `FALLBACK_LABEL` | `Gemini` | Badge name while the fallback runs. |

## Steps

- [ ] `api/agent.ts`: refactor `bobModel()` into `openAiModel(cfg)` where `cfg = { baseUrl, apiKey, authScheme, model, headers }`, read by `primaryConfig()` (the `AGENT_*` variables, as now) and `fallbackConfig()` (the `FALLBACK_*` variables; `null` when `FALLBACK_API_KEY` is unset). Same request, response mapping and error rules as TDD §5.2.
- [ ] `withFallback(primary: Model, fallback: Model | null, label: string, onSwitch: (label: string) => void): Model`: calls `primary` until a call throws. If the throw is not an abort (`signal.aborted` false) and `fallback` is set: `console.error('[agent] Bob failed, switching to <label>:', message)`, call `onSwitch(label)` once, retry the same call on `fallback`, and use `fallback` for every later call of this run. Without a fallback, rethrow (→ `unreachable`, as now). A `broken`, `turns` or `time` result never switches.
- [ ] `AgentEvent` (src/agent.ts and the server) gains `{ type: 'model'; label: string }`, sent once when a run switches. `agentHandler` wires `onSwitch` to enqueue it right away (before the next event). The default export uses `withFallback(openAiModel(primaryConfig()), fallbackConfig() && openAiModel(fallbackConfig()), FALLBACK_LABEL || 'Gemini', …)` per request.
- [ ] `src/agent.ts`: `runAgent` passes `model` events through and also sets the badge label store to that label, so every `BobBadge` shows `running on Gemini` for the rest of that run; the next run's `start` event resets the label to the GET value. `build.ts` and `assistant.ts` ignore `model` events (no change needed there).
- [ ] `GET /api/agent` stays `{ model: AGENT_LABEL || 'IBM Bob' }`.
- [ ] `.env.example`: add the six names with one-line comments. README env section: one paragraph on the fallback. TDD §1 env table and §5.1/§5.2: the new variables, event and `withFallback`.
- [ ] Tests (`api/agent.test.ts`): primary works → no `model` event, fallback never called; primary throws on round 1 → one `model` event with `Gemini`, the round retried on the fallback, later rounds on the fallback; primary throws on round 3 → same, from round 3; no fallback configured → `unreachable` as before; client abort → no switch. `src/agent.test.ts`: a `model` event updates the label store.

## Done when

- `pnpm check` passes.
- Locally with `FALLBACK_API_KEY` set and `AGENT_BASE_URL` pointed at a dead host (for example `https://127.0.0.1:9`): `pnpm build-demo` still finishes and prints the switch line; in the app, the Build card badge reads `running on Gemini`. With a good `AGENT_BASE_URL`, the badge stays `running on IBM Bob`.
- On Vercel (the human): add the `FALLBACK_*` variables to the app project (key Sensitive) and redeploy.
