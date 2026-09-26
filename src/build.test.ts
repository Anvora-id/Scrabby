import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentEvent, AgentRequest } from './agent.ts'
import type { Checkpoint, Project } from './model/types.ts'
import { addBlock, addTrait } from './model/project.ts'
import { builtSite, demoProject } from './fixtures/fixtures.ts'
import { instructionDocument } from './instructions/document.ts'
import { flashBlocks } from './preview.ts'
import { getProject, getUi, setProject, setStep } from './store.ts'
import { getBuild, nothingNew, pageName, runBuild } from './build.ts'

const fake = vi.hoisted(() => ({ saved: [] as Checkpoint[], events: [] as AgentEvent[], requests: [] as AgentRequest[] }))
vi.mock('./db.ts', () => ({
  listCheckpoints: vi.fn(async () => [...fake.saved]),
  addCheckpoint: vi.fn(async (c: Checkpoint) => { fake.saved.push(c) }),
  saveProject: vi.fn(async () => {}),
  loadLatestProject: vi.fn(async () => undefined),
}))
vi.mock('./agent.ts', () => ({
  runAgent: vi.fn(async function* (req: AgentRequest) {
    fake.requests.push(req)
    yield* fake.events
  }),
}))
vi.mock('./preview.ts', () => ({ flashBlocks: vi.fn() }))

function start(p: Project, saved: Checkpoint[], events: AgentEvent[]) {
  setProject(p)
  setStep('plan')
  fake.saved = [...saved]
  fake.events = events
  fake.requests = []
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('runBuild', () => {
  it('Build 1 saves Checkpoint 1 and turns the Site into the Checkpoint Block', async () => {
    const p = demoProject()
    const loose = addBlock(p, 'section', 'Idea')
    p.blocks[loose].pos = { x: 600, y: 40 }
    p.blocks.canvas.children.push(loose)
    const site = p.blocks.canvas.children[0]
    const pages = [...p.blocks[site].children]
    const v1 = builtSite().checkpoints[0].after
    const doc = instructionDocument(p) as { document: string }
    start(p, [], [{ type: 'start' }, { type: 'block', id: pages[0] }, { type: 'block', id: pages[0] }, { type: 'files', files: v1 }])

    expect(await runBuild()).toBeUndefined()

    expect(fake.requests).toEqual([{ kind: 'build', document: doc.document, files: {} }])
    expect(fake.saved).toHaveLength(1)
    expect(fake.saved[0]).toMatchObject({ number: 1, label: 'Checkpoint 1', from: null, before: {} })
    expect(fake.saved[0].after['.builds/build-1.md']).toBe(doc.document)
    expect(fake.saved[0].blocks?.top).toEqual([site])

    const q = getProject()
    expect(q.blocks[site]).toMatchObject({ type: 'checkpoint', locked: true, name: "Maya's bake sale", children: pages, traits: [] })
    expect(pages.map(id => q.blocks[id])).toMatchObject([
      { type: 'page', name: 'Home', file: 'index.html', locked: true, children: [], traits: [] },
      { type: 'page', name: 'Menu', file: 'menu.html', locked: true },
      { type: 'page', name: 'Quiz', file: 'quiz.html', locked: true },
    ])
    expect(q.blocks.canvas.children).toContain(loose)
    expect(q.blocks[loose]).toBeDefined()
    expect(q.checkpoint).toBe(1)
    expect(q.files['style.css']).toBe(v1['style.css'])

    expect(getBuild()).toMatchObject({ n: 1, state: 'done', loose: 1, lit: [pages[0], pages[0]] })
    expect(flashBlocks).toHaveBeenLastCalledWith([pages[0], pages[0]])
    expect(getUi().step).toBe('build')
    vi.advanceTimersByTime(899)
    expect(getUi().step).toBe('build')
    vi.advanceTimersByTime(1)
    expect(getUi().step).toBe('try')
  })

  it('a limit changes nothing, stays on Plan and returns the message', async () => {
    const before = getBuild()
    start(demoProject(), [], [{ type: 'limit', message: "You've used this hour's 10 Builds. Try again in 5 minutes." }])
    const p = getProject()

    expect(await runBuild()).toBe("You've used this hour's 10 Builds. Try again in 5 minutes.")
    expect(getProject()).toBe(p)
    expect(getUi().step).toBe('plan')
    expect(getBuild()).toBe(before)
    expect(fake.saved).toHaveLength(0)
  })

  it('a failed Build changes nothing and stays on Build', async () => {
    const d = demoProject()
    const home = d.blocks[d.blocks.canvas.children[0]].children[0]
    start(d, [], [{ type: 'start' }, { type: 'block', id: home }, { type: 'error', reason: 'time' }])
    const p = getProject()

    expect(await runBuild()).toBeUndefined()
    expect(getProject()).toBe(p)
    expect(fake.saved).toHaveLength(0)
    expect(getBuild()).toMatchObject({ n: 1, state: 'failed', reason: 'time', lit: [home] })
    vi.advanceTimersByTime(2000)
    expect(getUi().step).toBe('build')
  })

  it('Build 3 on the built site keeps the hand edit and adds a Built page', async () => {
    const { project: p, checkpoints } = builtSite()
    const top = p.blocks.canvas.children[0]
    const [home] = p.blocks[top].children
    const section = addBlock(p, 'section', 'Contact')
    p.blocks[section].traits = [addTrait(p, 'text', 'Call us')]
    p.blocks[home].children.push(section)
    p.files['style.css'] += '\n/* my hand edit */\n'
    const files = { ...p.files, 'contact.html': '<p data-block="' + section + '">Call us</p>' }
    start(p, checkpoints, [{ type: 'start' }, { type: 'block', id: section }, { type: 'files', files }])

    await runBuild()

    expect(fake.requests[0].files['style.css']).toContain('/* my hand edit */')
    expect(fake.saved[2]).toMatchObject({ number: 3, label: 'Checkpoint 3', from: 2 })
    expect(fake.saved[2].after['.builds/build-3.md']).toBeDefined()
    const q = getProject()
    expect(q.files['style.css']).toContain('/* my hand edit */')
    expect(q.blocks[section]).toBeUndefined()
    expect(q.blocks[home].children).toEqual([])
    const kids = q.blocks[top].children
    expect(kids).toHaveLength(4)
    expect(q.blocks[kids[3]]).toMatchObject({ type: 'page', name: 'Contact', file: 'contact.html', locked: true })
    expect(q.checkpoint).toBe(3)
    expect(getBuild()).toMatchObject({ n: 3, state: 'done' })
  })
})

describe('nothingNew', () => {
  it('is true only on a Checkpoint Block with nothing new', () => {
    const { project } = builtSite()
    expect(nothingNew(project)).toBe(true)
    expect(nothingNew(demoProject())).toBe(false)
    const home = project.blocks[project.blocks.canvas.children[0]].children[0]
    project.blocks[home].children.push(addBlock(project, 'section'))
    expect(nothingNew(project)).toBe(false)
  })
})

describe('pageName', () => {
  it('names a page from its file', () => {
    expect(pageName('contact-us.html')).toBe('Contact us')
    expect(pageName('index.html')).toBe('Home')
    expect(pageName('shop/big__sale.html')).toBe('Big sale')
  })
})
