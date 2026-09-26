import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Checkpoint, Project } from './model/types.ts'
import { addBlock, addTrait, applyChange, emptyProject } from './model/project.ts'
import { builtSite } from './fixtures/fixtures.ts'
import { topBlock } from './instructions/warnings.ts'
import { getProject, setProject } from './store.ts'
import { applyLoad, buildOf, checkpointTitle, fromTag, gist, loadCheckpoint, renameCheckpoint, warning, withNames } from './checkpoints.ts'

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

const load = (c: Checkpoint, mode: 'goBack' | 'edit') => applyChange(p, d => applyLoad(d, c, mode))
const named = (q: Project, name: string) => Object.values(q.blocks).find(b => b.name === name)!
const handEdit = (q: Project) => { q.files = { ...q.files, 'style.css': q.files['style.css'] + '\nh1 { color: red; }\n' } }

describe('Go back to this', () => {
  it('brings back the code and keeps the Checkpoint Block and its Built page ids', () => {
    const top = topBlock(p)!
    const q = load(cp1, 'goBack')
    expect(q.files).toEqual(cp1.after)
    expect(q.checkpoint).toBe(1)
    const nt = topBlock(q)!
    expect(nt).toMatchObject({ id: top.id, type: 'checkpoint', locked: true, pos: top.pos })
    expect(nt.children).toEqual(top.children)
    expect(nt.children.every(id => q.blocks[id].locked)).toBe(true)
  })

  it('turns unbuilt Blocks and Traits into loose ideas and leaves the Library and definitions alone', () => {
    const top = topBlock(p)!
    const home = top.children[0]
    const idea = addBlock(p, 'section', 'Idea')
    p.blocks[home].children.push(idea)
    const vibe = addTrait(p, 'vibe', 'calm')
    top.traits.push(vibe)
    const q = load(cp1, 'goBack')
    expect(q.blocks.canvas.children).toContain(idea)
    expect(q.traits[vibe].pos).toEqual({ x: 800, y: 40 })
    expect(q.blocks[idea].pos).toEqual({ x: 800, y: 110 })
    expect(q.blocks[home].children).toEqual([])
    expect(q.assets).toEqual(p.assets)
    expect(q.defs).toEqual(p.defs)
  })
})

describe('loadCheckpoint', () => {
  it('saves hand edits once as "Before loading Checkpoint 1"', async () => {
    handEdit(p)
    setProject(p)
    const edited = p.files
    await loadCheckpoint(1, 'goBack')
    expect(fake.saved).toHaveLength(3)
    expect(fake.saved[2]).toMatchObject({ number: 3, label: 'Before loading Checkpoint 1', from: 2, before: edited, after: edited, blocks: null })
    expect(getProject().files).toEqual(cp1.after)
    await loadCheckpoint(3, 'goBack')
    expect(getProject().files).toEqual(edited)
    await loadCheckpoint(1, 'goBack')
    expect(fake.saved).toHaveLength(3)
  })
})

describe('Edit its Blocks', () => {
  it('brings back the code before the Build and its request Blocks, unlocked', () => {
    const top = topBlock(p)!
    const q = load(cp2, 'edit')
    expect(q.files).toEqual(cp2.before)
    expect(q.checkpoint).toBe(1)
    const nt = topBlock(q)!
    expect(nt).toMatchObject({ id: top.id, type: 'checkpoint', pos: top.pos })
    expect(q.blocks.canvas.children.indexOf(nt.id)).toBe(p.blocks.canvas.children.indexOf(top.id))
    const hours = named(q, 'Opening hours')
    expect(q.blocks[nt.children[0]].children).toEqual([hours.id])
    expect(hours.locked).toBeUndefined()
    expect(q.traits[hours.traits[0]].value).toBe('Saturdays 9 till 1, at the school gate')
  })

  it('on Checkpoint 1 clears the code and brings the Site back', () => {
    const q = load(cp1, 'edit')
    expect(q.files).toEqual({})
    expect(q.checkpoint).toBeUndefined()
    const site = topBlock(q)!
    expect(site.type).toBe('site')
    expect(site.children.map(id => q.blocks[id].name)).toEqual(['Home', 'Menu', 'Quiz'])
    expect(site.children.some(id => q.blocks[id].locked)).toBe(false)
  })

  it('gives fresh ids to Blocks and Traits whose ids are taken, and maps "on click" to them', () => {
    const first = load(cp1, 'edit')
    const oldPopup = Object.values(first.blocks).find(b => b.type === 'popup')!.id
    p = first
    const q = load(cp1, 'edit')
    const site = topBlock(q)!
    // the first Site's Pages are loose ideas now and keep their ids
    for (const id of topBlock(first)!.children) expect(q.blocks[id].pos).toBeDefined()
    expect(site.children.some(id => topBlock(first)!.children.includes(id))).toBe(false)
    const home = q.blocks[site.children[0]]
    const inHome = (id: string): string[] => [id, ...q.blocks[id].children.flatMap(inHome)]
    const popup = inHome(home.id).map(id => q.blocks[id]).find(b => b.type === 'popup')!
    expect(popup.id).not.toBe(oldPopup)
    const onclick = inHome(home.id).flatMap(id => q.blocks[id].traits).map(t => q.traits[t]).find(t => t.value.startsWith('popup:'))!
    expect(onclick.value).toBe('popup:' + popup.id)
  })
})

describe('gist, fromTag, buildOf', () => {
  const saved: Checkpoint = { projectId: 'x', number: 3, label: 'Before loading Checkpoint 1', from: 2, before: {}, after: {}, blocks: null, time: 0 }

  it('gist', () => {
    expect(gist(cp1, p)).toBe('Built the site: 3 pages.')
    expect(gist(cp2, p)).toBe('Added: Opening hours.')
    expect(gist(saved, p)).toBe('Before loading Checkpoint 1: your code with its hand edits.')
    expect(gist(saved, { checkpointNames: { 1: 'First try' } })).toBe('Before loading Checkpoint 1 · First try: your code with its hand edits.')
  })

  it('fromTag', () => {
    expect(fromTag(cp1, p)).toBeNull()
    expect(fromTag(cp2, p)).toBeNull()
    expect(fromTag(saved, p)).toBeNull()
    expect(fromTag({ ...cp2, number: 4, from: 1 }, p)).toBe('from Checkpoint 1')
    expect(fromTag({ ...cp2, number: 4, from: 1 }, { checkpointNames: { 1: 'First try' } })).toBe('from Checkpoint 1 · First try')
    expect(fromTag({ ...cp2, number: 4, from: null }, p)).toBe('remade from scratch')
  })

  it('buildOf', () => {
    const cps = [cp1, cp2]
    const hours = named({ ...p, blocks: cp2.blocks!.blocks } as Project, 'Opening hours').id
    const hero = Object.values(cp1.blocks!.blocks).find(b => b.type === 'hero')!.id
    const home = topBlock(p)!.children[0]
    expect(buildOf(hours, p, cps)?.number).toBe(2)
    expect(buildOf(hero, p, cps)?.number).toBe(1)
    expect(buildOf(home, p, cps)?.number).toBe(1)
    expect(buildOf(hours, { ...p, checkpoint: 1 }, cps)?.number).toBe(2)
    expect(buildOf('b999', p, cps)).toBeUndefined()
  })
})

describe('warning', () => {
  it('Go back with the code already saved', () => {
    expect(warning(p, [cp1, cp2], cp1, 'goBack')).toEqual({
      title: 'Go back to Checkpoint 1?',
      lines: ['Your code goes back to how it was at Checkpoint 1.', 'The next Build may come out different.', 'Your current code is already saved as Checkpoint 2.'],
      confirm: 'Go back',
    })
  })

  it('Edit its Blocks with hand edits and unbuilt Blocks', () => {
    handEdit(p)
    p.blocks[topBlock(p)!.children[0]].children.push(addBlock(p, 'section', 'Idea'))
    expect(warning(p, [cp1, cp2], cp2, 'edit')).toEqual({
      title: 'Edit the Blocks of Checkpoint 2?',
      lines: [
        'Your code goes back to how it was before the Build of Checkpoint 2, and its Blocks come back so you can change them.',
        'The next Build may come out different.',
        'Your current code, with your hand edits, is saved first as a new Checkpoint, so you can come back to it.',
        'Blocks you have not built yet become loose ideas.',
      ],
      confirm: 'Edit its Blocks',
    })
    expect(warning(p, [cp1, cp2], cp1, 'edit').lines[0]).toBe('This remakes the website from scratch. Your code is cleared and the Blocks of Checkpoint 1 come back so you can change them.')
  })

  it('names the Checkpoints it mentions', () => {
    renameCheckpoint(p, 1, 'First try')
    renameCheckpoint(p, 2, 'Opening hours')
    expect(warning(p, [cp1, cp2], cp1, 'goBack')).toEqual({
      title: 'Go back to Checkpoint 1 · First try?',
      lines: ['Your code goes back to how it was at Checkpoint 1 · First try.', 'The next Build may come out different.', 'Your current code is already saved as Checkpoint 2 · Opening hours.'],
      confirm: 'Go back',
    })
  })

  it('warns that a pending Assistant proposal will be dropped', () => {
    p.chat = [{ role: 'bob', text: 'Done.', time: 1, proposal: { summary: 'Blue title.', files: { 'style.css': { base: p.files['style.css'], proposed: 'h1 { color: blue; }' } }, total: 1, accepted: 0, decided: 0 } }]
    expect(warning(p, [cp1, cp2], cp1, 'goBack').lines.at(-1)).toBe("The Assistant's unaccepted changes will be dropped.")
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
    expect(withNames(names, 'Before loading Checkpoint 3')).toBe('Before loading Checkpoint 3 · Like Checkpoint 2')
    expect(withNames(names, 'Code went back to Checkpoint 12')).toBe('Code went back to Checkpoint 12')
    expect(withNames(names, 'Open Checkpoints')).toBe('Open Checkpoints')
  })
})
