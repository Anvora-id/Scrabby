import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { demoProject, builtSite, DEMO_PHOTOS } from './fixtures.ts'

describe('DEMO_PHOTOS', () => {
  it('has 6 entries', () => {
    expect(DEMO_PHOTOS).toEqual(['cupcakes.jpg', 'layer-cake.jpg', 'cookies.jpg', 'bake-stall.jpg', 'lemon-drizzle.jpg', 'brownie.jpg'])
  })

  it('ships every photo in public/demo with its credit', () => {
    const credits = readFileSync(new URL('../../public/demo/CREDITS.md', import.meta.url), 'utf8')
    for (const file of DEMO_PHOTOS) {
      expect(existsSync(new URL('../../public/demo/' + file, import.meta.url))).toBe(true)
      expect(credits).toContain(`| ${file} |`)
    }
  })
})

describe('demoProject()', () => {
  it('has the correct name', () => {
    const p = demoProject()
    expect(p.name).toBe("Maya's bake sale")
  })

  it('has 6 assets with ids a1–a6', () => {
    const p = demoProject()
    expect(p.assets).toHaveLength(6)
    expect(p.assets.map(a => a.id)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6'])
    expect(p.next.a).toBe(7)
    expect(p.assets[0].kind).toBe('image')
    expect(p.assets[0].mime).toBe('image/jpeg')
    expect(p.assets[0].width).toBe(1200)
    expect(p.assets[0].height).toBe(800)
  })

  it('has the site block b1 with 3 traits', () => {
    const p = demoProject()
    const site = p.blocks['canvas'].children[0]
    expect(site).toBe('b1')
    expect(p.blocks[site].type).toBe('site')
    expect(p.blocks[site].traits).toHaveLength(3)
    expect(p.traits[p.blocks[site].traits[0]].type).toBe('color')
    expect(p.traits[p.blocks[site].traits[0]].value).toBe('#F8BBD0')
  })

  it('has 3 pages b2 b3 b4 with correct files', () => {
    const p = demoProject()
    const site = p.blocks['canvas'].children[0]
    const [home, menu, quiz] = p.blocks[site].children
    expect(home).toBe('b2')
    expect(menu).toBe('b3')
    expect(quiz).toBe('b4')
    expect(p.blocks[home].file).toBe('index.html')
    expect(p.blocks[menu].file).toBe('menu.html')
    expect(p.blocks[quiz].file).toBe('quiz.html')
  })

  it('has 2 custom block definitions d1 and d2', () => {
    const p = demoProject()
    expect(p.defs['d1']).toBeDefined()
    expect(p.defs['d2']).toBeDefined()
    expect(p.next.d).toBe(3)
    const topBar = p.blocks[p.defs['d1'].blockId]
    expect(topBar.type).toBe('navbar')
    expect(topBar.name).toBe('Top bar')
  })

  it('demo tree: 3 instances of d1 in pages', () => {
    const p = demoProject()
    const instances = Object.values(p.blocks).filter(b => b.inst === 'd1')
    expect(instances).toHaveLength(3)
    const names = instances.map(b => b.name).sort()
    expect(names).toEqual(['Top bar 1', 'Top bar 2', 'Top bar 3'])
  })

  it('has no files (no build yet)', () => {
    const p = demoProject()
    expect(Object.keys(p.files)).toHaveLength(0)
  })
})

describe('builtSite()', () => {
  it('has 3 linked pages + CSS + JS in project.files', () => {
    const { project } = builtSite()
    const keys = Object.keys(project.files).sort()
    expect(keys).toContain('index.html')
    expect(keys).toContain('menu.html')
    expect(keys).toContain('quiz.html')
    expect(keys).toContain('style.css')
    expect(keys).toContain('script.js')
  })

  it('has a Checkpoint Block with 3 locked Built pages', () => {
    const { project } = builtSite()
    const site = project.blocks['canvas'].children[0]
    expect(project.blocks[site].type).toBe('checkpoint')
    expect(project.blocks[site].locked).toBe(true)
    const [home, menu, quiz] = project.blocks[site].children
    expect(project.blocks[home].locked).toBe(true)
    expect(project.blocks[menu].locked).toBe(true)
    expect(project.blocks[quiz].locked).toBe(true)
  })

  it('has 2 checkpoints', () => {
    const { checkpoints } = builtSite()
    expect(checkpoints).toHaveLength(2)
    expect(checkpoints[0].number).toBe(1)
    expect(checkpoints[1].number).toBe(2)
    expect(checkpoints[0].from).toBeNull()
    expect(checkpoints[1].from).toBe(1)
  })

  it('checkpoints blocks hold more than 20 marks', () => {
    const { checkpoints } = builtSite()
    const cp1 = checkpoints[0].blocks
    const cp2 = checkpoints[1].blocks
    const allIds = new Set([
      ...Object.keys(cp1?.blocks ?? {}),
      ...Object.keys(cp2?.blocks ?? {}),
    ])
    expect(allIds.size).toBeGreaterThan(20)
  })

  it('nothing unreachable in project', () => {
    const { project: p } = builtSite()
    const reachable = new Set<string>()
    const reachableTraits = new Set<string>()
    function walk(id: string): void {
      if (reachable.has(id)) return
      reachable.add(id)
      const b = p.blocks[id]
      if (!b) return
      for (const tid of b.traits) reachableTraits.add(tid)
      for (const cid of b.children) walk(cid)
    }
    walk('canvas')
    for (const def of Object.values(p.defs)) walk(def.blockId)
    for (const id of Object.keys(p.blocks)) {
      expect(reachable.has(id), `block ${id} is unreachable`).toBe(true)
    }
    for (const id of Object.keys(p.traits)) {
      expect(reachableTraits.has(id), `trait ${id} is unreachable`).toBe(true)
    }
  })

  it('checkpoint=2', () => {
    const { project } = builtSite()
    expect(project.checkpoint).toBe(2)
  })
})
