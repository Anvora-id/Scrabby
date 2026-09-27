import type { Category } from './model/catalogue.ts'
import type { Block, Files, Project } from './model/types.ts'
import { addBlock, holding, makeCheckpoint, nextNumber } from './model/project.ts'
import { instructionDocument } from './instructions/document.ts'
import { topBlock } from './instructions/warnings.ts'
import { blockInfo } from './code/code.ts'
import { addCheckpoint, listCheckpoints } from './db.ts'
import { runAgent } from './agent.ts'
import { flashBlocks } from './preview.ts'
import { createStore, getProject, setStep, updateProject } from './store.ts'

export type FailReason = 'time' | 'turns' | 'unreachable' | 'broken' | 'save' | 'limit' | 'start'
export const FAILURE_LINES: Record<FailReason, string> = {
  time: 'Bob took too long, so this Build was stopped.',
  turns: 'Bob ran out of steps before finishing, so this Build was stopped.',
  unreachable: "Bob couldn't be reached. Check your connection and try again.",
  broken: "Bob's answer came back broken, so this Build was stopped.",
  save: "The Checkpoint couldn't be saved on this computer, so this Build didn't start.",
  limit: "Scrabby's Build limit was reached, so this Build didn't start.",
  start: "Something went wrong before Bob could start, so this Build didn't start.",
}
export interface BuildRun {
  n: number; state: 'running' | 'done' | 'failed'
  chips: { id: string; name: string; category: Category }[]
  lit: string[]; loose: number; skipped: string[]; reason?: FailReason
  message?: string // shown instead of the failure line: a `limit`'s words, or why a Build didn't start
}

const run = createStore<BuildRun | undefined>(undefined)
export const useBuild = () => run.use()
export const getBuild = () => run.get()

// A chip lights once Bob has written its HTML; he stays on the newest one until the next lights, so the ones before it are done.
export function progress(r: BuildRun): { done: Set<string>; working?: string } {
  const ids = new Set(r.chips.map(c => c.id))
  if (r.state === 'done') return { done: ids }
  if (r.state === 'failed') return { done: new Set() }
  const lit = [...new Set(r.lit)].filter(id => ids.has(id))
  return { done: new Set(lit.slice(0, -1)), working: lit.at(-1) }
}

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

// From a press until `start`, the Build buttons show "Starting…" and can't be pressed.
const starting = createStore(false)
export const useStarting = () => starting.use()

// Bob must answer `start` this soon after a press, or the Build did not start.
const START_MS = 15_000

// A second press while a Build starts or runs does nothing (the buttons are disabled meanwhile).
let busy = false

export async function runBuild(): Promise<void> {
  if (busy) return
  busy = true
  starting.set(true)
  try {
    await build()
  } finally {
    busy = false
    starting.set(false)
  }
}

async function build(): Promise<void> {
  const p = getProject()
  const stop = new AbortController()
  const timer = setTimeout(() => stop.abort(), START_MS)
  let base: Omit<BuildRun, 'state'> = { n: 0, chips: [], lit: [], loose: p.blocks.canvas.children.length - 1, skipped: [] }
  const set = (patch: Partial<BuildRun>) => run.set({ ...run.get()!, ...patch })
  let begun = false
  const begin = () => {
    if (begun) return
    begun = true
    clearTimeout(timer)
    starting.set(false)
    run.set({ ...base, state: 'running' })
    setStep('build')
  }
  // Every way out before Bob starts ends on a failed card, never in silence.
  const notStarted = (message?: string) => {
    begin()
    set({ state: 'failed', reason: 'start', message })
  }

  const ready = await (async () => {
    const doc = instructionDocument(p)
    if ('error' in doc) return doc.error
    const top = topBlock(p)!
    // The same deadline covers a Checkpoint read that never settles.
    const saved = await Promise.race([
      listCheckpoints(p.id).catch(() => []),
      new Promise<never>((_, fail) => stop.signal.addEventListener('abort', () => fail(new Error('Reading the Checkpoints took too long')))),
    ])
    const chips = requestBlocks(p, top).map(b => ({ id: b.id, ...blockInfo(b.id, p, [])! }))
    // Nothing changed since a Checkpoint (a Try again, say): build from that one instead of saving a copy.
    const held = holding(p, saved)
    const from = held ?? makeCheckpoint(p, nextNumber(saved))
    base = { ...base, n: saved.filter(c => !c.saved && c.number < from.number).length + 1, chips, skipped: doc.skipped }
    return { doc, top, from, fresh: !held }
  })().catch((e: unknown) => {
    console.error('The Build failed to start', e)
    return undefined
  })
  if (typeof ready !== 'object') return notStarted(ready)
  const { doc, top, from, fresh } = ready
  const { n } = base

  // Saved before Bob starts, so a Build can always be undone by restoring it. It stays when the Build fails.
  if (fresh) {
    try {
      await addCheckpoint(from)
    } catch (err) {
      console.error('Saving the Checkpoint failed', err)
      begin()
      set({ state: 'failed', reason: 'save' })
      return
    }
  }

  // A throw while Bob's answer is read or taken in (a browser without TextDecoderStream, say) still ends on a card.
  try {
    for await (const e of runAgent({ kind: 'build', document: doc.document, files: p.files }, stop.signal)) {
      if (e.type === 'text') continue
      if (e.type === 'error' && !begun) return notStarted(FAILURE_LINES[e.reason])
      begin()
      // A limit shows on the Build step, where it stays until the next press (a bubble closed on the next click).
      if (e.type === 'limit') {
        set({ state: 'failed', reason: 'limit', message: e.message })
        return
      }
      if (e.type === 'block') set({ lit: [...run.get()!.lit, e.id] })
      if (e.type === 'error') {
        set({ state: 'failed', reason: e.reason })
        return
      }
      if (e.type === 'files') {
        const after = guardImages({ ...e.files, ['.builds/build-' + n + '.md']: doc.document })
        updateProject(d => consume(d, top.id, after, from.number), null)
        set({ state: 'done' })
        flashBlocks(run.get()!.lit)
        setTimeout(() => setStep('try'), 900)
        return
      }
    }
  } catch (err) {
    console.error('The Build failed', err)
    if (!begun) return notStarted()
    set({ state: 'failed', reason: 'broken' })
    return
  }
  if (!begun) notStarted(FAILURE_LINES.unreachable)
}

const GUARD = '/* Pictures and videos never grow wider than their box */\nimg, video { max-width: 100%; height: auto; }'
// Only a live rule that starts at the top level counts: not one in a comment, in @media, or behind another selector.
// base.css's `img, video, svg` rule counts too. The `,` before svg keeps the spaces around it from overlapping.
// ponytail: a rule after another rule inside @media still counts; a CSS parser if that ever matters
const GUARDED = /(?:^|[;}])\s*img\s*,\s*video\s*(?:,\s*svg\s*)?\{[^{}]*max-width\s*:\s*100%/
// @charset and @import must come first, or the browser drops them (and the site's fonts with them).
// Bob writes style.css, so the tokens never overlap: a quoted string or a (…) group is one token, and the rest can't start one.
const LEADING = /^(?:(?:\s|\/\*[\s\S]*?\*\/)*@(?:charset|import)\b(?:"[^"]*"|'[^']*'|\([^)]*\)|[^;"'(])*;)*/
// An unclosed comment runs to the end of the file, as it does in CSS.
const COMMENTS = /\/\*[\s\S]*?(?:\*\/|$)/g

const guarded = (css: string | undefined) => css !== undefined && GUARDED.test(css.replace(COMMENTS, ''))

// Pictures never break a page's layout. base.css holds the rule since Build 1 gets it; this backs up
// sites built before base.css, or a base.css that lost the rule.
export function guardImages(files: Files): Files {
  const css = files['style.css']
  if (css === undefined || guarded(css) || guarded(files['base.css'])) return files
  const lead = css.match(LEADING)![0]
  return { ...files, 'style.css': (lead ? lead + '\n\n' : '') + GUARD + '\n\n' + css.slice(lead.length).replace(/^\s+/, '') }
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
