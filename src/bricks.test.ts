import { describe, expect, it } from 'vitest'
import { BRICKS, heap, loose, type Lying } from './bricks.ts'

// Every fallen brick tilts 4° to 35°, stays inside the stage and clear of Bob, and has both ends above the floor.
function fallen(ls: Lying[]) {
  for (const l of ls) {
    const b = BRICKS[l.i]
    expect(Math.abs(l.r)).toBeGreaterThanOrEqual(4)
    expect(Math.abs(l.r)).toBeLessThanOrEqual(35)
    expect(b.left + l.tx).toBeGreaterThanOrEqual(-26)
    expect(b.left + l.tx + b.width).toBeLessThanOrEqual(398)
    expect(b.bottom - l.ty - b.width / 2 * Math.abs(Math.sin(l.r * Math.PI / 180))).toBeGreaterThanOrEqual(-1e-9)
  }
}

describe('bricks', () => {
  it('a full pile falls into a heap of tilted bricks', () => {
    const ls = heap(BRICKS.map(b => ({ b, dy: 0 })))
    expect(ls.map(l => l.i)).toEqual(BRICKS.map(b => b.i))
    fallen(ls)
    expect(ls.filter(l => Math.abs(l.r) > 10).length).toBeGreaterThan(2)
  })

  it('mid-clear, only the bricks still standing fall', () => {
    const standing = BRICKS.filter(b => b.row > 0).map(b => ({ b, dy: 22 }))
    const ls = heap(standing)
    expect(ls.map(l => l.i)).toEqual(standing.map(s => s.b.i))
    fallen(ls)
  })

  it('a Build that did not start shows three bricks lying across each other', () => {
    const ls = loose()
    expect(ls.map(l => BRICKS[l.i].cat)).toEqual(['pages', 'content', 'ui'])
    fallen(ls)
  })
})
