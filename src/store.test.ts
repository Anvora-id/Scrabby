import { describe, expect, it, vi } from 'vitest'

vi.mock('./db.ts', () => ({
  loadLatestProject: vi.fn().mockResolvedValue(undefined),
  saveProject: vi.fn().mockResolvedValue(undefined),
  pruneAssets: vi.fn().mockResolvedValue(undefined),
  clearAll: vi.fn().mockResolvedValue(undefined),
}))

import {
  getProject,
  updateProject,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory,
  startStore,
  fillBlankName,
} from './store.ts'

// Reset history between tests
function reset() {
  clearHistory()
}

describe('store', () => {
  it('a no-undo change (key=null) leaves Undo for the last edit', async () => {
    await startStore()
    reset()

    // User edit in a field (keyed)
    updateProject(p => { p.name = 'First' }, 'name-field')
    // A no-undo change (e.g. a Build result)
    updateProject(p => { p.name = 'After Build' }, null)

    // Still can undo to 'First'
    expect(canUndo()).toBe(true)
    undo()
    // went back to 'First' (the state before 'After Build' was stored as 'First' state)
    expect(getProject().name).toBe('First')
    // One more undo step: back to original
    undo()
    expect(canUndo()).toBe(false)
  })

  it('undo/redo cycle', async () => {
    await startStore()
    reset()

    updateProject(p => { p.name = 'A' }, null)
    updateProject(p => { p.name = 'B' }, null)

    expect(canRedo()).toBe(false)
    undo()
    expect(canRedo()).toBe(true)
    redo()
    expect(canRedo()).toBe(false)
    expect(getProject().name).toBe('B')
  })

  it('undo does not revert the chat', async () => {
    await startStore()
    reset()

    updateProject(p => { p.name = 'Before' }, null)
    // capture before state
    const beforeName = getProject().name

    // Next update also sets chat
    updateProject(p => {
      p.chat = [{ role: 'user', text: 'hello', time: 1 }]
      p.name = 'After'
    }, null)

    // Verify state
    expect(getProject().name).toBe('After')
    expect(getProject().chat[0].text).toBe('hello')

    // Undo goes back to the 'Before' name state
    undo()

    // Name goes back to Before
    expect(getProject().name).toBe(beforeName)
    // But chat is preserved (never undone)
    expect(getProject().chat).toEqual([{ role: 'user', text: 'hello', time: 1 }])
  })
})

describe('fillBlankName', () => {
  it('puts back "My website" in the typing step, so Undo never gives a blank name', async () => {
    await startStore()
    updateProject(p => { p.name = 'Bake sale' }, null)
    reset()
    const field = {} as Element
    vi.stubGlobal('document', { activeElement: null })
    updateProject(p => { p.name = '' }, field)
    fillBlankName(field)
    expect(getProject().name).toBe('My website')
    undo()
    expect(getProject().name).toBe('Bake sale')
    vi.unstubAllGlobals()
  })
})
