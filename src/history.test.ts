import { describe, expect, it, vi } from 'vitest'
import { createHistory } from './history.ts'

describe('history', () => {
  it('records past, then undo returns the previous value', () => {
    const h = createHistory<number>()
    h.record(1)
    expect(h.canUndo()).toBe(true)
    expect(h.undo(2)).toBe(1)
    expect(h.canUndo()).toBe(false)
  })

  it('redo works after undo', () => {
    const h = createHistory<number>()
    h.record(1)
    h.undo(2)
    expect(h.canRedo()).toBe(true)
    expect(h.redo(1)).toBe(2)
    expect(h.canRedo()).toBe(false)
  })

  it('redo is cleared on a new record', () => {
    const h = createHistory<number>()
    h.record(1)
    h.undo(2)
    h.record(2) // new change clears redo
    expect(h.canRedo()).toBe(false)
  })

  it('merges when key is the same', () => {
    const h = createHistory<number>()
    h.record(1, 'field')
    h.record(2, 'field') // same key — merged, not pushed
    expect(h.undo(3)).toBe(1) // should get back to 1, not 2
    expect(h.canUndo()).toBe(false)
  })

  it('new step after undo: undo goes to new step first', () => {
    const h = createHistory<number>()
    h.record(1, 'a')
    const prev = h.undo(2) // go back to 1
    expect(prev).toBe(1)
    // a new edit after undo
    h.record(1, 'b') // key 'b', different from last
    h.undo(3) // undo the new edit
    expect(h.canUndo()).toBe(false) // redo cleared the old undo steps
  })

  it('respects the limit', () => {
    const h = createHistory<number>(3)
    h.record(0, null)
    h.record(1, null)
    h.record(2, null)
    h.record(3, null) // oldest (0) should be dropped
    let count = 0
    while (h.canUndo()) { h.undo(99); count++ }
    expect(count).toBe(3)
  })

  it('clear resets everything', () => {
    const h = createHistory<number>()
    h.record(1)
    h.clear()
    expect(h.canUndo()).toBe(false)
    expect(h.canRedo()).toBe(false)
  })
})

describe('history: a no-undo change leaves Undo for the last edit', () => {
  it('key=null does not merge', () => {
    const h = createHistory<number>()
    h.record(1, 'field')    // user edit, key = 'field'
    h.record(2, null)       // key=null: a new step
    expect(h.canUndo()).toBe(true)
    const v = h.undo(3)
    expect(v).toBe(2)
    expect(h.canUndo()).toBe(true) // still the original edit
  })
})

// Mock vi.mock must be at top level but we need it for store tests
vi.mock('./db.ts', () => ({
  loadLatestProject: vi.fn().mockResolvedValue(undefined),
  saveProject: vi.fn().mockResolvedValue(undefined),
  clearAll: vi.fn().mockResolvedValue(undefined),
}))
