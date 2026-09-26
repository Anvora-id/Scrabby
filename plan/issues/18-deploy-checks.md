# 18: Deploy checks before push and PR

Status: done
Blocked by: none
Lane: B

## What to build

One command, `pnpm check`, that says whether the repo is safe to deploy: no key in any file or anywhere in the git history, the safety rules of AGENTS.md hold, the config still matches TDD §1, and typecheck, tests and both builds pass. A git `pre-push` hook runs it before every push. A GitHub Actions workflow runs it on every pull request into `main` and every push to `main`.

The secret rules matter most. A leaked `AGENT_API_KEY` gets the IBM account suspended (SECURITY.md). Bob's exported histories in `bob_sessions/` are committed to this public repo, so the check scans them too, and it never prints what it found.

## Read

- TDD §1: package.json (the two dependency lists), vercel.json, and the `.gitignore` / `.bobignore` lines.
- Nothing else. Every rule, message and file content is below. The regexes were tested against this repo, its whole git history and both builds: zero false findings.

## Files

Create: `scripts/guard.ts`, `scripts/guard.test.ts`, `scripts/check.ts`, `.githooks/pre-push`, `.gitattributes`, `.github/workflows/check.yml`.
Add to: `package.json` (one script), `README.md` (one section).

## Steps

- [x] `scripts/guard.ts`: the pure rules below. No file system, no git, no `process`.
- [x] `scripts/check.ts`: the runner below. The only file that reads files, runs git and runs pnpm.
- [x] `scripts/guard.test.ts`: the cases below.
- [x] `package.json`: add `"check": "node scripts/check.ts"` after `build-demo`. It is the one script beyond TDD §1's list, and that is intended. Change nothing else.
- [x] `.githooks/pre-push`, `.gitattributes` and `.github/workflows/check.yml` exactly as below. Stage the hook as executable: `git add --chmod=+x .githooks/pre-push`.
- [x] `README.md`: the section below, right after `## Run locally`.
- [x] The proof run in Done when.

Both scripts run on Node's built-in TypeScript support, like `scripts/build-demo.ts` (Node 22.18+ locally, 24 in CI). Use erasable syntax only (no `enum`, `namespace` or constructor parameter properties). End relative imports in `.ts`, and bring types in with `import type`.

## scripts/guard.ts

```ts
export type Finding = { at: string; problem: string }
```

`at` is `path:line` (1-based), `path`, or `commit <7-char sha> <path>`. **A Finding never contains the matched text.**

### Secret rules (copy as-is)

```ts
export const STRONG: [string, RegExp][] = [
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['Google API key', /AIza[0-9A-Za-z_-]{35}/],
  ['OpenAI-style key', /\bsk-[A-Za-z0-9_-]{20,}/],
  ['GitHub token', /\b(gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})/],
  ['AWS key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
]
// Only for source files and history: minified bundles have too many token-like strings.
export const LOOSE: [string, RegExp][] = [
  ['credential in a header', /\b(Bearer|Apikey)\s+[A-Za-z0-9_\-.+/=]{16,}/],
  ['credential in a string', /(api[_-]?key|secret|token|password)["']?\s*[:=]\s*["'`](?=[^"'`]*\d)[A-Za-z0-9_\-.+/=]{16,}["'`]/i],
]
```

`secretsIn(line: string, envKey: string, loose: boolean): string[]` returns the names of the rules that match `line`: every STRONG rule, the LOOSE rules only when `loose`, plus `the AGENT_API_KEY from .env` when `envKey` is not empty and `line` includes it.

### scanFile(path: string, text: string, envKey: string): Finding[]

For each line (split on `/\r?\n/`), with `at` = `path:line`:

1. Each name from `secretsIn(line, envKey, true)` → `looks like a secret (<name>)`.
2. Unless `path` ends in `.md`: each match of `/\bVITE_[A-Z0-9_]+/g` other than `VITE_PREVIEW_ORIGIN` and `VITE_APP_ORIGIN` → `<match>: only VITE_PREVIEW_ORIGIN and VITE_APP_ORIGIN may use VITE_ (Vite puts them in the browser bundle)`.
3. If `path` is product code (`/^(src|preview|public|skills|api)\//` or exactly `index.html`) and the line matches `/\bScratch\b/` → `uses the word "Scratch" in the product`. The regex is case-sensitive on purpose: TDD §12's UI text "remade from scratch" is allowed.
4. If `path` starts with `src/` or `api/` and the line matches `/console\.\w+\(.*(AGENT_API_KEY|apiKey|authorization|headers)/i` → `may log a key or request headers`.
5. Outside files (AGENTS.md: the Google Fonts stylesheet is the app's only outside file). In a `.html` file, each host from `/(?:src|href)=["'](?:https?:)?\/\/([^/"'?#]+)/gi`; in a `.css` file, each host from `/@import\s+(?:url\()?["']?(?:https?:)?\/\/([^/"')?#]+)/gi`. A host other than `fonts.googleapis.com` and `fonts.gstatic.com` → `loads an outside file from <host>`.

### scanBundle(path: string, text: string, envKey: string): Finding[]

For built files. Per line: each name from `secretsIn(line, envKey, false)` → `looks like a secret (<name>)`, plus rule 5 for `.html` files.

### scanHistory(log: string, envKey: string): Finding[]

`log` is the output of `git log -p --all --no-color "--format=commit %H"`. Walk its lines. `commit <sha>` sets the commit. `+++ b/<path>` sets the file (`+++ /dev/null` sets none). Every added line (starts with `+`, not `+++`) in a file other than `pnpm-lock.yaml`: each name from `secretsIn(line.slice(1), envKey, true)` → at `commit <sha7> <path>`, `looks like a secret (<name>) in the git history`.

### checkRepo(files: string[], read: (path: string) => string): Finding[]

`read` returns `''` for a missing file.

1. A file whose name (the part after the last `/`) is `.env` or starts with `.env.` (except `.env.example`), or contains `secret`, `credential` or `password` in any case → at the path, `must never be committed`.
2. A file under `api/` other than `api/agent.ts` and `api/agent.test.ts` → at the path, `is not allowed in api/: Vercel makes every file there a function`.
3. `package.json`: `dependencies` and `devDependencies` must equal TDD §1's lists, names and ranges. Copy the lists into `guard.ts` as `DEPENDENCIES` and `DEV_DEPENDENCIES`. Each name added, removed or changed → at `package.json`, `<name> differs from TDD §1 (a new dependency needs a human's yes)`.
4. `vercel.json` must parse to exactly TDD §1's object; otherwise, or if it is not valid JSON → at `vercel.json`, `differs from TDD §1`.
5. `.gitignore` must hold each of TDD §1's 12 lines and `.bobignore` its 3 (compare trimmed lines) → at the file, `lost the line <line>`.
6. `.env.example`: every line that is not blank and not a `#` comment must match `/^[A-Z0-9_]+=$/` → at `.env.example:<line>`, `must keep every value empty`.

## scripts/check.ts

Runs from the repo root. Prints each Finding as `✗ <at>  <problem>` (two spaces). In order:

1. `envKey` = the value of the `AGENT_API_KEY=` line in `.env`, with surrounding spaces and quotes removed. It is `''` when `.env` is missing or the value is under 8 characters. Never print it or any part of it.
2. Files = `git ls-files -z --cached --others --exclude-standard`, split on `\0`, keeping only paths that exist: what `git add .` would commit. For each file except `pnpm-lock.yaml`: read it as a Buffer; skip it if its first 8000 bytes hold a 0 byte (binary); otherwise `scanFile`. Then `checkRepo(files, read)`, then `scanHistory` on the git log. Run git with `execFileSync('git', [...], { encoding: 'utf8', maxBuffer: 1 << 28 })`.
3. Any findings: print `Deploy checks`, each finding, then `Problems found: <N>. Fix them before you push.`, and exit 1 without building.
4. Run `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm build:preview` in that order, each with `spawnSync('pnpm <script>', { stdio: 'inherit', shell: true })` (the shell finds `pnpm.cmd` on Windows). On the first non-zero status, print `✗ pnpm <script>  failed` and exit 1.
5. Each of `dist/index.html`, `dist-preview/index.html` and `dist-preview/sw.js` that does not exist → `✗ <path>  is missing after the build`. Every text file under `dist/` and `dist-preview/` goes through `scanBundle`: this catches a key baked into the browser bundle. Findings: print them as in step 3 and exit 1.
6. Print `✓ All deploy checks passed.` and exit 0.

## .githooks/pre-push (LF line endings)

```sh
#!/bin/sh
# Runs the deploy checks before every push (plan/issues/18-deploy-checks.md).
exec pnpm check
```

## .gitattributes

```
.githooks/* text eol=lf
```

This machine has `core.autocrlf=true`, and a hook checked out with CRLF endings fails.

## .github/workflows/check.yml

```yaml
name: check
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0 # the history scan needs every commit
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
```

`--frozen-lockfile` fails when `package.json` and `pnpm-lock.yaml` disagree, which is what Vercel's install would do.

## README section

```markdown
## Before you push

Run `git config core.hooksPath .githooks` once per clone. Every `git push` then runs `pnpm check`, which looks for keys in the files and the git history, checks the AGENTS.md safety rules and the TDD §1 config, and runs typecheck, tests and both builds. GitHub runs the same check on every pull request into `main`.
```

## scripts/guard.test.ts

Build every fake secret, extra `VITE_` name and capital-S "Scratch" at runtime (`'AIza' + 'B'.repeat(35)`, `'VITE_' + 'BOB_KEY'`, `'Scr' + 'atch'`), never as one literal. This file and your session export in `bob_sessions/` get scanned too.

- `secretsIn`: each STRONG and LOOSE rule finds its fake. These find nothing: `apiKey: process.env.AGENT_API_KEY`, ``authorization: `${scheme} ${key}` ``, `authorization: Apikey $BOB_KEY`, `token: 'variableName.definition'`, `Basic internationalization`. The env key is found; `''` as the env key finds nothing; `loose` false skips the LOOSE rules.
- `scanFile`: `JSON.stringify` of the result never contains the fake. An extra `VITE_` name is found, the two allowed ones are not, and none in a `.md` file. "Scratch" is found in `src/x.ts` and `skills/x/SKILL.md` but not in `docs/x.md`, and `remade from scratch` in `src/checkpoints.ts` is not found. `console.log('req', req.headers)` in `api/agent.ts` is found. A `<script src="https://cdn.example.com/x.js">` in `index.html` is found; the Google Fonts link is not.
- `scanBundle`: a STRONG fake and the env key are found; a line only LOOSE matches is not.
- `scanHistory`: a fake on a `+` line → `commit <sha7> <path>`; on a `-` line, nothing; in `pnpm-lock.yaml`, nothing.
- `checkRepo`: the real repo passes (`files` = `package.json`, `vercel.json`, `.gitignore`, `.bobignore`, `.env.example`, `api/agent.ts`; `read` = `readFileSync`, or `''` when missing). `notes-secret.txt`, `.env` and `.env.local` are found; `.env.example` and `SECURITY.md` are not. `api/extra.ts` is found. An extra dependency is found. A `.env.example` with a value is found. A `vercel.json` with another `maxDuration` is found. A `.gitignore` without `.env` is found.

## Done when

- `pnpm typecheck` and `pnpm test` pass.
- `pnpm check` on the clean tree prints `✓ All deploy checks passed.` and exits 0.
- The check catches problems. Write `tmp/make-bad.mjs` (`tmp/` is git-ignored):

  ```js
  import { writeFileSync } from 'node:fs'
  writeFileSync('notes-secret.txt', 'x\n')
  writeFileSync('src/zz-check.ts', `const k = "${'AIza' + 'B'.repeat(35)}"\nconst t = import.meta.env.${'VITE_' + 'BOB_KEY'}\n// made in ${'Scr' + 'atch'}\n`)
  ```

  Run `node tmp/make-bad.mjs`, then `pnpm check`. Do not open or stage the two files. It must exit 1 before any build and list exactly four problems: `notes-secret.txt` (must never be committed), `src/zz-check.ts:1` (Google API key), `src/zz-check.ts:2` (the `VITE_` name) and `src/zz-check.ts:3` (Scratch). Delete `notes-secret.txt`, `src/zz-check.ts` and `tmp/make-bad.mjs`; `pnpm check` passes again. Paste the failing output under `## Answer`.
- Commit: `ci: run the deploy checks before every push and PR (issue 18)`. This issue is tooling, not a user feature, so the type is `ci`, not `feat`.

## Humans, after merge (Bob skips this)

- Each developer, once per clone: `git config core.hooksPath .githooks`.
- GitHub → Settings → Rules (or Branches) for `main`: require the status check `check` before merging.
- GitHub → Settings → Advanced Security: turn on Secret Protection and Push protection (free on public repos). It blocks known key formats even when someone skips the hook.
- If the history check ever finds a key: rotate it at once (SECURITY.md), then remove it from the history. Until then the check fails on every push.

## Do not

- Print, log or write any matched secret or part of one. Open `.env` yourself: only `check.ts` reads it, and only for the key's value.
- Write a literal fake key, an extra `VITE_` name or capital-S "Scratch" into any file or command. Build them at runtime, as in the tests.
- Add a dependency (no gitleaks, husky or lint-staged: git hooks and Actions need none).
- Add a `prepare` or `postinstall` script (Vercel runs the install), or put `check` into `build` (Vercel runs `pnpm build`).
- Touch `vercel.json`, `tsconfig.json`, the specs, Vercel settings or other issues' files.

## Answer

`pnpm check` on the clean tree prints `✓ All deploy checks passed.` and exits 0.

Failing output from `node tmp/make-bad.mjs` followed by `pnpm check` (before any build):

```
Deploy checks
✗ src/zz-check.ts:1  looks like a secret (Google API key)
✗ src/zz-check.ts:2  VITE_BOB_KEY: only VITE_PREVIEW_ORIGIN and VITE_APP_ORIGIN may use VITE_ (Vite puts them in the browser bundle)
✗ src/zz-check.ts:3  uses the word "Scratch" in the product
✗ notes-secret.txt  must never be committed
Problems found: 4. Fix them before you push.
```

Exit 1. Exactly four problems. After deleting the two bad files, `pnpm check` passes again.

Next issues: 17 is blocked by this one (its step 2 runs `pnpm check`). `scripts/guard.ts` exports `DEPENDENCIES`, `DEV_DEPENDENCIES`, and all scanner functions — available for future checks if needed.
