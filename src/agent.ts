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

// Stub until issue 09.
export async function* runAgent(_req: AgentRequest): AsyncGenerator<AgentEvent> {
  yield { type: 'error', reason: 'unreachable' }
}

export function useAgentLabel(): string | null {
  return null
}
