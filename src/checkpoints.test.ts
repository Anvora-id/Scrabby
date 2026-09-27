import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Checkpoint, Project } from './model/types.ts'
import { applyChange, emptyProject, holding } from './model/project.ts'
import { builtSite } from './fixtures/fixtures.ts'
import { topBlock } from './instructions/warnings.ts'
import { getProject, setProject } from './store.ts'
import { applyRestore, buildOf, checkpointTitle, fromTag, gist, renameCheckpoint, restoreCheckpoint, saveCheckpoint, warning, withNames } from './checkpoints.ts'

const fake = vi.hoisted(() => ({ saved: [] as Checkpoint[] }))
vi.mock('./db.ts', () => ({
  listCheckpoints: vi.fn(async () => [...fake.saved]),
  addCheckpoint: vi.fn(async (c: Checkpoint) => { fake.saved.push(c) }),
  saveProject: vi.fn(async () => {}),
  loadLatestProject: vi.fn(async () => undefined),
}))

let p: Project
let cp1: Checkpoint
let cp2: Checkpoint
beforeEach(() => {
  const site = builtSite()
  p = site.project
  ;[cp1, cp2] = site.checkpoints
  fake.saved = [...site.checkpoints]
})

const restore = (c: Checkpoint) => applyChange(p, d => applyRestore(d, c))
const named = (q: Pick<Project, 'blocks'>, name: string) => Object.values(q.blocks).find(b => b.name === name)!
const handEdit = (q: Project) => { q.files = { ...q.files, 'style.css': q.files['style.css'] + '\nh1 { color: red; }\n' } }

describe('applyRestore', () => {
  it('brings back the code and Canvas from before Build 2, and keeps the name and chat', () => {
    p.chat = [{ role: 'user', text: 'Hi', time: 1 }]
    const q = restore(cp2)
    expect(q.files).toEqual(cp2.files)
    expect(q.checkpoint).toBe(2)
    expect(q.name).toBe(p.name)
    expect(q.chat).toEqual(p.chat)
    const top = topBlock(q)!
    expect(top.type).toBe('checkpoint')
    const hours = named(q, 'Opening hours')
    expect(q.blocks[top.children[0]].children).toEqual([hours.id])
    expect(hours.locked).toBeUndefined()
    expect(holding(q, [cp1, cp2])).toBe(cp2)
  })

  it('on Checkpoint 1 clears the code and brings the Site back', () => {
    const q = restore(cp1)
    expect(q.files).toEqual({})
    expect(q.checkpoint).toBe(1)
    const site = topBlock(q)!
    expect(site.type).toBe('site')
    expect(site.children.map(id => q.blocks[id].name)).toEqual(['Home', 'Menu', 'Quiz'])
    expect(site.children.some(id => q.blocks[id].locked)).toBe(false)
  })
})

describe('holding', () => {
  it('counts code, Blocks and positions as changes', () => {
    const q = restore(cp2)
    expect(holding(q, [cp1, cp2])).toBe(cp2)
    handEdit(q)
    expect(holding(q, [cp1, cp2])).toBeUndefined()
    const r = restore(cp2)
    r.blocks[topBlock(r)!.id].pos = { x: 99, y: 99 }
    expect(holding(r, [cp1, cp2])).toBeUndefined()
  })
})

describe('saveCheckpoint and restoreCheckpoint', () => {
  it('Save Checkpoint saves the Project as "Saved by you" and puts it there', async () => {
    setProject(p)
    expect(await saveCheckpoint()).toBe(3)
    expect(fake.saved[2]).toMatchObject({ number: 3, saved: 'Saved by you', from: 2, files: p.files })
    expect(getProject().checkpoint).toBe(3)
    expect(holding(getProject(), fake.saved)).toBe(fake.saved[2])
  })

  it('Save and restore saves the changes once, then restores', async () => {
    handEdit(p)
    setProject(p)
    const edited = p.files
    await restoreCheckpoint(1, true)
    expect(fake.saved).toHaveLength(3)
    expect(fake.saved[2]).toMatchObject({ number: 3, saved: 'Saved before restoring Checkpoint 1', from: 2, files: edited })
    expect(getProject().files).toEqual({})
    expect(getProject().checkpoint).toBe(1)
    await restoreCheckpoint(3, true)
    expect(getProject().files).toEqual(edited)
    await restoreCheckpoint(1, true)
    expect(fake.saved).toHaveLength(3)
  })

  it('Restore without saving saves nothing', async () => {
    handEdit(p)
    setProject(p)
    await restoreCheckpoint(2, false)
    expect(fake.saved).toHaveLength(2)
    expect(getProject().files).toEqual(cp2.files)
  })
})

describe('gist, fromTag, buildOf', () => {
  const saved: Checkpoint = { projectId: 'x', number: 3, saved: 'Saved before restoring Checkpoint 1', from: 2, files: {}, canvas: { blocks: {}, traits: {}, defs: {}, assets: [] }, time: 0 }

  it('gist', () => {
    expect(gist(cp1, p)).toBe('Before Build: the whole site.')
    expect(gist(cp2, p)).toBe('Before Build: adds Opening hours.')
    expect(gist(saved, p)).toBe('Saved before restoring Checkpoint 1.')
    expect(gist(saved, { checkpointNames: { 1: 'First try' } })).toBe('Saved before restoring Checkpoint 1 · First try.')
  })

  it('fromTag', () => {
    expect(fromTag(cp1, p)).toBeNull()
    expect(fromTag(cp2, p)).toBeNull()
    expect(fromTag(saved, p)).toBeNull()
    expect(fromTag({ ...cp2, number: 4, from: 1 }, p)).toBe('from Checkpoint 1')
    expect(fromTag({ ...cp2, number: 4, from: 1 }, { checkpointNames: { 1: 'First try' } })).toBe('from Checkpoint 1 · First try')
  })

  it('buildOf', () => {
    const cps = [cp1, cp2]
    const hours = named(cp2.canvas, 'Opening hours').id
    const hero = Object.values(cp1.canvas.blocks).find(b => b.type === 'hero')!.id
    const home = topBlock(p)!.children[0]
    expect(buildOf(hours, p, cps)?.number).toBe(2)
    expect(buildOf(hero, p, cps)?.number).toBe(1)
    expect(buildOf(home, p, cps)?.number).toBe(1)
    expect(buildOf(hours, { ...p, checkpoint: 1 }, cps)?.number).toBe(2)
    expect(buildOf('b999', p, cps)).toBeUndefined()
  })
})

describe('warning', () => {
  it('asks to save changes that are not in a Checkpoint', () => {
    expect(warning(p, [cp1, cp2], cp1)).toEqual({
      title: 'Restore Checkpoint 1?',
      lines: ['Your Blocks and code go back to how they were at Checkpoint 1.', 'You have changes that are not in a Checkpoint.'],
      unsaved: true,
    })
  })

  it('does not ask when the Project is already in a Checkpoint, and names the Checkpoint', () => {
    const q = restore(cp2)
    renameCheckpoint(q, 1, 'First try')
    expect(warning(q, [cp1, cp2], cp1)).toEqual({
      title: 'Restore Checkpoint 1 · First try?',
      lines: ['Your Blocks and code go back to how they were at Checkpoint 1 · First try.'],
      unsaved: false,
    })
  })

  it('warns that a pending Assistant proposal will be dropped', () => {
    p.chat = [{ role: 'bob', text: 'Done.', time: 1, proposal: { summary: 'Blue title.', files: { 'style.css': { base: p.files['style.css'], proposed: 'h1 { color: blue; }' } }, total: 1, accepted: 0, decided: 0 } }]
    expect(warning(p, [cp1, cp2], cp1).lines.at(-1)).toBe("The Assistant's unaccepted changes will be dropped.")
  })
})

describe('Checkpoint names', () => {
  it('checkpointTitle adds the name after the number', () => {
    expect(checkpointTitle({}, 3)).toBe('Checkpoint 3')
    expect(checkpointTitle({ checkpointNames: { 3: 'Menu page' } }, 3)).toBe('Checkpoint 3 · Menu page')
  })

  it('renameCheckpoint trims, caps at 40 characters and removes a blank name', () => {
    const q = emptyProject()
    renameCheckpoint(q, 2, '  Menu page ')
    expect(q.checkpointNames).toEqual({ 2: 'Menu page' })
    renameCheckpoint(q, 2, 'x'.repeat(50))
    expect(q.checkpointNames![2]).toHaveLength(40)
    renameCheckpoint(q, 2, '   ')
    expect(q.checkpointNames).toEqual({})
  })

  it('withNames names every Checkpoint number in a saved text, once', () => {
    const names = { checkpointNames: { 2: 'Menu page', 3: 'Like Checkpoint 2' } }
    expect(withNames(names, 'Code went back to Checkpoint 2')).toBe('Code went back to Checkpoint 2 · Menu page')
    expect(withNames(names, 'Saved before restoring Checkpoint 3')).toBe('Saved before restoring Checkpoint 3 · Like Checkpoint 2')
    expect(withNames(names, 'Code went back to Checkpoint 12')).toBe('Code went back to Checkpoint 12')
    expect(withNames(names, 'Open Checkpoints')).toBe('Open Checkpoints')
  })
})
