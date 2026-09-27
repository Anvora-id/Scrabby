import type { Block, Checkpoint, Project } from './model/types.ts'
import { holding, makeCheckpoint, nextNumber } from './model/project.ts'
import { topBlock } from './instructions/warnings.ts'
import { requestBlocks } from './build.ts'
import { addCheckpoint, deleteCheckpoint, listCheckpoints } from './db.ts'
import { dropPending, hasPending } from './assistant.ts'
import { flashBlocks } from './preview.ts'
import { getProject, updateProject, updateProjectWithoutUndo } from './store.ts'

type Names = Pick<Project, 'checkpointNames'>

// "Checkpoint 3 · Menu page": the number never changes; the name is the user's and optional.
export function checkpointTitle(p: Names, n: number): string {
  const name = p.checkpointNames?.[n]
  return name ? `Checkpoint ${n} · ${name}` : `Checkpoint ${n}`
}

// Saved texts (chat lines, "Saved before restoring Checkpoint N") keep only the number; the name is added when shown, so renames reach them.
export function withNames(p: Names, text: string): string {
  return text.replace(/Checkpoint (\d+)/g, (_, n: string) => checkpointTitle(p, Number(n)))
}

export function renameCheckpoint(p: Project, n: number, name: string): void {
  const names = p.checkpointNames ??= {}
  const typed = name.trim().slice(0, 40)
  if (typed) names[n] = typed
  else delete names[n]
}

export async function saveCheckpoint(saved = 'Saved by you'): Promise<number> {
  const p = getProject()
  const number = nextNumber(await listCheckpoints(p.id))
  await addCheckpoint(makeCheckpoint(p, number, saved))
  updateProjectWithoutUndo(d => { d.checkpoint = number })
  return number
}

export function applyRestore(p: Project, c: Checkpoint): void {
  Object.assign(p, structuredClone({ files: c.files, ...c.canvas }))
  p.checkpoint = c.number
}

export async function restoreCheckpoint(number: number, save: boolean): Promise<void> {
  const cps = await listCheckpoints(getProject().id)
  const c = cps.find(x => x.number === number)
  if (!c) return
  if (save && !holding(getProject(), cps)) await saveCheckpoint('Saved before restoring Checkpoint ' + number)
  updateProject(d => applyRestore(d, c), null)
  if (hasPending(getProject())) dropPending('Code went back to Checkpoint ' + number)
  flashBlocks([])
}

export async function removeCheckpoint(number: number): Promise<void> {
  await deleteCheckpoint(getProject().id, number)
  // The save that follows also drops Library pictures only this Checkpoint held.
  updateProjectWithoutUndo(d => { delete d.checkpointNames?.[number] })
}

export function warning(p: Project, cps: Checkpoint[], c: Checkpoint): { title: string; lines: string[]; unsaved: boolean } {
  const t = checkpointTitle(p, c.number)
  const lines = [`Your Blocks and code go back to how they were at ${t}.`]
  const unsaved = !holding(p, cps)
  if (unsaved) lines.push('You have changes that are not in a Checkpoint.')
  if (hasPending(p)) lines.push("The Assistant's unaccepted changes will be dropped.")
  return { title: `Restore ${t}?`, lines, unsaved }
}

export function gist(c: Checkpoint, p: Names): string {
  if (c.saved) return withNames(p, c.saved) + '.'
  const top = topBlock(c.canvas)
  if (!top || top.type === 'site') return 'Before Build: the whole site.'
  const names: string[] = []
  const walk = (b: Block | undefined) => {
    if (!b) return
    if (!b.locked) return void names.push(b.name)
    if (b.traits.length || b.note.trim()) names.push(b.name)
    b.children.forEach(id => walk(c.canvas.blocks[id]))
  }
  walk(top)
  return `Before Build: adds ${names.join(', ') || 'changes'}.`
}

// A Checkpoint saved after a restore says where it came from.
export function fromTag(c: Checkpoint, p: Names): string | null {
  return c.from === undefined || c.from === c.number - 1 ? null : `from ${checkpointTitle(p, c.from)}`
}

export function buildOf(id: string, p: Project, cps: Checkpoint[]): Checkpoint | undefined {
  const made = (c: Checkpoint) => {
    const top = topBlock(c.canvas)
    return !!top && requestBlocks(c.canvas, top).some(b => b.id === id)
  }
  const byNumber = new Map(cps.map(c => [c.number, c]))
  for (let c = byNumber.get(p.checkpoint ?? 0); c; c = c.from === undefined ? undefined : byNumber.get(c.from)) {
    if (made(c)) return c
  }
  return cps.filter(made).at(-1)
}
