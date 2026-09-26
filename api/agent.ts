import { readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import type { AgentEvent, AgentRequest } from '../src/agent.ts'
import type { Files } from '../src/model/types.ts'

export const MAX_ROUNDS = 40
export const MAX_MS = 240_000

export type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } }
export type ChatMsg =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string }
export type ModelReply = { content: string | null; tool_calls: ToolCall[]; finish: string | null }
export type Model = (args: { messages: ChatMsg[]; signal: AbortSignal }) => Promise<ModelReply>

const skill = (path: string) => readFileSync(join(process.cwd(), 'skills', path), 'utf8').replace(/\r\n/g, '\n')

const SKILLS = ['code-rules', 'behavior', 'content', 'visual-style'].map((s) => skill(`${s}/SKILL.md`)).join('\n\n')
const PROMPT_ENDING = /## Prompt ending[\s\S]*?```text\n([\s\S]*?)\n```/.exec(skill('instruction-header.md'))![1]

const BUILD_ROLE = `You are Bob. You build the user's website from the instruction document, following the Skills below.
Write and change files only with the view, create, str_replace and insert tools. When every file is done, answer with one short line.`

const ASSISTANT_ROLE = `You are Bob, in the Assistant beside the code editor. You talk with the user about this website's code, following the Skills below.
- Help only with this Project's code and Blocks. Politely steer anything else back.
- Read files with the view tool before you answer about them. Files under \`.builds/\` are the instruction documents of the Builds that made the code; they are read-only.
- The Builds made the code, not you. Explain a Build from what its instruction document asked. Never invent the Build's reasoning.
- You change code only, with the create, str_replace and insert tools. When a fix belongs in the Blocks, say in words which Block or Trait to add or change.
- Every answer explains in plain words what the code does, or what your change does.
- Write plain text: the chat shows Markdown marks such as ** and # as they are.
- If you change files, make every edit first. End your answer with a line that starts with "Summary:" and says in 1–3 short plain lines what changed.`

const LEVELS = {
  'very simply': 'Explain very simply: the fewest and plainest words, short sentences, no code words without a meaning.',
  simply: 'Explain simply: plain words, and name a code word only with its meaning.',
  'in detail': 'Explain in detail: name the HTML, CSS and JavaScript parts involved and why they work.',
}

function prompt(req: AgentRequest): ChatMsg[] {
  if (req.kind === 'build') {
    const list = Object.entries(req.files)
      .filter(([path]) => !path.startsWith('.builds/'))
      .map(([path, text]) => `<file path="${path}">\n${text}\n</file>`)
    const files = '# Current files\n\n' + (list.join('\n\n') || 'None yet.')
    return [
      { role: 'system', content: BUILD_ROLE + '\n\n' + SKILLS },
      { role: 'user', content: req.document + '\n\n' + files + '\n\n' + PROMPT_ENDING },
    ]
  }
  const c = req.context
  const context = [
    '# This turn',
    LEVELS[c.level],
    'Files: ' + (Object.keys(req.files).sort().join(', ') || 'none yet'),
    'Open file: ' + (c.openFile ?? 'none'),
    c.selection ? ['Selected in the open file:', '```', c.selection, '```'].join('\n') : 'Nothing selected.',
    'Last Build card:\n' + (c.lastBuildCard ?? 'no Build yet'),
    'Library (use as assets/<file>):\n' + (c.library.join('\n') || 'empty'),
  ].join('\n\n')
  const chat = req.messages.slice(-10)
  while (chat.length && chat[0].role !== 'user') chat.shift()
  return [
    { role: 'system', content: ASSISTANT_ROLE + '\n\n' + context + '\n\n' + SKILLS },
    ...chat.map((m): ChatMsg => ({ role: m.role === 'bob' ? 'assistant' : 'user', content: m.text })),
  ]
}

const str = (description?: string) => ({ type: 'string', ...(description && { description }) })
const tool = (name: string, description: string, properties: Record<string, object>, required: string[]) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required } },
})

const TOOLS = [
  tool('view', 'Show a file with line numbers, or list every file when path is ".".', {
    path: str(),
    view_range: { type: 'array', items: { type: 'integer' }, description: 'Optional [first, last] line; last -1 means to the end.' },
  }, ['path']),
  tool('create', 'Write a whole file, replacing it if it exists.', { path: str(), file_text: str() }, ['path', 'file_text']),
  tool('str_replace', 'Replace old_str, which must appear exactly once in the file, with new_str.', {
    path: str(), old_str: str(), new_str: str(),
  }, ['path', 'old_str', 'new_str']),
  tool('insert', 'Insert insert_text after line insert_line (0 puts it at the top).', {
    path: str(), insert_line: { type: 'integer' }, insert_text: str(),
  }, ['path', 'insert_line', 'insert_text']),
]

class Broken extends Error {}

type Args = Record<string, unknown>

function runTool(files: Files, name: string, args: Args): string {
  const arg = (key: string) => {
    const value = args[key]
    if (typeof value !== 'string') throw new Broken(`${name} needs ${key}`)
    return value
  }
  let path = posix.normalize(arg('path')).replace(/^\/+/, '')
  if (path === '.') path = ''
  if (path.startsWith('..')) return 'Error: paths stay inside the site folder.'
  if (name !== 'view' && path.startsWith('.builds/')) return 'Error: .builds/ is read-only. It holds the past instruction documents.'
  const paths = Object.keys(files).sort()
  const missing = `Error: ${path} does not exist. The files are: ${paths.join(', ') || 'none yet'}.`
  const file = files[path]
  switch (name) {
    case 'view': {
      if (path === '') return paths.join('\n')
      if (file === undefined) return missing
      const [from = 1, to = -1] = Array.isArray(args.view_range) ? (args.view_range as number[]) : []
      return file
        .split('\n')
        .map((line, i) => `${i + 1}\t${line}`)
        .slice(from - 1, to === -1 ? undefined : to)
        .join('\n')
    }
    case 'create':
      files[path] = arg('file_text')
      return `Wrote ${path}.`
    case 'str_replace': {
      const old = arg('old_str')
      const replacement = typeof args.new_str === 'string' ? args.new_str : ''
      if (file === undefined) return missing
      const count = file.split(old).length - 1
      if (count === 0) return `Error: no match for old_str in ${path}. Use view to see the exact text.`
      if (count > 1) return `Error: ${count} matches for old_str in ${path}. Add more lines around it so it matches once.`
      files[path] = file.replace(old, () => replacement)
      return `Edited ${path}.`
    }
    case 'insert': {
      const text = arg('insert_text')
      if (file === undefined) return missing
      const lines = file.split('\n')
      const at = Number(args.insert_line)
      if (!Number.isInteger(at) || at < 0 || at > lines.length) return `Error: insert_line must be 0 to ${lines.length}.`
      lines.splice(at, 0, text)
      files[path] = lines.join('\n')
      return `Edited ${path}.`
    }
  }
  throw new Broken(`unknown tool ${name}`)
}

function blockIds(args: Args): string[] {
  const text = [args.file_text, args.new_str, args.insert_text].join('\n')
  return [...text.matchAll(/data-block="([^"]+)"/g)].map((m) => m[1])
}

function summaryOf(text: string): string {
  const at = text.lastIndexOf('Summary:')
  if (at >= 0) return text.slice(at + 'Summary:'.length).trim()
  return text.trim().split(/\n\s*\n/).pop()?.trim() ?? ''
}

export async function* runLoop(
  req: AgentRequest,
  model: Model,
  { ms = MAX_MS, signal }: { ms?: number; signal?: AbortSignal } = {},
): AsyncGenerator<AgentEvent> {
  const files = { ...req.files }
  const messages = prompt(req)
  const timeout = AbortSignal.timeout(ms)
  const stop = signal ? AbortSignal.any([timeout, signal]) : timeout
  const lit = new Set<string>()
  const said: string[] = []
  try {
    for (let round = 0; ; round++) {
      const reply = await model({ messages, signal: stop })
      const text = reply.content ?? ''
      const calls = reply.tool_calls
      if (!text.trim() && !calls.length) throw new Broken('empty reply')
      if (reply.finish === 'length' || reply.finish === 'content_filter') throw new Broken(`finish ${reply.finish}`)
      if (text.trim()) {
        if (req.kind === 'assistant') yield { type: 'text', text: said.length ? '\n\n' + text : text }
        said.push(text.trim())
      }
      if (!calls.length) {
        yield req.kind === 'assistant' ? { type: 'files', files, summary: summaryOf(text) } : { type: 'files', files }
        return
      }
      if (round === MAX_ROUNDS) {
        yield { type: 'error', reason: 'turns' }
        return
      }
      messages.push({ role: 'assistant', content: reply.content, tool_calls: calls })
      for (const call of calls) {
        let args: unknown
        try {
          args = JSON.parse(call.function.arguments || '{}')
        } catch {
          throw new Broken('arguments are not JSON')
        }
        if (typeof args !== 'object' || args === null || Array.isArray(args)) throw new Broken('arguments are not an object')
        const name = call.function.name
        const output = runTool(files, name, args as Args)
        if (name !== 'view' && !output.startsWith('Error')) {
          for (const id of blockIds(args as Args)) {
            if (lit.has(id)) continue
            lit.add(id)
            yield { type: 'block', id }
          }
        }
        messages.push({ role: 'tool', tool_call_id: call.id, content: output })
      }
      stop.throwIfAborted()
    }
  } catch (e) {
    if (signal?.aborted) return // the client left
    const reason = e instanceof Broken ? 'broken' : timeout.aborted ? 'time' : 'unreachable'
    if (reason === 'unreachable') console.error('[agent] the model call failed:', e instanceof Error ? e.message : String(e))
    yield { type: 'error', reason }
  }
}

export type ModelConfig = { baseUrl: string; apiKey: string; authScheme: string; model: string; headers: string }

export function primaryConfig(): ModelConfig {
  const env = process.env
  return {
    baseUrl: env.AGENT_BASE_URL || 'https://api.us-east.bob.ibm.com/inference/v1',
    apiKey: env.AGENT_API_KEY ?? '',
    authScheme: env.AGENT_AUTH_SCHEME || 'Apikey',
    model: env.AGENT_MODEL || 'premium',
    headers: env.AGENT_HEADERS || '{}',
  }
}

export function fallbackConfig(): ModelConfig | null {
  const env = process.env
  if (!env.FALLBACK_API_KEY) return null
  return {
    baseUrl: env.FALLBACK_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKey: env.FALLBACK_API_KEY,
    authScheme: env.FALLBACK_AUTH_SCHEME || 'Bearer',
    model: env.FALLBACK_MODEL || 'gemini-3.8-flash',
    headers: env.FALLBACK_HEADERS || '{}',
  }
}

export function openAiModel(cfg: ModelConfig): Model {
  return async ({ messages, signal }) => {
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `${cfg.authScheme} ${cfg.apiKey}`,
        ...JSON.parse(cfg.headers),
      },
      body: JSON.stringify({ model: cfg.model, messages, tools: TOOLS, tool_choice: 'auto' }),
      signal,
    })
    if (!res.ok) throw new Error(`model answered ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const json = await res.json()
    const choice = json.choices?.[0]
    if (!choice) return { content: null, tool_calls: [], finish: null }
    const raw = choice.message?.content
    const content =
      typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.map((p: { text?: string }) => p?.text ?? '').join('') : null
    return { content, tool_calls: choice.message?.tool_calls ?? [], finish: choice.finish_reason ?? null }
  }
}

// Only a throw switches (network, 403, 429, 5xx); broken, turns and time come from replies or the clock.
export function withFallback(primary: Model, fallback: Model | null, label: string, onSwitch: (label: string) => void): Model {
  let switched = false
  return async (args) => {
    if (switched) return fallback!(args)
    try {
      return await primary(args)
    } catch (e) {
      if (args.signal.aborted || !fallback) throw e
      console.error(`[agent] Bob failed, switching to ${label}:`, e instanceof Error ? e.message : String(e))
      switched = true
      onSwitch(label)
      return fallback(args)
    }
  }
}

// One per request: Bob first, the fallback (if configured) for the rest of the run once Bob fails.
export function bobModel(onSwitch: (label: string) => void = () => {}): Model {
  const fallback = fallbackConfig()
  return withFallback(
    openAiModel(primaryConfig()),
    fallback && openAiModel(fallback),
    process.env.FALLBACK_LABEL || 'Gemini',
    onSwitch,
  )
}

type Kind = 'build' | 'assistant'
const HOUR = 3_600_000
const HOUR_CAP = { build: 10, assistant: 40 }
const DAY_CAP = { build: 40, assistant: 150 }

// ponytail: in-memory counts, per server instance; a shared store if one instance stops being enough
export function createLimits() {
  const hours = new Map<string, number[]>()
  const runs = new Map<string, number>()
  let date = ''
  let day = { build: 0, assistant: 0 }
  return {
    // A run id seen in the last hour is a replay: it never starts a second run or counts twice.
    first(run: string, now: number): boolean {
      for (const [id, t] of runs) if (t <= now - HOUR) runs.delete(id)
      if (runs.has(run)) return false
      runs.set(run, now)
      return true
    },
    // A Build that ended without files gives its hour back (the day count stays: the tokens were spent).
    give(kind: Kind, browser: string, at: number) {
      const times = hours.get(`${kind}:${browser}`) ?? []
      const i = times.indexOf(at)
      if (i >= 0) times.splice(i, 1)
    },
    take(kind: Kind, browser: string, now: number): string | null {
      const today = new Date(now).toISOString().slice(0, 10)
      if (today !== date) {
        date = today
        day = { build: 0, assistant: 0 }
      }
      if (day[kind] >= DAY_CAP[kind]) return "Scrabby has reached today's limit for everyone. Please try again tomorrow."
      const key = `${kind}:${browser}`
      const times = (hours.get(key) ?? []).filter((t) => t > now - HOUR)
      if (times.length >= HOUR_CAP[kind]) {
        const m = Math.max(1, Math.ceil((times[0] + HOUR - now) / 60_000))
        const s = m === 1 ? '' : 's'
        return kind === 'build'
          ? `You've used this hour's 10 Builds. Try again in ${m} minute${s}.`
          : `You've asked Bob 40 questions this hour. Try again in ${m} minute${s}.`
      }
      times.push(now)
      hours.set(key, times)
      day[kind]++
      return null
    },
  }
}

export function agentHandler(model: (onSwitch: (label: string) => void) => Model, limits = createLimits()) {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'GET') return Response.json({ model: process.env.AGENT_LABEL || 'IBM Bob' })
    if (request.method !== 'POST') return new Response('POST an AgentRequest', { status: 405 })
    let req: AgentRequest
    try {
      req = await request.json()
    } catch {
      return new Response('The body is not JSON', { status: 400 })
    }
    if (req?.kind !== 'build' && req?.kind !== 'assistant') return new Response('kind must be build or assistant', { status: 400 })
    const run = request.headers.get('x-scrabby-run')?.slice(0, 64)
    if (run && !limits.first(run, Date.now())) return new Response('This run already started', { status: 409 })
    let giveBack = () => {}
    if (process.env.AGENT_LIMITS !== 'off') {
      const browser = (request.headers.get('x-scrabby-browser') || 'anon').slice(0, 64)
      const now = Date.now()
      const message = limits.take(req.kind, browser, now)
      if (message) return Response.json({ message }, { status: 429 })
      if (req.kind === 'build') giveBack = () => limits.give('build', browser, now)
    }
    const encoder = new TextEncoder()
    const send = (controller: ReadableStreamDefaultController<Uint8Array>, event: AgentEvent) =>
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    let stream!: ReadableStreamDefaultController<Uint8Array>
    // The model event goes out at once, while runLoop still waits on the fallback's reply.
    const onSwitch = (label: string) => send(stream, { type: 'model', label })
    const events = (async function* (): AsyncGenerator<AgentEvent> {
      yield { type: 'start' }
      for await (const event of runLoop(req, model(onSwitch), { signal: request.signal })) {
        if (event.type === 'error') giveBack()
        yield event
      }
    })()
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        stream = controller
      },
      async pull(controller) {
        const { done, value } = await events.next()
        if (done) controller.close()
        else send(controller, value)
      },
      async cancel() {
        await events.return(undefined)
      },
    })
    return new Response(body, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' } })
  }
}

export default { fetch: agentHandler(bobModel) }
