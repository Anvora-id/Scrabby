import { describe, expect, it } from 'vitest'
import { isEmptyProject, placeBubble } from './onboarding.ts'
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
})
