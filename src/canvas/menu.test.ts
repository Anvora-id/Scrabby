import { describe, expect, it } from 'vitest'
import { demoProject } from '../fixtures/fixtures.ts'
import { addBlock, addTrait, resolveAll } from '../model/project.ts'
import type { Project } from '../model/types.ts'
import { canMakeCustom, duplicate, menuItems } from './menu.ts'

function demo(): Project {
  return demoProject()
}

function bid(p: Project, name: string): string {
  const b = Object.values(p.blocks).find(b => b.name === name)
  if (!b) throw new Error(`Block not found: ${name}`)
  return b.id
}

function labels(p: Project, id: string): string[] {
  return menuItems(p, id).map(m => m.label)
}

describe('menu', () => {
  it('Block items: Add Note, Duplicate, Make Custom Block, Delete Block', () => {
    const p = demo()
    const hero = bid(p, 'Big welcome')
    expect(labels(p, hero)).toEqual(['Add Note', 'Duplicate', 'Make Custom Block', 'Delete Block'])
  })

  it('Trait: Add Note, Duplicate, Delete Trait', () => {
    const p = demo()
    const site = p.blocks['canvas'].children[0]
    const tid = p.blocks[site].traits[0]
    expect(labels(p, tid)).toEqual(['Add Note', 'Duplicate', 'Delete Trait'])
  })

  it('Site → Add Note only', () => {
    const p = demo()
    const site = p.blocks['canvas'].children[0]
    expect(labels(p, site)).toEqual(['Add Note'])
  })

  it('Checkpoint Block → Add Note only', () => {
    const p = demo()
    // Add a checkpoint block on the canvas for this test
    const cpId = addBlock(p, 'checkpoint' as any, 'Checkpoint')
    p.blocks['canvas'].children.push(cpId)
    expect(labels(p, cpId)).toEqual(['Add Note'])
  })

  it('Built page → Add Note only', () => {
    const p = demo()
    const pageId = addBlock(p, 'page', 'Contact')
    p.blocks[pageId].locked = true
    p.blocks['canvas'].children.push(pageId)
    expect(labels(p, pageId)).toEqual(['Add Note'])
  })

  it('Add Note sets noteOn; Delete Note when note || noteOn', () => {
    const p = demo()
    const hero = bid(p, 'Big welcome')
    const items = menuItems(p, hero)
    const addNote = items.find(i => i.label === 'Add Note')!
    addNote.change!(p)
    expect(p.blocks[hero].noteOn).toBe(true)
    // now Delete Note appears
    expect(labels(p, hero)).toContain('Delete Note')
    // invoke Delete Note
    const del = menuItems(p, hero).find(i => i.label === 'Delete Note')!
    del.change!(p)
    expect(p.blocks[hero].noteOn).toBe(false)
    expect(p.blocks[hero].note).toBe('')
  })

  it('Duplicate a Block with its insides right after it', () => {
    const p = demo()
    const hero = bid(p, 'Big welcome')
    const site = p.blocks['canvas'].children[0]
    const homeId = p.blocks[site].children[0]
    const homeChildren = p.blocks[homeId].children
    const idx = homeChildren.indexOf(hero)
    expect(idx).toBeGreaterThanOrEqual(0)
    duplicate(p, hero)
    const newChildren = p.blocks[homeId].children
    // copy is right after the original
    expect(newChildren[idx]).toBe(hero)
    const copyId = newChildren[idx + 1]
    expect(copyId).toBeDefined()
    expect(p.blocks[copyId].name).toBe('Big welcome')
    // the copy has traits (insides are copied)
    expect(p.blocks[copyId].traits.length).toBe(p.blocks[hero].traits.length)
    expect(p.blocks[copyId].children.length).toBe(p.blocks[hero].children.length)
  })

  it('a Page copy gets its own file', () => {
    const p = demo()
    const site = p.blocks['canvas'].children[0]
    const homeId = Object.values(p.blocks).find(b => b.type === 'page' && b.name === 'Home')!.id
    duplicate(p, homeId)
    const siblings = p.blocks[site].children
    const copyId = siblings[siblings.indexOf(homeId) + 1]
    expect(p.blocks[copyId].file).toBeDefined()
    expect(p.blocks[copyId].file).not.toBe(p.blocks[homeId].file)
  })

  it('a loose copy gets +30/+30', () => {
    const p = demo()
    const looseId = addBlock(p, 'section', 'Loose idea')
    p.blocks['canvas'].children.push(looseId)
    p.blocks[looseId].pos = { x: 100, y: 200 }
    duplicate(p, looseId)
    const canvas = p.blocks['canvas']
    const copyId = canvas.children[canvas.children.length - 1]
    expect(p.blocks[copyId].pos).toEqual({ x: 130, y: 230 })
  })

  it('Trait duplicate', () => {
    const p = demo()
    const site = p.blocks['canvas'].children[0]
    const tid = p.blocks[site].traits[0]
    const before = p.blocks[site].traits.length
    duplicate(p, tid)
    expect(p.blocks[site].traits.length).toBe(before + 1)
    const idx = p.blocks[site].traits.indexOf(tid)
    const copyId = p.blocks[site].traits[idx + 1]
    expect(p.traits[copyId]).toBeDefined()
    expect(p.traits[copyId].type).toBe(p.traits[tid].type)
    expect(p.traits[copyId].value).toBe(p.traits[tid].value)
  })

  it('Trait delete via menuItems', () => {
    const p = demo()
    const site = p.blocks['canvas'].children[0]
    const tid = p.blocks[site].traits[0]
    const del = menuItems(p, tid).find(i => i.label === 'Delete Trait')!
    del.change!(p)
    expect(p.traits[tid]).toBeUndefined()
    expect(p.blocks[site].traits.includes(tid)).toBe(false)
  })

  it('Make Custom Block availability', () => {
    const p = demo()
    const hero = bid(p, 'Big welcome')
    expect(canMakeCustom(p, hero)).toBe(true)
    // site/page/checkpoint not allowed
    const site = p.blocks['canvas'].children[0]
    expect(canMakeCustom(p, site)).toBe(false)
  })

  it('definition → Add Note only', () => {
    const p = demo()
    const defId = p.defs['d1'].blockId
    expect(labels(p, defId)).toEqual(['Add Note'])
  })

  it('Instance → Add Note, Edit Custom Block, Duplicate, Delete Block', () => {
    const p = demo()
    // find an instance on the canvas: navigate home page children
    const homeId = Object.values(p.blocks).find(b => b.type === 'page' && b.name === 'Home')!.id
    const instId = p.blocks[homeId].children.find(id => p.blocks[id]?.inst)!
    expect(instId).toBeDefined()
    const ls = labels(p, instId)
    expect(ls).toContain('Add Note')
    expect(ls).toContain('Edit Custom Block')
    expect(ls).toContain('Duplicate')
    expect(ls).toContain('Delete Block')
  })

  it('Instance shows Bring back removed parts (1) when removed', () => {
    const p = demo()
    const homeId = Object.values(p.blocks).find(b => b.type === 'page' && b.name === 'Home')!.id
    const instId = p.blocks[homeId].children.find(id => p.blocks[id]?.inst)!
    p.blocks[instId].removed = ['t1']
    expect(labels(p, instId)).toContain('Bring back removed parts (1)')
  })

  it("Instance shows Use the Custom Block's version when hasOverride", () => {
    const p = demo()
    const homeId = Object.values(p.blocks).find(b => b.type === 'page' && b.name === 'Home')!.id
    const instId = p.blocks[homeId].children.find(id => p.blocks[id]?.inst)!
    // set an ov on a child trait to trigger hasOverride
    const inst = p.blocks[instId]
    // Set ov on the instance block itself (name override)
    inst.from = 'some-src'
    inst.ov = { name: true }
    expect(labels(p, instId)).toContain("Use the Custom Block's version")
  })

  it('Edit Custom Block opens the Custom Block, not its definition Block', () => {
    const p = demo()
    const inst = Object.values(p.blocks).find(b => b.inst)!
    expect(menuItems(p, inst.id).find(i => i.label === 'Edit Custom Block')!.edit).toBe(inst.inst)
  })

  it('an Instance copy stays an Instance, following the same parts', () => {
    const p = demo()
    const home = Object.values(p.blocks).find(b => b.type === 'page' && b.name === 'Home')!
    const inst = home.children.find(id => p.blocks[id].inst)!
    duplicate(p, inst)
    const copy = p.blocks[home.children[home.children.indexOf(inst) + 1]]
    expect(copy.inst).toBe(p.blocks[inst].inst)
    expect(copy.traits.map(t => p.traits[t].from)).toEqual(p.blocks[inst].traits.map(t => p.traits[t].from))
  })

  it('a loose Trait copy +30/+30', () => {
    const p = demo()
    const t = addTrait(p, 'color', '#FF0000')
    p.traits[t].pos = { x: 100, y: 100 }
    p.blocks.canvas.traits.push(t)
    duplicate(p, t)
    const copy = p.blocks.canvas.traits[p.blocks.canvas.traits.indexOf(t) + 1]
    expect(p.traits[copy].pos).toEqual({ x: 130, y: 130 })
  })

  it('a Page copy keeps the Instance inside it following, without doubled parts', () => {
    const p = demo()
    const home = Object.values(p.blocks).find(b => b.type === 'page' && b.name === 'Home')!
    const site = p.blocks.canvas.children[0]
    duplicate(p, home.id)
    resolveAll(p)
    const kids = p.blocks[site].children
    const copy = p.blocks[kids[kids.indexOf(home.id) + 1]]
    const o = p.blocks[home.children.find(id => p.blocks[id].inst)!]
    const c = p.blocks[copy.children.find(id => p.blocks[id].inst)!]
    expect([c.traits.length, c.children.length]).toEqual([o.traits.length, o.children.length])
  })
})
