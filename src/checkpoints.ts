import type { Block, BuiltBlocks, Checkpoint, Files, Project } from './model/types.ts'
import { mapLayout } from './model/project.ts'
import { topBlock } from './instructions/warnings.ts'
import { dropItem, removeItem } from './canvas/tree.ts'
import { consume, requestBlocks } from './build.ts'
import { addCheckpoint, listCheckpoints } from './db.ts'
import { dropPending, hasPending } from './assistant.ts'
import { flashBlocks } from './preview.ts'
import { getProject, updateProject } from './store.ts'

export type LoadMode = 'goBack' | 'edit'

export function sameFiles(a: Files, b: Files): boolean {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every(k => k in b && a[k] === b[k])
}

export function holding(files: Files, cps: Checkpoint[]): Checkpoint | undefined {
  return cps.find(c => sameFiles(c.after, files) || sameFiles(c.before, files))
}

export function needsSave(files: Files, cps: Checkpoint[]): boolean {
  return Object.keys(files).length > 0 && !holding(files, cps)
}

// Locked Blocks are built; the first unlocked Block or Trait on each path is an unbuilt item.
export function unbuilt(p: Project): string[] {
  const top = topBlock(p)
  const out: string[] = []
  const walk = (b: Block) => {
    out.push(...b.traits)
    for (const id of b.children) {
      if (p.blocks[id]?.locked) walk(p.blocks[id])
      else out.push(id)
    }
  }
  if (top) walk(top)
  return out
}

export function applyLoad(p: Project, c: Checkpoint, mode: LoadMode): void {
  const top = topBlock(p)
  if (!top) return
  const at = top.pos ?? { x: 40, y: 40 }
  unbuilt(p).forEach((id, i) => {
    dropItem(p, { kind: p.blocks[id] ? 'block' : 'trait', id }, { id: 'canvas', pos: { x: at.x + 760, y: at.y + i * 70 } })
  })

  if (mode === 'goBack') {
    const files = new Set(top.children.map(id => p.blocks[id]?.file))
    for (const b of Object.values(c.blocks?.blocks ?? {})) {
      if (b.type !== 'page' || !b.file || p.blocks[b.id] || files.has(b.file)) continue
      p.blocks[b.id] = { id: b.id, type: 'page', name: b.name, note: '', traits: [], children: [], file: b.file, locked: true }
      top.children.push(b.id)
    }
    consume(p, top.id, structuredClone(c.after), c.number)
    return
  }

  const canvas = p.blocks.canvas
  const index = canvas.children.indexOf(top.id)
  removeItem(p, top.id)
  const id = restore(p, c.blocks!)
  p.blocks[id].pos = top.pos
  canvas.children.splice(index, 0, id)
  delete canvas.layout // rebuilt from `children` on the next repair
  p.files = c.from === null ? {} : structuredClone(c.before)
  if (c.from === null) delete p.checkpoint
  else p.checkpoint = c.from
}

function restore(p: Project, bb: BuiltBlocks): string {
  const ids = new Map<string, string>()
  const collect = (id: string) => {
    const b = bb.blocks[id]
    if (!b) return
    ids.set(id, p.blocks[id] ? `b${p.next.b++}` : id)
    for (const t of b.traits) if (bb.traits[t]) ids.set(t, p.traits[t] ? `t${p.next.t++}` : t)
    b.children.forEach(collect)
  }
  collect(bb.top[0])
  const to = (id: string) => ids.get(id) ?? id

  for (const [old, id] of ids) {
    const b = bb.blocks[old]
    if (b) {
      p.blocks[id] = { ...structuredClone(b), id, traits: b.traits.map(to), children: b.children.map(to) }
      if (b.layout) p.blocks[id].layout = mapLayout(b.layout, to)
      continue
    }
    const t = structuredClone(bb.traits[old])
    p.traits[id] = { ...t, id, value: t.type === 'onclick' ? t.value.replace(/^(page|popup):(.*)$/, (_, k, x) => `${k}:${to(x)}`) : t.value }
  }
  return to(bb.top[0])
}

export async function loadCheckpoint(number: number, mode: LoadMode): Promise<void> {
  const cps = await listCheckpoints(getProject().id)
  const c = cps.find(x => x.number === number)
  if (!c || (mode === 'edit' && !c.blocks)) return
  const p = getProject()
  if (needsSave(p.files, cps)) {
    await addCheckpoint({
      projectId: p.id, number: cps.length + 1, label: 'Before loading Checkpoint ' + number,
      from: p.checkpoint ?? null, before: p.files, after: p.files, blocks: null, time: Date.now(),
    })
  }
  updateProject(d => applyLoad(d, c, mode), null)
  if (hasPending(getProject())) dropPending('Code went back to Checkpoint ' + number)
  flashBlocks([])
}

export function warning(p: Project, cps: Checkpoint[], c: Checkpoint, mode: LoadMode): { title: string; lines: string[]; confirm: string } {
  const n = c.number
  const lines = [
    mode === 'goBack' ? `Your code goes back to how it was at Checkpoint ${n}.`
      : c.from === null ? `This remakes the website from scratch. Your code is cleared and the Blocks of Checkpoint ${n} come back so you can change them.`
      : `Your code goes back to how it was before Checkpoint ${n}'s Build, and its Blocks come back so you can change them.`,
    'The next Build may come out different.',
  ]
  if (needsSave(p.files, cps)) lines.push('Your current code, with your hand edits, is saved first as a new Checkpoint, so you can come back to it.')
  else if (Object.keys(p.files).length) lines.push(`Your current code is already saved as Checkpoint ${holding(p.files, cps)!.number}.`)
  if (unbuilt(p).length) lines.push('Blocks you have not built yet become loose ideas.')
  if (hasPending(p)) lines.push("The Assistant's unaccepted changes will be dropped.")
  return mode === 'goBack'
    ? { title: `Go back to Checkpoint ${n}?`, lines, confirm: 'Go back' }
    : { title: `Edit the Blocks of Checkpoint ${n}?`, lines, confirm: 'Edit its Blocks' }
}

export function gist(c: Checkpoint): string {
  const bb = c.blocks
  if (!bb) return `${c.label}: your code with its hand edits.`
  if (c.from === null) {
    const n = Object.keys(c.after).filter(f => f.endsWith('.html')).length
    return `Built the site: ${n} page${n === 1 ? '' : 's'}.`
  }
  const names: string[] = []
  const walk = (b: Block | undefined) => {
    if (!b) return
    if (!b.locked) return void names.push(b.name)
    if (b.traits.length || b.note.trim()) names.push(b.name)
    b.children.forEach(id => walk(bb.blocks[id]))
  }
  walk(bb.blocks[bb.top[0]])
  return `Added: ${names.join(', ') || 'changes'}.`
}

export function fromTag(c: Checkpoint): string | null {
  if (!c.blocks || c.number === 1) return null
  if (c.from === null) return 'remade from scratch'
  return c.from !== c.number - 1 ? `from Checkpoint ${c.from}` : null
}

export function buildOf(id: string, p: Project, cps: Checkpoint[]): Checkpoint | undefined {
  const made = (c: Checkpoint) => !!c.blocks && requestBlocks(c.blocks, c.blocks.blocks[c.blocks.top[0]]).some(b => b.id === id)
  const byNumber = new Map(cps.map(c => [c.number, c]))
  for (let c = byNumber.get(p.checkpoint ?? 0); c; c = c.from === null ? undefined : byNumber.get(c.from)) {
    if (made(c)) return c
  }
  return cps.filter(made).at(-1)
}
