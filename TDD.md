# Scrabby technical design (hackathon build)

**Status:** build spec, 2026-09-26. It describes the team prototype as built (planning repo `spbob_prototype`, commit `267140d`), plus the hackathon changes: Bob runs the product through its inference endpoint, and the app is hosted on Vercel with the PRD §8 guardrails and the Bob kit.
**Readers:** Bob and the two developers. Bob builds from this file: every name, string and number here is exact. Do not rename, reword or "improve" anything.
**Other sources:** words in [`CONTEXT.md`](CONTEXT.md), what and why in [`PRD.md`](PRD.md), the look in [`DESIGN.md`](DESIGN.md), work order in [`plan/build-map.md`](plan/build-map.md), rules for Bob in [`AGENTS.md`](AGENTS.md).
**Precedence:** this file wins over PRD.md on mechanisms. §18 wins over DESIGN.md where they differ. DESIGN.md wins on every look value §18 does not mention.

**How to read this file.** Each section lists its files and stands alone. An issue names the sections it needs; read only those. Section numbers are stable ids.

## 0. Fixed rules (ADRs)

- **ADR 0001, Blocks are agent instructions.** Nothing executes Blocks. A Build sends the Blocks (as the instruction document) and the current code to Bob, and Bob edits the code. Builds are not deterministic.
- **ADR 0002, our own Canvas.** Nested DOM Blocks, not Blockly or Scratch. A Trait applies to the Block it sits in. Position on the Canvas, and layout inside a Block, mean nothing to Bob. Links between Blocks are Traits, never wires.
- **ADR 0003, Custom Blocks are classes.** Each Instance is a real copy that follows its definition, except fields and parts that Instance changed, added or removed. The definition is edited in its own view. No Custom Block inside a Custom Block. Bob always receives Instances fully resolved.
- **ADR 0004, `data-block` marks.** Bob writes `data-block="<id>"` on the outermost HTML tag of each Block's code, and `/* block <id> */` above CSS rules and scripts of one Block. Parts Bob adds carry their parent Block's id. Bob never removes a mark.
- **ADR 0005, a Build consumes its Blocks.** A finished Build saves a Checkpoint (code and Blocks) and turns the Site Block into the locked Checkpoint Block, holding one locked Built page per `.html` file. The next Build's Blocks go inside it. The Checkpoint list only grows. A failed Build changes nothing.
- **ADR 0006, runtime (replaces the prototype's Gemini ADR).** The product's Bob is IBM Bob's OpenAI-compatible inference endpoint, driven by our own tool loop (§5). Base URL, key, auth scheme, model and label come only from environment variables, so a fallback model is a settings change.

## 1. Stack, repo layout, hosting

```
Browser: https://<app>.vercel.app                 Vercel Function (Node 24)
┌──────────────────────────────┐  POST JSON      ┌──────────────────────────────────┐
│ React app (Vite build)       │ ──────────────▶ │ /api/agent  (api/agent.ts)        │
│  store.ts ── db.ts (IndexedDB)│ ◀──── SSE ───── │  limits → tool loop → Bob endpoint│
│  Preview <iframe> ───────────┼─▶ https://<preview>.vercel.app (second Vercel project):
│        ▲ postMessage         │    shell page, Service Worker sw.js, helper.js
└──────────────────────────────┘
Local dev: app on http://localhost:5173 (with /api/agent mounted by a Vite plugin), preview on http://localhost:5174.
```

| Part | Choice |
|---|---|
| App | React 19, TypeScript 7, Vite 8.3, `@vitejs/plugin-react` 6. |
| Styling | Plain CSS. `src/tokens.css` = DESIGN.md's Tokens block pasted as-is. One CSS Module per component. No component library, no Tailwind. |
| Icons | `@phosphor-icons/react`, mapped per icon key in `src/icons.ts` (§3). |
| Code editor | CodeMirror 6 (`lang-html`, `lang-css`, `lang-javascript`), `@codemirror/merge` and `@codemirror/search`. |
| Storage | IndexedDB through `idb`. |
| Agent | Plain `fetch` to an OpenAI-compatible `/chat/completions` endpoint (IBM Bob), behind `runAgent` (§5). No AI SDK. |
| Preview | A separate origin with a Service Worker (§13). |
| Zip | `fflate`. |
| Tests | Vitest 5 (`pnpm test`); `pnpm typecheck` runs `tsc --noEmit`. |

**package.json** (`"name": "scrabby"`, `"private": true`, `"type": "module"`, `"packageManager": "pnpm@9.15.6"`):
- scripts: `dev` = `vite`; `build` = `tsc --noEmit && vite build`; `build:preview` = `vite build --config preview/vite.config.ts`; `typecheck` = `tsc --noEmit`; `test` = `vitest run`; `build-demo` = `node scripts/build-demo.ts`.
- dependencies: `@codemirror/commands ^6.11.1`, `@codemirror/lang-css ^6.3.1`, `@codemirror/lang-html ^6.4.12`, `@codemirror/lang-javascript ^6.2.5`, `@codemirror/language ^6.12.4`, `@codemirror/merge ^6.12.2`, `@codemirror/search ^6.7.2`, `@codemirror/state ^6.7.6`, `@codemirror/view ^6.43.13`, `@lezer/highlight ^1.2.4`, `@phosphor-icons/react ^2.1.10`, `fflate ^0.8.3`, `idb ^8.0.3`, `react ^19.3.0`, `react-dom ^19.3.0`.
- devDependencies: `@types/node ^26.6.2`, `@types/react ^19.3.0`, `@types/react-dom ^19.3.0`, `@vitejs/plugin-react ^6.1.1`, `typescript ^7.0.2`, `vite ^8.3.1`, `vitest ^5.0.2`.
- No other dependency. Adding one needs a human's yes.

**tsconfig.json** compilerOptions: `target ES2022`, `lib [ES2023, DOM, DOM.Iterable]`, `module ESNext`, `moduleResolution bundler`, `jsx react-jsx`, `strict`, `noEmit`, `allowImportingTsExtensions`, `skipLibCheck`, `isolatedModules`, `noUnusedLocals`, `noUnusedParameters`, `types [vite/client, node]`; `include [src, preview, api, scripts, vite.config.ts]`.

**index.html**: lang en, charset, viewport, `<title>Scrabby</title>`, `<link rel="icon" type="image/svg+xml" href="/bob-head.svg">`, one Google Fonts stylesheet link for the app's own fonts (DESIGN.md Tokens) and the font Trait's list (`https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat&family=JetBrains+Mono:wght@500&family=Merriweather&family=Nunito:wght@400;600;700;800;900&family=Pacifico&family=Playfair+Display&family=Poppins&family=Space+Mono&display=swap`), `<div id="root">`, `<script type="module" src="/src/main.tsx">`.

**Repo layout**

| Path | Holds |
|---|---|
| `AGENTS.md`, `PRD.md`, `TDD.md`, `DESIGN.md`, `CONTEXT.md`, `LICENSE` (MIT), `README.md` | Docs. The README says the product's Bob runs on IBM Bob's inference endpoint, and how to run it. |
| `plan/` | `build-map.md` and `issues/`. |
| `assets/` | Bob's artwork as drawn (DESIGN.md Brand and Bob): `Scrabby_2.svg`, `bob-head.svg`, `Scrabby.png` (video and deck only). Never edit them. |
| `public/` | `bob.svg` (a copy of `assets/Scrabby_2.svg`) and `bob-head.svg` (a copy of `assets/bob-head.svg`), served at `/bob.svg` and `/bob-head.svg`. |
| `skills/` | The four Skills and `instruction-header.md`, copied word for word from the planning repo. Never edit them in a code issue. |
| `src/model/` | `types.ts`, `catalogue.ts`, `project.ts`, `library.ts`. |
| `src/canvas/` | `tree.ts`, `target.ts`, `drag.ts`, `marks.ts`, `menu.ts`, `tooltip.ts`, `bobPicks.ts`, `cx.ts`, `BlockView.tsx`, `TraitPill.tsx`, `Overlays.tsx`, `Warnings.tsx`, CSS Modules `Canvas`, `parts`, `Overlays`, `Warnings`. |
| `src/instructions/` | `warnings.ts`, `document.ts`. |
| `src/code/` | `code.ts`, `setup.ts`, `navigation.ts`, `MergeReview.tsx`, `editor.module.css`. |
| `src/shell/` | `MenuBar`, `StepBar`, `Steps`, `Onboarding`, `BobBadge` (each `.tsx` + `.module.css`). |
| `src/slots/` | One component per panel: `Canvas`, `Palette`, `Library`, `Checkpoints`, `BuildButton`, `BuildCard`, `Preview`, `CodeEditor`, `Assistant` (+ CSS Modules; `Build.module.css` is shared by BuildButton and BuildCard). |
| `src/*.ts` | `main.tsx`, `App.tsx`, `App.module.css`, `tokens.css`, `icons.ts`, `store.ts`, `history.ts`, `db.ts`, `agent.ts`, `build.ts`, `checkpoints.ts`, `assistant.ts`, `preview.ts`, `download.ts`, `onboarding.ts`. |
| `src/fixtures/` | `fixtures.ts` (demo and built-site fixtures), `dev.ts` (dev-only loader). |
| `api/agent.ts` | The only server file: the agent route, the model client and the usage limits. Keep it one file (Vercel turns every file in `api/` into a function). |
| `preview/` | `index.html`, `shell.ts`, `sw.ts`, `serve.ts`, `public/helper.js`, `vite.config.ts`. |
| `scripts/` | `build-demo.ts`, `demo-instructions.md`. |

**vite.config.ts** (root): plugins `react()`, `previewServer()`, `agentApi()`; `server: { port: 5173, strictPort: true }`.
- `previewServer()`: `apply` only when `command === 'serve' && !process.env.VITEST`. In `configureServer`, `createServer({ configFile: 'preview/vite.config.ts' })`, `listen()`, `printUrls()`, and close it when the main server's `httpServer` closes.
- `agentApi()`: `apply: 'serve'`. In `configureServer`, copy `loadEnv(mode, root, ['AGENT_'])` into `process.env`, then mount middleware at `/api/agent` exactly like this:

```ts
server.middlewares.use('/api/agent', async (req, res, next) => {
  try {
    const abort = new AbortController()
    res.on('close', () => abort.abort())
    const mod = await server.ssrLoadModule('/api/agent.ts') // reloaded on edit: no restart needed
    const response: Response = await mod.default.fetch(
      new Request(new URL(req.originalUrl ?? '/api/agent', 'http://localhost'), {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: req.method === 'POST' ? (Readable.toWeb(req) as ReadableStream) : undefined,
        duplex: 'half',
        signal: abort.signal,
      } as RequestInit),
    )
    res.writeHead(response.status, Object.fromEntries(response.headers))
    if (response.body) for await (const chunk of response.body) res.write(chunk)
    res.end()
  } catch (e) {
    if (res.headersSent) res.end()
    else next(e)
  }
})
```

**preview/vite.config.ts** (verified to build):

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// The Preview origin (TDD §13). sw.js keeps a fixed name so the shell can register it.
export default defineConfig({
  root: here('.'),
  server: { port: 5174, strictPort: true },
  build: {
    outDir: here('../dist-preview'),
    emptyOutDir: true,
    rolldownOptions: {
      input: { index: here('index.html'), sw: here('sw.ts') },
      output: { entryFileNames: c => (c.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js') },
    },
  },
})
```

**Hosting: two Vercel Hobby projects from the same GitHub repo** (humans set these up, build-map step 0):

| Project | Settings | Environment variables |
|---|---|---|
| `scrabby` (the app, the submitted URL) | Framework Vite. Build `pnpm build`. Output `dist`. | `AGENT_API_KEY` (Sensitive), `AGENT_BASE_URL`, `AGENT_MODEL`, `AGENT_AUTH_SCHEME`, `AGENT_LABEL`, optional `AGENT_HEADERS`; optional `FALLBACK_API_KEY` (Sensitive) and the other `FALLBACK_*`; `VITE_PREVIEW_ORIGIN` = the preview project's URL |
| `scrabby-preview` | Framework Other. Build `pnpm build:preview`. Output `dist-preview`. | `VITE_APP_ORIGIN` = the app project's URL. No `AGENT_*` variables, so its copy of `/api/agent` never reaches a model. |

**vercel.json** (root, applies to both projects):

```json
{ "functions": { "api/agent.ts": { "maxDuration": 300, "includeFiles": "skills/**" } } }
```

**Environment variables** (server ones are read on every request; never give a secret a `VITE_` prefix):

| Name | Default | Meaning |
|---|---|---|
| `AGENT_API_KEY` | none (required) | Bob Inference API key. Server only. |
| `AGENT_BASE_URL` | `https://api.us-east.bob.ibm.com/inference/v1` | OpenAI-compatible base; the server POSTs to `${AGENT_BASE_URL}/chat/completions`. |
| `AGENT_AUTH_SCHEME` | `Apikey` | Sent as `authorization: <scheme> <key>`. `Bearer` for other providers. |
| `AGENT_MODEL` | `premium` | The model id. |
| `AGENT_HEADERS` | `{}` | Optional JSON object of extra request headers (for example a `User-Agent` or a team-id header the endpoint asks for). |
| `AGENT_LABEL` | `IBM Bob` | The name on the Bob badge. |
| `AGENT_LIMITS` | on | `off` turns the usage limits off (local dev only). |
| `FALLBACK_API_KEY` | none | Turns the fallback model on (§5.2 `withFallback`). Server only (Vercel: Sensitive). |
| `FALLBACK_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` | OpenAI-compatible base URL of the fallback. |
| `FALLBACK_AUTH_SCHEME` | `Bearer` | Sent as `authorization: <scheme> <key>` to the fallback. |
| `FALLBACK_MODEL` | `gemini-3.8-flash` | The fallback's model id. |
| `FALLBACK_HEADERS` | `{}` | Optional JSON object of extra request headers for the fallback. |
| `FALLBACK_LABEL` | `Gemini` | The name on the Bob badge while the fallback runs. |
| `VITE_PREVIEW_ORIGIN` | `${location.protocol}//${location.hostname}:5174` | App build: where the Preview lives. |
| `VITE_APP_ORIGIN` | `${location.protocol}//${location.hostname}:5173` | Preview build: the only origin the shell takes files from. |

Fallback model: with `FALLBACK_API_KEY` set (a Gemini key), a run whose Bob call fails switches to the fallback for the rest of that run (§5.2 `withFallback`); Bob stays first for every new run. Redeploy after any variable change.

**`.env.example`** lists every `AGENT_*` name with an empty value and a one-line comment each. `.gitignore`: `.env`, `.env.*`, `!.env.example`, `node_modules/`, `dist/`, `dist-preview/`, `tmp/`, `.vercel/`, `.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/`. `.bobignore`: `.env`, `.env.*`, `!.env.example`.

**src/main.tsx:** imports `./tokens.css`, then `startStore().then(() => createRoot(#root).render(<StrictMode><App /></StrictMode>))`.

## 2. Data model

**File:** `src/model/types.ts`. Copy these types exactly (comments may be shortened).

```ts
export type BlockType = 'canvas' | 'site' | 'page' | 'checkpoint' | 'navbar' | 'hero' | 'section' | 'cardgrid'
  | 'card' | 'form' | 'popup' | 'footer' | 'text' | 'image' | 'button' | 'box'
export type TraitType = 'color' | 'font' | 'vibe' | 'size' | 'position' | 'onclick' | 'purpose' | 'fakedata'
  | 'text' | 'image' | 'sound' | 'video' | 'tellbob' | 'letbobpick'
export type Pos = { x: number; y: number }
export type Layout = { d: 'row' | 'col'; k: (string | Layout)[] } // rows and columns of child ids; for the user only

export interface Block {
  id: string            // b1, b2, …: permanent, never reused
  type: BlockType
  name: string
  note: string
  traits: string[]      // Trait ids, in order
  children: string[]    // Block ids, in order: the truth; `layout` is repaired to match it
  layout?: Layout
  pos?: Pos             // only on Blocks sitting directly on the Canvas
  file?: string         // Page Blocks: the .html file, set once at creation, never renamed
  locked?: boolean      // the Checkpoint Block and Built pages
  noteOn?: boolean      // Add Note shows an empty Note
  folded?: boolean      // unset: Blocks 4 levels deep start folded
  defines?: string      // this Block is the definition of Custom Block `defines`; lives off the Canvas
  inst?: string         // this Block is an Instance of Custom Block `inst`
  removed?: string[]    // on an Instance: definition parts removed from it
  from?: string         // a copied part: the definition part it follows
  ov?: { name?: true; note?: true } // fields this copied part changed
}

// Trait values are strings: color = hex; choice/text = the text (a value not in the choices is a "custom…" value);
// asset = an Asset id or ""; on click = a choice, "page:<blockId>" or "popup:<blockId>".
export interface Trait {
  id: string            // t1, t2, …
  type: TraitType
  value: string         // kept while bobPicks is on, so × restores it
  note: string          // also the Bob picks hint
  bobPicks?: boolean
  noteOn?: boolean
  pos?: Pos             // only on loose Traits sitting directly on the Canvas
  from?: string
  ov?: { value?: true; note?: true } // `value` covers bobPicks
}

export interface CustomBlockDef { id: string /* d1, d2, … */; blockId: string; color: { h: number; s: number; l: number } }
export type AssetKind = 'image' | 'video' | 'sound'
export interface Asset { id: string /* a1, … */; file: string /* path is assets/<file> */; kind: AssetKind; mime: string; bytes: number; width?: number; height?: number; seconds?: number }
export type Files = Record<string, string> // path → text

export interface ChatMessage {
  role: 'user' | 'bob'
  text: string
  time: number          // also the message's id; strictly increasing
  proposal?: Proposal   // the diff card
  line?: true           // an app line ("Code went back to Checkpoint 2"), never sent to Bob
}
export interface Proposal {
  summary: string
  files: Record<string, { base?: string; proposed: string }> // base missing = a new file
  total: number         // changes when proposed
  accepted: number
  decided: number
  done?: true
}
export interface Project {
  id: string            // crypto.randomUUID()
  name: string
  next: { b: number; t: number; d: number; a: number } // id counters
  blocks: Record<string, Block> // always holds the `canvas` Block (id 'canvas', type 'canvas')
  traits: Record<string, Trait>
  defs: Record<string, CustomBlockDef>
  assets: Asset[]
  files: Files          // the current Prototype code, including .builds/build-N.md
  chat: ChatMessage[]
  updated: number
  checkpoint?: number   // the Checkpoint the current code came from; unset before Build 1
  checkpointNames?: Record<number, string> // names the user gave Checkpoints, by number
}
export interface BuiltBlocks { top: string[]; blocks: Record<string, Block>; traits: Record<string, Trait>; defs: Record<string, CustomBlockDef> }
export interface Checkpoint {
  projectId: string
  number: number        // 1, 2, …; the list only grows
  label: string         // "Checkpoint 2", "Before loading Checkpoint 1"
  from: number | null   // the Checkpoint the Build started from; null on Build 1 or a remake
  before: Files
  after: Files
  blocks: BuiltBlocks | null // null on code-only Checkpoints
  time: number
}
```

The Canvas is the Block `canvas`. Its `children` are the Site or Checkpoint Block plus loose Blocks; its `traits` are loose Traits.

## 3. Catalogue and icons

**Files:** `src/model/catalogue.ts`, `src/icons.ts`. The one place every Block and Trait type is defined.

`Category = 'site' | 'pages' | 'ui' | 'prim' | 'design' | 'behavior' | 'content' | 'bob' | 'my'`. CSS class `cat-<id>` (tokens.css) gives the colors.

`CATEGORIES` (palette order): `pages` Pages, `ui` UI, `prim` Primitives, `design` Design, `behavior` Behavior, `content` Content, `bob` Talk to Bob, `my` My Blocks.

`BlockTypeDef { label; category; icon: IconKey; meaning; accepts: BlockType[]; tooltip }`. `accepts`: Site and Checkpoint take `['page']`; Textbox, Frame, Button take `[]`; every other type takes ANY_PART = `navbar hero section cardgrid card form popup footer text image button box`. `acceptsBlock(parent, child)` = `parent === 'canvas' || BLOCK_TYPES[parent].accepts.includes(child)`.

`BLOCK_TYPES` (key: label · category · icon · meaning · tooltip). Tooltips use `{where}` (§9.6):

| Key | Label | Cat | Icon | meaning | tooltip |
|---|---|---|---|---|---|
| site | Site | site | site | The whole website; its Traits describe every page. | Your whole website. Traits here apply to every page. |
| page | Page | pages | page | One page of the website, in its own \`.html\` file. | One page of your website. Put it inside {where}. |
| checkpoint | Checkpoint | site | checkpoint | The website as already built; its Traits ask for changes across the whole site, and new Pages in it are new pages. | Your website as Bob built it. Drop in Pages or Traits to ask for changes. |
| navbar | Navbar | ui | navbar | The bar of links for getting around the site. | The menu bar with links, usually at the top of every page. |
| hero | Hero | ui | hero | The big eye-catching banner at the top of a page, usually with a headline, an image and a button. | The big first thing people see on a page: a headline, a picture, a button. |
| section | Section | ui | section | One band of a page that groups content with one purpose. | A part of a page that groups things together. |
| cardgrid | Card grid | ui | cardgrid | A grid of similar Cards. Repeat the Cards to a full grid with varied content only if a "fake data" Trait asks for it; otherwise show the Cards placed. | A grid of cards, like products or photos. |
| card | Card | ui | card | A small box that shows one thing, usually an image, a title and a short text. | One box with a picture, some words and maybe a button. |
| form | Form | ui | form | Fields a visitor fills in and sends; sending is fake and shows a success message. | Boxes people type into, with a Send button. Sending is pretend. |
| popup | Popup | ui | popup | A box that opens over the page and has a way to close it. It stays closed unless an "on click" opens it, a Note or "tell Bob" says when it opens, or a "let Bob pick" covers it. | A small window that pops up over the page. |
| footer | Footer | ui | footer | The strip at the bottom with small print, contact details and links. | The strip at the very bottom of a page. |
| text | Textbox | prim | text | Words: a heading, paragraph or label, whichever fits. | Words on the page. |
| image | Frame | prim | image | One picture. With no image Trait, a plain placeholder box labelled with the Block's name; a Library Asset only under "let Bob pick". | A picture from your Library. |
| button | Button | prim | button | Something a visitor clicks. | Something people click. |
| box | Panel | prim | box | Groups what's inside; has no meaning of its own. | An empty panel that holds other Blocks. |

(In `meaning`, the backticks around `.html` are literal characters.)

`BUILT_PAGE = { label: 'Built page', meaning: 'A page already built; Blocks and Traits in it ask for changes or additions to that page.', tooltip: 'A page Bob already built. Drop Blocks or Traits here to change it.' }`.
`LOOSE_IDEA_TOOLTIP = 'Loose idea: Bob ignores it until you move it into {where}.'`

`TraitTypeDef { label; category; icon; valueKind: 'text' | 'choice' | 'color' | 'asset' | 'action'; choices?; default; meaning; tooltip; hint?; stretch?: true }`.

| Key | Label | Cat | Icon | Kind | Choices | Default | meaning | tooltip |
|---|---|---|---|---|---|---|---|---|
| color | color | design | t_color | color | | `#3B82F6` | main color of this Block; decide where it shows, keep text readable | The main color of this Block. |
| font | font | design | t_font | choice | Nunito, Poppins, Merriweather, Playfair Display, Caveat, Space Mono, Bebas Neue, Pacifico | Nunito | typeface for this Block's text | The style of the letters. |
| vibe | vibe | design | t_vibe | choice | playful, calm, bold, minimal, elegant, retro | playful | overall feel: wording, shapes, spacing, motion | The overall feeling, like playful or calm. |
| size | size | design | t_size | choice | small, medium, large, full width, full screen | medium | room it takes in its parent; "full screen" fills the window | How big this Block is. |
| position | position | design | t_position | choice | top, bottom, left, right, center, stays on top when scrolling, floating corner | top | where it sits inside its parent | Where this Block sits. |
| onclick | on click | behavior | t_onclick | action | ON_CLICK_CHOICES | `''` | when a visitor clicks this Block | What happens when someone clicks it, like opening a page or a popup. |
| purpose | purpose | behavior | t_purpose | choice | slideshow, countdown, search (fake), filter / sort (fake), appears on scroll | slideshow | what this Block does by itself, no click needed | What this Block does by itself, like a slideshow. |
| fakedata | fake data | behavior | t_fakedata | text | | 6 items with prices | fill with made-up content as described | Pretend content that Bob makes up, like 6 products with prices. |
| text | text | content | t_text | text | | Hello! | exact words to show, as written | The words this Block shows. |
| image | image | content | t_image | asset | | `''` | show this picture | The picture this Block shows, from your Library. |
| sound | sound | content | t_sound | asset (stretch: hidden) | | `''` | play this sound when the Block is clicked, unless "purpose" says otherwise | The sound this Block plays, from your Library. |
| video | video | content | t_video | asset | | `''` | show this video with play controls | The video this Block shows, from your Library. |
| tellbob | tell Bob | bob | t_tellbob | text | | `''` (hint `like make it feel cozy`) | what the user tells Bob | Tell Bob anything the other Blocks can't say. |
| letbobpick | let Bob pick | bob | t_bobpicks | text | | `''` (hint `like the colors`) | what Bob decides; empty means anything in this Block | Let Bob decide something for you, like the colors. |

`ON_CLICK_CHOICES = ['submits (fake)', 'adds to cart (fake)', PLAYS_A_SOUND, "shows / hides what's inside", 'adds to a list', 'checks an answer', 'counts clicks', 'remembers on this device']`, `PLAYS_A_SOUND = 'plays a sound'` (stretch: never shown).

`COLOR_PRESETS` (name, hex, in this order): coral `#FF8A80`, pink `#F8BBD0`, orange `#FFB74D`, sunny yellow `#FFE066`, lime `#C5E1A5`, mint `#A8E6CF`, sky blue `#81D4FA`, navy `#1E3A5F`, lavender `#C5B3F6`, brown `#8D6E63`, black `#111111`, white `#FFFFFF`.

**icons.ts:** `ICONS` maps key → Phosphor component (`<Name>Icon` from `@phosphor-icons/react`), `satisfies Record<string, Icon>`; `IconKey = keyof typeof ICONS`. Keys: site Globe, page FileText, navbar List, hero FlagBanner, section Rows, cardgrid SquaresFour, card Cards, form ClipboardText, popup PictureInPicture, footer SquareHalfBottom, text TextT, image Image, button CursorClick, box Square, custom PuzzlePiece, checkpoint Lock, t_color Palette, t_font TextAa, t_vibe Sparkle, t_size ArrowsOut, t_position PushPin, t_onclick Lightning, t_purpose Gear, t_fakedata DiceFive, t_text PencilSimpleLine, t_image ImageSquare, t_sound SpeakerHigh, t_video VideoCamera, t_tellbob ChatCircleDots, t_bobpicks Lightbulb, flag Flag, tab_canvas PuzzlePiece, tab_library Image, tab_checkpoints ClockCounterClockwise, new Plus, demo Cake, download DownloadSimple, undo ArrowCounterClockwise, redo ArrowClockwise, help Question, zoom_in Plus, zoom_out Minus, zoom_reset Equals, fold CaretDown, check Check, close X, reload ArrowClockwise. Every icon renders with `weight="fill"` unless §18 says otherwise.

## 4. Project functions

**File:** `src/model/project.ts`. Functions that change a Project are recipes: they mutate the Project they get; callers run them inside `updateProject` (§6), which hands them a copy.

- `emptyProject()`: `{ id: crypto.randomUUID(), name: 'My website', next: {b:1,t:1,d:1,a:1}, blocks: { canvas: { id:'canvas', type:'canvas', name:'Canvas', note:'', traits:[], children:[] } }, traits:{}, defs:{}, assets:[], files:{}, chat:[], updated: Date.now() }`, then `addBlock(p, 'site', 'My website')` (so the Site is `b1`), `pos {x:40, y:40}`, pushed to `canvas.children`.
- `addBlock(p, type, name = BLOCK_TYPES[type].label)`: id `b${p.next.b++}`, `{ id, type, name, note:'', traits:[], children:[] }`; a Page also gets `file = pageFile(p, name)`. Not placed anywhere. Returns the id.
- `addTrait(p, type, value = TRAIT_TYPES[type].default)`: id `t${p.next.t++}`, `{ id, type, value, note:'' }`. Returns the id.
- `pageFile(p, name)` (private): taken = every Block's `file`. If `index.html` is free, return it. Else base = name lower-cased, runs of non `[a-z0-9]` → `-`, leading/trailing `-` trimmed, or `page` if empty; try `${base}.html`, then `${base}-2.html`, `-3`, … until free. Test: pages named `Home`, `Our Menu!`, `Our menu`, `''` → `index.html`, `our-menu.html`, `our-menu-2.html`, `page.html`.
- `mapLayout(l, f)`: copy of a layout with every leaf id passed through `f`.
- `copyTrait(p, sid)` (private): `addTrait(p, s.type, s.value)`, then set `note`, `bobPicks`, `from: sid`.
- `copyBlock(p, sid)` (private): new id `b${p.next.b++}` taken FIRST, then `{ id, type, name, note, from: sid, traits: s.traits.map(copyTrait), children: s.children.map(k => map[k] = copyBlock(k)), layout: s.layout && mapLayout(s.layout, x => map[x]) }`. (Id order matters: the parent id is taken before its Traits and children.)
- `makeInstance(p, defId)`: n = number of Blocks on the Canvas (`canvasBlocks`) with `inst === defId`, plus 1. `copyBlock` of the definition Block, then set `inst: defId`, `removed: []`, `name: '<definition name> <n>'`, delete `from`. The caller places it.
- `freshColor(p)` (private): PRESET_HUES `[345, 15, 40, 90, 140, 180, 205, 235, 275, 310]`. The first hue no def uses → `{h, s:90, l:71}`. If all used: the integer hue 0–359 with the largest circular distance to the nearest used hue (first best wins, scanning 1–359 against a start of 0) → `{h, s:85, l:71}`.
- `addDef(p, blockId)` (private): id `d${p.next.d++}`, `p.defs[id] = { id, blockId, color: freshColor(p) }`, `p.blocks[blockId].defines = id`.
- `makeCustomBlock(p, id)`: `d = addDef(p, id)`; `inst = makeInstance(p, d)`; in the parent that holds `id`, replace `id` by `inst` in `children` and in `layout` (mapLayout); if the Block had `pos`, move it to the Instance and delete it from the definition. Returns `d`. The caller checks it is allowed (§9.4).
- `newCustomBlock(p)`: `addDef(p, addBlock(p, 'box', 'My block'))` (no Instance).
- `hasOverride(x)`: `!!x.ov && Object.values(x.ov).some(Boolean)`.
- `applyChange(before, recipe)`: `p = structuredClone(before)`; `recipe(p)`; `recordInstanceEdits(before, p)`; `resolveAll(p)`; `syncName(before, p)`; return `p`.
- `syncName(before, p)` (private): the Project name and the top Block's name (the Site, or the Checkpoint Block after a Build) are one name. top = the Site or Checkpoint Block in `canvas.children`; none → return. If `p.name` is unchanged and the top Block in `before` has a name other than `before.name` (a Project saved before the names were joined), `p.name` = that name. Then top `name = p.name`, so a Checkpoint load that brings back an older name keeps the current one. `NEW_NAME = 'My website'` (exported) is the new-Project name.
- `instanceParts(p)` (private): for every Instance on the Canvas, map each Block and Trait inside it (the Instance included) to the Instance id.
- `recordInstanceEdits(before, after)` (private). `now = instanceParts(after)`; `up` = part id → the Block that held it in `before`. For each `[id, instId]` of `instanceParts(before)`:
  1. Skip if `after.blocks[instId]?.inst` is not set (the whole Instance went).
  2. If `now.get(id) !== instId` (deleted from the Instance or dragged out): `from` = the part's `from` in `before`; outermost = `up.get(id) === instId || now.get(up.get(id)) === instId`; if `from && outermost` and not already in `inst.removed`, append `from` to `inst.removed`. If the part still exists in `after`, `unfollow(after, id)`. Continue.
  3. A Block part: if `name` changed and `id !== instId`, set `ov.name = true`; if `note` changed, set `ov.note = true`.
  4. A Trait part: if `value` changed or `!!bobPicks` changed, set `ov.value = true`; if `note` changed, set `ov.note = true`.
- `unfollow(p, id)`: delete `from` and `ov` on the part, and recursively on its Traits and children, skipping any child that is an Instance (it keeps following its own Custom Block).
- `resolveInstance(p, instId)`: if the Block is an Instance with a def, `syncBlock(p, defBlock, inst, inst)`.
- `resolveAll(p)`: `resolveInstance` for every Instance on the Canvas (definitions and Checkpoints untouched).
- `syncBlock(p, src, dst, root)` (private): if `dst !== root` and no `ov.name`, copy `name`; if no `ov.note`, copy `note`. Then `syncList` over Traits (update: if no `ov.value`, copy `value` and `bobPicks`; if no `ov.note`, copy `note`) and over children (update: recurse `syncBlock`).
- `syncList(p, src, dst, root, get, copy, update)` (private): 1) from the end of `dst`, remove (and `drop`) every item whose `from` is set and not in `src`. 2) `at = 0`; for each `sid` of `src`: find the index in `dst` of the item with `from === sid`; if none: skip if `root.removed` holds `sid`, else insert `copy(sid)` at `at`. Then `update(src item, dst item)`; `at = index + 1`.
- `drop(p, id)` (private): delete a Block with its Traits and children, or a Trait.
- `canvasBlocks(p)`: every Block under `canvas`, depth first (not the Canvas, not definitions).

**Library** (`src/model/library.ts`, recipes too):
- KINDS: `image/png`, `image/jpeg`, `image/gif`, `image/webp` → image; `video/mp4`, `video/webm` → video. `MAX_BYTES = 25 * 1024 * 1024`.
- `uploadKind(f: {name, type, size})`: not in KINDS → `` `${f.name} can't go in the Library: it takes png, jpg, gif and webp images, and mp4 and webm videos.` ``; `size > MAX_BYTES` → `` `${f.name} is ${formatBytes(f.size)}. The Library takes files up to 25 MB.` ``; else the kind.
- `formatBytes(n)`: under 1024² → KB (n/1024), under 1024³ → MB, else GB; value `< 10` → `+v.toFixed(1)`, else `Math.round(v)`; `"640 KB"`, `"1.2 MB"`, `"30 MB"`.
- `cleanFileName(name)`: `normalize('NFD')`, lower case, trim, whitespace runs → `-`, drop every char not in `[a-z0-9._-]`; if the result is empty or starts with `.`, prefix `file`. `My Cat.PNG` → `my-cat.png`, `Été (2).webm` → `ete-2.webm`.
- `freeName` (private): on a clash add `-2`, `-3` before the extension.
- `addAsset(p, uploadName, info)`: id `a${p.next.a++}`, push `{ id, file: freeName(cleanFileName(uploadName)), ...info }`.
- `renamedFile(p, id, typed)`: `cleanFileName(typed)`; if it has no `/\.[a-z0-9]+$/` extension, add the Asset's old extension.
- `renameProblem(p, id, typed)`: `` `${file} is already in the Library` `` if another Asset has that file, else null.
- `renameAsset(p, id, typed)`: sets `file` to `renamedFile`. Traits keep the id. Code is not rewritten.
- `removeAsset(p, id)`: removes it from `p.assets` (Traits keep the id and show "missing file").
- `deleteWarning(p, id)`: users = for every Block, its Traits of type image/video/sound whose value is the id, as `` `${blockName} › ${traitType}` ``. With users: `` `Delete ${file}? ${n} Trait${n>1?'s':''} (${users joined ', '}) and any code using it will break. You can ask the Assistant to fix the references.` `` Without: `` `Delete ${file}? Any code using it will break. You can ask the Assistant to fix the references.` ``

## 5. Agent: route, model client, client seam

**Files:** `api/agent.ts` (server), `src/agent.ts` (client), `scripts/build-demo.ts`.

### 5.1 Types (src/agent.ts)

```ts
export interface AssistantContext {
  level: 'very simply' | 'simply' | 'in detail'
  openFile: string | null
  selection: string | null
  lastBuildCard: string | null
  library: string[] // one line per Asset: "assets/<file>: kind, W×H px, N s"
}
export type AgentRequest =
  | { kind: 'build'; document: string; files: Files }
  | { kind: 'assistant'; messages: ChatMessage[]; context: AssistantContext; files: Files }
export type AgentEvent =
  | { type: 'start' }                                  // the server accepted the run
  | { type: 'limit'; message: string }                 // a usage limit refused it (HTTP 429); nothing ran
  | { type: 'text'; text: string }                     // Assistant reply text
  | { type: 'block'; id: string }                      // a data-block id first written by a tool call
  | { type: 'files'; files: Files; summary?: string }  // the files when the run ends
  | { type: 'error'; reason: 'time' | 'turns' | 'unreachable' | 'broken' }
  | { type: 'model'; label: string }                   // the run switched to the fallback model
```

A stream is: `start`, then any `text`/`block` (and at most one `model`), then exactly one `files` or `error`. Or just one `limit`.

### 5.2 Server (api/agent.ts)

Constants: `MAX_ROUNDS = 40`, `MAX_MS = 240_000`. Exports: `MAX_ROUNDS`, `MAX_MS`, types `ChatMsg`, `ToolCall`, `ModelReply`, `Model`, type `ModelConfig`, functions `runLoop`, `primaryConfig`, `fallbackConfig`, `openAiModel`, `withFallback`, `bobModel`, `createLimits`, `agentHandler`, and `export default { fetch: agentHandler(bobModel) }` (Vercel's web handler shape; the dev plugin calls `default.fetch`).

```ts
export type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } }
export type ChatMsg =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string }
export type ModelReply = { content: string | null; tool_calls: ToolCall[]; finish: string | null }
export type Model = (args: { messages: ChatMsg[]; signal: AbortSignal }) => Promise<ModelReply>
```

**Skills:** read at module load with `readFileSync(join(process.cwd(), 'skills', path), 'utf8')`, CRLF → LF. `SKILLS` = the four `SKILL.md` files (`code-rules`, `behavior`, `content`, `visual-style`, in that order) joined with a blank line. `PROMPT_ENDING` = the text inside the ```` ```text ```` block after `## Prompt ending` in `skills/instruction-header.md` (the two lines "Keep every `data-block` mark." and "Change only what the request asks.").

**Roles** (exact text):

BUILD_ROLE:
```
You are Bob. You build the user's website from the instruction document, following the Skills below.
Write and change files only with the view, create, str_replace and insert tools. When every file is done, answer with one short line.
```

ASSISTANT_ROLE:
```
You are Bob, in the Assistant beside the code editor. You talk with the user about this website's code, following the Skills below.
- Help only with this Project's code and Blocks. Politely steer anything else back.
- Read files with the view tool before you answer about them. Files under `.builds/` are the instruction documents of the Builds that made the code; they are read-only.
- The Builds made the code, not you. Explain a Build from what its instruction document asked. Never invent the Build's reasoning.
- You change code only, with the create, str_replace and insert tools. When a fix belongs in the Blocks, say in words which Block or Trait to add or change.
- Every answer explains in plain words what the code does, or what your change does.
- Write plain text: the chat shows Markdown marks such as ** and # as they are.
- If you change files, make every edit first. End your answer with a line that starts with "Summary:" and says in 1–3 short plain lines what changed.
```

LEVELS:
- `very simply`: `Explain very simply: the fewest and plainest words, short sentences, no code words without a meaning.`
- `simply`: `Explain simply: plain words, and name a code word only with its meaning.`
- `in detail`: `Explain in detail: name the HTML, CSS and JavaScript parts involved and why they work.`

**prompt(req): ChatMsg[]**
- Build: `[{ role:'system', content: BUILD_ROLE + '\n\n' + SKILLS }, { role:'user', content: document + '\n\n' + files + '\n\n' + PROMPT_ENDING }]` where files = `# Current files\n\n` + each file not under `.builds/` as `<file path="PATH">\nTEXT\n</file>` joined by a blank line, or `None yet.`.
- Assistant: system = `ASSISTANT_ROLE + '\n\n' + context + '\n\n' + SKILLS`, context = these parts joined by a blank line: `# This turn`; `LEVELS[level]`; `Files: ` + sorted file paths joined `, ` (or `none yet`); `Open file: ` + openFile or `none`; with a selection: `Selected in the open file:` then a line of three backticks, the selection, and a line of three backticks (joined by `\n`); without: `Nothing selected.`; `Last Build card:\n` + card or `no Build yet`; `Library (use as assets/<file>):\n` + lines or `empty`. Chat: take the last 10 messages, drop leading ones until the first `user`, map `bob` → `assistant`, `user` → `user`, content = text.

**TOOLS** (OpenAI function tools; `{ type: 'function', function: { name, description, parameters } }`):

| name | description | parameters (JSON schema, all `type: object`) |
|---|---|---|
| view | Show a file with line numbers, or list every file when path is ".". | `path` string (required); `view_range` array of integer, description "Optional [first, last] line; last -1 means to the end." |
| create | Write a whole file, replacing it if it exists. | `path`, `file_text` strings (both required) |
| str_replace | Replace old_str, which must appear exactly once in the file, with new_str. | `path`, `old_str`, `new_str` strings (all required) |
| insert | Insert insert_text after line insert_line (0 puts it at the top). | `path` string, `insert_line` integer, `insert_text` string (all required) |

**runTool(files, name, args): string** (mutates `files`). `class Broken extends Error`.
- `arg(key)`: throws Broken unless `args[key]` is a string.
- `path = posix.normalize(arg('path'))`, strip leading `/`, `.` → `''`. If it starts with `..` → `Error: paths stay inside the site folder.` If name is not `view` and path starts with `.builds/` → `Error: .builds/ is read-only. It holds the past instruction documents.`
- missing = `` `Error: ${path} does not exist. The files are: ${sorted paths joined ', ' || 'none yet'}.` ``
- `view`: path `''` → sorted paths joined `\n`. Missing → missing. Else lines as `${n}\t${line}` (n from 1), sliced by `view_range [from = 1, to = -1]` (`to -1` = end), joined `\n`.
- `create`: `files[path] = arg('file_text')` → `` `Wrote ${path}.` ``
- `str_replace`: old = `arg('old_str')`, new = `args.new_str` if string else `''`. Missing file → missing. count = occurrences; 0 → `` `Error: no match for old_str in ${path}. Use view to see the exact text.` ``; >1 → `` `Error: ${count} matches for old_str in ${path}. Add more lines around it so it matches once.` ``; else replace (use a replacer function so `$` in new text is literal) → `` `Edited ${path}.` ``
- `insert`: text = `arg('insert_text')`; missing file → missing; `at = Number(args.insert_line)` must be an integer 0…lines.length, else `` `Error: insert_line must be 0 to ${lines.length}.` ``; splice in at `at` → `` `Edited ${path}.` ``
- Any other name → throw Broken.
- `blockIds(args)`: ids from `data-block="([^"]+)"` in `[file_text, new_str, insert_text].join('\n')`.

**runLoop(req, model, { ms = MAX_MS, signal } = {}): AsyncGenerator<AgentEvent>**
1. `files = { ...req.files }`, `messages = prompt(req)`, `timeout = AbortSignal.timeout(ms)`, `stop = signal ? AbortSignal.any([timeout, signal]) : timeout`, `lit = new Set()`, `said: string[] = []`.
2. For `round = 0, 1, …`:
   1. `reply = await model({ messages, signal: stop })`.
   2. `text = reply.content ?? ''`. If `!text.trim()` and no tool calls → throw Broken. If `reply.finish` is `length` or `content_filter` → throw Broken.
   3. If `text.trim()`: for an Assistant turn yield `{ type: 'text', text: said.length ? '\n\n' + text : text }`; push `text.trim()` to `said`.
   4. No tool calls → summary from this final round's `text` only: the text after its last `Summary:` (trimmed) if present, else its last paragraph (split on blank lines) trimmed, else `''`. Yield `{ type:'files', files, summary }` for an Assistant turn, `{ type:'files', files }` for a Build. Return.
   5. If `round === MAX_ROUNDS` → yield `{ type:'error', reason:'turns' }`, return.
   6. Push `{ role:'assistant', content: reply.content, tool_calls }`. For each call: `args = JSON.parse(call.function.arguments || '{}')` (throw Broken if it throws or is not an object); `output = runTool(files, name, args)`; if the tool is not `view` and output does not start with `Error`, yield `{ type:'block', id }` for each id of `blockIds(args)` not yet in `lit` (add it); push `{ role:'tool', tool_call_id: call.id, content: output }`.
   7. `stop.throwIfAborted()`.
3. catch: if `signal?.aborted` → return silently (the client left). reason = Broken ? `broken` : `timeout.aborted` ? `time` : `unreachable`. Log `[agent] the model call failed:` + message when unreachable. Yield `{ type:'error', reason }`.

**ModelConfig** = `{ baseUrl, apiKey, authScheme, model, headers }` (all strings; `headers` is JSON). `primaryConfig()` reads the `AGENT_*` variables, `fallbackConfig()` the `FALLBACK_*` ones (`null` when `FALLBACK_API_KEY` is unset), each with its §1 default.

**openAiModel(cfg): Model**:
- POST `${cfg.baseUrl}/chat/completions` (strip one trailing `/` from the base), headers `content-type: application/json`, `authorization: ${cfg.authScheme} ${cfg.apiKey}`, plus `JSON.parse(cfg.headers)`; body `{ model: cfg.model, messages, tools: TOOLS, tool_choice: 'auto' }`; `signal`.
- Not `ok` → throw `Error(\`model answered ${status}: ${first 300 chars of the body}\`)` (→ unreachable).
- `choice = json.choices?.[0]`. No choice → `{ content: null, tool_calls: [], finish: null }` (→ broken). `content` = `message.content` when it is a string; when it is an array, join the `text` of its parts; else null. `tool_calls = message.tool_calls ?? []`. `finish = choice.finish_reason ?? null`.
- Never log the key or the headers.

**withFallback(primary: Model, fallback: Model | null, label: string, onSwitch: (label: string) => void): Model**: calls `primary` until a call throws. If the throw is not an abort (`signal.aborted` false) and `fallback` is set: `console.error('[agent] Bob failed, switching to <label>:', message)`, call `onSwitch(label)` once, retry the same call on `fallback`, and use `fallback` for every later call of this run. Without a fallback, rethrow (→ `unreachable`). A `broken`, `turns` or `time` result never switches.

**bobModel(onSwitch = () => {}): Model** (reads env on every call, so one per request): `withFallback(openAiModel(primaryConfig()), fallbackConfig() && openAiModel(fallbackConfig()), FALLBACK_LABEL || 'Gemini', onSwitch)`.

**createLimits()** returns `take(kind: 'build' | 'assistant', browser: string, now: number): string | null` (null = allowed, and counted):
- Caps: per browser per rolling hour: build 10, assistant 40. For everyone per UTC day (`new Date(now).toISOString().slice(0, 10)`): build 40, assistant 150. Day counts reset when the date changes.
- Day cap reached → `Scrabby has reached today's limit for everyone. Please try again tomorrow.`
- Hour: timestamps for `${kind}:${browser}` newer than `now - 3_600_000`. At the cap → m = `Math.max(1, Math.ceil((oldest + 3_600_000 - now) / 60_000))`; build → `` `You've used this hour's 10 Builds. Try again in ${m} minute${m === 1 ? '' : 's'}.` ``; assistant → `` `You've asked Bob 40 questions this hour. Try again in ${m} minute${m === 1 ? '' : 's'}.` ``
- Else record `now` for the browser and add 1 to the day count; return null. A failed Build still counts (it was counted when it started).

**agentHandler(model: (onSwitch: (label: string) => void) => Model, limits = createLimits())** returns `(request: Request) => Promise<Response>`:
- `GET` → `Response.json({ model: process.env.AGENT_LABEL || 'IBM Bob' })`.
- Not `POST` → 405 `POST an AgentRequest`. Body not JSON → 400 `The body is not JSON`. `kind` not `build`/`assistant` → 400 `kind must be build or assistant`.
- Unless `process.env.AGENT_LIMITS === 'off'`: browser = header `x-scrabby-browser` (first 64 chars) or `anon`; `message = limits.take(kind, browser, Date.now())`; if set → `Response.json({ message }, { status: 429 })`.
- Else stream SSE: a `ReadableStream` whose `pull` sends `data: ${JSON.stringify(event)}\n\n` for `{ type:'start' }` first, then every `runLoop(req, model(onSwitch), { signal: request.signal })` event, and closes when it ends; `onSwitch(label)` enqueues `{ type:'model', label }` right away (through the controller kept from `start`), before the next event; `cancel` calls `events.return()`. Headers `content-type: text/event-stream`, `cache-control: no-cache`.

### 5.3 Client (src/agent.ts)

- `browserId()`: `localStorage['scrabby.browser']`, created with `crypto.randomUUID()` on first use; if storage throws, one id per page load.
- `runAgent(req)`: `fetch('/api/agent', { method:'POST', headers: { 'content-type':'application/json', 'x-scrabby-browser': browserId() }, body: JSON.stringify(req) })`. A throw → yield `unreachable`, return. Status 429 → `message` from the JSON body (fallback `Scrabby has reached today's limit for everyone. Please try again tomorrow.`), yield `{ type:'limit', message }`, return. Else yield every `readAgentStream(res)` event; on `start` set the label store back to the GET value, on `model` set it to `label` (so every BobBadge shows the fallback for the rest of that run).
- `readAgentStream(res)`: if `res.ok && res.body`: read with `res.body.pipeThrough(new TextDecoderStream()).getReader()` in a `read()` loop (not `for await`: Safari cannot iterate a stream). Buffer text; split on `\n\n`; keep the last piece as the buffer; each message is JSON after stripping `^data: `; yield it; return after a `files`, `error` or `limit` event. A throw falls through. `finally` cancels the reader (ignore errors). After the loop (stream ended early, or not ok): yield `{ type:'error', reason:'unreachable' }`.
- `useAgentLabel(): string | null`: a store filled once by `fetch('/api/agent')` (GET) → `model`; null until it arrives or if it fails. `runAgent` changes it during a run (above). `agentLabel()` reads it outside React.

### 5.4 scripts/build-demo.ts

Runs one real Build with no browser (use it on day 1 to prove the key and the endpoint). `process.loadEnvFile('.env')` in a try; throw `AGENT_API_KEY is not set. Add it to .env.` if missing. Reads `scripts/demo-instructions.md`, calls `agentHandler(bobModel, createLimits())` with a POST Request `{ kind:'build', document, files:{} }`, prints `Building the demo with ${AGENT_MODEL || 'the default model'}…` first, reads it with `readAgentStream`, and prints `${seconds} s  Building <id>` per block, `The Build failed: <reason>` (exit 1), or on files: empties `tmp/demo-site/`, writes each file (skip paths that leave the folder), writes a placeholder `assets/cupcakes.svg`, prints `Done: <paths> in tmp/demo-site/`. Import the server with `'../api/agent.ts'` and the client with `'../src/agent.ts'` (Node runs TypeScript directly).

## 6. State: store, history, IndexedDB

**Files:** `src/store.ts`, `src/history.ts`, `src/db.ts`.

**createStore<T>(initial)** → `{ get, set(v) (notifies listeners), use() }` where `use` is `useSyncExternalStore(subscribe, get)`. The app's small stores all use it.

**Project store** (`store.ts`): `useProject`, `getProject`.
- `setProject(p)`: set, then `saveProject(p)` (fire and forget; on failure `console.error('Saving the Project failed', e)`).
- `updateProject(recipe, key = focusedField())`: `before = get()`; `updateProjectWithoutUndo(recipe)`; `history.record(before, key)`. `focusedField()` = `document.activeElement?.closest('input, textarea') ?? null` (guard `globalThis.document`).
- `updateProjectWithoutUndo(recipe)`: `setProject({ ...applyChange(get(), recipe), updated: Date.now() })`.
- `undo()` / `redo()`: `p = history.undo(get())` (or redo); if p: `setProject({ ...p, chat: get().chat })` (the chat is never undone). `canUndo`, `canRedo`, `clearHistory`.
- `startStore()`: `navigator.storage?.persist?.()` (ignore errors); `saved = await loadLatestProject()` (on error log `Loading the Project failed`, treat as none); if saved, set it without saving; else `setProject(get())` (saves the empty Project).
- UI store: `{ step: 'plan' | 'build' | 'try', planTab: 'canvas' | 'library' | 'checkpoints', editing: string | null }`, start `{ step:'plan', planTab:'canvas', editing:null }`; `useUi`, `getUi`, `setStep`, `setPlanTab`, `setEditing` (types `Step`, `PlanTab`). `editing` = the Custom Block id whose edit view the Canvas shows.
- Callers that are not user edits pass `key = null` (a Build, loading a Checkpoint, accepting Assistant changes, menu items).

**createHistory<T>(limit = 100)** (`history.ts`): `past`, `future`, `lastKey = null`.
- `record(before, key = null)`: clear `future`; if `key != null && key === lastKey` return (merge into the open step); `lastKey = key`; push `before`; drop the oldest past `limit`.
- `undo(current)`: `lastKey = null`; empty past → undefined; push current to future; return popped past. `redo` mirrors it. `clear()`, `canUndo()`, `canRedo()`.

**IndexedDB** (`db.ts`, `openDB('scrabby', 1)`), stores: `projects` (keyPath `id`), `checkpoints` (keyPath `['projectId','number']`, index `projectId`), `assets` (keyPath `['projectId','id']`, index `projectId`, value `AssetBlob { projectId, id, blob }`). Exports: `loadLatestProject()` (all projects, newest `updated` first), `clearAll()` (clear all three stores), `saveProject(p)` (put), `listCheckpoints(projectId)` (by index, number order), `addCheckpoint(c)` (add), `putAsset`, `getAsset(projectId, id)`, `listAssets(projectId)`, `deleteAsset(projectId, id)`. Only one Project is ever kept (PRD §9).

## 7. Shell: App, menu bar, step bar, Steps

**Files:** `src/App.tsx`, `src/App.module.css`, `src/shell/MenuBar.tsx`, `StepBar.tsx`, `Steps.tsx`, `BobBadge.tsx` (+ CSS Modules). Look: DESIGN.md Shell, Screen layout, Buttons.

- **App:** `<div class=app>` (height 100vh, min-width 1366px, flex column) holding `<MenuBar/>`, `<StepBar/>`, `<main class=page>` (flex 1, min-height 0, flex, padding 10px, `--page`) with the Step on screen, then `<Onboarding/>` (§17). `body`: margin 0, `--page` background, `--text` color, `--font`, `--fs`; `* { box-sizing: border-box }` (`:global` rules in App.module.css).
- **MenuBar** (reads `useProject()` so Undo/Redo stay current): the logo (`<img src="/bob.svg" alt="">` 40px tall, then "Scrabby" in `--fs-logo` weight 900), the Project name chip (an `<input>`, `aria-label` `Project name`, title `Rename your Project`, `size` as TextField §9.2; typing → `updateProject(d => { d.name = value })`, which renames the Site too (§4 `syncName`); Enter blurs; on blur a blank name → `NEW_NAME`), then buttons, each with its icon (§3), **New Project** (`askNewProject`), **Demo** (`askDemo`), **Download code** (`downloadCode(project)`; on error log `Download code failed`), **Undo** (disabled unless `canUndo()`, title `Undo (Ctrl+Z)`), **Redo** (disabled unless `canRedo()`, title `Redo (Ctrl+Y)`), a dev-only `<select>` (rendered only when `import.meta.env.DEV`; disabled placeholder option "Dev: load fixture…", one option per `FIXTURES` entry, title "Dev only: replace the current Project with a fixture", value always `""`), and at the right end (`margin-left: auto`) **Show me around** (icon `help`) (disabled on the Build step; starts tour `try` on Try & tweak, else `plan`). Window keydown: with Ctrl or Meta, not inside `input, textarea, select`: `z` without Shift → undo; `y`, or `z` with Shift → redo; `preventDefault()`.
- **StepBar** (`<nav data-tour="steps">`): steps Plan (`plan`), Build (`build`), Try & tweak (`try`), a "›" between them. Each is a button with `data-state` = `current`, `done` (before current) or `idle`; inside, a circle (the `check` icon when done, else its number) and the label. Disabled: the Build step always, and every step while the Build step is on screen. Click → `setStep`. On Try & tweak only: a right-aligned **← Back to the Blocks** button → Plan.
- **PlanStep:** a tab row (`role=tablist`; each tab `role=tab`, `aria-selected`, icon `tab_<id>` 20px fill; z-index: selected 3, others `2 - index`) over one tab panel. Canvas tab: the palette column (`data-tour="palette"`), then the Canvas area (`data-tour="canvas"`, flex 1, position relative) holding `<Canvas/>` and the Build button holder (absolute, right 20px, bottom 22px, flex). Library tab: `<Library/>`. Checkpoints tab: `<Checkpoints/>`.
- **BuildStep:** a grid that centers a 560px-wide (max 100%) holder with `<BuildCard/>`.
- **TryStep:** grid `minmax(0,1.2fr) minmax(0,1fr) 320px`, gap `--gap`; Two 8px drag handles sit between the panels (`role="separator"`, `aria-orientation="vertical"`, title `Drag to resize, double-click to reset`): transparent, `cursor: col-resize`, a 2px `--line` bar in the middle that turns `--brand` on hover and while dragging. Dragging sets the columns in px, with minimums Preview 320, Code 320, Assistant 260; the rest stays with the Preview. While dragging, the handle has pointer capture, `body` gets `user-select: none` and the Preview iframe `pointer-events: none`. Left/Right arrow keys on a focused handle move it by 16px. Double-click resets to the default grid. The widths are kept in `localStorage['scrabby.tryCols']` (no storage = the default grid). Panels: three panels (`--surface`, 2px `--line`, a 3px `--line` bottom edge, radius `--r-panel`, min-height 0, flex; the code editor's panel is the editor itself, DESIGN.md Code editor): Preview (`data-tour="preview"`), CodeEditor, Assistant (`data-tour="assistant"`). No Build button here.
- **BobBadge:** `useAgentLabel()`; renders nothing while unknown; else a pill "running on {label}" with title `Bob's answers come from {label} right now.` Look: DESIGN.md Bob badge. Used in the Assistant title bar and at the right end of the Build card's running title.

## 8. Canvas: layout tree, drop targets, dragging, pan and zoom

**Files:** `src/canvas/tree.ts`, `target.ts`, `drag.ts`, `cx.ts`, `src/slots/Canvas.tsx`, `src/canvas/Canvas.module.css`. Look: DESIGN.md Canvas.

`cx(...classes)` joins the truthy class names with spaces.

### 8.1 tree.ts

Types: `NewBlockType = Exclude<BlockType, 'canvas' | 'site' | 'checkpoint'>`; `DragItem = { kind:'newBlock'; type: NewBlockType } | { kind:'newTrait'; type: TraitType } | { kind:'block'; id } | { kind:'trait'; id } | { kind:'newInstance'; defId }`; `isTraitItem(item)` = newTrait or trait; `Slot = { where: 'left' | 'right' | 'above' | 'below' | 'rowBefore'; ref: string }`; `Drop = { id: string; slot?: Slot | null; tIdx?: number; pos?: Pos }`; `Option = { value: string; label: string; missing?: true; font?: string }`.

Layout tree (a group runs `row` or `col`; the root is a `col`):
- `leafList(n)`: every id in the tree, in order.
- `norm(n, root = false)` (private): normalize child groups first; drop empty groups; flatten a child group that has its parent's direction into the parent; a non-root group with one item becomes that item.
- `keepLeaves(n, keep)` (private): a copy without the ids `keep` rejects.
- `repairLayout(b)`: `l = norm(keepLeaves(b.layout ?? {d:'col',k:[]}, id is in b.children), root)`; append to the root every child id not in `l`. Returns `{ d: l.d, k }`.
- `insertInto(l, id, slot)`: works on a clone. No slot, no ref, or ref not in the tree → push `id` at the end of the root. `rowBefore` → insert `id` into the root just before the root item that contains `ref`. Else `dir` = `row` for left/right, `col` for above/below; `after` = right or below. Walk to the group that holds leaf `ref`: if that group runs `dir`, insert `id` beside `ref` (after it if `after`); else replace `ref` with `{ d: dir, k: after ? [ref, id] : [id, ref] }`. Return the normalized root.
- `parentMap(p)`: Block or Trait id → id of the Block holding it, walking from `canvas` and from every definition Block.
- `canDrop(p, item, target, parents = parentMap(p))`: a Trait item → true. Type = the new type, the definition Block's type (newInstance), or the moved Block's type. False if the type is `canvas` or `!acceptsBlock(targetType, type)`. `chain` = target and its ancestors. `inCustom` = a Block in the chain is an Instance or a definition. `hasInst(id)` = the Block or anything inside it is an Instance. newInstance → `!inCustom`. A moved Block → false if `chain` holds it (into itself); false if it is a locked Page and `target` is not its current parent; false if `inCustom && hasInst(id)`. Otherwise true.
- `canTrash(p, item)`: `trait` → true; `block` → not site/checkpoint, not locked, not a definition; anything else → false.
- `detach` (private): remove the id from its parent's `traits`, or from `children` (then `layout = repairLayout(parent)`).
- `dropItem(p, item, at): string`: create the item (`addBlock` with the type's label, `addTrait` with its default, `makeInstance`) or detach the moved one. Trait → splice into `c.traits` at `at.tIdx ?? length`. Block → `c.layout = insertInto(repairLayout(c), id, at.slot)`; `c.children = leafList(c.layout)`. If `at.id === 'canvas' && at.pos`, set the item's `pos`; else delete it. Returns the id.
- `removeItem(p, id)`: detach, then delete it and everything inside it.
- `onClickOptions(p, traitId): Option[]`: `{ value:'', label:'pick one' }`; `go to page › <name>` (value `page:<id>`) for each Page directly in the Site or Checkpoint Block (never loose Pages); `open popup › <name>` (value `popup:<id>`) for each Popup inside the Trait's own Page (walk up to the nearest Page; none for a Trait not in a Page); every `ON_CLICK_CHOICES` item except `plays a sound`. If the value is `page:…`/`popup:…` and not listed, append `{ value, label: 'go to missing page' | 'open missing popup', missing: true }`.

### 8.2 target.ts

`Rect = { left, top, right, bottom }`; `DragRects = { blocks: Map<string, Rect>; traits: Map<string, Rect> }`: screen rects measured once per drag, after the dragged item left its place (so the drop shadow never moves the target).

`targetAt(p, rects, item, x, y): Drop | null`:
1. `hit` = the Block with the most ancestors whose rect contains the point.
2. `targetFor(bx)`: if bx has a parent that is not `canvas`, the item is a Block, and `canDrop(item, parent)`: `ex = min(28, width / 5)`, `ey = min(12, height / 5)`; where = `left` if `x - left < ex`, else `right` if `right - x < ex`, else `above` if `y - top < ey`, else `below` if `bottom - y < ey`; if where → `{ id: parent, slot: { where, ref: bx } }`. Then `!canDrop(item, bx)` → null. A Trait item → `{ id: bx, tIdx }`, tIdx = index of the first of bx's measured pills with `y < top || (y <= bottom && x < (left + right) / 2)`, else the number of measured pills. A Block item → `{ id: bx, slot: nearestSlot(bx) }`.
3. `nearestSlot(bx)`: rows = each root item of `repairLayout(bx)` as its measured ids plus their union rect (skip rows with none); none → null. The row whose union spans `y` (inclusive); if none, the first row whose top is below `y` → `{ where:'rowBefore', ref: its first id }`, else null. Inside the row: for each id and each edge (left, right, `above` = top edge, `below` = bottom edge), the distance from the point to that edge segment; the smallest wins (first wins ties) → `{ where, ref }`.
4. Walk from `hit` up while not `canvas`: the first non-null `targetFor` wins. Else null.

### 8.3 drag.ts

A tiny store: `DragState { item; w; h; pill: boolean; target: Drop | null; trash: boolean }`, `getDrag`, `setDrag`, `useDrag`. A pending press `Pending { el; item; x; y }` with `takePending()` (returns and clears) and `peekPending()`. `dragSource(item)` returns an `onPointerDown`: ignore non-left buttons and presses inside `input, select, textarea, button`; `stopPropagation()` (the innermost item wins); store the pending press.

### 8.4 Canvas.tsx

Constants `MIN_ZOOM 0.3`, `MAX_ZOOM 2`, `CORNER 40`, `DOTS 24`. Refs: viewport, world, drop line, `view {x, y, z}`, rects.
- **Render:** viewport (class `viewport`; plus `panning` while panning) → world (absolute, `transform-origin: 0 0`) → inside `MarksContext.Provider` (§10.3): in the edit view only the definition Block, absolute at left 40, top 70; else each Canvas child Block at its `pos` (fallback `20 + i*40` for left and top) as `<BlockView>`, with `<DemoButton/>` (§17) under a Site Block that has no children; then the loose Traits as `<TraitPill>` the same way (index continues after the Blocks). After the world: the EditBar (edit view only), `<Stepper>` and `<Popover>` (not in the edit view; §10.3), the zoom buttons, the drop line (class `dropLine`, hidden), `<ContextMenu/>`, `<Tooltip/>` (§9.5).
- **apply()** (a layout effect after every render, and on window resize): over the world's direct children (offset boxes), clamp `v.x` to `[CORNER - z*maxRight, viewportWidth - CORNER - z*minLeft]` and `v.y` likewise; world transform `translate(${x}px, ${y}px) scale(${z})`; viewport `backgroundPosition: ${x}px ${y}px`, `backgroundSize: ${DOTS*z}px ${DOTS*z}px`.
- **Zoom:** `zoomAt(mx, my, z)` clamps z and keeps the point still (`v.x = mx - ((mx - v.x) / v.z) * z`, same for y). Wheel (non-passive, `preventDefault`): Ctrl → zoom at the pointer by `v.z * exp(-deltaY * 0.002)`; else pan by `-deltaX`, `-deltaY`. A wheel during a drag drops the rects and the drag target (they are measured again). Buttons (titles Zoom in, Zoom out, Reset zoom): ×1.25, ÷1.25, 1, at the viewport center; 18px icons `zoom_in`, `zoom_out`, `zoom_reset` (§3).
- **Reset view:** a new Project id → `{0, 0, 1}`. Entering the edit view remembers the Canvas view and starts at `{0, 0, 1}`; leaving restores it.
- **Pan:** pointer down with the middle button anywhere, or the left button on the viewport or world element itself → `preventDefault`, capture the pointer, drag the view. Prevent middle-click autoscroll (`mousedown`/`auxclick` with button 1).
- **Dragging** (window `pointermove`, `pointerup`, `pointercancel`, set up once):
  - move: a pending press and no drag and the pointer moved more than 4px → start: avatar = `cloneNode(true)` of the pressed element with field values copied into the clone's fields; add class `avatar`, remove `over`; `transform: scale(z)` when the element is in the world; append to `body`; `body.style.userSelect = 'none'`; clear the text selection; `setDrag({ item, w: offsetWidth, h: offsetHeight, pill: isTraitItem(item), target: null, trash: false })`. During a drag: place the avatar at pointer minus the grab offset; compute: element under the pointer inside `[data-palette]` → `{ target: null, trash: canTrash }`; not inside the viewport, or no rects yet → none; not inside a `[data-bid]` → `{ id:'canvas' }` when not in the edit view and `canDrop(item, 'canvas')`, else null; else `targetAt`. Update the store only when target or trash changed (JSON compare).
  - up / cancel: clear the pending press. If dragging: remove the avatar, reset `userSelect`, clear rects, `setDrag(null)`; stop on cancel. Trash with a `block` or `trait` → `updateProject(d => removeItem(d, id))`. A target: for the Canvas, `pos` = the pointer in world coordinates minus the grab offset, rounded. Dry-run `dropItem` on `structuredClone(project)`; if `[blocks, traits]` are unchanged (JSON), save nothing. Else `updateProject(d => id = dropItem(d, item, to))`, make `id` busy (§10.3), and call `droppedBlock(id)` (§17) for a new Block.
- **Drop line** (layout effect on every drag change): hide it; if dragging, measure rects once per drag (every `[data-bid]` and `[data-tid]` in the world that has client rects); find `[data-ghost]`; for a Trait target or a left/right slot draw a 4px-wide line at x = ghost.left − 5 (`right`) or ghost.right + 1 (else), ghost's top and height; otherwise a 4px-tall line at y = ghost.bottom + 1 (`above`, `rowBefore`) or ghost.top − 5 (else), ghost's left and width.
- **show(id):** find `[data-bid=id], [data-tid=id]`; move the view so the item's point `(left + min(width,400)/2, top + min(height,200)/2)` lands at 42% across and 40% down the viewport; `apply()`; `flash(el)` (§10.3).
- **Stepper go(d):** index moves cyclically through `stops` (§10.3); the first press goes to the first (next) or last (previous). If the target is not rendered (a folded ancestor), set `folded = false` on every ancestor with `updateProjectWithoutUndo`, then on the next animation frame show it and open its popover. The popover opens 6px below the item's `[data-badge]` (or the item itself), left edges lined up.
- **EditBar:** `Editing Custom Block "{name}". Changes reach all {n} Instance{n === 1 ? '' : 's'}, except parts an Instance changed itself.` plus **Done** (`setEditing(null)`). n = Instances of it on the Canvas. Only the definition shows; `editing` is ignored if that Custom Block no longer exists.
- **Busy item:** window capture-phase `pointerdown` and `focusin`: unless the target is inside `[data-badge]` or `[data-wpop]`, the nearest `[data-tid]` or `[data-bid]` becomes busy (its mark hides until the user moves on); no such element → none.

## 9. Blocks, Traits, Notes, menus, tooltips, Bob picks, Custom Blocks UI

**Files:** `src/canvas/BlockView.tsx`, `TraitPill.tsx`, `Overlays.tsx`, `menu.ts`, `tooltip.ts`, `bobPicks.ts`, `src/slots/Palette.tsx`, CSS Modules `parts`, `Overlays`, `Palette`. Look: DESIGN.md Block, Trait, Note, Palette, Menus, Tooltip, and §18.

### 9.1 BlockView({ p, id, depth = 1, inInst = false })

- `data-bid={id}`; classes: `block` plus `checkpoint` (type checkpoint), `site` (type site), `lockedPage` (locked), else `cat-my` for an Instance or a definition, else `cat-<category>`; plus `inst` (Instance), `def` (definition), `over` (it is the drag target), `lifted` (it is being dragged: `display: none`), `loose` (a direct Canvas child that is not site/checkpoint). An Instance or definition gets `style = customColor(def.color)`.
- `customColor({h, s, l})` (exported): `--c1 hsl(h s l)`, `--c2 hsl(h s l-9)`, `--c3 hsl(h s-25 l-26)`, `--c4 hsl(h 100 92.6)`, each clamped 0–100; plus `--ink: #fff` when `l < 55`.
- `onPointerDown = dragSource({ kind:'block', id })`, except on a definition. `onContextMenu = openMenu(e, id)`.
- **Header** (`data-tip="b:<id>"`): fold button (not on the Checkpoint Block; title `Open this Block` / `Fold this Block`; the 12px `fold` icon, turned −90° when folded) → `updateProject(d.blocks[id].folded = !folded)`. Then:
  - Checkpoint Block: lock icon, `checkpointTitle(p, p.checkpoint)` (§12; "Checkpoint" when unset), hint "the built site".
  - Locked Page: lock icon, `Page "<name>"`, hint = its file.
  - Else: icon (`custom` for an Instance/definition, else the type's) and type label (the Custom Block's name for an Instance, "Custom Block" for a definition, else the label), then the name `TextField` (→ `name`; on the Site → the Project `name`, and when focus leaves the header with a blank name, `name = NEW_NAME`), an **Edit** pill on an Instance (title `Edit this Custom Block` → `setEditing(inst)`), then the marker (§9.4).
  - A loose Block adds the `not built` badge. Last: `<Mark id>` (§10.3).
- Folded = not the Checkpoint Block and (`folded` ?? `depth >= 4`).
- Under the header: the Block Note if `note || noteOn` (§9.3).
- Folded: a chips row: one chip per Trait (icon + label), one per child (icon + name; draggable with `dragSource`), `empty` when there is neither; while it is the drop target, a small ghost (40×18, pill). Open: the Trait row (pills in order; the drop ghost before the pill it lands in front of, counting pills that are not lifted; at the end when `tIdx` = count) and, if the type accepts Blocks, the inside: the layout (with the ghost inserted by `insertInto(repairLayout(b), GHOST, slot)` while this Block is a Block-drop target) rendered as nested `row`/`col` divs of `<BlockView depth+1 inInst={inInst || isInstance}>`. Empty inside (no children other than the lifted one, and not a Block-drop target): class `empty` unless locked; a locked Page shows `drop Blocks or Traits here`; a Site shows the empty hint (Bob, `<img src="/bob.svg" alt="">` 64px tall, above `Drag a Page into your Site to start.`).
- Trait pills and child BlockViews both get `inInst = inInst || !!b.inst`; the Block's own header marker uses the incoming `inInst` prop.
- Ghost: `<div data-ghost class="ghost [ghostPill]" style={{width: drag.w, height: drag.h}}>`.

### 9.2 TraitPill({ p, id, inInst = false }) and value fields

- `<span class="pill cat-<category> [lifted] [loose]" data-tid data-tip="t:<id>">`, `dragSource({kind:'trait', id})`, context menu. Content: icon + label; the value (a Bob picks chip when `bobPicks`, else the value field); the bulb button when not Bob picks and `bobPicksControl` is `bulb` (class `bulb cat-bob`, title `Let Bob pick this value`, 14px bulb icon); the Trait Note when `(note || noteOn) && !bobPicks`; inside an Instance the short marker (first word only: `✎` or `+`); `<Mark id>`. Handing the value to Bob (bulb, or the dropdown option) sets `bobPicks` and focuses the hint field once.
- **TextField** (exported): `<input class=text size={clamp(len(value || placeholder) + 1, 3, 34)}>`; Enter blurs.
- **LongText** (text kinds): a TextField plus `⤢` (title `Show all of it`) when longer than 30 chars; open → a `textarea class=big` (autofocus) plus `⤡` (title `Make it smaller`). The placeholder is the type's `hint`.
- **Dropdown(value, options, onChange, back, onBobPicks)**: a `<select class=select>` of the options (the font list shows each option in its own `fontFamily`), then `💡 Bob picks`, then `custom…`. A value not in the options, or after choosing `custom…` (which sets the value to `''`), shows a TextField (placeholder `type your own`, autofocus only after choosing custom) plus `▾` (title `Pick from the list`) that returns the value to `back` (the type's default; `''` for Assets). A `missing` option gets class `warn` and title `What this pointed to was deleted. Pick another one.`
  - choice kinds: options = the choices. action (on click): `onClickOptions`. asset: `pick from Library` (`''`), then the Library Assets of the Trait's kind (`image`, `video`, `sound`) by file name; a value like `a<digits>` not among them → `{ label: 'missing file', missing }`.
- **ColorField:** a button with a 20px swatch and the preset name (or the value); click toggles the color menu at the button's left/bottom + 4px; while the menu is open, the button's `onPointerDown` calls `e.nativeEvent.stopImmediatePropagation()` so the menu's outside listener does not close it before the click toggles it (clamped to `innerWidth - 230`, `innerHeight - 150`). **ColorMenu** (portal to body): title `Colors`, the 12 preset swatches (title = name, `on` for the current one) → set and close; `Any color` with `<input type=color>` (value lower-cased when it is a 6-digit hex, else `#000000`; output upper-cased). Closes on pointerdown outside or Escape. Its pointerdown must not start a drag (`stopPropagation`).
- **BobPicksChip:** a chip `cat-bob`: bulb icon, `Bob picks`, a `×` (title `Pick it myself`) that turns Bob picks off; then the hint input (the Trait's Note; placeholder `hint, like something warm`; size clamp(len + 1, 14, 30); Enter blurs).
- Every edit goes through `updateProject`.

### 9.3 Notes and the context menu (Overlays.tsx, menu.ts)

- **BlockNote:** a sticky with a `×` (title `Delete Note` → `deleteNote`) and a textarea (placeholder `Note for Bob`) → `note`. **TraitNote:** an input (placeholder `note for Bob`, size clamp(len + 1, 8, 30), Enter blurs), with the same ⤢/⤡ long-text behavior. A Note that mounts empty takes focus without scrolling.
- **openMenu(e, id):** ignored inside `input, textarea` (the browser menu stays); else prevent default, stop propagation, open the menu at the pointer. **ContextMenu** (portal): `role=menu`, left `min(x, innerWidth - 210)`, top `min(y, innerHeight - 8 - 32 * items)`; each item a `menuitem` button: close, then `updateProject(change, null)` / `act()` / `setEditing(edit)`. Closes on outside pointerdown or Escape; renders nothing if the id is gone.
- **menuItems(p, id)** in this order, each only when it applies: `Add Note` (sets `noteOn`) or `Delete Note` (when `note || noteOn`); `Edit Custom Block` (an Instance; `edit: inst`); `Duplicate` (when `canTrash` allows it); `Bring back removed parts (N)` (Instance with N removed; sets `removed = []`); `Use the Custom Block's version` (`hasOverride`; deletes `ov`); `Make Custom Block` (a Block where `canMakeCustom`); `Delete Trait` / `Delete Block` (when `canTrash`; `removeItem`).
- `canMakeCustom`: not site/page/checkpoint, not locked, does not hold (itself or inside) an Instance or definition, and no ancestor is an Instance or definition.
- `deleteNote(p, id)`: `note = ''`, `noteOn = false`.
- `duplicate(p, id)`: copy with new ids (`copyOf`: Traits cloned; Blocks via `addBlock` so a Page gets its own file, children and Traits copied recursively, layout mapped). A loose original → the copy's `pos` is +30/+30. Trait → dropped at index + 1 in the same Block. Block → unless the original is an Instance, `unfollow` the copy; dropped into the same parent with slot `below` the original (on the Canvas: no slot, at the new pos).

### 9.4 Custom Blocks UI

- Instance: `inst` class (2px dashed `--c3`), its color, Edit pill. Parts inside an Instance get a marker: `✎ changed here` when copied (`from`) and `hasOverride`; `+ only here` when not copied; nothing when unchanged. Pills show only the first word (`✎`, `+`) with the full text as title.
- Definition: only in the edit view, `def` class (5px `--def-ring`), type label "Custom Block", not draggable.
- **Palette My Blocks** (§9.6): `Make a Custom Block` → `updateProject(d => id = newCustomBlock(d), null)`, then `setEditing(id)`; the hint `Or right-click a Block on the Canvas and choose "Make Custom Block".`; one row per def: a palette Block in its color (puzzle icon, definition name, title `N Instance(s)`, `dragSource({ kind:'newInstance', defId })`) and an **Edit** button.

### 9.5 Tooltip and bobPicks

- **Tooltip** (portal, `role=tooltip`, class `tip cat-<cat>`): window `pointerover`: the nearest `[data-tip]`; when it changes, hide; unless dragging, a press is pending, or a menu is open, show after 500ms with its rect. Hide on `pointerdown`, `contextmenu`, `wheel`, `keydown` (capture). Place 8px below with left edges lined up; above (8px) if no room; clamp inside the window with 8px margins. Content: icon + title (bold), text, and the loose line (italic hint) if any.
- **tipFor(p, key): Tip | null** with `Tip { icon; title; text; loose?; cat: Category | null }`; key `b:<id>`, `t:<id>`, `nb:<type>`, `nt:<type>`. `{where}` = `the Checkpoint` when a Checkpoint Block is on the Canvas, else `the Site`. `nb` → type icon, label, filled tooltip, category. `nt` → the Trait type's. `b`: Checkpoint Block → `{ icon:'checkpoint', title:'Checkpoint', text: its tooltip, cat: null }`; locked → `{ icon:'checkpoint', title:'Built page', text: BUILT_PAGE.tooltip, cat: null }`; Instance → `{ icon:'custom', title: definition name, text: filled type tooltip, cat:'my' }`; else the type's. `t` → the Trait type's. A gone id or the canvas → null. Loose line: walk up from the item to the Block directly on the Canvas (or the item itself); if that is on the Canvas and not site/checkpoint, `loose = filled LOOSE_IDEA_TOOLTIP`.
- **bobPicksControl(type, value)**: `tellbob`, `letbobpick` → null; color → `bulb`; text kinds → `bulb` if `value.trim()` is empty, else null; everything else → `option`. **setBobPicks(p, id, on)**: on sets `bobPicks = true`; off deletes it. The value and Note stay.

### 9.6 Palette.tsx

`<div class="palette [trash]" data-palette>` (trash while `drag.trash`). Category column: a toggle (`⟨` open / `⟩` folded, title `Hide or show the palette`), then one button per category (dot `cat-<id>` + label; `on` for the current one while open). Clicking a category opens the palette and smooth-scrolls the list to that section (a fresh request object each click, so a second click scrolls again). The list (when open): one `<section data-cat>` per category with an `h4`, its Block types (palette Block: icon + label, `data-tip="nb:<type>"`, `dragSource(newBlock)`), `MyBlocks` in `my`, then its Trait types except `stretch` ones (a pill with icon + label, `data-tip="nt:<type>"`, `dragSource(newTrait)`). On scroll, the current category = the last section whose `offsetTop <= scrollTop + 20`; at the very bottom the current category is left as it is.

## 10. Warnings and the instruction document

**Files:** `src/instructions/warnings.ts`, `src/instructions/document.ts`, `src/canvas/marks.ts`, `src/canvas/Warnings.tsx`, `Warnings.module.css`. Behavior: PRD §10. Look: DESIGN.md Warnings.

### 10.1 warnings(p): Warning[]

```ts
export type WarningRule = 'nosite' | 'nopage' | 'deadpage' | 'deadpopup' | 'noaction' | 'noasset' | 'deletedasset'
  | 'lonepopup' | 'lonepage' | 'emptypage' | 'emptyvalue' | 'emptytellbob'
export interface Warning {
  kind: 'stop' | 'skip' | 'look'; rule: WarningRule
  target: string | null  // the Block or Trait it marks; null only for nosite
  where: string          // "Home › Big welcome › Order"
  text: string; todo: string
  key: string            // `${rule}:${source ?? part.id}`: shared by Instances of one definition problem
  def?: string; source?: string
}
```

Helpers (exported): `topBlock(p)` = the Canvas child of type site or checkpoint; `pagesOf(p, top)` = its Page children; `popupsIn(p, b)` = every Popup id in `b`, itself included; `parseAction(v)` = `{ kind:'page'|'popup', id }` for `page:`/`popup:` values, else `{ kind:'action' }`; `blockLabel(b)` = `Built page` for a locked Page, else the type label. Private: `blockName(b)` = `` the "<name>" <label lower-cased> ``; `talks(p, b)` = b has a tellbob or letbobpick Trait; `told(p, b)` = `b.note.trim()` or `talks`.

Algorithm:
1. No top → `[{ kind:'stop', rule:'nosite', target:null, where:'', text:'There is no Site Block.', todo:'Add a Page inside your Site first.', key:'nosite' }]`.
2. No Pages → `[{ kind:'stop', rule:'nopage', target: top.id, where:'', text:'Your Site has no Page.', todo:'Add a Page inside your Site first.', key:'nopage' }]`.
3. Visit every Block from `top` depth first, recording its Page (nearest Page above or itself for children of a Page), the Blocks above it, and the Instance it sits in (the nearest Instance, itself included).
4. `linked` = ids that working "on click" Traits (not Bob picks) point at: a Page of the top, or a Popup on the same Page as the Trait.
5. For each visit, `where` = names of the Blocks above plus itself, without the top, joined ` › `. `sourceOf(part)`: no Instance → undefined; the Instance itself → its definition Block id; else `part.ov ? undefined : part.from`. A Warning with a source carries `def` (the Instance's Custom Block) and `source`. Checks, in this order:
   - Popup, not linked, not `told`, and no Block above has an empty "let Bob pick" → look `lonepopup`: `` Nothing opens the "<name>" popup, so visitors never see it. `` / `Give a button "on click › open popup", or tell Bob when it opens.`
   - An unlocked Page: file not `index.html`, not linked, not told → look `lonepage`: `` Nothing links to the "<name>" page. `` / `Visitors can only reach it by typing its address. Link to it from a button or the menu.` No children and not told → look `emptypage`: `` The "<name>" page is empty. `` / `Bob will guess what goes on it. Add Blocks, or say what it is for.`
   - Each Trait (empty = `!value.trim() && !bobPicks`):
     - Asset kind and not Bob picks: `what` = `picture` for image, else the type. No value → skip `noasset`: `` The <label> Trait on <blockName> has no <what> picked. `` / `Pick one from the Library, or remove the Trait.` Value not an existing Asset → skip `deletedasset`: `` The <what> for <blockName> was deleted from the Library. `` / `Pick another one from the Library, or remove the Trait.`
     - tellbob and empty → look `emptytellbob`: `` The "tell Bob" on <blockName> is empty. `` / `Type what Bob should know, or remove it.`
     - empty, type text or fakedata or a choice kind, no Trait Note, and `!talks(block)` → look `emptyvalue`: `` The <label> Trait on <blockName> is empty, so Bob will <write the words | choose one>. `` (choose one for choice kinds) / `Fill it in, or hand it to Bob.`
     - onclick, not Bob picks: a page target that is not a Page of the top → skip `deadpage`: `` <BlockName capitalized> goes to a page that no longer exists. `` / `Pick another page, or remove the link. If you build now, Bob makes it do nothing.`; a popup target not on this Page → skip `deadpopup`: `` <BlockName> opens a popup that no longer exists. `` / `Pick another action, or remove it.`; empty value → skip `noaction`: `` <BlockName> has an "on click" with nothing picked. `` / `Pick what happens on click, or remove it.`

Only the Site or Checkpoint Block is checked; loose ideas never. Locked Pages and the Checkpoint Block are link targets, never marked for being empty or unlinked.

### 10.2 instructionDocument(p)

`type InstructionResult = { error: string } | { document: string; skipped: string[] }`. Pure.

- Header: `import headerFile from '../../skills/instruction-header.md?raw'`; CRLF → LF; HEADER = the body of the first ```` ```markdown ```` block, EXTRA_LINE = the second (both `trimEnd`).
- A stop Warning → `{ error: stop.todo }`.
- `skipped`: skip Warnings de-duplicated by `key` with `new Map(skips.map(w => [w.key, w]))` (the first Warning's position, the last Warning's text), each `` `Skipped: ${text with its first letter lower-cased}` ``.
- Trait lines (`popups` = Popup ids an "on click" here may open; Note line `  - Note: "<note trimmed>"` when the Note is not blank):
  - tellbob: non-empty → `- The user says: "<value trimmed>"` + Note; empty → nothing.
  - letbobpick: `- You choose: <value trimmed or 'anything in this Block'>` + Note.
  - else: value = `you choose` when Bob picks, or when blank and the kind is not asset/action; else by kind: color → `<name> (<preset hex>)` for a preset (case-insensitive match), else the value; asset → `assets/<file>` (mark the Asset used) or skip the line if the Asset is gone; action → page → `` go to "<name>" page (<file>) #<id> `` or `go to missing page` (kept, not skipped); popup → `` open "<name>" popup #<id> `` if in `popups`, else skip; other → the value, or skip if empty; text kind → `"<value trimmed>"`; choice → the value. Line: `- <label> (<meaning>): <value>` + Note.
- `inside(b, popups, ids)`: Note line `- Note: "<note>"` (if any), the Trait lines, then each child's `blockLines`, indented two spaces per level under their Block.
- `blockLines(b, popups, ids)`: `- <blockLabel> "<name>"`, plus ` (Instance of "<definition name>")` for an Instance, plus ` #<id>` when `ids`; then `inside` indented by two spaces. Every label used is recorded for the glossary; also record `blockLabel(top)`, `blockLabel(page)` for each Page that is written, and `Built page` whenever the top is a Checkpoint Block.
- `heading(level, b)` = `<level> <blockLabel> "<name>"` + ` (<file>)` when it has a file + ` #<id>`. A section = its title, and if it has lines, a blank line and the lines.
- Document parts, joined by one blank line, ending with a newline:
  1. Header: HEADER, plus `\n` + EXTRA_LINE when the top is a Checkpoint Block.
  2. `## Block types used`: `- <label>: <meaning>` for each type used, in BLOCK_TYPES order with `Built page` right after `Checkpoint`.
  3. From Build 2 on: `## Already built`: `- Built page "<name>" (<file>) #<id>` for each locked Page.
  4. `## <heading of top>` with the top's Note and Traits only (no children), popups empty.
  5. Per Page (`###` heading), with `inside(page, popupsIn(page), true)`. A locked Page with no Traits, no children and no Note is left out.
  6. `## Custom Blocks` if any Instance was written: each used definition once, as `blockLines` of the definition Block (not as an Instance), `ids` off, popups = every Popup of every Page.
  7. `## Library` if any Asset: `- assets/<file>: <kind>` + `, W×H px` (when both) + `, N s` (rounded, when set) + `, used by a Trait` (when a Trait line named it).
- Appendix A is the demo's expected Build 1 document; the snapshot test must equal it.

### 10.3 Marks on the Canvas (marks.ts, Warnings.tsx)

- `marksOf(ws)`: `Map<targetId, Warning[]>` in reading order (Warnings with no target mark nothing). `badgeOf(ws)` = `?` when the first is `look`, else `!`. `stopsOf(ws)` = Warnings with a target, first per `key`.
- `MarksContext` = `{ marks, busy, open(id) }` (default: empty map, null, no-op). The Canvas computes `warnings(p)`, marks and stops with `useMemo` on the Project.
- **Mark({ id })**: nothing if unmarked or busy; else `<button class=badge data-badge={id} title={texts joined '\n'}>` with the badge char → `open(id)`. The ring: `[data-bid]:has(> div > .badge), [data-tid]:has(> .badge) { box-shadow: 0 0 0 3px var(--alert) }`.
- **Popover** (portal, `data-wpop`): left `max(8, min(x, innerWidth - 308))`, top clamped into the window. One row per Warning: its badge char, a `where` pill button only when `where` is not empty (title `Show it on the Canvas` → show), the text (bold), the todo, and for a definition problem `Comes from the Custom Block "<name>"`. Buttons: **Show** (show + close), **Pick one** (only on a Trait: close, then focus the pill's `select, input, textarea`), **Close**. Closes on pointerdown outside (not on a badge) or Escape. The Canvas renders it only while its id still has marks.
- **Stepper({ count, clean, onGo })**: `clean` (no Warnings at all) → `<div class=ok>` with the `check` icon and `Nothing to check`; count 0 (only the target-less `nosite` Warning) → nothing; else `‹` (title Previous) `⚠ N to check` `›` (title Next).
- **flash(el)**: animate `box-shadow` `0 0 0 6px var(--flash)` held to 40%, then to 0, over 1400ms (read `--flash` with `getComputedStyle`).

## 11. Build

**Files:** `src/build.ts`, `src/slots/BuildButton.tsx`, `src/slots/BuildCard.tsx`, `src/slots/Build.module.css`. Behavior: PRD §4, §10. Look: DESIGN.md Build button and Build card.

```ts
export type FailReason = 'time' | 'turns' | 'unreachable' | 'broken' | 'save'
export const FAILURE_LINES: Record<FailReason, string> = {
  time: 'Bob took too long, so this Build was stopped.',
  turns: 'Bob ran out of steps before finishing, so this Build was stopped.',
  unreachable: "Bob couldn't be reached. Check your connection and try again.",
  broken: "Bob's answer came back broken, so this Build was stopped.",
  save: "Bob's website couldn't be saved on this computer, so this Build was stopped.",
}
export interface BuildRun {
  n: number; state: 'running' | 'done' | 'failed'
  chips: { id: string; name: string; category: Category }[]
  lit: string[]; loose: number; skipped: string[]; reason?: FailReason
}
```

- Store `run` (`useBuild`, `getBuild`).
- `requestBlocks(p: Pick<Project,'blocks'>, top)`: every Block under and including `top`, depth first, except locked Blocks with no Traits and no blank-free Note.
- `progress(run)`: `{ done, working }`. Running: the lit ids that are chips, first-lit order, no duplicates; the last is `working`, the rest are `done`. Done: every chip `done`. Failed: none.
- `nothingNew(p)`: the top is a Checkpoint Block and `requestBlocks` is empty.
- `buildProblem(p)`: `instructionDocument(p).error` or null.
- `runBuild(): Promise<string | undefined>` (returns a limit message, else undefined). New in this build: a module flag makes a second call while one runs return at once (the button is only disabled once `start` arrives).
  1. `doc = instructionDocument(p)`; stop on error. `top`, `saved = await listCheckpoints(p.id)` (errors → `[]`), `n = saved.filter(c => c.blocks).length + 1`, chips = `requestBlocks(p, top)` mapped to `{ id, ...blockInfo(id, p, []) }` (§14).
  2. `begin()` (once): `run.set({ n, state:'running', chips, lit: [], loose: canvas.children.length - 1, skipped: doc.skipped })`; `setStep('build')`.
  3. For each event of `runAgent({ kind:'build', document: doc.document, files: p.files })`: `limit` → return its message (nothing changed, still on Plan); `start` → `begin()`; `block` → `begin()`, append the id to `lit`; `error` → `begin()`, set `state:'failed', reason`, return; `files` → `begin()`, then:
     - `number = saved.length + 1`; `after = { ...e.files, ['.builds/build-' + n + '.md']: doc.document }`.
     - `addCheckpoint({ projectId, number, label: 'Checkpoint ' + number, from: top.type === 'site' ? null : p.checkpoint ?? saved.at(-1)?.number ?? null, before: p.files, after, blocks: builtBlocks(p, top.id), time: Date.now() })`; on an error log `Saving the Checkpoint failed`, set `state:'failed', reason:'save'` and return (nothing changed).
     - `updateProject(d => consume(d, top.id, after, number), null)`; `state:'done'`; `flashBlocks(lit)` (§13); after 900ms `setStep('try')`.
- `builtBlocks(p, top)`: `{ top: [top], blocks, traits, defs: clone of p.defs }` with clones of every Block and Trait under `top` and under every definition Block.
- `consume(p, topId, files, checkpoint)` (exported): `pages` = the top's Page children by file. `html` = file paths ending `.html`. Order = the top's Page files that exist in `html` (in the top's order), then the other `html` files (in `files` order). Delete every Block and Trait inside the top and the top's Traits. For each file: reuse the id of the Page that had it (else `addBlock(p, 'page')` for a new id) and set `{ id, type:'page', name: old name or pageName(file), note:'', traits:[], children:[], file, locked:true }`. Replace the top with `{ id: topId, type:'checkpoint', name: top.name, note:'', traits:[], children, locked:true, pos: top.pos }`. `p.files = files`, `p.checkpoint = checkpoint`. `pageName(file)`: strip `.html`, the last path part, `-`/`_` runs → space, trim; `index` or empty → `Home`; else first letter upper-cased (`contact-us.html` → `Contact us`).
- The Build applies to the Project as it is when it ends (an Undo pressed mid-Build is consumed too).

**BuildButton:** reads the Project and the run. Greyed (class `greyed`) when `nothingNew`. Disabled while running; label `Building…` while running, else `Build`, with the 24px fill flag icon; `data-tour="build"`. Press: nothingNew → bubble `Nothing new to build. To redo a Build, open ` + a link button **Checkpoints** (→ `setPlanTab('checkpoints')`); `buildProblem` → bubble with it; `hasPending(p)` (§15) → the warning dialog (title `Build now?`, line `The Assistant has changes you haven't accepted. Building drops them.`, confirm `Build anyway`: `dropPending()` then build); else build. Build = `runBuild()`; a returned limit message shows in the bubble. The bubble (`role=status`) sits above the button (absolute, right 0, bottom 100% + 16px) with a tail; the button gets class `target` while it shows; it closes on the next click anywhere (listener added after the current click). The warning dialog is the `Warning` component from Checkpoints.tsx (§12).

**BuildCard:** under the title, a `BuildStage` (`aria-hidden`; DESIGN.md Build card, item 2): still with no run, looping while running, stopped on done or failed as DESIGN.md says; reduced motion keeps it still. No run → title `Nothing built yet`, the stage, and a big BuildButton. Else:
- Title: running → spinner + `Bob is building your website` + `<BobBadge/>` at the right end; done → `✓ Build N done` and sub `Opening your website…`; failed → `!` + `Build N did not finish` and sub `Nothing changed: your code and Blocks are as they were.`; failed card has class `failed`.
- Chips: each chip `cat-<category>`, class `done` or `working` from `progress(run)`. More than 12 chips: a `fold` button (`aria-expanded`, starts folded) with the fold chevron, `N Blocks · M done` (M = done count) and, while folded, the working chip; it toggles the chip list below it.
- Notes (a list, only when there is one): each skipped line, then `M loose idea(s) skipped` when M > 0, each with a `–`. Failed: the failure line (`!` + FAILURE_LINES[reason], class `failLine`).
- Failed: **Try again** (Primary → `runBuild()`; a returned limit message shows as an extra `failLine` under the buttons) and **← Back to the Blocks** (ghost → Plan).

## 12. Checkpoints

**Files:** `src/checkpoints.ts`, `src/slots/Checkpoints.tsx`, `Checkpoints.module.css`. Behavior: PRD §4. Look: DESIGN.md Checkpoints, Menus.

- Names: `checkpointTitle(p, n)` → `Checkpoint N · <name>` when `p.checkpointNames[n]` is set, else `Checkpoint N`; every place that names a Checkpoint uses it, so a name never goes missing anywhere. `withNames(p, text)` puts `checkpointTitle` in place of every `Checkpoint <digits>` in a saved text (a chat `line`, a code-only `label`), so those follow renames too. `renameCheckpoint(p, n, name)` (recipe, an Undo step): trim, cut to 40 characters, blank deletes the name.
- `LoadMode = 'goBack' | 'edit'`. `sameFiles(a, b)`: same keys and texts. `holding(files, cps)`: the Checkpoint whose `after` or `before` equals `files`. `needsSave(files, cps)`: files non-empty and no `holding`.
- `unbuilt(p)`: unbuilt items in the top, outermost only: for a Site Block its Traits and children; for a Checkpoint Block its own Traits, then walking into locked children: their Traits, and their unlocked children (not deeper).
- `applyLoad(p, c, mode)` (recipe): `at = top.pos ?? {40,40}`; move each unbuilt item to the Canvas at `{ x: at.x + 760, y: at.y + i*70 }` with `dropItem`.
  - goBack: for each Page in `c.blocks.blocks` that has a file, whose id is free and whose file no top child has: add it as a locked Page (`name`, `file`) to the top. Then `consume(p, top.id, clone(c.after), c.number)`.
  - edit: remember the top's index among Canvas children; `removeItem(top)`; `id = restore(p, c.blocks)`; set its `pos` to the old top's; put it back at the index; `p.files = c.from === null ? {} : clone(c.before)`; `from === null` → delete `p.checkpoint`, else `p.checkpoint = c.from`.
- `restore(p, bb)` (private): map each id under `bb.top[0]` to itself, or to a fresh `b<next>`/`t<next>` if taken in `p`; copy Blocks (Traits, children, layout mapped) and Traits (an "on click" `page:x`/`popup:x` value is mapped too). Returns the new top id.
- `loadCheckpoint(number, mode)`: `cps = await listCheckpoints`; find it (edit needs `blocks`); if `needsSave(p.files, cps)`: add `{ number: cps.length + 1, label: 'Before loading Checkpoint ' + number, from: p.checkpoint ?? null, before: p.files, after: p.files, blocks: null, time }`. `updateProject(d => applyLoad(d, c, mode), null)`. If `hasPending` → `dropPending('Code went back to Checkpoint ' + number)`. `flashBlocks([])`.
- `warning(p, cps, c, mode)` → `{ title, lines, confirm }`:
  - `Checkpoint N` below is `checkpointTitle(p, N)`, so it carries the name.
  - title: `Go back to Checkpoint N?` / `Edit the Blocks of Checkpoint N?`; confirm: `Go back` / `Edit its Blocks`.
  - line 1: goBack `Your code goes back to how it was at Checkpoint N.`; edit with `from === null` `This remakes the website from scratch. Your code is cleared and the Blocks of Checkpoint N come back so you can change them.`; edit otherwise `Your code goes back to how it was before the Build of Checkpoint N, and its Blocks come back so you can change them.`
  - `The next Build may come out different.`
  - needsSave → `Your current code, with your hand edits, is saved first as a new Checkpoint, so you can come back to it.`; else if there is code → `Your current code is already saved as Checkpoint <holding number>.`
  - unbuilt items → `Blocks you have not built yet become loose ideas.`
  - `hasPending` → `The Assistant's unaccepted changes will be dropped.`
- `gist(c, p)`: no blocks → `<withNames(p, label)>: your code with its hand edits.`; `from === null` → `Built the site: N page(s).` (N = `.html` files in `after`); else `Added: <names>.` where names = walking from the top: an unlocked Block adds its name (not deeper); a locked one adds its name only if it has Traits or a Note, then walks its children; empty → `changes`.
- `fromTag(c, p)`: none for code-only or number 1; `from === null` → `remade from scratch`; `from !== number - 1` → `from <checkpointTitle(p, from)>`.
- `buildOf(id, p, cps)`: `made(c)` = c has blocks and `requestBlocks(c.blocks, top)` includes id. Walk from `p.checkpoint` back through `from`; the first `made` wins; else the newest `made` in the list.

**Checkpoints.tsx:** loads `listCheckpoints` on Project id, `p.checkpoint` and a reload counter. Empty list → `No Checkpoints yet. Every Build saves one here.` Entries newest first:
- Title row: `checkpointTitle(p, N)` (h3), the time (`toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })`), the from tag, `saved for you` (code-only; class `saved`), and on the current one (`p.checkpoint === number`, entry class `here`) `you are here` + (` + hand edits` when `p.files` differs from its `after`), then at the row's end a rename button (the 14px fill `PencilSimple` icon, title `Rename`, aria-label `Rename Checkpoint N`).
- Rename: the h3 becomes `Checkpoint N` followed by an input (autofocus, `maxLength` 40, aria-label `Name for Checkpoint N`, starting with the current name; the rename button hides meanwhile). Enter → `updateProject(d => renameCheckpoint(d, N, draft))` when the trimmed draft differs from the name; Escape or blur cancels.
- Gist. Buttons: **Go back to this**; **Edit its Blocks** and **Show its Blocks** / **Hide its Blocks** (a link-style toggle, `aria-expanded`) only when it has blocks.
- Open: a read-only tree `ul` of its Blocks from `blocks.top[0]`: each row icon (lock for locked, puzzle for Instances, else the type's) + name + file; class `cat-<cat>` (none → `built` for locked or site); click picks it. A picked row with code in the current files (`findBlockCode`) shows `</> See its code` (→ `seeItsCode(id)`, stops propagation).
- From a Block chip: when `useCheckpointFocus()` is set and the list is loaded: open `buildOf(focus)`, pick that Block with `flash` (it scrolls to the center and flashes twice), clear the focus.
- Buttons open `Warning` with `warning(...)`; confirm → close, `await loadCheckpoint`, reload; after edit, switch to the Canvas tab.
- `Warning({ title, lines, confirm, onCancel, onConfirm })` (exported): a native `<dialog>` opened with `showModal()`; `onClose` cancels (Escape); `h2` title; a `p` per line; **Cancel** (text) and the confirm (Primary, autofocus).

## 13. Preview

**Files:** `preview/index.html`, `preview/shell.ts`, `preview/sw.ts`, `preview/serve.ts`, `preview/public/helper.js`, `preview/vite.config.ts`, `src/preview.ts`, `src/slots/Preview.tsx`, `Preview.module.css`. Look: DESIGN.md Preview and §18.

The Prototype runs on its own origin, so it cannot reach the app's IndexedDB. The iframe has no `sandbox` attribute; real `localStorage` works there.

- **preview/index.html:** title `Scrabby Preview`, `<script type="module" src="/shell.ts">`.
- **serve.ts** (pure, tested): `PreviewFiles = { projectId; files: Record<string,string>; assets: { path; blob }[] }`; `NO_FILE_TEXT = 'This page has no file yet.'`; HELPER = `<script src="/helper.js"></script>`; `injectHelper(html)`: right after the first `<head…>` tag (case-insensitive), else prepended. Types by extension: html `text/html`, css `text/css`, js `text/javascript`, json `application/json`, svg `image/svg+xml`, txt and md `text/plain`, else `text/plain`, each + `; charset=utf-8`. `toEntries(projectId, files, assets)`: key = `new URL('/preview/' + projectId + '/' + path, 'http://x').pathname` (encodes like a request); HTML → helper injected; Assets → `new Response(blob, { 'content-type': blob.type })`. `answer(pathname, lookup)`: not `/preview/<id>/…` → undefined; a trailing `/` → `index.html`; found → it; missing `.html` → the injected page `<!doctype html><meta charset="utf-8"><p style="font:16px sans-serif">This page has no file yet.</p>` with status 404; else `Not found` 404.
- **sw.ts:** `install` → `skipWaiting()`; `activate` → `clients.claim()`. `message` `{ projectId, files, assets }`: chain onto `storing`: delete cache `preview`, open it, put every `toEntries` entry, then post `stored` on `e.ports[0]`; `waitUntil(storing)`; errors logged. `fetch`: same-origin `/preview/…` only → `respondWith(storing.then(() => answer(path, key => cache match)).then(r => r ?? fetch(request)))`.
- **shell.ts:** `APP = import.meta.env.VITE_APP_ORIGIN || location.protocol + '//' + location.hostname + ':5173'`. `tell(preview, rest)` = `parent.postMessage({ preview, ...rest }, APP)`. Register `import.meta.env.DEV ? '/sw.ts' : '/sw.js'` with `{ type: 'module' }`, await `ready`; on `message` from `parent` with `e.origin === APP` and `data.preview === 'files'`: post `{ projectId, files, assets }` to the worker with a `MessageChannel` port, await `stored`, then `location.replace('/preview/' + projectId + '/' + path)`. Then `tell('ready')`. Any failure (no `serviceWorker`: `Service Workers are turned off here.`) → `tell('no-worker', { message })`.
- **helper.js** (plain script, in `preview/public/`): does nothing when not in a frame. Posts to `parent` with `'*'` (only a path or an error text): `page` with `location.pathname` on load; `error` `{ message, file: e.filename }` on `error`; `error` `{ message: String(reason?.message ?? reason) }` on `unhandledrejection`. On a `flash` message from `parent`, after DOMContentLoaded: every `[data-block="<CSS.escape(id)>"]` animates `outline: 4px solid #FFE14D; outline-offset: 3px` to `#FFE14D00` over 1500ms, `ease-in`.
- **src/preview.ts:** `flashBlocks(ids)` stores ids for the next load and asks every mounted Preview to redraw; `previewHooks.askBobToFix` (set by the Assistant, §15); `onRedraw(fn)` (returns unsubscribe); `takeFlash()` (returns and clears).
- **Preview.tsx:** `ORIGIN = import.meta.env.VITE_PREVIEW_ORIGIN || location.protocol + '//' + location.hostname + ':5174'`; `LIVE_DELAY = 400`.
  - `codeOf(p) = JSON.stringify([p.files, p.assets])`; `sent` = the code on screen.
  - `redraw(path = current page)`: a call counter lets the newest win. Read `listAssets` (errors → `[]`), build `assets` = `{ path: 'assets/<file>', blob }` for Library Assets that have a Blob; `sent = codeOf(p)`; pending = `{ projectId, files: p.files, assets, path, flash: takeFlash() }`; bump a load counter (a new iframe `key`, `src = ORIGIN + '/'`, title `Preview of your website`).
  - Redraw on mount and on every `flashBlocks`. Live: when the code differs from `sent` and not paused, redraw 400ms after the last change (only if still stale).
  - Messages (only from `ORIGIN` and the iframe's window): `ready` → post `{ preview:'files', projectId, files, assets, path }` to ORIGIN; `no-worker` → the error card; `error` → the error bar `{ message, file }` (file = the error's file as a Project path, else the current page); `page` → clear the error; if the path changed and the code is stale → redraw at that path; else set the page and post `{ preview:'flash', ids }` for the pending flash (once).
  - `fileOf(url)`: pathname without `/preview/<id>/`, URI-decoded; empty → `index.html`.
  - Build count = Checkpoints with blocks (reloaded on Project id and code changes).
  - No files (before the first Build): no iframe; the page area shows the empty state (`Press Build to make your website.`), the pill reads `not built yet`.
  - Address bar: ↻ (the `reload` icon; title `Reload the page with your latest code`; a 7px dot, aria-label `Your code has changed`, while paused with changes), the pill `<site slug> / <page>` (slug = name lower-cased, non-alphanumeric runs → `-`, trimmed, or `site`), `Build N` when N > 0, and `Pause live updates` with a `role=switch` checkbox (turning it off redraws). Paused strip: `Live updates are paused. Press ↻ to see your latest code.`
  - Error bar (`role=alert`): `!`, bold `Something on this page isn't working`, the message (one line, ellipsis), **Ask Bob to fix it** → `previewHooks.askBobToFix(error)`.
  - No-worker card (`role=alert`): bold `The Preview can't start in this browser.`, `It needs a Service Worker, and the browser blocked it. Brave and strict privacy settings can do this. Try Chrome, or allow this site to store data.`, and the message small.

## 14. Code editor

**Files:** `src/code/code.ts`, `setup.ts`, `navigation.ts`, `MergeReview.tsx`, `editor.module.css`, `src/slots/CodeEditor.tsx`. Look: DESIGN.md Code editor (the `.code-editor` variables live on the editor's root class `codeEditor`).

- `changedLines(base, text)`: lines of `text` (from 1) new or changed against `base`, from `@codemirror/merge` `Chunk.build(Text.of(base lines), Text.of(text lines))`: for each chunk with `toB > fromB`, every line from `lineAt(fromB)` to `lineAt(endB)`. `base` undefined → every line. Pure deletions add nothing.
- `blockMarks(text)`: `{ line, id }` for the first line of each `data-block="<id>"` (first time only), in order.
- `findBlockCode(files, id)`: the first file and line containing `data-block="<id>"`, else the first containing `/* block <id> */`; else undefined.
- `blockInfo(id, project, checkpoints)`: the Block from the Project, else the newest Checkpoint that has it; none or canvas → undefined; `{ name, category: inst ? 'my' : type's category }`.
- `newFileProblem(name, files)`: `name` comes trimmed and lower-cased; not matching `/^[a-z0-9][a-z0-9-]*\.(html|css|js)$/` → `Use a name like about.html, extra.css or games.js.`; already in `files` → `<name> already exists.`; else null.
- `setup(path)`: `lineNumbers()`, `highlightActiveLineGutter()`, `history()`, `drawSelection()`, `highlightActiveLine()`, `bracketMatching()`, `search({ top: true })`, `highlightSelectionMatches()`, keymap (default + `searchKeymap` + `{ key: 'Mod-y', run: redo, preventDefault: true }` + `{ key: 'Mod-Shift-z', run: redo, preventDefault: true }` + history + `indentWithTab`), syntax highlighting (tagName `var(--ed-tag)`; attributeName `var(--ed-attr)` (`#C3A6FF`); string and attributeValue `var(--ed-string)`; comment `var(--ed-comment)` italic; propertyName `#7CC4FF`; keyword `#FF9EC7`; number and bool `#FFB86B`; typeName and className `#8BE9C4`; punctuation and angleBracket `var(--ed-line-no)`), language by extension (`html`, `css`, `js`), and a dark theme: height 100%, `--ed-bg`, `--ed-text`, 12.5px, no focus outline, mono font line-height 1.75, content padding 10px 0, caret and cursor `--ed-text`, gutters `--ed-bg`/`--ed-line-no`/no border/not selectable, line numbers min-width 40px, padding `0 12px 0 0`, right-aligned, selection `--ed-rule`, active line and active line gutter `#FFFFFF08`, search and selection matches `#F5C73D33` with a 1px `#F5C73D80` outline, the current search match `#F5C73D66`, search panel `--ed-tabs` background and `--ed-text` text, its fields `--ed-bg` with a 1px `--ed-rule` border, its buttons no fill, no border, `--ed-tab-text`, weight 700 12.5px `--font`.
- **navigation.ts:** editor UI store `{ file?, jump?: { file, line }, review?: number }` (`useEditorUi`, `getEditorUi`, `openFile(file)`, `clearJump()`, `startReview(time, file)` (keeps the other fields, sets `review` and `file`)); `editorSelection = { read: () => string | null }` (the editor replaces `read` while mounted); `seeItsCode(id)`: `findBlockCode` → set the editor store to exactly `{ file, jump }` (clears `review`), `setStep('try')`, return true; else false. Checkpoint focus store: `useCheckpointFocus`, `clearCheckpointFocus`, `openCheckpointsAtBlock(id)` (set focus, Plan, Checkpoints tab).
- **CodeEditor.tsx:** tabs = file paths not under `.builds/`, plus review files that do not exist yet. Review files = when `review` is set and that message's proposal is `open` or `reviewing`, its `openFiles`. The open file = the chosen one if listed, else the first. Tabs (`role=tab`, `aria-selected`) show `●` (title `Bob's suggested changes`) for review files, else `●` (title `changed by the last Build`) for files that differ from the base. Base = `before` of the newest Checkpoint that has blocks (Checkpoints read once per Project id). No files → `No code yet. Build your website first.`
  - One `EditorView` per open tab; each tab's `EditorState` is kept in a map (its undo history and cursor survive tab switches). While mounted, `editorSelection.read` returns the selected text.
  - Hand edits: an update listener writes the doc to `files[file]` through `updateProject` when it differs.
  - Outside changes (a Build, an accepted change, a load) replace the doc with `Transaction.addToHistory.of(false)`.
  - Line marks in a compartment placed before `setup(file)` (so its gutter sits left of the line numbers), reconfigured on base/Checkpoints change: a `gutter` (class `marks`, 14px) whose markers are recomputed on doc change. Change bars: when the base has this file, each of `changedLines` gets a 3px bar, `#5FD38D` at 70% opacity, no background tint; a file the base does not have gets no bars. Block markers: on each mark's first line, only when `blockInfo(id, project, checkpoints)` is defined, a button `cat-<category>`: an 8px circle, `--c1` fill, 1px `--c3` ring, title `<name> Block · Show in Checkpoints`, click → `openCheckpointsAtBlock(id)`.
  - Undo and Redo: two buttons at the right end of the tab strip, `↶` (title `Undo (Ctrl+Z)`) and `↷` (title `Redo (Ctrl+Y)`), running `undo(view)` / `redo(view)` from `@codemirror/commands` on the open file's view, then focusing it; disabled when `undoDepth` / `redoDepth` is 0 (tracked in `dispatchTransactions`, per view). `keepUndoInside` stops Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z from reaching the app's Undo.
  - New file: a `+` button after the last tab (title `New file`) opens an inline input in the tab strip (placeholder `name.html, .css or .js`); Enter creates, Escape or blur cancels. The name is trimmed and lower-cased; a `newFileProblem` shows as one line under the strip in `--ed-tab-text`. Else `updateProject(d => { d.files[name] = '' })` (a hand edit, undoable with the app's Undo) and `openFile(name)`. A new `.html` becomes a Built page at the next Build.
  - Scrollbars: `.cm-scroller` and the tab strip get `scrollbar-width: thin; scrollbar-color: #4A5068 var(--ed-bg)` plus `::-webkit-scrollbar` rules (8px, thumb `#4A5068` radius 8px, track `--ed-bg`, thumb hover `#5B6278`).
  - Jump: `clearJump()` at once, then select the line start, scroll it to the center, flash it (class `flash`, `--ed-flash`) for 1500ms. Unmounting clears the timer and the flash before saving the tab's state.
  - A review file shows `<MergeReview key={review + ':' + file} path code={current text ?? ''} proposed onDecide={(code, _, proposed) => decide(review, file, code, proposed)} />` instead of the editor.
- **MergeReview({ path, code, proposed, onDecide })**: reads its props once on mount. A read-only `EditorView` on `proposed` with `setup(path)`, `EditorView.lineWrapping`, `unifiedMergeView({ original: code, gutter: false, highlightChanges: false, mergeControls })` and a theme: changed/inserted lines `--ed-add`; deleted chunk `--ed-del`, position relative, padding-right 150px; deleted lines struck through; buttons row flex gap 6px; the buttons (class `sb-accept` / `sb-reject`, text `Accept` / `Reject`, `onmousedown` = the action): no fill, 1.5px `--flag` border (Reject: `--ed-line-no`), radius 9px, `--ed-text`, weight 800 11px `--font`, padding 2px 9px, content before `✓ ` in `--flag` / `✕ `. An update listener calls `onDecide(original doc, chunk count, doc)` when the doc or the original changed. On mount, scroll the first chunk to the center.

## 15. Assistant

**Files:** `src/assistant.ts`, `src/slots/Assistant.tsx`, `Assistant.module.css`. Behavior: PRD §5. Look: DESIGN.md Assistant.

- Stores: `level` (`'simply'`; `useLevel`, `setLevel`); `reply` (`{ stopped, asked, bob? } | null`: the question, and Bob's message time once `start` came; `useReplying`, `useReply`).
- FAILED lines (appended to Bob's text after a blank line): time `Bob took too long, so this answer was stopped. Try asking again.`; turns `Bob ran out of steps before finishing, so this answer was stopped. Try a smaller question.`; unreachable `Bob couldn't be reached. Check your connection and try again.`; broken `Bob's answer came back broken. Try asking again.`
- Chat writes use `setProject` (never the undo history). Message time = `max(Date.now(), last time + 1)`.
- `ask(text): Promise<string | undefined>` (returns a limit message): ignore while a reply runs. Take `files = p.files` (with `.builds/`), `messages` = chat + the new user message, without `line`s, last 10, only `{ role, text, time }`; `context = turnContext(p)`. Set the reply token (`asked` = text). For each event: `limit` → clear the token, return the message (nothing added); `start` → add the user message and an empty Bob message (time + 1, kept as the token's `bob`); `text` → append to Bob's text; `error` → append the FAILED line; `files` → `propose(files, e.files, summary)`; with a proposal, Bob's text loses everything from the last `Summary:` and gets the proposal; else it is trimmed. If the token was stopped: stop reading; Bob's text becomes its trimmed text or `Stopped.`. Finally clear the token if it is still ours. If no `start` came before an `error`, add the two messages first so the failure shows.
- `turnContext(p)`: level; openFile = the editor's file if it exists, else the first file not under `.builds/`, else null; selection = `editorSelection.read() || null`; lastBuildCard = the run as text (`Build N is running` / `Build N done` / `Build N did not finish`, `Blocks: <names or none>`, skipped lines, failure line; joined `\n`) or null; library lines `assets/<file>: <kind>[, W×H px][, N s]`.
- `propose(sent, result, summary)`: files whose text changed or is new → `{ base: sent text, proposed }` (no `base` for new files); none → null; `total` = sum of `Chunk.build` chunk counts per file; `{ summary, files, total, accepted: 0, decided: 0 }`.
- `cardState(pr, files)`: done → `accepted` (accepted = total) / `rejected` (0) / `partial`; a file whose current text ≠ `base` → `outOfDate`; `decided > 0` → `reviewing`; else `open`.
- `hasPending(p)`: a reply is running, or a proposal not done. `openFiles(pr)`: files whose `base ?? ''` ≠ `proposed`.
- `acceptAll(time)`: not done and not out of date: `updateProject(write every proposed file, null)`; set `accepted: pr.accepted + pr.total - pr.decided, decided: pr.total, done: true`; `flashBlocks(changedBlocks(before, after))`.
- `rejectAll(time)` (also Dismiss): mark done (`decided = total`).
- `askAgain(time)`: `rejectAll`, then `ask` the user message before that Bob message; a limit message is added as a chat `line`.
- `decide(time, path, code, proposed)`: accepted = `code !== (base ?? '')`; if accepted `updateProject(files[path] = code, null)`; the file becomes `{ base: code, proposed }` (no base if the file does not exist); `decided + 1`, `accepted + (accepted ? 1 : 0)`; done when `openFiles` is empty; flash the changed Blocks when accepted.
- `dropPending(line?)`: stop a running reply; mark every open proposal done; append `line` as `{ role:'bob', text: line, line: true }`.
- `changedBlocks(before, after)`: for each changed `.html` file, for each `changedLines(before, after)` line, the last `blockMarks` entry at or above it; unique ids. CSS/JS alone → none.
- `previewHooks.askBobToFix = ({ message, file }) => ask('Something on ' + file + ' isn\'t working. The page says: "' + message + '". Can you fix it?')`; a limit message is added as a chat `line`.

**Assistant.tsx:** title bar: Bob's head (28px) + `Bob` + `<BobBadge/>`; the `Explain:` picker (`role=radiogroup` aria-label `Explain`, three `role=radio` buttons `very simply`, `simply`, `in detail`, `aria-checked`); the chat (pinned to the bottom when it was within 8px of it); empty (and nothing waiting) → Bob's head (48px) above `Ask Bob what a part of your code does, or ask for a change.`; messages: a `line` as a small centered paragraph; else a bubble (`user` / `bob`, Bob's with his 24px head beside it) with the text (plain text, `white-space: pre-wrap`) and the diff card; the Bob message being written (the token's `bob`, token not stopped, no proposal yet) shows, while empty, the thinking state (`role=status`: three bouncing dots, then `Bob is thinking…`), else its text with three small bouncing dots under it (`role=status`, aria-label `Bob is still working…`); while the token has no `bob` yet, its `asked` shows after the chat as a user bubble and a thinking Bob bubble (panel only, not saved); the composer form (input placeholder `Ask about your code, or ask for a change`, aria-label `Message to Bob`; **Send** ghost, disabled while replying or blank). Send: text = the trimmed draft (blank → nothing); clear the input; re-pin the chat to the bottom; `ask(text)` (errors logged `The Assistant failed`); a returned limit message puts the text back and shows the limit speech bubble over the Send button (closes on the next click).
- **DiffCard:** `Out of date` tag (outOfDate); the summary; file names (mono) joined `, `; buttons by state: open → **Accept all** (accept style), **Reject all**, **Review** (→ `startReview(time, first open file)`); reviewing → `N of M changes accepted` + **Review**; partial → `N of M changes accepted`; accepted → `✓` `Accepted, in your code now`; rejected → `Rejected`; outOfDate → **Ask again** (disabled while replying) and **Dismiss** (text).

## 16. Library and Download

**Files:** `src/slots/Library.tsx`, `Library.module.css`, `src/download.ts`. Behavior: §4 library rules. Look: DESIGN.md Library and §18.

**Library.tsx:**
- `ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm'`.
- `measure(file, kind)`: image → `createImageBitmap` width/height (close it); video → a `<video preload=metadata>` on an object URL → `videoWidth`, `videoHeight`, `duration` (revoke the URL).
- `upload(files)`: for each: `uploadKind` refusal → a problem line; measure failure → `` `${name} can't be opened. It may be damaged.` ``; else `updateProject(d => id = addAsset(d, name, { kind, mime, bytes, ...size }))`, then `putAsset`; if saving fails: log, `updateProject(removeAsset)`, problem `` `${name} couldn't be saved. The browser's storage may be full.` ``. Returns the problems.
- View: heading `Library`, hint `Images and videos for this Project. Pick one inside an image or video Trait.`, **Upload** (Primary; clicks a hidden multiple file input; reset its value after picking). Problems box (`role=alert`) with a **Dismiss** text button. Empty → `Nothing here yet. Upload an image or a video.` Tiles (title `<file> · <size>`): the image (object URL of its Blob) or a 40px duotone image/video icon; the name; hover actions: rename (pencil, title `Rename`, aria-label `Rename <file>`) and delete (trash, title `Delete`). Delete also has aria-label `Delete <file>`. Rename: an input (autofocus, aria-label `New name for <file>`): Enter commits, Escape or blur cancels, typing clears the problem. Commit trims the draft; a non-blank draft with a `renameProblem` shows it under the field and stays open; a blank or unchanged name just closes the field; a new name asks `confirm('Rename <file>?\nCode that references assets/<file> won't be updated and will break. You can ask the Assistant to fix the references.')` then `renameAsset`. Delete: `confirm(deleteWarning)`, then `removeAsset` and `deleteAsset` (Blob). Storage line at the bottom: `<used> of <quota> browser storage used` from `navigator.storage.estimate()`. Object URLs are revoked when the tiles reload.

**download.ts:**
- `zipDownload(project: Pick<Project, 'name' | 'files'>, assets: { file: string; data: Uint8Array }[]): Uint8Array` with fflate `zipSync`: every file not under `.builds/` (as `strToU8`); every Asset at `assets/<file>` stored uncompressed (`[data, { level: 0 }]`); and the **Bob kit**: `AGENTS.md` (below) and `.bob/skills/<name>/SKILL.md` for `code-rules`, `behavior`, `content`, `visual-style` (imported with `?raw` from `../skills/<name>/SKILL.md`).
- Kit `AGENTS.md` text (exact; `<name>` is the Project name; the plan parts are the `.builds/build-N.md` files in N order, or the single line `No Build yet.`):

```markdown
# <name>

A website made with Scrabby. Bob built it from a plan of Blocks and Traits. The plan Bob read for each Build is at the end of this file.

## Rules for Bob

- Plain HTML, CSS and JavaScript: one `.html` file per page, one shared `style.css` and `script.js`, images and videos in `assets/`. No build step, no npm, no frameworks.
- Keep every `data-block="…"` attribute and every `/* block … */` comment. They tie the code to the Blocks it came from.
- Change only what is asked. Keep all other code as it is, including the user's own edits.
- Follow the Skills in `.bob/skills/`: code rules, behavior, content and visual style.

## The plan

### Build <N>

<the text of .builds/build-N.md>
```

- `downloadCode(project)`: read each Asset Blob (`getAsset`; a missing one is left out with a `console.warn`), build the zip Blob (`application/zip`), download it as `${name.replace(/[^\p{L}\p{N} _-]+/gu, '').trim() || 'my-site'}.zip`, revoke the object URL after 60s.

## 17. Onboarding and demo

**Files:** `src/onboarding.ts`, `src/shell/Onboarding.tsx`, `Onboarding.module.css`, `src/fixtures/dev.ts`. Behavior: PRD §8, §9. Look: DESIGN.md Speech bubble, Menus.

- `isEmptyProject(p)`: at most 2 Blocks (canvas + Site), no Traits, no Assets, no files, no chat.
- `replaceProject(project, checkpoints = [])`: first fetch every Asset named in `DEMO_PHOTOS` from `/demo/<file>` (a failed fetch throws before anything is cleared, so the saved Project stays); `clearAll()`; for each photo set `bytes` to the Blob's size, `putAsset`; add the Checkpoints; `clearHistory()`; `setProject`; `setEditing(null)`; Canvas tab; Plan.
- `loadDemo()` = `replaceProject(demoProject())`; `newProject()` = `replaceProject(emptyProject())` (errors logged `Loading the demo failed` / `Starting a new Project failed`).
- Ask store (`'demo' | 'new' | null`): `askDemo()` loads at once when `isEmptyProject`, else asks; `askNewProject()` always asks; `closeAsk()`.
- **ReplaceWarning** (a fixed backdrop + modal; Escape closes): demo → title `Load the demo?`, text `This replaces your current Project, Blocks and all. Download code first to keep a copy of the website's code.`, go `Load the demo`; new → `Start a new Project?`, `Only one Project is saved, so this one will be replaced, Blocks and all. Download code first to keep a copy of the website's code.`, `Start a new Project`. Buttons: **Download code** (Secondary), **Cancel** (Text), the go button (Primary, autofocus: close, then run).
- **DemoButton** (exported): `Try the demo: Maya's bake sale` → `askDemo`.
- **Tours** (`TOURS`, texts in PRD §9): plan → targets `palette`, `canvas`, `build`, `steps`; try → `preview`, `assistant`. `startTour(which)` (plan also opens the Canvas tab), `nextBubble()`, `endTour()`. `once(key)`: true the first time (localStorage; true every time when storage throws).
- The first-visit plan tour (`once('scrabby.tour.plan')`) starts on the first visit; the try tour (`once('scrabby.tour.try')`) the first time Try & tweak opens.
- **SpeechBubble({ target, text, children })**: a ring (fixed, 3px `--bob` outline offset 3px, copying the target's rect and border radius) and the bubble (`role=dialog`, aria-label `Tip`; tour bubbles carry Bob, `<img src="/bob.svg" alt="">` 74px tall, on the corner away from the target), both hidden while the target is missing; re-placed after every render, on resize, and on a Step or tab change (it subscribes to the UI store) with `placeBubble`; `data-side` and `--tail` set on the bubble. Tour footer: `i of N`, **Skip** (text), **Next** / **Got it** (Primary, autofocus). Tip: target `[data-bid="<id>"]`, text `Right-click a Block or Trait for more.`, **Got it**.
- `droppedBlock(id)`: when no tour runs and `once('scrabby.tip.rightClick')`, show the tip on that Block.
- `placeBubble(r, w, h, W, H)` (GAP 14, EDGE 8): x/y centered on the target and clamped to `[EDGE, size - EDGE - w|h]`; `along(c, from, size) = clamp(c - from, 20, size - 20)`. A target wider than W/2 and taller than H/2 → `{ side:'inside', x, y: r.top + 24, tail: 0 }`. Else right if `r.right + GAP + w <= W - EDGE` → `{ side:'right', x: r.right + GAP, y, tail: along(cy, y, h) }`; else left if `r.left - GAP - w >= EDGE` → `{ side:'left', x: r.left - GAP - w, y, tail: along(cy, y, h) }`; else below if `r.bottom + GAP + h <= H - EDGE` → `{ side:'below', x, y: r.bottom + GAP, tail: along(cx, x, w) }`; else above if `r.top - GAP - h >= EDGE` → `{ side:'above', x, y: r.top - GAP - h, tail: along(cx, x, w) }`; else inside.
- **dev.ts:** `FIXTURES = { demo: 'Demo plan (spec §7)', built: 'Built site (2 Checkpoints)' }`; `loadFixture(name)` → `replaceProject` with `demoProject()` or `builtSite()`.

## 18. Where the build differs from DESIGN.md, and look details DESIGN.md leaves out

DESIGN.md's look was redone on 2026-09-26 (D-Q14 to D-Q27: Grape, Bob blue, Nunito, chunky bottom edges, springy motion, the Bob mascot). The team prototype departed from DESIGN.md in the places below; build these, not DESIGN.md's version.

| DESIGN.md says | Build this |
|---|---|
| Shell, Tabs: a count pill after "Checkpoints" | No count pill. |
| Block header: a **Color** button on a definition; the Custom Block color menu; menu item "Change color…" | None of them. A Custom Block's color is only the automatic `freshColor` (§4). |
| Block, Instance: shows only what differs, with a toggle strip | An Instance shows every part; parts carry the `✎ changed here` / `+ only here` markers (§9.4). No strip. |
| Block, Selected: a click selects a Block; a "See its code" button on its top-right corner, on locked Pages on the Canvas too | No selection on the Canvas. "See its code" exists only on a picked row in the Checkpoints tab's Block tree (§12), inline after the name: margin-left 8px, `--ink` fill, white weight-800 12px, radius `--r-pill`, padding 2px 10px, a 3px `#000` bottom edge. |
| Warnings popover: one-click fixes; an **Edit** button for a Custom Block problem; in the edit view a stepper for that Custom Block | Buttons **Show**, **Pick one** (Traits only), **Close**. The Custom Block line is text. The edit view shows no marks and no stepper. |
| Preview: a sandboxed `srcdoc` frame | A separate origin served by a Service Worker (§13), no `sandbox` attribute; plus the "can't start" card. |
| Speech bubble, Blocked Build and Nothing new: the Speech bubble component | The Build button's own bubble (§11): absolute, right 0, bottom `calc(100% + 16px)`, the Speech bubble look without Bob (`--surface`, 2.5px `--bob` border, radius 18px, a 5px bottom edge of `--bob` at 25%, padding 12px 14px, max-width 280px, `--ink` weight 700 `--fs-md`, line-height 1.4, z-index 10), a 20px tail pointing down at right 40px; its link is weight 900 `--brand`, underlined, no border. The button meanwhile has `outline: 3px solid var(--bob); outline-offset: 3px`. The limit message after pressing Build uses the same bubble; after Send, the same look placed above the Send button. |
| Code editor tabs: a dot only for files the last Build changed | Also a dot (title `Bob's suggested changes`) on files in Review, and a tab for a new file Bob proposes. |
| Library: tiles only | Also: hover actions, rename field, problems box, empty line and storage line (below). |
| Checkpoints: entries only | Also the **Show its Blocks** / **Hide its Blocks** toggle and the read-only Block tree (below). |
| Tooltip hides when the pointer leaves, a drag starts or a menu opens | It also hides on press, right-click, wheel and any key. |

**Look details not in DESIGN.md** (use exactly; every other look value comes from DESIGN.md):
- **Step bar:** step button disabled cursor default; `.back` hover border `--brand`.
- **Plan tab panel:** flex, `--surface`, 2px `--line`, a 3px `--line` bottom edge, radius `0 var(--r-panel) var(--r-panel) var(--r-panel)`, overflow hidden, padding `--gap`, gap `--gap`. Tab icon color `--muted` (selected `--brand`).
- **Palette:** column buttons: flex column, align center, gap 4px. The list: overflow auto; `h4` margin 14px 0 8px. Palette Block: flex, gap 6px, width max-content, margin 0 0 8px, cursor grab, position relative, the mouth a `::after` bar (left 10px, right 10px, bottom 5px, height 5px, radius 3px, `--c4`). Palette Trait: padding-right 12px, margin 0 6px 8px 0. While trashing, column and list `--trash`. My Blocks hint margin 8px 0 12px, `--fs-sm`, `--hint`; rows flex, gap 6px.
- **Canvas:** viewport `background: var(--ws) radial-gradient(circle, var(--ws-dot) 1.6px, transparent 1.8px) 0 0 / 24px 24px`, radius `--r-inside`, overflow hidden. Zoom stack absolute right 20px, bottom 96px, z-index 5, flex column, gap 8px. Edit bar absolute top/left/right 0, z-index 6, flex gap 10px; Done margin-left auto.
- **Block:** `.site > .empty` min-height 120px, width auto, min-width 150px, 2px dashed `--muted`, radius `--r-inside`; `.site > .inside`, `.checkpoint > .inside`: no background, no inner shade, padding 0; `.lockedPage > .inside`: no background, no inner shade. Empty hint: flex 1, flex column, centered, gap 8px, padding 0 16px. `drop Blocks or Traits here`: `--hint` italic weight 600, padding 2px. `.traits` align-items flex-start, margin 4px 0, hidden when empty. `.inside` align-items flex-start, margin-top 4px. `.row`/`.col` flex (column for col), gap `--gap`, align flex-start. `--ink: #1F1A33` is re-set on `.traits`, `.inside`, sticky, chips, badges, fold and Trait Note (a dark Custom Block color turns only its own header text white). Header: white-space nowrap, padding 3px 0. Header press: `translateY(var(--edge))` while the pointer is down on it, not during a drag.
- **Trait:** `.pill:has(textarea)` radius 18px, align flex-start, padding-top/bottom 5px. Text field focus: `--focus`. Big textarea: 280px, min-height 44px, padding 4px 10px, no resize, `field-sizing: content`. Small buttons (⤢ ⤡ ▾): white, no border, `--ink`, radius `--r-pill`, padding 1px 6px, `--fs-sm`, weight 900, hover `--c4`. Select: `appearance: none`, the caret as an inline SVG data URL (a 9×6 triangle `M0 0h9L4.5 6z` in `#1F1A33`) at right 9px center; options black on white, weight 600. `.warn`: `--alert-bg` fill, 1.5px `--alert` border. Color button: no border or fill, padding 0 6px 0 0, weight 900 `--ink`, gap 6px. Color menu: fixed, z-index 30, the DESIGN.md context menu look; title padding 4px 6px 6px; swatch grid 6 columns of 26px, gap 6px, padding 4px 6px 8px; Any color row padding 2px 6px 4px, gap 8px; color input 44×26px, 2px `--line`, radius 8px.
- **Dragging:** ghost `--drop-gap`, radius `--r-block` (pills `--r-pill`, inline-block); avatar fixed, z-index 50, no pointer events, `filter: var(--shadow-drag)`, scaled 1.03 on top of the zoom; drop line fixed, z-index 20, `--drop`, radius 3px, `box-shadow: 0 0 0 2px #fff`; `.over` outline 3px `--drop-over` offset 2px; `.lifted` display none.
- **Overlays:** folded chips margin-top 4px. Loose: opacity .85, `saturate(.75)`, full on hover. Sticky × at top 4px right 6px, `--note-text` at 60%, 14px. Trait Note input radius `--r-pill`; its big textarea radius 12px. Context menu item hover and focus: `--brand-tint` fill, `--brand` text. Tooltip: fixed, z-index 40, no pointer events, left border `5px solid var(--c3, var(--muted))`; title gap 6px.
- **Warnings:** badge line-height 20px; on a sticker margin-left −3px. Popover fixed, z-index 40, flex column gap 8px; items flex gap 8px; buttons row padding-left 28px, margin-top −2px. Stepper and ok pill absolute top 12px right 12px, z-index 5; ok gap 6px.
- **Build:** button inline-flex, align center; disabled opacity .6; greyed `--placeholder` with a `--muted` bottom edge. Card chip transition over `--t-pop` with `--spring`. Notes and the failure line flex, gap 10px; the working chip breathes (1.2s loop); the fold drawer animates `grid-template-rows` 0fr → 1fr over `--t-settle`. Actions flex, gap 6px, margin-top 6px. Spinner 1s linear spin. Build stage: position relative; its pieces absolute inside the 292px base; Bob absolute, right 26px, bottom 10px.
- **Checkpoints:** panel flex column, scrolls. Title row flex wrap, baseline. Link button: no border, padding 5px 6px, `--text`, weight 700, underline on hover. Tree: no bullets, nested lists indented 18px, margin-top 10px; rows inline-flex gap 6px, margin 3px 0, padding 3px 10px, `--c1`, 2px `--c3`, a 2px `--c3` bottom edge, radius `--r-inside`, weight 900 `--ink`, pointer; built rows `--idle` with 2px dashed `--muted` and no bottom edge; file `--fs-sm` weight 600 `--hint`; picked outline 3px `--brand` offset 3px; flash `@keyframes flash { 50% { box-shadow: 0 0 0 6px var(--flash) } }` 1.4s twice. Dialog: the DESIGN.md Menus modal as a native `<dialog>`: margin 100px auto auto, width 480px (max `100% - 32px`), no padding, no border, radius `--r-card`, overflow hidden, `box-shadow: 0 6px 0 #0000002e`; `::backdrop` `--brand` at 88%; title 56px, centered, white 18px weight 900 on `--brand`; body padding 24px; paragraphs margin 0 0 10px; buttons margin-top 16px, gap 8px, right.
- **Library:** panel flex column gap 12px, scrolls. Head flex space-between. Problems: `--alert-bg`, 2px `--alert`, radius `--r-inside`, padding 8px 12px. Empty `--muted`. Grid flex wrap; tile padding 6px, flex column centered gap 4px, position relative; the duotone icon's `opacity="0.2"` path filled `--idle` at opacity 1. Rename input `--fs-sm`, 2px `--line`, radius 8px, padding 1px 6px. Problem `--fs-sm` `--alert-dark`. Actions absolute top 4px right 4px, gap 2px, visible on tile hover or focus-within; buttons 24px, `--surface`, 2px `--line`, radius 8px, 14px fill icons. Storage line margin-top auto, `--fs-sm` `--hint`.
- **Preview:** frame wrapper 2px `--line-soft`, radius `--r-inside`, overflow hidden; page area white, iframe no border; ↻ dot absolute top 2px right 2px; error bar absolute at the bottom of the page area; message flex 1, one line, ellipsis. No-worker card margin 16px, padding 12px 14px, `--alert-bg`, 2px `--alert`, radius `--r-panel`.
- **Code editor:** root flex column, `--ed-bg`, radius `--r-panel`, overflow hidden, `box-shadow: 0 3px 0 #0000002e`; tabs row scrolls sideways; empty state centered; flash `@keyframes flash { 0%, 50% { background: var(--ed-flash) } }` 1.5s; chip margin-left 12px, line-height 1.4.
- **Assistant:** panel radius `--r-panel`, overflow hidden; segment dividers 2px `--line`; bubbles white-space pre-wrap, `overflow-wrap: anywhere`; line paragraph centered `--fs-sm` `--hint`; card files mono `--fs-sm`; Out of date tag margin-bottom 4px; composer input `--ink`.
- **Onboarding:** bubble fixed, z-index 50, width max-content; ring z-index 49; footer flex end, gap 8px, margin-top 10px; count margin-right auto; the tour's Bob absolute, no pointer events. Replace backdrop fixed, z-index 100, `color-mix(in srgb, var(--brand) 88%, transparent)`; modal absolute top 100px, centered, width 480px, the DESIGN.md Menus modal; body line-height 1.45, paragraphs margin 0 0 20px. Demo button: block, margin-top 24px, nowrap.

## 19. Fixtures

**File:** `src/fixtures/fixtures.ts`. Test data and the demo. Build them in exactly this order so the ids match Appendix A.

`DEMO_PHOTOS` (real photos in `public/demo/`, credits in `public/demo/CREDITS.md`; each a 1200×800 JPEG under 250 KB; §17 fetches them): `cupcakes.jpg`, `layer-cake.jpg`, `cookies.jpg`, `bake-stall.jpg`, `lemon-drizzle.jpg`, `brownie.jpg`.

**demoProject()** ("Maya's bake sale", PRD §7). `T(type, value?, extra?)` = `addTrait` then assign extra; `B(type, name, traits = [], children = [])` = `addBlock` then set traits and children (arguments are evaluated first, so inner Traits and Blocks get lower ids). Steps:
1. `p = emptyProject()` (Site `b1`); `p.name = "Maya's bake sale"`; `p.assets` = the 6 photos as `{ id: 'a1'…'a6', file, kind:'image', mime:'image/jpeg', bytes:0, width:1200, height:800 }`; `p.next.a = 7`.
2. Site: name `Maya's bake sale`, traits `[T('color','#F8BBD0'), T('vibe','playful'), T('font','friendly')]`.
3. `home = B('page','Home')`, `menu = B('page','Menu')`, `quiz = B('page','Quiz')`; Site children `[home, menu, quiz]`.
4. Definitions (off the Canvas): `menuButton = B('button','Menu',[T('onclick','page:'+menu)])`; `quizButton = B('button','Quiz',[T('onclick','page:'+quiz)])`; `topBar = B('navbar','Top bar',[],[menuButton, quizButton])` with layout `{d:'col',k:[{d:'row',k:[menuButton, quizButton]}]}`; `bottom = B('footer','Bottom',[],[B('text', undefined)])`. `p.defs.d1 = { id:'d1', blockId: topBar, color:{h:345,s:90,l:82} }`, `d2` = bottom with `{h:15,s:90,l:82}`; set `defines`; `p.next.d = 3`.
5. `withBarAndBottom(content) = [makeInstance(p,'d1'), ...content, makeInstance(p,'d2')]` (the Instance for d1 is made first).
6. `order = B('popup','Order',[],[B('form','Order form',[],[B('button',undefined,[T('onclick','submits (fake)')])])])`; `orderButton = B('button','Order',[T('onclick','popup:'+order)])`; `photo = B('image',undefined,[T('image','a1')])`; `hero = B('hero','Big welcome',[],[B('text',undefined,[T('text','Fresh cakes every Saturday')]), photo, orderButton])`; home children += `withBarAndBottom([hero, order])`.
7. `card = B('card',undefined,[T('image','',{bobPicks:true})])`; `cakes = B('cardgrid','Cakes',[T('fakedata','6 cakes with prices')],[card])` with layout `{d:'col',k:[{d:'row',k:[card]}]}`; menu children += `withBarAndBottom([cakes])`.
8. `answer = B('button',undefined,[T('onclick','checks an answer')])`; `cupcake = B('section','Which cupcake are you?',[T('tellbob','3 questions, then show which cupcake you are')],[answer])`; quiz children += `withBarAndBottom([cupcake])`.

It must show no Warnings, and its Build 1 document must equal Appendix A.

**builtSite(): { project, checkpoints }** — the demo after two Builds:
1. Build the demo as above (keep the ids: site, home, menu, quiz, hero, photo, orderButton, order, cakes, card, cupcake, answer, homeBar = Home's first child, homeBottom = Home's last child).
2. `hours = addBlock(p,'section','Opening hours')` with a text Trait `Saturdays 9 till 1, at the school gate`.
3. Files, `files(withHours)`: `index.html`, `menu.html`, `quiz.html`, `style.css`, `script.js`. Each page:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{Title} · Maya's bake sale</title>
  <link rel="stylesheet" href="style.css">
</head>
<body data-block="{page id}">
  <nav class="top-bar" data-block="{page's Top bar Instance}">
    <a href="index.html" class="logo">Maya's bake sale</a>
    <a href="menu.html" data-block="{its Menu button}">Menu</a>
    <a href="quiz.html" data-block="{its Quiz button}">Quiz</a>
  </nav>
{body}
  <footer class="bottom" data-block="{page's Bottom Instance}">
    <p data-block="{its Textbox}">Made with love by Maya. Every Saturday, 9 till 1.</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>
```

   - The page bodies, `style.css` and `script.js` are this fixture text, word for word (`d.<name>` are the ids from step 1, `hours` the id from step 2, `page(...)` the template above):

```ts
  const homeBody = (withHours: boolean) => `  <main>
    <section class="hero" data-block="${d.hero}">
      <h1 data-block="${ids(d.hero)[0]}">Fresh cakes every Saturday</h1>
      <img data-block="${d.photo}" src="assets/cupcakes.jpg" alt="A tray of pink cupcakes">
      <button class="big" data-block="${d.orderButton}" data-open="order">Order</button>
    </section>${withHours ? `
    <section class="hours" data-block="${hours}">
      <h2>Opening hours</h2>
      <p>Saturdays 9 till 1, at the school gate</p>
    </section>` : ''}
    <div class="popup" id="order" data-block="${d.order}" hidden>
      <form data-block="${ids(d.order)[0]}">
        <button type="button" class="close" data-close>×</button>
        <h2>Order a cake</h2>
        <label>Your name <input name="name" required></label>
        <label>Which cake? <input name="cake" required></label>
        <button data-block="${ids(ids(d.order)[0])[0]}">Send order</button>
        <p class="thanks" hidden>Thanks! Your order is in.</p>
      </form>
    </div>
  </main>`
  const cakes = [['Pink cupcake', '£1.50', 'cupcakes'], ['Lemon drizzle', '£2.00', 'lemon-drizzle'], ['Chocolate slice', '£2.50', 'brownie'], ['Carrot cake', '£2.00', 'layer-cake'], ['Victoria sponge', '£3.00', 'layer-cake'], ['Brownie', '£1.80', 'brownie']]
  const menuBody = `  <main>
    <h1>Our cakes</h1>
    <div class="grid" data-block="${d.cakes}">
${cakes.map(([n, price, photo]) => `      <article class="card" data-block="${d.card}">
        <img src="assets/${photo}.jpg" alt="${n}">
        <h3>${n}</h3><p>${price}</p>
      </article>`).join('\n')}
    </div>
  </main>`
  const quizBody = `  <main>
    <section class="quiz" data-block="${d.cupcake}">
      <h1>Which cupcake are you?</h1>
      <p id="question"></p>
      <div id="answers"></div>
      <p id="result" hidden></p>
      <button data-block="${d.answer}" id="again" hidden>Try again</button>
    </section>
  </main>`
  const css = (withHours: boolean) => `/* Pictures and videos never grow wider than their box */
img, video { max-width: 100%; height: auto; }

/* block ${d.site} */
body { margin: 0; font-family: "Nunito", sans-serif; background: #FFF5F8; color: #3A2A30; }
main { max-width: 960px; margin: 0 auto; padding: 24px; }
button { font: inherit; background: #E91E63; color: white; border: 0; border-radius: 999px; padding: 10px 20px; cursor: pointer; }

/* block ${d.homeBar} */
.top-bar { display: flex; gap: 20px; align-items: center; padding: 14px 24px; background: #F8BBD0; }
.top-bar a { color: #3A2A30; font-weight: bold; text-decoration: none; }
.top-bar .logo { margin-right: auto; font-size: 20px; }

/* block ${d.hero} */
.hero { text-align: center; padding: 32px; background: white; border-radius: 24px; }
.hero img { width: 100%; max-width: 480px; border-radius: 16px; display: block; margin: 16px auto; }

/* block ${d.order} */
.popup { position: fixed; inset: 0; background: #0006; display: grid; place-items: center; }
.popup[hidden] { display: none; }
.popup form { background: white; padding: 24px; border-radius: 16px; display: grid; gap: 12px; min-width: 280px; position: relative; }
.popup .close { position: absolute; top: 8px; right: 8px; padding: 4px 10px; }

/* block ${d.cakes} */
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.card { background: white; border-radius: 16px; padding: 12px; text-align: center; }
.card img { width: 100%; border-radius: 12px; }

/* block ${d.cupcake} */
.quiz { text-align: center; }
#answers { display: flex; gap: 12px; justify-content: center; }
${withHours ? `
/* block ${hours} */
.hours { margin-top: 24px; padding: 16px; background: #FFE066; border-radius: 16px; text-align: center; }
` : ''}
/* block ${d.homeBottom} */
.bottom { text-align: center; padding: 24px; color: #8A6A75; }
`
  const js = `/* block ${d.order} */
document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
  document.getElementById(b.dataset.open).hidden = false
}))
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
  b.closest('.popup').hidden = true
}))
document.querySelectorAll('.popup form').forEach(f => f.addEventListener('submit', e => {
  e.preventDefault()
  f.querySelector('.thanks').hidden = false
}))

/* block ${d.cupcake} */
const questions = [
  ['Pick a color', ['Pink', 'Brown', 'Yellow']],
  ['Pick a topping', ['Sprinkles', 'Chocolate', 'Lemon']],
  ['Pick a time', ['Morning', 'Night', 'Afternoon']],
]
const cupcakes = ['Strawberry swirl', 'Double chocolate', 'Lemon sunshine']
const quiz = document.getElementById('question')
if (quiz) {
  let step = 0
  const score = [0, 0, 0]
  const show = () => {
    const answers = document.getElementById('answers')
    answers.innerHTML = ''
    if (step === questions.length) {
      const result = document.getElementById('result')
      result.textContent = 'You are a ' + cupcakes[score.indexOf(Math.max(...score))] + ' cupcake!'
      result.hidden = false
      quiz.textContent = ''
      document.getElementById('again').hidden = false
      return
    }
    quiz.textContent = questions[step][0]
    questions[step][1].forEach((a, i) => {
      const b = document.createElement('button')
      b.textContent = a
      b.onclick = () => { score[i]++; step++; show() }
      answers.append(b)
    })
  }
  document.getElementById('again').onclick = () => location.reload()
  show()
}
`
  const files = (withHours: boolean): Files => ({
    'index.html': page('Home', d.home, homeBody(withHours)),
    'menu.html': page('Menu', d.menu, menuBody),
    'quiz.html': page('Quiz', d.quiz, quizBody),
    'style.css': css(withHours),
    'script.js': js,
  })
```

   - `v1 = files(false)`, `v2 = files(true)`. `menu.html` is identical in both.
4. `cp1Blocks = builtBlocks(p, [site])` (§11 shape, top = `[site]`).
5. Consume by hand: delete the site and the three Page Blocks; add locked Built pages with the same ids and names (files `index.html`, `menu.html`, `quiz.html`); the Site id becomes the Checkpoint Block `{ type:'checkpoint', name:"Maya's bake sale", locked:true, pos:{x:40,y:40}, children: [home, menu, quiz] }`.
6. `home.children = [hours]`; `cp2Blocks = builtBlocks(p, [site])`; `home.children = []`; then remove every Block and Trait not reachable from the Canvas or a definition.
7. `p.files = v2`; `p.checkpoint = 2`; time = `Date.UTC(2026, 8, 25, 10)`; checkpoints `[{ number:1, label:'Checkpoint 1', from:null, before:{}, after:v1, blocks:cp1Blocks, time }, { number:2, label:'Checkpoint 2', from:1, before:v1, after:v2, blocks:cp2Blocks, time: time + 600_000 }]` (projectId = p.id).

## 20. Tests

`pnpm test` runs Vitest over the pure modules. UI components have no unit tests; the done walk (issue 17) checks them. Modules that import `./db` mock it (`vi.mock('./db', …)`: IndexedDB is missing in Node). Build and Assistant tests mock `./agent`'s `runAgent` with a scripted event list that starts with `{ type:'start' }`. Each file below must exist with at least these cases:

| Test file | Cases |
|---|---|
| `src/model/project.test.ts` | makeInstance copies with `from` links, name "Product card 1"; resolve follows definition changes (value + bobPicks, nested name); keeps overridden fields; keeps the Instance's own name; adds new definition parts, drops deleted ones; keeps only-here parts and removed parts gone; resolveAll numbers a second Instance "Product card 2"; addBlock page files (§4 example); applyChange records `ov` (value, note) and leaves the old Project untouched; Bob picks counts as a value change; a deleted part goes to `removed`; a part dragged out is unlinked; makeCustomBlock swaps the Block for Instance 1 in children and layout, keeps a loose Block's pos, first colors 345 then 15, `newCustomBlock` is a box "My block"; the demo's Top bar follows definition renames except the one an Instance changed; the Instance's own name is never an override; `hasOverride`; the Project name renames the Site, and after a Build the Checkpoint Block, wins over the old name a Checkpoint load brings back, and a Project saved with a renamed Site takes its name on the first edit. |
| `src/canvas/tree.test.ts` | new Block into a Page; beside in a column splits into a row (`{d:'col',k:[{d:'row',k:[a,c]},b]}`), rowBefore; moving out to the Canvas closes the cell and sets pos, moving back clears pos; Traits at an index and between Blocks; canDrop rules (Site/Page/leaf/itself/Instance in Instance); the Checkpoint Block moves only on the Canvas; a Built page reorders only inside its Checkpoint Block and stays locked; canTrash never on Site/Checkpoint/Built page/definition; removeItem deletes everything inside; onClickOptions for the demo's Order button (exact list: pick one, go to page › Home, › Menu, › Quiz, open popup › Order, then the 7 actions without "plays a sound"); loose Pages never listed and a deleted target shows missing; newInstance drop names "Top bar 4"; Custom Blocks never inside Custom Blocks. |
| `src/canvas/target.test.ts` | Scene: Site (0,0,400,400) › Home (10,40,390,390) › Hero (20,80,380,200) with pills (30,100,90,128) and (100,100,160,128), Footer (20,210,380,300). `text` at (200,140) → `{id:hero, slot:null}`; at (25,140) → left of hero in Home; at (200,195) → below hero; at (200,205) → rowBefore footer; a `page` at (200,140) → `{id:site, slot:{where:'above', ref:home}}`; a Trait at (120,110) → tIdx 1, at (300,150) → tIdx 2; (600,600) → null. |
| `src/canvas/menu.test.ts` | Block items `Add Note, Duplicate, Make Custom Block, Delete Block`; Trait `Add Note, Duplicate, Delete Trait`; Site, Checkpoint Block, Built page → `Add Note` only; Add/Delete Note; Duplicate a Block with its insides right after it; a Page copy gets its own file; a loose copy +30/+30; Trait duplicate and delete; Make Custom Block availability; definition → `Add Note`; Instance → `Add Note, Edit Custom Block, Duplicate, Delete Block`, plus Bring back removed parts (1) and Use the Custom Block's version when they apply. |
| `src/canvas/marks.test.ts`, `tooltip.test.ts`, `bobPicks.test.ts` | Demo has no marks; deleting Quiz marks both Top bar Quiz links "!" with one stop; a new empty Page holds `lonepage, emptypage` with "?"; no Site marks nothing. Tooltips: palette texts, "the Site" / "the Checkpoint", loose lines, Checkpoint and Built page tips (`cat: null`), a gone id → null. Bob picks controls per type; setBobPicks keeps value and hint. |
| `src/instructions/warnings.test.ts` | Demo and built site have none; nosite; nopage; deadpage on both Top bar Instances sharing one key and `def:'d1'`; an overridden part counts alone; deadpopup; popup on another Page → deadpopup + lonepopup; noaction (Bob picks → only lonepopup); noasset for image/video/sound; deletedasset; lonepage; emptypage cleared by an empty let Bob pick or a Note; emptyvalue texts; cleared by a Trait Note or a tell Bob; "Bob skips it" never cleared; empty tell Bob always marked, empty let Bob pick never; where paths (`Home › Big welcome › Order`, `Home › Order`); only an empty let Bob pick above covers a Popup; loose ideas never marked; the Checkpoint Block's new items checked. |
| `src/instructions/document.test.ts` | Stop with no Site/Page; header and the Build 2 extra line; Trait lines with preset names; on click lines; `go to missing page` plus its Skipped line; skipped items left out, one line per key; two items → two lines; Bob picks and empty → `you choose` with the Note; Notes, tell Bob, let Bob pick; Instances tagged and definitions listed once; the Library section; a renamed Page keeps its file; loose ideas never sent; Build 2 document shape. Snapshot: the demo's Build 1 document equals Appendix A. |
| `api/agent.test.ts` | With a fake `Model` returning scripted replies: a Build creates files, lights each id once, ends with files; view (list, numbered, range, missing); insert (line 1 and 0); str_replace no match / 2 matches; every write to `.builds/` refused; the four Skills in the system message; the Build user message = document, then files, then the ending; 40 rounds → turns (41 model calls); time cap (`ms: 20`) → time; a throwing model → unreachable; unknown tool or missing argument → broken; finish `length`/`content_filter` → broken; an empty reply → broken; an Assistant turn yields text per round and the summary; the last 10 messages and the context in the system message; a failed write lights nothing; summary after `Summary:`; chat starts on a user message; `agentHandler`: GET returns the label, 405, 400, `start` first; limits: the 11th Build in an hour from one browser → 429 with `Try again in 60 minutes.`, the 41st Build of the day from any browser → the everyone message, `AGENT_LIMITS=off` skips them. |
| `src/agent.test.ts` | readAgentStream reads the server's events; joins messages split across chunks; a stream ending early or a 500 → unreachable; a 429 from runAgent (mock `fetch`) → one `limit` event. |
| `src/build.test.ts` | Build 1: sends document and empty files, saves Checkpoint 1 (`from: null`, `.builds/build-1.md`), Site → Checkpoint Block with 3 locked pages, loose ideas stay, card `done`, flash ids, Try & tweak after 900ms and not before; a limit event → nothing changes, step stays Plan, the message is returned; a failed Build changes nothing and stays on Build; progress (working = newest lit chip, the earlier ones done; all done on done, none on failed); nothingNew; Build 3 on the built site keeps the hand edit, `from: 2`, adds a Built page for `contact.html`. |
| `src/checkpoints.test.ts` | Go back (code, Checkpoint Block, Built page ids kept, unbuilt → loose, Library and defs unchanged); "Before loading Checkpoint 1" saved once; Edit its Blocks (code `before`, request Blocks back unlocked); Edit on Checkpoint 1 clears code and brings the Site back; fresh ids when taken; gist, fromTag, buildOf, the warning text; names: `checkpointTitle`, `renameCheckpoint` (trim, 40 characters, blank deletes), `withNames` (saved texts, `Checkpoint 12` untouched), a named gist, tag and warning. |
| `src/assistant.test.ts` | A turn sends 10 messages without lines, level, open file, Library, `.builds/`, never Blocks; streams into one Bob message; a diff card with summary (`total: 2` for a changed and a new file); a failed turn; a limit adds no messages and returns the text; Accept all (no Checkpoint; Undo takes it back; chat stays); Reject all; Out of date then Dismiss; Review decisions → `reviewing` then `partial`; dropPending with the line; a running reply is pending and one reply at a time; loading a Checkpoint drops it; changedBlocks. |
| `src/code/code.test.ts`, `preview/serve.test.ts` | changedLines (examples + the 4 hours lines + none on menu.html + all lines without base); blockMarks; findBlockCode (HTML first, CSS comment fallback); blockInfo (from Checkpoints, Built page on Canvas, Instances `my`). Serve: helper first in head; no head; folder → index.html; CSS/JS types; Asset Blob; missing page text with helper and html type; other missing 404; other paths → undefined. |
| `src/store.test.ts`, `src/history.test.ts`, `src/model/library.test.ts`, `src/download.test.ts`, `src/onboarding.test.ts`, `src/fixtures/fixtures.test.ts` | A no-undo change leaves Undo for the last edit. History order, redo cleared, key merging, a new step after undo, the limit. Library: addAsset names, clashes, uploadKind (types, SVG refused text, 30 MB text), rename + problems, deleteWarning texts. Zip: code at the top, Assets under `assets/`, no `.builds/`, the kit's `AGENTS.md` (Project name, plan per Build) and the 4 `.bob/skills/*/SKILL.md`. Demo shows no Warnings and has 4–6 photos; isEmptyProject; placeBubble cases (§17 numbers: `{0,100,300,700}`, 280×100 in 1366×768 → right x 314 y 350 tail 50; `{1200,680,1350,740}` → left x 906; a full-width bar → below y 104; `{300,150,W,H}` → inside y 174; `{10,740,60,766}` → right, y 660, tail 80). Fixtures: the demo tree, page files, asset ids; built site: 3 linked pages + CSS + JS, Checkpoint Block with Built pages, 2 Checkpoints whose Blocks hold every mark id (more than 20 marks), nothing unreachable. |

## 20a. Console messages (exact)

`Saving the Project failed`, `Loading the Project failed` (§6); `Saving the Checkpoint failed`, `The Build failed to run` (BuildButton and BuildCard catch of `runBuild`) (§11); `Loading the Checkpoints failed` (Checkpoints.tsx, CodeEditor.tsx), `Loading the Checkpoint failed` (§12); `Reading the Library failed` (Preview.tsx) (§13); `The Assistant failed` (Assistant.tsx, askBobToFix) (§15); `Saving an Asset failed`, `Deleting an Asset failed` (then reload the tiles), `Loading the Library failed` (§16); `Download code failed` (§7); `Loading the demo failed`, `Starting a new Project failed` (§17); `[agent] the model call failed:` (§5).

## 21. Known limits (keep; mark each in code with a `ponytail:` comment)

- Every change copies the whole Project, and Undo keeps whole copies.
- Drop targeting and each "on click" pill rebuild the parent map per pointer move / render.
- The Preview compares the whole code as JSON on every render.
- A Build applies to the Project as it is when it ends.
- The flash after an accepted change takes the nearest mark above a changed line.
- A deleted Asset's Warning cannot name the file.
- Loaded Checkpoints put loose ideas in one column, which may overlap other loose ideas.
- Library rename and delete use the native `confirm()`.
- The code editor reads Checkpoints once per visit to Try & tweak.
- Demo photos are drawn placeholders.
- A deleted Asset's Blob goes at once, so an Undo brings back a broken tile.
- Usage limits live in the running function's memory: approximate, reset on a cold start, one map entry per browser.
- Warnings are checked only on the Canvas, so the Custom Block edit view shows none.

## Appendix A. The demo's Build 1 document

`instructionDocument(demoProject()).document` must be exactly: the first ```` ```markdown ```` block of `skills/instruction-header.md` (it starts `## How to read this` and ends with the Library rule), then a blank line, then:

```markdown
## Block types used

- Site: The whole website; its Traits describe every page.
- Page: One page of the website, in its own `.html` file.
- Navbar: The bar of links for getting around the site.
- Hero: The big eye-catching banner at the top of a page, usually with a headline, an image and a button.
- Section: One band of a page that groups content with one purpose.
- Card grid: A grid of similar Cards. Repeat the Cards to a full grid with varied content only if a "fake data" Trait asks for it; otherwise show the Cards placed.
- Card: A small box that shows one thing, usually an image, a title and a short text.
- Form: Fields a visitor fills in and sends; sending is fake and shows a success message.
- Popup: A box that opens over the page and has a way to close it. It stays closed unless an "on click" opens it, a Note or "tell Bob" says when it opens, or a "let Bob pick" covers it.
- Footer: The strip at the bottom with small print, contact details and links.
- Textbox: Words: a heading, paragraph or label, whichever fits.
- Frame: One picture. With no image Trait, a plain placeholder box labelled with the Block's name; a Library Asset only under "let Bob pick".
- Button: Something a visitor clicks.

## Site "Maya's bake sale" #b1

- color (main color of this Block; decide where it shows, keep text readable): pink (#F8BBD0)
- vibe (overall feel: wording, shapes, spacing, motion): playful
- font (typeface for this Block's text): friendly

### Page "Home" (index.html) #b2

- Navbar "Top bar 1" (Instance of "Top bar") #b17
  - Button "Menu" #b18
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b19
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Hero "Big welcome" #b16
  - Textbox "Textbox" #b15
    - text (exact words to show, as written): "Fresh cakes every Saturday"
  - Frame "Frame" #b14
    - image (show this picture): assets/cupcakes.jpg
  - Button "Order" #b13
    - on click (when a visitor clicks this Block): open "Order" popup #b12
- Popup "Order" #b12
  - Form "Order form" #b11
    - Button "Button" #b10
      - on click (when a visitor clicks this Block): submits (fake)
- Footer "Bottom 1" (Instance of "Bottom") #b20
  - Textbox "Textbox" #b21

### Page "Menu" (menu.html) #b3

- Navbar "Top bar 2" (Instance of "Top bar") #b24
  - Button "Menu" #b25
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b26
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Card grid "Cakes" #b23
  - fake data (fill with made-up content as described): "6 cakes with prices"
  - Card "Card" #b22
    - image (show this picture): you choose
- Footer "Bottom 2" (Instance of "Bottom") #b27
  - Textbox "Textbox" #b28

### Page "Quiz" (quiz.html) #b4

- Navbar "Top bar 3" (Instance of "Top bar") #b31
  - Button "Menu" #b32
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b33
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Section "Which cupcake are you?" #b30
  - The user says: "3 questions, then show which cupcake you are"
  - Button "Button" #b29
    - on click (when a visitor clicks this Block): checks an answer
- Footer "Bottom 3" (Instance of "Bottom") #b34
  - Textbox "Textbox" #b35

## Custom Blocks

- Navbar "Top bar"
  - Button "Menu"
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz"
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Footer "Bottom"
  - Textbox "Textbox"

## Library

- assets/cupcakes.jpg: image, 1200×800 px, used by a Trait
- assets/layer-cake.jpg: image, 1200×800 px
- assets/cookies.jpg: image, 1200×800 px
- assets/bake-stall.jpg: image, 1200×800 px
- assets/lemon-drizzle.jpg: image, 1200×800 px
- assets/brownie.jpg: image, 1200×800 px
```

(The document ends with one newline after the last Library line.)
