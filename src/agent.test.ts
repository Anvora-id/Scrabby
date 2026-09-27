import { afterEach, describe, expect, it, vi } from 'vitest'
import { agentHandler, type Model } from '../api/agent.ts'
import { agentLabel, readAgentStream, runAgent, type AgentEvent } from './agent.ts'

async function collect(events: AsyncGenerator<AgentEvent>) {
  const out: AgentEvent[] = []
  for await (const e of events) out.push(e)
  return out
}

const chunked = (chunks: string[], init?: ResponseInit) =>
  new Response(
    new ReadableStream({
      start(c) {
        for (const s of chunks) c.enqueue(new TextEncoder().encode(s))
        c.close()
      },
    }),
    init,
  )

describe('readAgentStream', () => {
  it("reads the server's events", async () => {
    const model: Model = async () => ({ content: 'Done.', tool_calls: [], finish: 'stop' })
    const res = await agentHandler(() => model)(
      new Request('http://localhost/api/agent', { method: 'POST', body: JSON.stringify({ kind: 'build', document: 'D', files: {} }) }),
    )
    expect(await collect(readAgentStream(res))).toEqual([{ type: 'start' }, { type: 'files', files: { 'base.css': expect.any(String) } }])
  })

  it('joins messages split across chunks', async () => {
    const res = chunked(['data: {"type":"st', 'art"}\n', '\ndata: {"type":"block","id":"b1"}\n\ndata: {"type":"fi', 'les","files":{"a":"x"}}\n\n'])
    expect(await collect(readAgentStream(res))).toEqual([
      { type: 'start' },
      { type: 'block', id: 'b1' },
      { type: 'files', files: { a: 'x' } },
    ])
  })

  it("skips the server's heartbeat blank lines, also split across chunks", async () => {
    const res = chunked(['data: {"type":"start"}\n\n', '\n\n', '\n', '\n', 'data: {"type":"block","id":"b1"}\n\n\n\n', 'data: {"type":"files","files":{}}\n\n'])
    expect(await collect(readAgentStream(res))).toEqual([{ type: 'start' }, { type: 'block', id: 'b1' }, { type: 'files', files: {} }])
  })

  it('a stream ending early or a 500 ends with unreachable', async () => {
    const early = chunked(['data: {"type":"start"}\n\ndata: {"type":"blo'])
    expect(await collect(readAgentStream(early))).toEqual([{ type: 'start' }, { type: 'error', reason: 'unreachable' }])
    const failed = chunked(['oops'], { status: 500 })
    expect(await collect(readAgentStream(failed))).toEqual([{ type: 'error', reason: 'unreachable' }])
  })
})

describe('runAgent', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('a 429 yields one limit event', async () => {
    const fetch = vi.fn(async () => Response.json({ message: 'Try again in 5 minutes.' }, { status: 429 }))
    vi.stubGlobal('fetch', fetch)
    expect(await collect(runAgent({ kind: 'build', document: 'D', files: {} }))).toEqual([
      { type: 'limit', message: 'Try again in 5 minutes.' },
    ])
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('sends a new run id with every run', async () => {
    const fetch = vi.fn(async (_url: string, _init: RequestInit) => chunked(['data: {"type":"files","files":{}}\n\n']))
    vi.stubGlobal('fetch', fetch)
    await collect(runAgent({ kind: 'build', document: 'D', files: {} }))
    await collect(runAgent({ kind: 'build', document: 'D', files: {} }))
    const ids = fetch.mock.calls.map(([, init]) => (init.headers as Record<string, string>)['x-scrabby-run'])
    expect(ids[0]).toMatch(/^[0-9a-f-]{36}$/)
    expect(ids[1]).not.toBe(ids[0])
  })

  it('a model event sets the badge label; the next run starts on the GET label again', async () => {
    vi.stubGlobal('fetch', async () => chunked(['data: {"type":"start"}\n\ndata: {"type":"model","label":"Gemini"}\n\n']))
    const events = await collect(runAgent({ kind: 'build', document: 'D', files: {} }))
    expect(events.slice(0, 2)).toEqual([{ type: 'start' }, { type: 'model', label: 'Gemini' }])
    expect(agentLabel()).toBe('Gemini')
    vi.stubGlobal('fetch', async () => chunked(['data: {"type":"start"}\n\n']))
    await collect(runAgent({ kind: 'build', document: 'D', files: {} }))
    expect(agentLabel()).toBeNull()
  })
})
