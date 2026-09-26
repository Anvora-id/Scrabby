import { describe, expect, it } from 'vitest'
import { demoProject } from '../fixtures/fixtures.ts'
import { warnings } from '../instructions/warnings.ts'
import { addBlock, emptyProject } from '../model/project.ts'
import { badgeOf, marksOf, stopsOf } from './marks.ts'
import { removeItem } from './tree.ts'

describe('marks', () => {
  it('marks nothing in the demo', () => {
    expect(marksOf(warnings(demoProject())).size).toBe(0)
  })

  it('marks both Top bar Quiz links "!" with one stop after deleting Quiz', () => {
    const p = demoProject()
    const site = p.blocks.canvas.children[0]
    removeItem(p, p.blocks[site].children[2])
    const ws = warnings(p)
    const marks = marksOf(ws)
    const quizLinks = ['Top bar 1', 'Top bar 2'].map(bar => {
      const b = Object.values(p.blocks).find(b => b.name === bar)!
      return p.blocks[b.children[1]].traits[0]
    })
    expect([...marks.keys()]).toEqual(quizLinks)
    expect(quizLinks.map(id => badgeOf(marks.get(id)!))).toEqual(['!', '!'])
    expect(stopsOf(ws).map(w => w.target)).toEqual([quizLinks[0]])
  })

  it('gives a new empty Page lonepage and emptypage with "?"', () => {
    const p = demoProject()
    const page = addBlock(p, 'page', 'About')
    p.blocks[p.blocks.canvas.children[0]].children.push(page)
    const marks = marksOf(warnings(p))
    expect(marks.get(page)!.map(w => w.rule)).toEqual(['lonepage', 'emptypage'])
    expect(badgeOf(marks.get(page)!)).toBe('?')
  })

  it('marks nothing without a Site', () => {
    const p = emptyProject()
    p.blocks.canvas.children = []
    const ws = warnings(p)
    expect(marksOf(ws).size).toBe(0)
    expect(stopsOf(ws)).toEqual([])
  })
})
