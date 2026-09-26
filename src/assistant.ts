import { Text } from '@codemirror/state'
import { Chunk } from '@codemirror/merge'
import { runAgent, type AssistantContext } from './agent.ts'
import { FAILURE_LINES, getBuild } from './build.ts'
import { blockMarks, changedLines } from './code/code.ts'
import { editorSelection, getEditorUi } from './code/navigation.ts'
import type { ChatMessage, Files, Project, Proposal } from './model/types.ts'
import { flashBlocks, previewHooks } from './preview.ts'
import { createStore, getProject, setProject, updateProject } from './store.ts'

export type Level = AssistantContext['level']
export type CardState = 'accepted' | 'rejected' | 'partial' | 'outOfDate' | 'reviewing' | 'open'
type FailReason = 'time' | 'turns' | 'unreachable' | 'broken'

const FAILED: Record<FailReason, string> = {
  time: 'Bob took too long, so this answer was stopped. Try asking again.',
  turns: 'Bob ran out of steps before finishing, so this answer was stopped. Try a smaller question.',
  unreachable: "Bob couldn't be reached. Check your connection and try again.",
  broken: "Bob's answer came back broken. Try asking again.",
}

// ── stores ────────────────────────────────────────────────────────────────────

const level = createStore<Level>('simply')
export const useLevel = () => level.use()
export const setLevel = (l: Level) => level.set(l)

// The running reply: what was asked, for which Project, and the time of Bob's message once the server accepted it.
type Reply = { stopped: boolean; asked: string; project: string; bob?: number }
const reply = createStore<Reply | null>(null)
export const useReply = () => reply.use()

// ── chat writes (never in the undo history) ──────────────────────────────────

function nextTime(chat: ChatMessage[]): number {
  return Math.max(Date.now(), (chat.at(-1)?.time ?? 0) + 1)
}

function setChat(change: (chat: ChatMessage[]) => ChatMessage[]): void {
  const p = getProject()
  setProject({ ...p, chat: change(p.chat) })
}

function setMessage(time: number, change: (m: ChatMessage) => ChatMessage): void {
  setChat(chat => chat.map(m => (m.time === time ? change(m) : m)))
}

function setProposal(time: number, change: (pr: Proposal) => Proposal): void {
  setMessage(time, m => (m.proposal ? { ...m, proposal: change(m.proposal) } : m))
}

function addLine(text: string): void {
  setChat(chat => [...chat, { role: 'bob', text, time: nextTime(chat), line: true }])
}

const proposalAt = (time: number) => getProject().chat.find(m => m.time === time)?.proposal

// ── a turn ────────────────────────────────────────────────────────────────────

export async function ask(text: string): Promise<string | undefined> {
  if (reply.get()) return
  const p = getProject()
  const messages = [...p.chat, { role: 'user' as const, text, time: nextTime(p.chat) }]
    .filter(m => !m.line)
    .slice(-10)
    .map(({ role, text, time }) => ({ role, text, time }))
  const token: Reply = { stopped: false, asked: text, project: p.id }
  reply.set(token)
  let said = ''
  const start = () => {
    if (token.bob !== undefined) return
    setChat(chat => {
      const time = nextTime(chat)
      token.bob = time + 1
      return [...chat, { role: 'user', text, time }, { role: 'bob', text: '', time: token.bob }]
    })
  }
  const show = (t: string, proposal?: Proposal) =>
    setMessage(token.bob!, m => (proposal ? { ...m, text: t, proposal } : { ...m, text: t }))
  try {
    for await (const e of runAgent({ kind: 'assistant', messages, context: turnContext(p), files: p.files })) {
      // New Project or the demo replaced it: write nothing into that one.
      if (getProject().id !== p.id) break
      if (token.stopped) {
        // Stopped before `start`: still show the question and that it was stopped.
        start()
        show(said.trim() || 'Stopped.')
        break
      }
      if (e.type === 'limit') return e.message
      if (e.type === 'start') start()
      else if (e.type === 'text') { said += e.text; show(said) }
      else if (e.type === 'error') {
        start()
        said = (said.trim() ? said.trim() + '\n\n' : '') + FAILED[e.reason]
        show(said)
      } else if (e.type === 'files') {
        start()
        const proposal = propose(p.files, e.files, e.summary ?? '')
        const cut = said.lastIndexOf('Summary:')
        if (proposal) show((cut >= 0 ? said.slice(0, cut) : said).trim(), proposal)
        else show(said.trim())
      }
    }
  } finally {
    if (reply.get() === token) reply.set(null)
  }
}

const libraryLine = (a: Project['assets'][number]) =>
  `assets/${a.file}: ${a.kind}` +
  (a.width && a.height ? `, ${a.width}×${a.height} px` : '') +
  (a.seconds ? `, ${Math.round(a.seconds)} s` : '')

export function turnContext(p: Project): AssistantContext {
  const file = getEditorUi().file
  const run = getBuild()
  return {
    level: level.get(),
    openFile: file !== undefined && file in p.files ? file : Object.keys(p.files).find(f => !f.startsWith('.builds/')) ?? null,
    selection: editorSelection.read() || null,
    lastBuildCard: run
      ? [
          run.state === 'running' ? `Build ${run.n} is running` : run.state === 'done' ? `Build ${run.n} done` : `Build ${run.n} did not finish`,
          `Blocks: ${run.chips.map(c => c.name).join(', ') || 'none'}`,
          ...run.skipped,
          ...(run.reason ? [run.message ?? FAILURE_LINES[run.reason]] : []),
        ].join('\n')
      : null,
    library: p.assets.map(libraryLine),
  }
}

// ── proposals ─────────────────────────────────────────────────────────────────

const lines = (s: string) => Text.of(s.split(/\r?\n/))

export function propose(sent: Files, result: Files, summary: string): Proposal | null {
  const files: Proposal['files'] = {}
  let total = 0
  for (const [path, proposed] of Object.entries(result)) {
    if (sent[path] === proposed) continue
    files[path] = path in sent ? { base: sent[path], proposed } : { proposed }
    total += Chunk.build(lines(sent[path] ?? ''), lines(proposed)).length
  }
  return Object.keys(files).length ? { summary, files, total, accepted: 0, decided: 0 } : null
}

export function cardState(pr: Proposal, files: Files): CardState {
  if (pr.done) return pr.accepted === pr.total ? 'accepted' : pr.accepted === 0 ? 'rejected' : 'partial'
  if (Object.entries(pr.files).some(([path, f]) => files[path] !== f.base)) return 'outOfDate'
  return pr.decided > 0 ? 'reviewing' : 'open'
}

export function openFiles(pr: Proposal): string[] {
  return Object.keys(pr.files).filter(path => (pr.files[path].base ?? '') !== pr.files[path].proposed)
}

export function hasPending(p: Project): boolean {
  return reply.get() !== null || p.chat.some(m => m.proposal && !m.proposal.done)
}

export function acceptAll(time: number): void {
  const pr = proposalAt(time)
  if (!pr || pr.done || cardState(pr, getProject().files) === 'outOfDate') return
  const before = getProject().files
  updateProject(p => { for (const [path, f] of Object.entries(pr.files)) p.files[path] = f.proposed }, null)
  setProposal(time, x => ({ ...x, accepted: x.accepted + x.total - x.decided, decided: x.total, done: true }))
  flashBlocks(changedBlocks(before, getProject().files))
}

export function rejectAll(time: number): void {
  if (proposalAt(time)?.done) return
  setProposal(time, x => ({ ...x, decided: x.total, done: true }))
}

export async function askAgain(time: number): Promise<void> {
  rejectAll(time)
  const user = getProject().chat.filter(m => m.role === 'user' && !m.line && m.time < time).at(-1)
  if (!user) return
  const limit = await ask(user.text)
  if (limit) addLine(limit)
}

export function decide(time: number, path: string, code: string, proposed: string): void {
  const pr = proposalAt(time)
  if (!pr || pr.done || !(path in pr.files)) return
  const before = getProject().files
  const accepted = code !== (pr.files[path]?.base ?? '')
  if (accepted) updateProject(p => { p.files[path] = code }, null)
  setProposal(time, x => {
    const next: Proposal = {
      ...x,
      files: { ...x.files, [path]: path in getProject().files ? { base: code, proposed } : { proposed } },
      decided: x.decided + 1,
      accepted: x.accepted + (accepted ? 1 : 0),
    }
    return openFiles(next).length ? next : { ...next, done: true }
  })
  if (accepted) flashBlocks(changedBlocks(before, getProject().files))
}

export function dropPending(line?: string): void {
  // Only mark it: the token clears when the reader sees it and stops.
  const token = reply.get()
  if (token) token.stopped = true
  setChat(chat => chat.map(m => (m.proposal && !m.proposal.done ? { ...m, proposal: { ...m.proposal, decided: m.proposal.total, done: true } } : m)))
  if (line) addLine(line)
}

export function changedBlocks(before: Files, after: Files): string[] {
  const ids = new Set<string>()
  for (const [path, text] of Object.entries(after)) {
    if (!path.endsWith('.html') || before[path] === text) continue
    const marks = blockMarks(text)
    for (const n of changedLines(before[path], text)) {
      const mark = marks.filter(m => m.line <= n).at(-1)
      if (mark) ids.add(mark.id)
    }
  }
  return [...ids]
}

previewHooks.askBobToFix = ({ message, file }) => {
  ask('Something on ' + file + ' isn\'t working. The page says: "' + message + '". Can you fix it?')
    .then(limit => { if (limit) addLine(limit) })
    .catch(e => console.error('The Assistant failed', e))
}
