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
    // hit = footer (deepest block containing 200,205). footer.top=210 > 205, wait—
    // Actually footer rect is (20,210,380,300). y=205 is NOT inside footer (205 < 210).
    // So hit would be home (10,40,390,390) which contains 200,205.
    // hero (20,80,380,200): y=205 > 200, not inside.
    // So hit = home.
    // targetFor(home): parent=site (not canvas). canDrop({text},site) → site only accepts page → false. No edge.
    //   canDrop({text}, home) → home is page, accepts ANY_PART including text → true.
    //   nearestSlot(home): rows from repairLayout(home) = {d:'col',k:[hero,footer]}.
    //   Hero measured (20,80,380,200) and footer measured (20,210,380,300).
    //   rows = [{ids:[hero], union:{20,80,380,200}}, {ids:[footer], union:{20,210,380,300}}]
    //   y=205: not in hero row (80-200 doesn't contain 205). not in footer row (210-300 doesn't contain 205).
    //   First row whose top > y: footer.top=210 > 205 → rowBefore, ref=footer
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
    // t1: (30,100,90,128). t2: (100,100,160,128).
    // midX of hero = (20+380)/2 = 200.
    // traitIds (measured) = [t1, t2]
    // For i=0 (t1): y=110. t1.top=100. y >= top. y <= t1.bottom=128 AND x=120 < midX=200 → but check: does this pill's condition match?
    //   y < tr.top: 110 < 100 → false. y <= tr.bottom (110 <= 128) AND x < midX (120 < 200) → true. So tIdx=0? No wait—
    //   Actually we check if i=0 matches: y=110 < t1.top=100? No. y<=t1.bottom=128 && x=120 < midX=200? Yes → tIdx=0? 
    //   Wait, that would mean x=120 maps to tIdx=0 (before t1). But the spec says tIdx=1 for (120,110).
    // Hmm, let me re-read the spec:
    // "tIdx = index of the first of bx's measured pills with y < top || (y <= bottom && x < (left + right) / 2)"
    // left/right of the PILL, not the block!
    // t2: (100,100,160,128). midX of t2 = (100+160)/2 = 130.
    // For t1 at (30,100,90,128): midX_t1 = (30+90)/2 = 60. x=120 > 60, and y=110 <= 128 → NOT before t1.
    // Actually wait — re-reading: "x < (left + right) / 2" — this is the midX of the pill itself!
    // t1: midX = (30+90)/2 = 60. y=110 <= 128 && x=120 < 60? No (120 > 60).
    // t2: midX = (100+160)/2 = 130. y=110 <= 128 && x=120 < 130? Yes → tIdx=1 (index of t2).
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
