import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentEvent, AgentRequest } from './agent.ts'

vi.mock('./db.ts', () => ({
  loadLatestProject: vi.fn().mockResolvedValue(undefined),
  saveProject: vi.fn().mockResolvedValue(undefined),
  addCheckpoint: vi.fn().mockResolvedValue(undefined),
}))

let script: AgentEvent[] = []
let gate: Promise<void> = Promise.resolve()
const sent: AgentRequest[] = []
vi.mock('./agent.ts', () => ({
  runAgent: async function* (req: AgentRequest) {
    sent.push(req)
    for (const e of script) {
      await gate
      yield e
    }
  },
}))

import { addCheckpoint } from './db.ts'
import { emptyProject } from './model/project.ts'
import type { ChatMessage, Files, Project } from './model/types.ts'
import { clearHistory, getProject, setProject, undo, updateProject } from './store.ts'
import { acceptAll, ask, cardState, changedBlocks, decide, dropPending, hasPending, rejectAll, setLevel } from './assistant.ts'

const SITE: Files = {
  'index.html': '<main data-block="b2">\n  <h1>Hi</h1>\n</main>',
  'style.css': 'h1 { color: red; }',
  '.builds/build-1.md': 'Build 1 asked for a page.',
}

function start(chat: ChatMessage[] = [], files: Files = SITE): void {
  const p: Project = { ...emptyProject(), files, chat, assets: [{ id: 'a1', file: 'cake.png', kind: 'image', mime: 'image/png', bytes: 10, width: 64, height: 48 }] }
  setProject(p)
  clearHistory()
}

const bob = () => getProject().chat.filter(m => m.role === 'bob' && !m.line).at(-1)!

beforeEach(() => {
  sent.length = 0
  gate = Promise.resolve()
  dropPending()
  start()
})

describe('ask', () => {
  it('sends the last 10 messages without lines, the context and the files, never Blocks', async () => {
    const chat: ChatMessage[] = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'bob' : 'user', text: 'm' + i, time: i + 1 }))
    chat.push({ role: 'bob', text: 'Code went back to Checkpoint 1', time: 20, line: true })
    start(chat)
    setLevel('in detail')
    script = [{ type: 'start' }, { type: 'text', text: 'Hi' }, { type: 'files', files: SITE, summary: '' }]
    await ask('What does style.css do?')
    const req = sent[0]
    if (req.kind !== 'assistant') throw new Error('not an Assistant turn')
    expect(req.messages).toHaveLength(10)
    expect(req.messages.at(-1)).toMatchObject({ role: 'user', text: 'What does style.css do?' })
    expect(req.messages.some(m => m.text.startsWith('Code went'))).toBe(false)
    expect(Object.keys(req.messages[0])).toEqual(['role', 'text', 'time'])
    expect(req.context).toMatchObject({ level: 'in detail', openFile: 'index.html', library: ['assets/cake.png: image, 64×48 px'] })
    expect(req.files['.builds/build-1.md']).toBe('Build 1 asked for a page.')
    expect(JSON.stringify(req)).not.toContain('"blocks"')
    setLevel('simply')
  })

  it('streams into one Bob message', async () => {
    script = [{ type: 'start' }, { type: 'text', text: 'It colors ' }, { type: 'text', text: 'the title. ' }, { type: 'files', files: SITE, summary: '' }]
    await ask('What does style.css do?')
    const chat = getProject().chat
    expect(chat).toHaveLength(2)
    expect(chat[0]).toMatchObject({ role: 'user', text: 'What does style.css do?' })
    expect(chat[1]).toMatchObject({ role: 'bob', text: 'It colors the title.' })
    expect(chat[1].time).toBeGreaterThan(chat[0].time)
    expect(chat[1].proposal).toBeUndefined()
  })

  it('makes a diff card with the summary for a changed and a new file', async () => {
    const files = { ...SITE, 'style.css': 'h1 { color: blue; }', 'about.html': '<p>About</p>' }
    script = [{ type: 'start' }, { type: 'text', text: 'Done.\n\nSummary: The title is blue.' }, { type: 'files', files, summary: 'The title is blue.' }]
    await ask('Make it blue')
    expect(bob().text).toBe('Done.')
    expect(bob().proposal).toEqual({
      summary: 'The title is blue.',
      files: { 'style.css': { base: SITE['style.css'], proposed: files['style.css'] }, 'about.html': { proposed: '<p>About</p>' } },
      total: 2, accepted: 0, decided: 0,
    })
  })

  it('shows a failed turn, even without start', async () => {
    script = [{ type: 'error', reason: 'time' }]
    await ask('Hi')
    expect(getProject().chat).toHaveLength(2)
    expect(bob().text).toBe('Bob took too long, so this answer was stopped. Try asking again.')
    script = [{ type: 'start' }, { type: 'text', text: 'Half' }, { type: 'error', reason: 'broken' }]
    await ask('Again')
    expect(bob().text).toBe("Half\n\nBob's answer came back broken. Try asking again.")
  })

  it('a limit adds no messages and returns the text', async () => {
    script = [{ type: 'limit', message: 'Try again in 60 minutes.' }]
    expect(await ask('Hi')).toBe('Try again in 60 minutes.')
    expect(getProject().chat).toEqual([])
    expect(hasPending(getProject())).toBe(false)
  })

  it('a running reply is pending, and runs one at a time', async () => {
    let open!: () => void
    gate = new Promise(r => { open = r })
    script = [{ type: 'start' }, { type: 'text', text: 'Yes' }, { type: 'files', files: SITE, summary: '' }]
    const first = ask('One')
    expect(hasPending(getProject())).toBe(true)
    expect(await ask('Two')).toBeUndefined()
    expect(sent).toHaveLength(1)
    open()
    await first
    expect(hasPending(getProject())).toBe(false)
  })
})

describe('the diff card', () => {
  const files = { ...SITE, 'index.html': '<main data-block="b2">\n  <h1>Hello</h1>\n</main>', 'style.css': 'h1 { color: blue; }' }

  async function propose(): Promise<number> {
    script = [{ type: 'start' }, { type: 'files', files, summary: 'Friendlier title.' }]
    await ask('Change it')
    return bob().time
  }

  it('Accept all writes the files without a Checkpoint; Undo takes it back and the chat stays', async () => {
    const time = await propose()
    acceptAll(time)
    expect(getProject().files).toEqual(files)
    expect(bob().proposal).toMatchObject({ accepted: 2, decided: 2, done: true })
    expect(cardState(bob().proposal!, getProject().files)).toBe('accepted')
    expect(addCheckpoint).not.toHaveBeenCalled()
    undo()
    expect(getProject().files).toEqual(SITE)
    expect(bob().proposal?.done).toBe(true)
  })

  it('Reject all leaves the code', async () => {
    const time = await propose()
    rejectAll(time)
    expect(getProject().files).toEqual(SITE)
    expect(cardState(bob().proposal!, getProject().files)).toBe('rejected')
    expect(hasPending(getProject())).toBe(false)
  })

  it('turns Out of date when a file changes, then Dismiss rejects it', async () => {
    const time = await propose()
    updateProject(p => { p.files['style.css'] = 'h1 { color: green; }' }, null)
    expect(cardState(bob().proposal!, getProject().files)).toBe('outOfDate')
    rejectAll(time)
    expect(cardState(bob().proposal!, getProject().files)).toBe('rejected')
  })

  it('Review decisions go reviewing, then partial', async () => {
    const time = await propose()
    decide(time, 'style.css', files['style.css'], files['style.css'])
    expect(getProject().files['style.css']).toBe(files['style.css'])
    expect(cardState(bob().proposal!, getProject().files)).toBe('reviewing')
    decide(time, 'index.html', SITE['index.html'], SITE['index.html'])
    expect(getProject().files['index.html']).toBe(SITE['index.html'])
    expect(bob().proposal).toMatchObject({ accepted: 1, decided: 2, done: true })
    expect(cardState(bob().proposal!, getProject().files)).toBe('partial')
  })

  it('dropPending closes open cards and adds the line', async () => {
    await propose()
    dropPending('Code went back to Checkpoint 1')
    expect(bob().proposal?.done).toBe(true)
    expect(getProject().chat.at(-1)).toMatchObject({ role: 'bob', text: 'Code went back to Checkpoint 1', line: true })
    expect(hasPending(getProject())).toBe(false)
  })
})

describe('changedBlocks', () => {
  it('names the Blocks around changed HTML lines, and none for CSS alone', () => {
    const before = { 'a.html': '<nav data-block="b1">x</nav>\n<main data-block="b2">\n  <p>a</p>\n</main>', 's.css': 'p {}' }
    const after = { 'a.html': '<nav data-block="b1">x</nav>\n<main data-block="b2">\n  <p>b</p>\n</main>', 's.css': 'p { color: red }' }
    expect(changedBlocks(before, after)).toEqual(['b2'])
    expect(changedBlocks(before, { ...before, 's.css': 'p { color: red }' })).toEqual([])
  })
})
