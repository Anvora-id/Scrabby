import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentEvent, AgentRequest } from './agent.ts'
import type { Checkpoint, Project } from './model/types.ts'
import { addBlock, addTrait, emptyProject } from './model/project.ts'
import { builtSite, demoProject } from './fixtures/fixtures.ts'
import { instructionDocument } from './instructions/document.ts'
import { flashBlocks } from './preview.ts'
import { addCheckpoint } from './db.ts'
import { getProject, getUi, setProject, setStep } from './store.ts'
import { getBuild, guardImages, nothingNew, pageName, progress, runBuild, type BuildRun } from './build.ts'

const fake = vi.hoisted(() => ({ saved: [] as Checkpoint[], events: [] as AgentEvent[], requests: [] as AgentRequest[], hang: '' as '' | 'db' | 'server' | 'throw' }))
vi.mock('./db.ts', () => ({
  listCheckpoints: vi.fn(() => fake.hang === 'db' ? new Promise(() => {}) : Promise.resolve([...fake.saved])),
  addCheckpoint: vi.fn(async (c: Checkpoint) => { fake.saved.push(c) }),
  saveProject: vi.fn(async () => {}),
  loadLatestProject: vi.fn(async () => undefined),
}))
vi.mock('./agent.ts', () => ({
  runAgent: vi.fn(async function* (req: AgentRequest, signal?: AbortSignal) {
    fake.requests.push(req)
    // A server that never answers: like fetch, give up with unreachable once the signal aborts.
    if (fake.hang === 'server') await new Promise(done => signal?.addEventListener('abort', done))
    yield* fake.events
    if (fake.hang === 'throw') throw new TypeError('TextDecoderStream is not defined')
  }),
}))
vi.mock('./preview.ts', () => ({ flashBlocks: vi.fn() }))

function start(p: Project, saved: Checkpoint[], events: AgentEvent[]) {
  setProject(p)
  setStep('plan')
  fake.saved = [...saved]
  fake.events = events
  fake.requests = []
  fake.hang = ''
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('runBuild', () => {
  it('Build 1 saves Checkpoint 1 before Bob starts and turns the Site into the Checkpoint Block', async () => {
    const p = demoProject()
    const loose = addBlock(p, 'section', 'Idea')
    p.blocks[loose].pos = { x: 600, y: 40 }
    p.blocks.canvas.children.push(loose)
    const site = p.blocks.canvas.children[0]
    const pages = [...p.blocks[site].children]
    const v1 = builtSite().checkpoints[1].files
    const doc = instructionDocument(p) as { document: string }
    start(p, [], [{ type: 'start' }, { type: 'block', id: pages[0] }, { type: 'block', id: pages[0] }, { type: 'files', files: v1 }])

    expect(await runBuild()).toBeUndefined()

    expect(fake.requests).toEqual([{ kind: 'build', document: doc.document, files: {} }])
    expect(fake.saved).toHaveLength(1)
    expect(fake.saved[0]).toMatchObject({ number: 1, files: {} })
    expect(fake.saved[0].from).toBeUndefined()
    expect(fake.saved[0].saved).toBeUndefined()
    expect(fake.saved[0].canvas.blocks[site]).toMatchObject({ type: 'site', children: pages })

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
    expect(q.files['style.css']).toBe(guardImages(v1)['style.css'])
    expect(q.files['.builds/build-1.md']).toBe(doc.document)

    expect(getBuild()).toMatchObject({ n: 1, state: 'done', loose: 1, lit: [pages[0], pages[0]] })
    expect(flashBlocks).toHaveBeenLastCalledWith([pages[0], pages[0]])
    expect(getUi().step).toBe('build')
    vi.advanceTimersByTime(899)
    expect(getUi().step).toBe('build')
    vi.advanceTimersByTime(1)
    expect(getUi().step).toBe('try')
  })

  it('a limit leaves the Project as it was and shows its message on a failed card on Build', async () => {
    start(demoProject(), [], [{ type: 'limit', message: "You've used this hour's 10 Builds. Try again in 5 minutes." }])
    const p = getProject()

    await runBuild()
    expect(getProject()).toBe(p)
    expect(getUi().step).toBe('build')
    expect(getBuild()).toMatchObject({ n: 1, state: 'failed', reason: 'limit', message: "You've used this hour's 10 Builds. Try again in 5 minutes." })
    expect(fake.saved).toHaveLength(1)
  })

  it('a plan problem on Try again shows a failed card with its words', async () => {
    start(emptyProject(), [], [{ type: 'start' }])
    await runBuild()
    expect(getUi().step).toBe('build')
    expect(getBuild()).toMatchObject({ n: 0, state: 'failed', reason: 'start', message: 'Add a Page inside your Site first.' })
    expect(fake.requests).toHaveLength(0)
  })

  it('no start within 15s shows a failed card with the unreachable line', async () => {
    start(demoProject(), [], [{ type: 'error', reason: 'unreachable' }])
    fake.hang = 'server'
    const done = runBuild()
    await vi.advanceTimersByTimeAsync(14_999)
    expect(getUi().step).toBe('plan')
    await vi.advanceTimersByTimeAsync(1)
    await done
    expect(getUi().step).toBe('build')
    expect(getBuild()).toMatchObject({ n: 1, state: 'failed', reason: 'start', message: "Bob couldn't be reached. Check your connection and try again." })
  })

  it('a Checkpoint read that never settles ends on a failed card after 15s', async () => {
    start(demoProject(), [], [{ type: 'start' }])
    fake.hang = 'db'
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const done = runBuild()
    await vi.advanceTimersByTimeAsync(15_000)
    await done
    expect(getBuild()).toMatchObject({ n: 0, state: 'failed', reason: 'start', message: undefined })
    expect(fake.requests).toHaveLength(0)
    expect(log).toHaveBeenCalledWith('The Build failed to start', expect.any(Error))
    log.mockRestore()
  })

  it('a throw while the answer is read ends on a failed card, before or after start', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    start(demoProject(), [], [])
    fake.hang = 'throw'
    await runBuild()
    expect(getBuild()).toMatchObject({ n: 1, state: 'failed', reason: 'start', message: undefined })
    start(demoProject(), [], [{ type: 'start' }])
    fake.hang = 'throw'
    await runBuild()
    expect(getBuild()).toMatchObject({ n: 1, state: 'failed', reason: 'broken' })
    expect(log).toHaveBeenCalledWith('The Build failed', expect.any(TypeError))
    log.mockRestore()
  })

  it('a failed Build leaves the Project as it was, keeps its Checkpoint and stays on Build', async () => {
    const d = demoProject()
    const home = d.blocks[d.blocks.canvas.children[0]].children[0]
    start(d, [], [{ type: 'start' }, { type: 'block', id: home }, { type: 'error', reason: 'time' }])
    const p = getProject()

    expect(await runBuild()).toBeUndefined()
    expect(getProject()).toBe(p)
    expect(fake.saved).toHaveLength(1)
    expect(getBuild()).toMatchObject({ n: 1, state: 'failed', reason: 'time', lit: [home] })
    vi.advanceTimersByTime(2000)
    expect(getUi().step).toBe('build')
  })

  it('Try again with nothing changed builds from the same Checkpoint', async () => {
    const d = demoProject()
    start(d, [], [{ type: 'start' }, { type: 'error', reason: 'time' }])
    await runBuild()
    fake.events = [{ type: 'start' }, { type: 'files', files: builtSite().checkpoints[1].files }]
    await runBuild()
    expect(fake.saved).toHaveLength(1)
    expect(getBuild()).toMatchObject({ n: 1, state: 'done' })
    expect(getProject().checkpoint).toBe(1)
  })

  it('a Checkpoint that fails to save stops the Build before Bob starts', async () => {
    start(demoProject(), [], [{ type: 'start' }, { type: 'files', files: builtSite().checkpoints[1].files }])
    const p = getProject()
    vi.mocked(addCheckpoint).mockRejectedValueOnce(new Error('QuotaExceededError'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await runBuild()).toBeUndefined()
    expect(getProject()).toBe(p)
    expect(getBuild()).toMatchObject({ n: 1, state: 'failed', reason: 'save' })
    expect(fake.requests).toHaveLength(0)
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
    expect(fake.saved[2]).toMatchObject({ number: 3, from: 2 })
    expect(fake.saved[2].files['style.css']).toContain('/* my hand edit */')
    expect(fake.saved[2].canvas.blocks[home].children).toEqual([section])
    const q = getProject()
    expect(q.files['.builds/build-3.md']).toBeDefined()
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

describe('progress', () => {
  const run = (state: BuildRun['state'], lit: string[]): BuildRun => ({
    n: 1, state, lit, loose: 0, skipped: [],
    chips: ['a', 'b', 'c'].map(id => ({ id, name: id, category: 'ui' as const })),
  })
  it('is on the newest lit chip, and the chips lit before it are done', () => {
    expect(progress(run('running', []))).toEqual({ done: new Set() })
    expect(progress(run('running', ['a', 'x', 'b', 'a']))).toEqual({ done: new Set(['a']), working: 'b' })
  })
  it('has every chip done on done and none on failed', () => {
    expect(progress(run('done', ['a']))).toEqual({ done: new Set(['a', 'b', 'c']) })
    expect(progress(run('failed', ['a', 'b']))).toEqual({ done: new Set() })
  })
})

describe('guardImages', () => {
  it('puts the image rule at the top of style.css once', () => {
    const files = guardImages({ 'index.html': '<p>', 'style.css': 'body { margin: 0; }' })
    expect(files['style.css']).toBe('/* Pictures and videos never grow wider than their box */\nimg, video { max-width: 100%; height: auto; }\n\nbody { margin: 0; }')
    expect(guardImages(files)).toBe(files)
  })
  it('leaves a guarded or missing style.css alone', () => {
    const guarded = { 'style.css': 'img, video {\n  max-width: 100%;\n  height: auto;\n}' }
    expect(guardImages(guarded)).toBe(guarded)
    const none = { 'index.html': '<p>' }
    expect(guardImages(none)).toBe(none)
    const compact = { 'style.css': 'body{margin:0}img,video{max-width:100%}' }
    expect(guardImages(compact)).toBe(compact)
    const withSvg = { 'style.css': 'img, video, svg { max-width: 100%; }' }
    expect(guardImages(withSvg)).toBe(withSvg)
  })
  it('leaves style.css alone when base.css has the rule, and adds it when base.css lost it', () => {
    // Read from disk: Vitest stubs CSS imports, even with ?raw.
    const files = { 'base.css': readFileSync('skills/base.css', 'utf8'), 'style.css': 'body { margin: 0; }' }
    expect(guardImages(files)).toBe(files)
    const lost = { 'base.css': 'body { margin: 0; }', 'style.css': 'body { margin: 0; }' }
    expect(guardImages(lost)['style.css']).toMatch(/^\/\* Pictures and videos never grow wider than their box \*\//)
  })
  it('adds the rule when the only one is commented out, inside @media or behind another selector', () => {
    for (const css of [
      '/* img, video { max-width: 100% } */\nbody { margin: 0; }',
      '@media (min-width: 600px) {\n  img, video { max-width: 100%; }\n}',
      '.gallery img, video { max-width: 100%; }',
    ]) expect(guardImages({ 'style.css': css })['style.css']).toMatch(/^\/\* Pictures and videos never grow wider than their box \*\//)
  })
  it('stays fast on style.css that would make a regex backtrack', () => {
    // process.hrtime, not performance.now: this file fakes the timers.
    const started = process.hrtime.bigint()
    for (const css of ['@import ' + 'url(a)'.repeat(40) + ' x', '/*' + ' x'.repeat(200_000), '/*'.repeat(100_000), ';img,video{'.repeat(20_000), ';img,video' + ' '.repeat(200_000)]) {
      expect(guardImages({ 'style.css': css })['style.css']).toContain('img, video { max-width: 100%; height: auto; }')
    }
    expect(Number(process.hrtime.bigint() - started) / 1e6).toBeLessThan(50)
  })
  it('puts the rule after a leading @charset or @import, and a Block mark stays on its rule', () => {
    const css = '@charset "utf-8";\n/* fonts */\n@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;900");\n@import url(https://x.test/a;b.css);\n/* block b1 */\nbody { margin: 0; }'
    expect(guardImages({ 'style.css': css })['style.css']).toBe(
      '@charset "utf-8";\n/* fonts */\n@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;900");\n@import url(https://x.test/a;b.css);\n\n' +
      '/* Pictures and videos never grow wider than their box */\nimg, video { max-width: 100%; height: auto; }\n\n/* block b1 */\nbody { margin: 0; }')
  })
})
