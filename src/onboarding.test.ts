import { describe, expect, it } from 'vitest'
import { isEmptyProject, keepClearOf, placeBubble } from './onboarding.ts'
import { emptyProject, addBlock } from './model/project.ts'
import { demoProject } from './fixtures/fixtures.ts'

describe('isEmptyProject', () => {
  it('is true for a new Project', () => {
    expect(isEmptyProject(emptyProject())).toBe(true)
  })

  it('is false with a Page, with an Asset, with files or with chat', () => {
    const withPage = emptyProject()
    addBlock(withPage, 'page')
    expect(isEmptyProject(withPage)).toBe(false)
    expect(isEmptyProject(demoProject())).toBe(false)
    expect(isEmptyProject({ ...emptyProject(), files: { 'index.html': '' } })).toBe(false)
  })

  it('is false once renamed', () => {
    expect(isEmptyProject({ ...emptyProject(), name: "Maya's bakery" })).toBe(false)
  })
})

describe('placeBubble', () => {
  const W = 1366
  const H = 768
  const box = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom })

  it('goes right of a tall panel, centered', () => {
    expect(placeBubble(box(0, 100, 300, 700), 280, 100, W, H)).toEqual({ side: 'right', x: 314, y: 350, tail: 50 })
  })

  it('goes left when the right has no room', () => {
    const p = placeBubble(box(1200, 680, 1350, 740), 280, 100, W, H)
    expect(p.side).toBe('left')
    expect(p.x).toBe(906)
  })

  it('goes below a full-width bar', () => {
    const p = placeBubble(box(0, 56, W, 90), 280, 100, W, H)
    expect(p.side).toBe('below')
    expect(p.y).toBe(104)
  })

  it('goes inside a target bigger than half the screen', () => {
    const p = placeBubble(box(300, 150, W, H), 280, 100, W, H)
    expect(p.side).toBe('inside')
    expect(p.y).toBe(174)
    expect(p.tail).toBe(0)
  })

  it('clamps y and the tail near the bottom edge', () => {
    expect(placeBubble(box(10, 740, 60, 766), 280, 100, W, H)).toMatchObject({ side: 'right', y: 660, tail: 80 })
  })

  it('slides along its side to the nearest spot clear of a Block', () => {
    expect(placeBubble(box(0, 100, 300, 700), 280, 100, W, H, [box(320, 300, 700, 460)]))
      .toEqual({ side: 'right', x: 314, y: 474, tail: 20 })
  })

  it('steps outward past a Block too tall to slide around', () => {
    expect(placeBubble(box(0, 100, 300, 700), 280, 100, W, H, [box(320, 0, 700, H)]))
      .toEqual({ side: 'right', x: 714, y: 350, tail: 50 })
  })

  it('stays put when nowhere is clear', () => {
    expect(placeBubble(box(0, 100, 300, 700), 280, 100, W, H, [box(310, 0, W, H)]))
      .toEqual({ side: 'right', x: 314, y: 350, tail: 50 })
  })

  it('slides sideways below a bar', () => {
    expect(placeBubble(box(0, 56, W, 90), 280, 100, W, H, [box(500, 100, 900, 300)]))
      .toEqual({ side: 'below', x: 206, y: 104, tail: 260 })
  })

  it('ignores Blocks when it sits inside the target', () => {
    expect(placeBubble(box(300, 150, W, H), 280, 100, W, H, [box(300, 150, W, H)]).side).toBe('inside')
  })
})

describe('keepClearOf', () => {
  const box = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom })
  const canvas = box(310, 150, 1366, 768)
  const blocks = [box(320, 100, 700, 400), box(320, 800, 700, 900)]

  it('cuts Blocks to the Canvas, adds the bars above it for a target in the Canvas panel, and makes room for Bob', () => {
    expect(keepClearOf(box(0, 150, 300, 700), canvas, blocks, 1366, 64))
      .toEqual([box(320, 150, 700, 464), box(0, 0, 1366, 214)])
  })

  it('leaves the bars alone for a target above the Canvas', () => {
    expect(keepClearOf(box(0, 56, 1366, 90), canvas, blocks, 1366, 64)).toEqual([box(320, 150, 700, 464)])
  })

  it('leaves the Blocks alone for a target on the Canvas, so its bubble stays beside it', () => {
    expect(keepClearOf(box(1200, 700, 1350, 750), canvas, blocks, 1366, 64)).toEqual([box(0, 0, 1366, 214)])
  })
})
