import { describe, expect, it } from 'vitest'
import {
  addBlock,
  addTrait,
  applyChange,
  canvasBlocks,
  emptyProject,
  hasOverride,
  makeCustomBlock,
  makeInstance,
  newCustomBlock,
  resolveAll,
} from './project.ts'
import { demoProject } from '../fixtures/fixtures.ts'

describe('makeInstance', () => {
  it('copies with from links, name "Product card 1"', () => {
    const p = emptyProject()
    const defBlockId = addBlock(p, 'card', 'Product card')
    const t1 = addTrait(p, 'text', 'Hello')
    p.blocks[defBlockId].traits.push(t1)
    const childId = addBlock(p, 'text', 'Label')
    p.blocks[defBlockId].children.push(childId)
    const siteId = p.blocks['canvas'].children[0]
    p.blocks[siteId].children.push(defBlockId)
    makeCustomBlock(p, defBlockId)
    const def = Object.values(p.defs).find(d => p.blocks[d.blockId].type === 'card')!
    // the first Instance was already made by makeCustomBlock, add a fresh one
    const instId = makeInstance(p, def.id)
    const inst = p.blocks[instId]
    expect(inst.name).toBe('Product card 2')
    expect(inst.inst).toBe(def.id)
    expect(inst.removed).toEqual([])
    expect(inst.from).toBeUndefined()
    // traits and children should have from links
    for (const tid of inst.traits) {
      expect(p.traits[tid].from).toBeTruthy()
    }
    for (const cid of inst.children) {
      expect(p.blocks[cid].from).toBeTruthy()
    }
  })

  it('first instance is named "Product card 1"', () => {
    const p = emptyProject()
    const defBlockId = addBlock(p, 'card', 'Product card')
    p.defs['d1'] = { id: 'd1', blockId: defBlockId, color: { h: 345, s: 90, l: 71 } }
    p.blocks[defBlockId].defines = 'd1'
    p.next.d = 2
    const instId = makeInstance(p, 'd1')
    expect(p.blocks[instId].name).toBe('Product card 1')
  })
})

describe('resolve (syncBlock / syncList)', () => {
  function setup() {
    const p = emptyProject()
    const defBlockId = addBlock(p, 'card', 'Product card')
    const t1 = addTrait(p, 'text', 'Hello')
    p.blocks[defBlockId].traits.push(t1)
    const childId = addBlock(p, 'text', 'Child')
    p.blocks[defBlockId].children.push(childId)
    p.defs['d1'] = { id: 'd1', blockId: defBlockId, color: { h: 345, s: 90, l: 71 } }
    p.blocks[defBlockId].defines = 'd1'
    p.next.d = 2
    const instId = makeInstance(p, 'd1')
    p.blocks['canvas'].children.push(instId)
    return { p, defBlockId, t1, childId, instId }
  }

  it('follows definition value + bobPicks changes', () => {
    const { p, t1, instId } = setup()
    // Change definition trait value
    p.traits[t1].value = 'World'
    p.traits[t1].bobPicks = true
    resolveAll(p)
    const inst = p.blocks[instId]
    const instTrait = p.traits[inst.traits[0]]
    expect(instTrait.value).toBe('World')
    expect(instTrait.bobPicks).toBe(true)
  })

  it('follows nested definition name changes', () => {
    const { p, childId, instId } = setup()
    p.blocks[childId].name = 'Renamed'
    resolveAll(p)
    const inst = p.blocks[instId]
    const instChild = p.blocks[inst.children[0]]
    expect(instChild.name).toBe('Renamed')
  })

  it('keeps overridden fields (value override)', () => {
    const { p, instId } = setup()
    const inst = p.blocks[instId]
    const instTrait = p.traits[inst.traits[0]]
    instTrait.ov = { value: true }
    instTrait.value = 'Override'
    // change definition
    p.traits[p.blocks[p.defs['d1'].blockId].traits[0]].value = 'New'
    resolveAll(p)
    expect(instTrait.value).toBe('Override')
  })

  it('keeps the Instance own name', () => {
    const { p, instId } = setup()
    p.blocks[instId].name = 'My own name'
    // definition rename should NOT affect the instance's own name (inst.name is self-set)
    p.blocks[p.defs['d1'].blockId].name = 'Something else'
    resolveAll(p)
    // The instance name is only overridden by ov.name; its own name stays
    expect(p.blocks[instId].name).toBe('My own name')
  })

  it('adds new definition parts', () => {
    const { p, defBlockId, instId } = setup()
    // add a new trait to definition
    const newT = addTrait(p, 'color', '#ff0000')
    p.blocks[defBlockId].traits.push(newT)
    resolveAll(p)
    const inst = p.blocks[instId]
    expect(inst.traits.length).toBe(2)
    const added = p.traits[inst.traits[1]]
    expect(added.from).toBe(newT)
    expect(added.value).toBe('#ff0000')
  })

  it('drops deleted definition parts', () => {
    const { p, defBlockId, instId } = setup()
    const instTraitId = p.blocks[instId].traits[0]
    // remove trait from definition
    p.blocks[defBlockId].traits = []
    resolveAll(p)
    const inst = p.blocks[instId]
    // the instance trait (which had from: t1) should be gone
    expect(inst.traits.length).toBe(0)
    expect(p.traits[instTraitId]).toBeUndefined()
  })

  it('keeps only-here parts (not from def)', () => {
    const { p, instId } = setup()
    const inst = p.blocks[instId]
    // add a trait only on this instance (no from)
    const ownT = addTrait(p, 'color', '#aabbcc')
    inst.traits.push(ownT)
    resolveAll(p)
    expect(p.blocks[instId].traits).toContain(ownT)
  })

  it('removed parts stay gone', () => {
    const { p, t1, instId } = setup()
    const inst = p.blocks[instId]
    inst.removed = [t1]
    // t1 is in removed, so the synced trait should not reappear
    inst.traits = []
    if (p.traits[inst.traits[0]]) delete p.traits[inst.traits[0]]
    resolveAll(p)
    // the definition still has t1, but removed blocks re-insertion
    const inst2 = p.blocks[instId]
    expect(inst2.traits.every(tid => p.traits[tid]?.from !== t1)).toBe(true)
  })

  it('resolveAll numbers a second Instance "Product card 2"', () => {
    const p = emptyProject()
    const defBlockId = addBlock(p, 'card', 'Product card')
    p.defs['d1'] = { id: 'd1', blockId: defBlockId, color: { h: 345, s: 90, l: 71 } }
    p.blocks[defBlockId].defines = 'd1'
    p.next.d = 2
    const inst1 = makeInstance(p, 'd1')
    p.blocks['canvas'].children.push(inst1)
    const inst2 = makeInstance(p, 'd1')
    p.blocks['canvas'].children.push(inst2)
    expect(p.blocks[inst1].name).toBe('Product card 1')
    expect(p.blocks[inst2].name).toBe('Product card 2')
  })
})

describe('addBlock page files', () => {
  it('pages named Home, Our Menu!, Our menu, "" → correct files', () => {
    const p = emptyProject()
    const id1 = addBlock(p, 'page', 'Home')
    expect(p.blocks[id1].file).toBe('index.html')
    const id2 = addBlock(p, 'page', 'Our Menu!')
    expect(p.blocks[id2].file).toBe('our-menu.html')
    const id3 = addBlock(p, 'page', 'Our menu')
    expect(p.blocks[id3].file).toBe('our-menu-2.html')
    const id4 = addBlock(p, 'page', '')
    expect(p.blocks[id4].file).toBe('page.html')
  })
})

describe('applyChange', () => {
  it('records ov.value for a trait value change', () => {
    const p = emptyProject()
    const defBlockId = addBlock(p, 'card', 'Card')
    p.defs['d1'] = { id: 'd1', blockId: defBlockId, color: { h: 345, s: 90, l: 71 } }
    p.blocks[defBlockId].defines = 'd1'
    p.next.d = 2
    const instId = makeInstance(p, 'd1')
    p.blocks['canvas'].children.push(instId)
    // add a trait to def and sync
    const defTrait = addTrait(p, 'text', 'original')
    p.blocks[defBlockId].traits.push(defTrait)
    resolveAll(p)
    const inst = p.blocks[instId]
    const instTraitId = inst.traits[0]

    const after = applyChange(p, q => {
      q.traits[instTraitId].value = 'changed'
    })
    expect(after.traits[instTraitId].ov?.value).toBe(true)
  })

  it('records ov.note for a trait note change', () => {
    const p = emptyProject()
    const defBlockId = addBlock(p, 'card', 'Card')
    p.defs['d1'] = { id: 'd1', blockId: defBlockId, color: { h: 345, s: 90, l: 71 } }
    p.blocks[defBlockId].defines = 'd1'
    p.next.d = 2
    const instId = makeInstance(p, 'd1')
    p.blocks['canvas'].children.push(instId)
    const defTrait = addTrait(p, 'text', 'hello')
    p.blocks[defBlockId].traits.push(defTrait)
    resolveAll(p)
    const inst = p.blocks[instId]
    const instTraitId = inst.traits[0]

    const after = applyChange(p, q => {
      q.traits[instTraitId].note = 'a note'
    })
    expect(after.traits[instTraitId].ov?.note).toBe(true)
  })

  it('leaves the old Project untouched', () => {
    const p = emptyProject()
    const siteId = p.blocks['canvas'].children[0]
    const originalName = p.blocks[siteId].name
    applyChange(p, q => { q.blocks[siteId].name = 'Changed' })
    expect(p.blocks[siteId].name).toBe(originalName)
  })

  it('Bob picks counts as a value change', () => {
    const p = emptyProject()
    const defBlockId = addBlock(p, 'card', 'Card')
    p.defs['d1'] = { id: 'd1', blockId: defBlockId, color: { h: 345, s: 90, l: 71 } }
    p.blocks[defBlockId].defines = 'd1'
    p.next.d = 2
    const instId = makeInstance(p, 'd1')
    p.blocks['canvas'].children.push(instId)
    const defTrait = addTrait(p, 'text', 'hello')
    p.blocks[defBlockId].traits.push(defTrait)
    resolveAll(p)
    const inst = p.blocks[instId]
    const instTraitId = inst.traits[0]

    const after = applyChange(p, q => {
      q.traits[instTraitId].bobPicks = true
    })
    expect(after.traits[instTraitId].ov?.value).toBe(true)
  })

  it('a deleted part goes to removed', () => {
    const p = emptyProject()
    const defBlockId = addBlock(p, 'card', 'Card')
    p.defs['d1'] = { id: 'd1', blockId: defBlockId, color: { h: 345, s: 90, l: 71 } }
    p.blocks[defBlockId].defines = 'd1'
    p.next.d = 2
    const instId = makeInstance(p, 'd1')
    p.blocks['canvas'].children.push(instId)
    const defChild = addBlock(p, 'text', 'Item')
    p.blocks[defBlockId].children.push(defChild)
    resolveAll(p)

    const inst = p.blocks[instId]
    const instChildId = inst.children[0]
    const instChildFrom = p.blocks[instChildId].from!

    const after = applyChange(p, q => {
      // delete the child from the instance
      q.blocks[instId].children = []
      delete q.blocks[instChildId]
    })
    expect(after.blocks[instId].removed).toContain(instChildFrom)
  })

  it('a part dragged out is unlinked', () => {
    const p = emptyProject()
    const defBlockId = addBlock(p, 'card', 'Card')
    p.defs['d1'] = { id: 'd1', blockId: defBlockId, color: { h: 345, s: 90, l: 71 } }
    p.blocks[defBlockId].defines = 'd1'
    p.next.d = 2
    const instId = makeInstance(p, 'd1')
    p.blocks['canvas'].children.push(instId)
    const defChild = addBlock(p, 'text', 'Item')
    p.blocks[defBlockId].children.push(defChild)
    resolveAll(p)

    const inst = p.blocks[instId]
    const instChildId = inst.children[0]

    const after = applyChange(p, q => {
      // drag the child to the canvas (out of the instance)
      q.blocks[instId].children = []
      q.blocks['canvas'].children.push(instChildId)
      q.blocks[instChildId].pos = { x: 100, y: 100 }
    })
    expect(after.blocks[instChildId].from).toBeUndefined()
    expect(after.blocks[instChildId].ov).toBeUndefined()
  })
})

describe('makeCustomBlock', () => {
  it('swaps the Block for Instance 1 in children and layout', () => {
    const p = emptyProject()
    const siteId = p.blocks['canvas'].children[0]
    const cardId = addBlock(p, 'card', 'Product card')
    p.blocks[siteId].children.push(cardId)
    p.blocks[siteId].layout = { d: 'col', k: [cardId] }

    makeCustomBlock(p, cardId)

    const def = Object.values(p.defs)[0]
    const instId = p.blocks[siteId].children.find(id => p.blocks[id]?.inst === def.id)
    expect(instId).toBeTruthy()
    expect(p.blocks[siteId].children).not.toContain(cardId)
    // layout updated
    expect(JSON.stringify(p.blocks[siteId].layout)).toContain(instId)
  })

  it('keeps a loose Block pos on the Instance', () => {
    const p = emptyProject()
    const cardId = addBlock(p, 'card', 'My card')
    p.blocks[cardId].pos = { x: 200, y: 300 }
    p.blocks['canvas'].children.push(cardId)

    makeCustomBlock(p, cardId)

    const def = Object.values(p.defs)[0]
    const instId = p.blocks['canvas'].children.find(id => p.blocks[id]?.inst === def.id)!
    expect(p.blocks[instId].pos).toEqual({ x: 200, y: 300 })
    expect(p.blocks[def.blockId].pos).toBeUndefined()
  })

  it('first colors 345 then 15', () => {
    const p = emptyProject()
    const id1 = addBlock(p, 'card', 'A')
    makeCustomBlock(p, id1)
    const def1 = Object.values(p.defs)[0]
    expect(def1.color).toEqual({ h: 345, s: 90, l: 71 })

    const id2 = addBlock(p, 'card', 'B')
    makeCustomBlock(p, id2)
    const def2 = Object.values(p.defs).find(d => d.id !== def1.id)!
    expect(def2.color).toEqual({ h: 15, s: 90, l: 71 })
  })

  it('newCustomBlock is a box "My block"', () => {
    const p = emptyProject()
    const defId = newCustomBlock(p)
    const def = p.defs[defId]
    const block = p.blocks[def.blockId]
    expect(block.type).toBe('box')
    expect(block.name).toBe('My block')
    // no instance created
    const instances = canvasBlocks(p).filter(b => b.inst === defId)
    expect(instances).toHaveLength(0)
  })
})

describe('definition rename follows instances', () => {
  it('follows definition renames except where an Instance changed', () => {
    const p = emptyProject()
    // simulate a Top bar definition
    const defBlockId = addBlock(p, 'navbar', 'Top bar')
    const menuBtnId = addBlock(p, 'button', 'Menu')
    p.blocks[defBlockId].children.push(menuBtnId)
    p.defs['d1'] = { id: 'd1', blockId: defBlockId, color: { h: 345, s: 90, l: 71 } }
    p.blocks[defBlockId].defines = 'd1'
    p.next.d = 2

    const inst1Id = makeInstance(p, 'd1')
    p.blocks['canvas'].children.push(inst1Id)
    const inst2Id = makeInstance(p, 'd1')
    p.blocks['canvas'].children.push(inst2Id)

    resolveAll(p)

    // Manually override child name on inst1's child
    const inst1Child = p.blocks[inst1Id].children[0]
    p.blocks[inst1Child].ov = { name: true }
    p.blocks[inst1Child].name = 'Changed Menu'

    // Rename definition child
    p.blocks[menuBtnId].name = 'Nav Menu'
    resolveAll(p)

    // inst1's child has override, should keep its name
    expect(p.blocks[inst1Child].name).toBe('Changed Menu')

    // inst2's child should follow the definition
    const inst2Child = p.blocks[inst2Id].children[0]
    expect(p.blocks[inst2Child].name).toBe('Nav Menu')
  })

  it("the Instance's own name is never an override", () => {
    const p = emptyProject()
    const defBlockId = addBlock(p, 'card', 'Product card')
    p.defs['d1'] = { id: 'd1', blockId: defBlockId, color: { h: 345, s: 90, l: 71 } }
    p.blocks[defBlockId].defines = 'd1'
    p.next.d = 2
    const instId = makeInstance(p, 'd1')
    p.blocks['canvas'].children.push(instId)

    // Instance name is auto-set, not an override
    expect(p.blocks[instId].ov?.name).toBeFalsy()

    // Changing the instance name via applyChange should set ov.name
    // but the instance itself (root) is exempt from ov.name tracking
    const after = applyChange(p, q => {
      q.blocks[instId].name = 'Custom name'
    })
    // The root inst itself: ov.name is NOT set (it's the root block)
    expect(after.blocks[instId].ov?.name).toBeFalsy()
  })
})

describe('hasOverride', () => {
  it('returns false with no ov', () => {
    expect(hasOverride({})).toBe(false)
    expect(hasOverride({ ov: {} })).toBe(false)
  })

  it('returns true with a set field', () => {
    expect(hasOverride({ ov: { name: true } })).toBe(true)
    expect(hasOverride({ ov: { value: true } })).toBe(true)
    expect(hasOverride({ ov: { note: true } })).toBe(true)
  })
})

describe("demo's Top bar", () => {
  it('follows definition renames except the one an Instance changed', () => {
    // Reproduce the demo's Top bar definition with two child buttons
    const p = demoProject()
    const def = p.defs['d1']
    const defBlock = p.blocks[def.blockId]
    // instances on the canvas
    const instances = Object.values(p.blocks).filter(b => b.inst === 'd1')
    // rename the definition's "Menu" button child
    const menuBtnId = defBlock.children[0]
    p.blocks[menuBtnId].name = 'Nav'
    resolveAll(p)
    // One instance that we manually override the Menu child name
    const inst1 = instances[0]
    const inst1MenuBtn = p.blocks[inst1.id].children[0]
    p.blocks[inst1MenuBtn].ov = { name: true }
    p.blocks[inst1MenuBtn].name = 'Custom'
    // Re-resolve
    p.blocks[menuBtnId].name = 'Navigation'
    resolveAll(p)
    // inst1's Menu button kept its override
    expect(p.blocks[inst1MenuBtn].name).toBe('Custom')
    // other instances follow the definition
    const inst2 = instances[1]
    const inst2MenuBtn = p.blocks[inst2.id].children[0]
    expect(p.blocks[inst2MenuBtn].name).toBe('Navigation')
  })
})
