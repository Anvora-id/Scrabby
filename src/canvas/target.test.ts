import { describe, expect, it } from 'vitest'
import { demoProject } from '../fixtures/fixtures.ts'
import { addBlock, addTrait } from '../model/project.ts'
import type { Project } from '../model/types.ts'
import { targetAt } from './target.ts'
import type { DragRects } from './target.ts'

// Build a minimal project for the scene described in TDD §20:
// Site (0,0,400,400) › Home (10,40,390,390) › Hero (20,80,380,200) with pills and Footer (20,210,380,300).
function makeScene(): { p: Project; site: string; home: string; hero: string; footer: string; t1: string; t2: string; rects: DragRects } {
  const p = demoProject()

  // We need a Project that has:
  // canvas → site → home (page) → [hero, footer]
  // hero has two trait pills
  // We'll build it by creating new blocks
  const canvasBlock = p.blocks['canvas']

  // clear existing canvas children and rebuild
  const site = addBlock(p, 'site', 'My site')
  p.blocks[site].pos = { x: 0, y: 0 }
  canvasBlock.children = [site]

  const home = addBlock(p, 'page', 'Home')
  p.blocks[site].children = [home]

  const hero = addBlock(p, 'hero', 'Hero')
  const footer = addBlock(p, 'footer', 'Footer')
  p.blocks[home].children = [hero, footer]
  p.blocks[home].layout = { d: 'col', k: [hero, footer] }

  // hero gets two trait pills
  const tp1 = addTrait(p, 'text', 'Pill 1')
  const tp2 = addTrait(p, 'text', 'Pill 2')
  p.blocks[hero].traits = [tp1, tp2]

  // Build DragRects: only blocks (no menu, quiz, etc.)
  // Site (0,0,400,400); Home (10,40,390,390); Hero (20,80,380,200); Footer (20,210,380,300)
  const blocks: DragRects['blocks'] = new Map([
    [site, { left: 0, top: 0, right: 400, bottom: 400 }],
    [home, { left: 10, top: 40, right: 390, bottom: 390 }],
    [hero, { left: 20, top: 80, right: 380, bottom: 200 }],
    [footer, { left: 20, top: 210, right: 380, bottom: 300 }],
  ])
  // Pills: (30,100,90,128) and (100,100,160,128)
  const traits: DragRects['traits'] = new Map([
    [tp1, { left: 30, top: 100, right: 90, bottom: 128 }],
    [tp2, { left: 100, top: 100, right: 160, bottom: 128 }],
  ])

  return { p, site, home, hero, footer, t1: tp1, t2: tp2, rects: { blocks, traits } }
}

describe('target', () => {
  it('text at (200,140) → {id:hero, slot:null}', () => {
    const { p, hero, rects } = makeScene()
    const item = { kind: 'newBlock' as const, type: 'text' as const }
    const result = targetAt(p, rects, item, 200, 140)
    // hero's nearestSlot: hero has no measured child blocks (only traits) → null
    expect(result).toEqual({ id: hero, slot: null })
  })

  it('text at (25,140) → left of hero in Home', () => {
    const { p, home, hero, rects } = makeScene()
    const item = { kind: 'newBlock' as const, type: 'text' as const }
    const result = targetAt(p, rects, item, 25, 140)
    // x - hero.left = 25 - 20 = 5 < ex(28) → left edge → drop into home with slot {where:'left', ref:hero}
    expect(result).toEqual({ id: home, slot: { where: 'left', ref: hero } })
  })

  it('text at (200,195) → below hero', () => {
    const { p, home, hero, rects } = makeScene()
    const item = { kind: 'newBlock' as const, type: 'text' as const }
    const result = targetAt(p, rects, item, 200, 195)
    // hero.bottom = 200, hero.bottom - y = 200 - 195 = 5 < ey(12) → below edge → drop into home
    expect(result).toEqual({ id: home, slot: { where: 'below', ref: hero } })
  })

  it('text at (200,205) → rowBefore footer', () => {
    const { p, home, footer, rects } = makeScene()
    const item = { kind: 'newBlock' as const, type: 'text' as const }
    const result = targetAt(p, rects, item, 200, 205)
    // the gap between hero and footer: hit = home, no row spans y, footer is the next row
    expect(result).toEqual({ id: home, slot: { where: 'rowBefore', ref: footer } })
  })

  it('page at (200,140) → {id:site, slot:{where:"above", ref:home}}', () => {
    const { p, site, home, rects } = makeScene()
    const item = { kind: 'newBlock' as const, type: 'page' as const }
    const result = targetAt(p, rects, item, 200, 140)
    // page can only go inside site. nearestSlot(site) → above home
    expect(result).toEqual({ id: site, slot: { where: 'above', ref: home } })
  })

  it('Trait at (120,110) → tIdx 1', () => {
    const { p, hero, rects } = makeScene()
    const item = { kind: 'newTrait' as const, type: 'color' as const }
    const result = targetAt(p, rects, item, 120, 110)
    // past t1's middle (60), before t2's middle (130)
    expect(result).toEqual({ id: hero, tIdx: 1 })
  })

  it('Trait at (300,150) → tIdx 2', () => {
    const { p, hero, rects } = makeScene()
    const item = { kind: 'newTrait' as const, type: 'color' as const }
    const result = targetAt(p, rects, item, 300, 150)
    // t1: midX=60. y=150. y < t1.top=100? No. y <= 128? No (150 > 128). Not before t1.
    // t2: midX=130. y=150 <= 128? No (150 > 128). Not before t2.
    // tIdx = 2 (past all pills)
    expect(result).toEqual({ id: hero, tIdx: 2 })
  })

  it('(600,600) → null', () => {
    const { p, rects } = makeScene()
    const item = { kind: 'newBlock' as const, type: 'text' as const }
    const result = targetAt(p, rects, item, 600, 600)
    expect(result).toBeNull()
  })
})
