import type { Category } from './model/catalogue.ts'
import type { Block, BuiltBlocks, Files, Project } from './model/types.ts'
import { addBlock } from './model/project.ts'
import { instructionDocument } from './instructions/document.ts'
import { topBlock } from './instructions/warnings.ts'
import { blockInfo } from './code/code.ts'
import { builtBlocks as cloneBlocks } from './fixtures/fixtures.ts'
import { addCheckpoint, listCheckpoints } from './db.ts'
import { runAgent } from './agent.ts'
import { flashBlocks } from './preview.ts'
import { createStore, getProject, setStep, updateProject } from './store.ts'

export type FailReason = 'time' | 'turns' | 'unreachable' | 'broken'
export const FAILURE_LINES: Record<FailReason, string> = {
  time: 'Bob took too long, so this Build was stopped.',
  turns: 'Bob ran out of steps before finishing, so this Build was stopped.',
  unreachable: "Bob couldn't be reached. Check your connection and try again.",
  broken: "Bob's answer came back broken, so this Build was stopped.",
}
export interface BuildRun {
  n: number; state: 'running' | 'done' | 'failed'
  chips: { id: string; name: string; category: Category }[]
  lit: string[]; loose: number; skipped: string[]; reason?: FailReason
}

const run = createStore<BuildRun | undefined>(undefined)
export const useBuild = () => run.use()
export const getBuild = () => run.get()

export function requestBlocks(p: Pick<Project, 'blocks'>, top: Block): Block[] {
  const out: Block[] = []
  const walk = (b: Block) => {
    if (!b.locked || b.traits.length || b.note.trim()) out.push(b)
    for (const id of b.children) if (p.blocks[id]) walk(p.blocks[id])
  }
  walk(top)
  return out
}

export function nothingNew(p: Project): boolean {
  const top = topBlock(p)
  return top?.type === 'checkpoint' && !requestBlocks(p, top).length
}

export function buildProblem(p: Project): string | null {
  const doc = instructionDocument(p)
  return 'error' in doc ? doc.error : null
}

// The button is only disabled once `start` arrives, so a second press before that must do nothing.
let busy = false

export async function runBuild(): Promise<string | undefined> {
  if (busy) return
  busy = true
  try {
    return await build()
  } finally {
    busy = false
  }
}

async function build(): Promise<string | undefined> {
  const p = getProject()
  const doc = instructionDocument(p)
  if ('error' in doc) return
  const top = topBlock(p)!
  const saved = await listCheckpoints(p.id).catch(() => [])
  const n = saved.filter(c => c.blocks).length + 1
  const chips = requestBlocks(p, top).map(b => ({ id: b.id, ...blockInfo(b.id, p, [])! }))
  const set = (patch: Partial<BuildRun>) => run.set({ ...run.get()!, ...patch })
  let begun = false
  const begin = () => {
    if (begun) return
    begun = true
    run.set({ n, state: 'running', chips, lit: [], loose: p.blocks.canvas.children.length - 1, skipped: doc.skipped })
    setStep('build')
  }

  for await (const e of runAgent({ kind: 'build', document: doc.document, files: p.files })) {
    if (e.type === 'limit') return e.message
    if (e.type === 'text') continue
    begin()
    if (e.type === 'block') set({ lit: [...run.get()!.lit, e.id] })
    if (e.type === 'error') {
      set({ state: 'failed', reason: e.reason })
      return
    }
    if (e.type === 'files') {
      const number = saved.length + 1
      const after = { ...e.files, ['.builds/build-' + n + '.md']: doc.document }
      await addCheckpoint({
        projectId: p.id, number, label: 'Checkpoint ' + number,
        from: top.type === 'site' ? null : p.checkpoint ?? saved.at(-1)?.number ?? null,
        before: p.files, after, blocks: builtBlocks(p, top.id), time: Date.now(),
      }).catch(err => console.error('Saving the Checkpoint failed', err))
      updateProject(d => consume(d, top.id, after, number), null)
      set({ state: 'done' })
      flashBlocks(run.get()!.lit)
      setTimeout(() => setStep('try'), 900)
      return
    }
  }
}

export function builtBlocks(p: Project, top: string): BuiltBlocks {
  return cloneBlocks(p, [top])
}

export function consume(p: Project, topId: string, files: Files, checkpoint: number): void {
  const top = p.blocks[topId]
  const pages = new Map(top.children.map(id => p.blocks[id]).filter(b => b?.type === 'page' && b.file).map(b => [b.file!, b]))
  const html = Object.keys(files).filter(f => f.endsWith('.html'))
  const order = [...[...pages.keys()].filter(f => html.includes(f)), ...html.filter(f => !pages.has(f))]

  const drop = (id: string) => {
    const b = p.blocks[id]
    if (!b) return void delete p.traits[id]
    b.traits.forEach(drop)
    b.children.forEach(drop)
    delete p.blocks[id]
  }
  top.traits.forEach(drop)
  top.children.forEach(drop)

  const children = order.map(file => {
    const old = pages.get(file)
    const id = old?.id ?? addBlock(p, 'page')
    p.blocks[id] = { id, type: 'page', name: old?.name ?? pageName(file), note: '', traits: [], children: [], file, locked: true }
    return id
  })
  p.blocks[topId] = { id: topId, type: 'checkpoint', name: top.name, note: '', traits: [], children, locked: true, pos: top.pos }
  p.files = files
  p.checkpoint = checkpoint
}

export function pageName(file: string): string {
  const s = file.replace(/\.html$/, '').split('/').pop()!.replace(/[-_]+/g, ' ').trim()
  return !s || s === 'index' ? 'Home' : s[0].toUpperCase() + s.slice(1)
}
