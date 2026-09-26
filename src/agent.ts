import { useSyncExternalStore } from 'react'
import type { ChatMessage, Files } from './model/types.ts'

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

let pageId: string | null = null

export function browserId(): string {
  try {
    let id = localStorage.getItem('scrabby.browser')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('scrabby.browser', id)
    }
    return id
  } catch {
    return (pageId ??= crypto.randomUUID())
  }
}

export async function* runAgent(req: AgentRequest): AsyncGenerator<AgentEvent> {
  let res: Response
  try {
    res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-scrabby-browser': browserId() },
      body: JSON.stringify(req),
    })
  } catch {
    yield { type: 'error', reason: 'unreachable' }
    return
  }
  if (res.status === 429) {
    let message = "Scrabby has reached today's limit for everyone. Please try again tomorrow."
    try {
      const body = await res.json()
      if (typeof body?.message === 'string') message = body.message
    } catch {
      // keep the fallback
    }
    yield { type: 'limit', message }
    return
  }
  yield* readAgentStream(res)
}

export async function* readAgentStream(res: Response): AsyncGenerator<AgentEvent> {
  if (res.ok && res.body) {
    // A read() loop, not for await: Safari cannot iterate a stream.
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
    try {
      let buffer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const parts = (buffer + value).split('\n\n')
        buffer = parts.pop() ?? ''
        for (const part of parts) {
          if (!part.trim()) continue
          const event = JSON.parse(part.replace(/^data: /, '')) as AgentEvent
          yield event
          if (event.type === 'files' || event.type === 'error' || event.type === 'limit') return
        }
      }
    } catch {
      // falls through to unreachable
    } finally {
      reader.cancel().catch(() => {})
    }
  }
  yield { type: 'error', reason: 'unreachable' }
}

let label: string | null = null
let asked = false
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!asked) {
    asked = true
    fetch('/api/agent')
      .then((res) => res.json())
      .then((body) => {
        if (typeof body?.model !== 'string') return
        label = body.model
        listeners.forEach((l) => l())
      })
      .catch(() => {})
  }
  return () => {
    listeners.delete(listener)
  }
}

export function useAgentLabel(): string | null {
  return useSyncExternalStore(subscribe, () => label)
}
