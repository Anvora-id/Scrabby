import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AgentEvent, AgentRequest, AssistantContext } from '../src/agent.ts'
import type { ChatMessage, Files } from '../src/model/types.ts'
import { agentHandler, createLimits, runLoop, withFallback, type ChatMsg, type Model, type ModelReply } from './agent.ts'

let n = 0
const call = (name: string, args: object | string) => ({
  id: `c${++n}`,
  type: 'function' as const,
  function: { name, arguments: typeof args === 'string' ? args : JSON.stringify(args) },
})
const tools = (...calls: ReturnType<typeof call>[]): ModelReply => ({ content: null, tool_calls: calls, finish: 'tool_calls' })
const say = (content: string, ...calls: ReturnType<typeof call>[]): ModelReply => ({ content, tool_calls: calls, finish: 'stop' })

function fake(replies: ModelReply[]) {
  const got: ChatMsg[][] = []
  const model: Model = async ({ messages }) => {
    got.push(structuredClone(messages))
    return replies[got.length - 1] ?? say('Done.')
  }
  return { model, got }
}

async function collect(events: AsyncGenerator<AgentEvent>) {
  const out: AgentEvent[] = []
  for await (const e of events) out.push(e)
  return out
}

const build = (files: Files = {}, document = 'DOC'): AgentRequest => ({ kind: 'build', document, files })
const context: AssistantContext = { level: 'simply', openFile: null, selection: null, lastBuildCard: null, library: [] }
const msg = (role: 'user' | 'bob', text: string, time: number): ChatMessage => ({ role, text, time })
const ask = (messages: ChatMessage[], files: Files = {}, ctx = context): AgentRequest => ({ kind: 'assistant', messages, context: ctx, files })

// The tool outputs the model saw on its last call, in order.
const outputs = (got: ChatMsg[][]) =>
  got[got.length - 1].flatMap((m) => (m.role === 'tool' ? [m.content] : []))

const BASE_CSS = readFileSync('skills/base.css', 'utf8').replace(/\r\n/g, '\n')
const SITE = { 'index.html': 'one\ntwo\nthree', 'style.css': 'a $ b\na $ b' }

describe('runLoop', () => {
  it('a Build creates files, lights each id once, ends with files', async () => {
    const { model } = fake([
      tools(call('create', { path: 'index.html', file_text: '<main data-block="b1"><div data-block="b2"></div></main>' })),
      tools(call('str_replace', { path: 'index.html', old_str: '</main>', new_str: '<p data-block="b1"></p><p data-block="b3"></p></main>' })),
      say('All done.'),
    ])
    const events = await collect(runLoop(build(), model))
    expect(events).toEqual([
      { type: 'block', id: 'b1' },
      { type: 'block', id: 'b2' },
      { type: 'block', id: 'b3' },
      {
        type: 'files',
        files: {
          'base.css': BASE_CSS,
          'index.html': '<main data-block="b1"><div data-block="b2"></div><p data-block="b1"></p><p data-block="b3"></p></main>',
        },
      },
    ])
  })

  it('view lists, numbers, slices by range and reports a missing file', async () => {
    const { model, got } = fake([
      tools(
        call('view', { path: '.' }),
        call('view', { path: '/index.html' }),
        call('view', { path: 'index.html', view_range: [2, -1] }),
        call('view', { path: 'index.html', view_range: [1, 2] }),
        call('view', { path: 'nope.html' }),
      ),
    ])
    await collect(runLoop(build(SITE), model))
    expect(outputs(got)).toEqual([
      'index.html\nstyle.css',
      '1\tone\n2\ttwo\n3\tthree',
      '2\ttwo\n3\tthree',
      '1\tone\n2\ttwo',
      'Error: nope.html does not exist. The files are: index.html, style.css.',
    ])
  })

  it('insert after line 1 and at the top', async () => {
    const { model } = fake([
      tools(
        call('insert', { path: 'index.html', insert_line: 1, insert_text: 'x' }),
        call('insert', { path: 'index.html', insert_line: 0, insert_text: 'top' }),
      ),
    ])
    const { model: m2, got } = fake([tools(call('insert', { path: 'index.html', insert_line: 9, insert_text: 'no' }))])
    const events = await collect(runLoop(build(SITE), model))
    expect(events.at(-1)).toMatchObject({ type: 'files', files: { 'index.html': 'top\none\nx\ntwo\nthree' } })
    await collect(runLoop(build(SITE), m2))
    expect(outputs(got)).toEqual(['Error: insert_line must be 0 to 3.'])
  })

  it('str_replace reports no match and 2 matches, and keeps $ literal', async () => {
    const { model, got } = fake([
      tools(
        call('str_replace', { path: 'index.html', old_str: 'four', new_str: 'x' }),
        call('str_replace', { path: 'style.css', old_str: 'a $ b', new_str: 'x' }),
        call('str_replace', { path: 'index.html', old_str: 'two', new_str: '$& $1' }),
      ),
    ])
    const events = await collect(runLoop(build(SITE), model))
    expect(outputs(got)).toEqual([
      'Error: no match for old_str in index.html. Use view to see the exact text.',
      'Error: 2 matches for old_str in style.css. Add more lines around it so it matches once.',
      'Edited index.html.',
    ])
    expect(events.at(-1)).toMatchObject({ files: { 'index.html': 'one\n$& $1\nthree' } })
  })

  it('refuses every write to .builds/ and paths outside the folder', async () => {
    const files = { '.builds/build-1.md': 'doc' }
    const { model, got } = fake([
      tools(
        call('create', { path: '.builds/build-1.md', file_text: 'x' }),
        call('str_replace', { path: '.builds/build-1.md', old_str: 'doc', new_str: 'x' }),
        call('insert', { path: '/.builds/build-1.md', insert_line: 0, insert_text: 'x' }),
        call('create', { path: '.builds/new.md', file_text: 'x' }),
        call('view', { path: '../secret' }),
      ),
    ])
    const events = await collect(runLoop(build(files), model))
    const refused = 'Error: .builds/ is read-only. It holds the past instruction documents.'
    expect(outputs(got)).toEqual([refused, refused, refused, refused, 'Error: paths stay inside the site folder.'])
    expect(events.at(-1)).toEqual({ type: 'files', files: { ...files, 'base.css': BASE_CSS } })
  })

  it('puts the five Skills in the system message and document, files, ending in the user message', async () => {
    const { model, got } = fake([say('Done.')])
    await collect(runLoop(build({ 'index.html': 'hi', '.builds/build-1.md': 'old' }, 'THE DOC'), model))
    const [system, user] = got[0]
    for (const s of ['code-rules', 'layout', 'behavior', 'content', 'visual-style']) {
      expect(system.content).toContain(readFileSync(`skills/${s}/SKILL.md`, 'utf8').replace(/\r\n/g, '\n'))
    }
    expect(system.content).toMatch(/^You are Bob\. You build the user's website/)
    expect(user.content).toBe(
      'THE DOC\n\n# Current files\n\n<file path="index.html">\nhi\n</file>\n\nKeep every `data-block` mark.\nChange only what the request asks.',
    )
    const { model: m2, got: g2 } = fake([say('Done.')])
    await collect(runLoop(build({}, 'D'), m2))
    expect(g2[0][1].content).toBe(
      `D\n\n# Current files\n\n<file path="base.css">\n${BASE_CSS}\n</file>\n\nKeep every \`data-block\` mark.\nChange only what the request asks.`,
    )
  })

  it('stops after 40 rounds with turns (41 model calls)', async () => {
    let calls = 0
    const model: Model = async () => {
      calls++
      return tools(call('view', { path: '.' }))
    }
    expect(await collect(runLoop(build(), model))).toEqual([{ type: 'error', reason: 'turns' }])
    expect(calls).toBe(41)
  })

  it('the time cap ends with time', async () => {
    const model: Model = async () => {
      await new Promise((r) => setTimeout(r, 50))
      return tools(call('view', { path: '.' }))
    }
    expect(await collect(runLoop(build(), model, { ms: 20 }))).toEqual([{ type: 'error', reason: 'time' }])
  })

  it('a throwing model ends with unreachable', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const model: Model = async () => {
      throw new Error('down')
    }
    expect(await collect(runLoop(build(), model))).toEqual([{ type: 'error', reason: 'unreachable' }])
    expect(log).toHaveBeenCalledWith('[agent] the model call failed:', 'down')
    log.mockRestore()
  })

  it.each([
    ['an unknown tool', [tools(call('delete', { path: 'a' }))]],
    ['a missing argument', [tools(call('create', { path: 'a' }))]],
    ['arguments that are not JSON', [tools(call('view', '{oops'))]],
    ['finish length', [{ content: 'half', tool_calls: [], finish: 'length' }]],
    ['finish content_filter', [{ content: 'x', tool_calls: [], finish: 'content_filter' }]],
    ['an empty reply', [{ content: '  ', tool_calls: [], finish: 'stop' }]],
  ])('%s ends with broken', async (_, replies) => {
    const { model } = fake(replies as ModelReply[])
    expect(await collect(runLoop(build(), model))).toEqual([{ type: 'error', reason: 'broken' }])
  })

  it('a failed write lights nothing', async () => {
    const { model } = fake([tools(call('str_replace', { path: 'index.html', old_str: 'zzz', new_str: '<p data-block="b9">' }))])
    const events = await collect(runLoop(build(SITE), model))
    expect(events.map((e) => e.type)).toEqual(['files'])
  })

  it('an Assistant turn yields text per round and the summary', async () => {
    const { model } = fake([
      say('Let me look.', call('view', { path: 'index.html' })),
      say('I changed the title.\n\nSummary: The title is bigger.', call('create', { path: 'a.html', file_text: 'x' })),
      say('It is done.\n\nThe page now greets people.'),
    ])
    const events = await collect(runLoop(ask([msg('user', 'hi', 1)], SITE), model))
    expect(events).toEqual([
      { type: 'text', text: 'Let me look.' },
      { type: 'text', text: '\n\nI changed the title.\n\nSummary: The title is bigger.' },
      { type: 'text', text: '\n\nIt is done.\n\nThe page now greets people.' },
      { type: 'files', files: { ...SITE, 'a.html': 'x' }, summary: 'The page now greets people.' },
    ])
  })

  it('the summary is the text after Summary:', async () => {
    const { model } = fake([say('Fixed it.\nSummary: The button is blue.\nThe menu opens.')])
    const events = await collect(runLoop(ask([msg('user', 'hi', 1)]), model))
    expect(events.at(-1)).toEqual({ type: 'files', files: {}, summary: 'The button is blue.\nThe menu opens.' })
  })

  it('sends the last 10 messages from a user one, and the context in the system message', async () => {
    const chat = Array.from({ length: 12 }, (_, i) => msg(i % 2 ? 'bob' : 'user', `m${i}`, i))
    const { model, got } = fake([say('ok')])
    const ctx: AssistantContext = {
      level: 'in detail',
      openFile: 'index.html',
      selection: '<h1>',
      lastBuildCard: 'Build 1: 3 pages',
      library: ['assets/cake.png: image, 10×10 px'],
    }
    await collect(runLoop(ask(chat, { 'b.html': '', 'a.html': '' }, ctx), model))
    const [system, ...rest] = got[0]
    // the last 10 are m2…m11; m2 is a user message, so nothing is dropped
    expect(rest).toEqual(chat.slice(2).map((m) => ({ role: m.role === 'bob' ? 'assistant' : 'user', content: m.text })))
    expect(system.content).toContain(
      [
        '# This turn',
        'Explain in detail: name the HTML, CSS and JavaScript parts involved and why they work.',
        'Files: a.html, b.html',
        'Open file: index.html',
        'Selected in the open file:\n```\n<h1>\n```',
        'Last Build card:\nBuild 1: 3 pages',
        'Library (use as assets/<file>):\nassets/cake.png: image, 10×10 px',
      ].join('\n\n'),
    )
    expect(system.content).toMatch(/^You are Bob, in the Assistant/)
  })

  it('the chat starts on a user message', async () => {
    const chat = Array.from({ length: 11 }, (_, i) => msg(i % 2 ? 'bob' : 'user', `m${i}`, i))
    const { model, got } = fake([say('ok')])
    await collect(runLoop(ask(chat), model))
    const [system, ...rest] = got[0]
    expect(rest[0]).toEqual({ role: 'user', content: 'm2' })
    expect(rest).toHaveLength(9)
    expect(system.content).toContain('Files: none yet\n\nOpen file: none\n\nNothing selected.\n\nLast Build card:\nno Build yet\n\nLibrary (use as assets/<file>):\nempty')
  })
})

const post = (body: unknown, browser = 'b1') =>
  new Request('http://localhost/api/agent', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-scrabby-browser': browser },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

describe('agentHandler', () => {
  const env = process.env.AGENT_LIMITS
  afterEach(() => {
    if (env === undefined) delete process.env.AGENT_LIMITS
    else process.env.AGENT_LIMITS = env
  })

  it('GET returns the label', async () => {
    const res = await agentHandler(() => fake([]).model)(new Request('http://localhost/api/agent'))
    expect(await res.json()).toEqual({ model: process.env.AGENT_LABEL || 'IBM Bob' })
  })

  it('refuses other methods, bodies that are not JSON and unknown kinds', async () => {
    const handler = agentHandler(() => fake([]).model)
    const put = await handler(new Request('http://localhost/api/agent', { method: 'PUT' }))
    expect([put.status, await put.text()]).toEqual([405, 'POST an AgentRequest'])
    const bad = await handler(post('{nope'))
    expect([bad.status, await bad.text()]).toEqual([400, 'The body is not JSON'])
    const kind = await handler(post({ kind: 'other' }))
    expect([kind.status, await kind.text()]).toEqual([400, 'kind must be build or assistant'])
  })

  it('streams start first, then the run', async () => {
    const res = await agentHandler(() => fake([]).model)(post(build()))
    expect(res.headers.get('content-type')).toBe('text/event-stream')
    const text = await res.text()
    expect(text).toBe(`data: {"type":"start"}\n\ndata: ${JSON.stringify({ type: 'files', files: { 'base.css': BASE_CSS } })}\n\n`)
  })

  it('the 11th Build in an hour from one browser gets 429; AGENT_LIMITS=off skips the limits', async () => {
    delete process.env.AGENT_LIMITS
    const limits = createLimits()
    const handler = agentHandler(() => fake([]).model, limits)
    for (let i = 0; i < 10; i++) expect((await handler(post(build()))).status).toBe(200)
    const res = await handler(post(build()))
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ message: "You've used this hour's 10 Builds. Try again in 60 minutes." })
    expect((await handler(post(build(), 'b2'))).status).toBe(200)
    process.env.AGENT_LIMITS = 'off'
    expect((await handler(post(build()))).status).toBe(200)
  })
})

describe('createLimits', () => {
  const now = Date.UTC(2026, 8, 26, 12)

  it('counts per browser per rolling hour', () => {
    const { take } = createLimits()
    for (let i = 0; i < 10; i++) expect(take('build', 'a', now + i * 60_000)).toBeNull()
    expect(take('build', 'a', now + 10 * 60_000)).toBe("You've used this hour's 10 Builds. Try again in 50 minutes.")
    expect(take('build', 'a', now + 59 * 60_000 + 30_000)).toBe("You've used this hour's 10 Builds. Try again in 1 minute.")
    expect(take('build', 'a', now + 60 * 60_000 + 1)).toBeNull()
    for (let i = 0; i < 40; i++) expect(take('assistant', 'a', now)).toBeNull()
    expect(take('assistant', 'a', now)).toBe("You've asked Bob 40 questions this hour. Try again in 60 minutes.")
  })

  it('the 41st Build of the day from any browser gets the everyone message, and a new day resets it', () => {
    const { take } = createLimits()
    for (let i = 0; i < 40; i++) expect(take('build', `b${i}`, now)).toBeNull()
    expect(take('build', 'new', now)).toBe("Scrabby has reached today's limit for everyone. Please try again tomorrow.")
    expect(take('build', 'new', now + 24 * 3_600_000)).toBeNull()
  })
})

describe('withFallback', () => {
  // Bob answers with a create call per round and throws from round `failAt` on (Infinity: never).
  function bob(failAt: number) {
    const got: ChatMsg[][] = []
    const model: Model = async ({ messages }) => {
      got.push(structuredClone(messages))
      if (got.length - 1 >= failAt) throw new Error('model answered 403: blocked')
      return tools(call('create', { path: `bob${got.length}.html`, file_text: 'x' }))
    }
    return { model, got }
  }

  async function run(primary: Model, fallback: Model | null) {
    const res = await agentHandler((onSwitch) => withFallback(primary, fallback, 'Gemini', onSwitch))(post(build()))
    const text = await res.text()
    return text.split('\n\n').filter(Boolean).map((m) => JSON.parse(m.replace(/^data: /, '')) as AgentEvent)
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('a working Bob sends no model event and never calls the fallback', async () => {
    const primary = fake([tools(call('create', { path: 'a.html', file_text: 'x' })), say('Done.')])
    const fallback = vi.fn<Model>()
    const events = await run(primary.model, fallback)
    expect(events.map((e) => e.type)).toEqual(['start', 'files'])
    expect(fallback).not.toHaveBeenCalled()
  })

  it.each([
    ['round 1', 0],
    ['round 3', 2],
  ])('Bob failing on %s switches once, retries that round and every later one on the fallback', async (_, failAt) => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const primary = bob(failAt)
    const fallback = fake([tools(call('create', { path: 'gem.html', file_text: 'y' })), say('Done.')])
    const events = await run(primary.model, fallback.model)
    expect(events.filter((e) => e.type === 'model')).toEqual([{ type: 'model', label: 'Gemini' }])
    expect(events[1]).toEqual({ type: 'model', label: 'Gemini' })
    expect(primary.got).toHaveLength(failAt + 1)
    expect(fallback.got[0]).toEqual(primary.got[failAt])
    expect(fallback.got).toHaveLength(2)
    const last = events[events.length - 1]
    expect(last.type === 'files' && Object.keys(last.files).sort()).toEqual(
      ['base.css', ...Array.from({ length: failAt }, (_, i) => `bob${i + 1}.html`), 'gem.html'].sort(),
    )
    expect(log).toHaveBeenCalledWith('[agent] Bob failed, switching to Gemini:', 'model answered 403: blocked')
  })

  it('without a fallback Bob failing ends with unreachable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const events = await run(bob(0).model, null)
    expect(events).toEqual([{ type: 'start' }, { type: 'error', reason: 'unreachable' }])
  })

  it('a client abort never switches', async () => {
    const leave = new AbortController()
    const primary: Model = async () => {
      leave.abort()
      throw new Error('aborted')
    }
    const fallback = vi.fn<Model>()
    const onSwitch = vi.fn()
    const events = await collect(runLoop(build(), withFallback(primary, fallback, 'Gemini', onSwitch), { signal: leave.signal }))
    expect(events).toEqual([])
    expect(fallback).not.toHaveBeenCalled()
    expect(onSwitch).not.toHaveBeenCalled()
  })
})
