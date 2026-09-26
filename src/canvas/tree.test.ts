import { describe, expect, it } from 'vitest'
import { builtSite, demoProject } from '../fixtures/fixtures.ts'
import { addBlock } from '../model/project.ts'
import type { Project } from '../model/types.ts'
import {
  canDrop,
  canTrash,
  dropItem,
  insertInto,
  onClickOptions,
  parentMap,
  removeItem,
} from './tree.ts'

// Helper: get a fresh demo project
function demo(): Project {
  return demoProject()
}

// Helper: find a block id by name
function bid(p: Project, name: string): string {
  const b = Object.values(p.blocks).find(b => b.name === name)
  if (!b) throw new Error(`Block not found: ${name}`)
  return b.id
}

describe('tree', () => {
  it('new Block into a Page', () => {
    const p = demo()
    const home = bid(p, 'Home')
    const beforeLen = p.blocks[home].children.length
    dropItem(p, { kind: 'newBlock', type: 'text' }, { id: home })
    expect(p.blocks[home].children.length).toBe(beforeLen + 1)
    const newId = p.blocks[home].children[p.blocks[home].children.length - 1]
    expect(p.blocks[newId].type).toBe('text')
  })

  it('beside in a column splits into a row', () => {
    // layout: col [a, b]. Insert c beside a → col [{row [a, c]}, b]
    const p = demo()
    const a = addBlock(p, 'text', 'A')
    const b = addBlock(p, 'text', 'B')
    const c = addBlock(p, 'text', 'C')
    const result = insertInto({ d: 'col', k: [a, b] }, c, { where: 'right', ref: a })
    expect(result).toEqual({ d: 'col', k: [{ d: 'row', k: [a, c] }, b] })
  })

  it('a ref not in the tree goes to the end', () => {
    expect(insertInto({ d: 'col', k: ['a'] }, 'c', { where: 'left', ref: 'gone' })).toEqual({ d: 'col', k: ['a', 'c'] })
  })

  it('a loose Trait gets a pos on the Canvas and loses it in a Block', () => {
    const p = demo()
    const t = dropItem(p, { kind: 'newTrait', type: 'color' }, { id: 'canvas', pos: { x: 5, y: 6 } })
    expect(p.traits[t].pos).toEqual({ x: 5, y: 6 })
    dropItem(p, { kind: 'trait', id: t }, { id: bid(p, 'Home') })
    expect(p.traits[t].pos).toBeUndefined()
  })

  it('rowBefore', () => {
    const a = 'blockA', b = 'blockB', c = 'blockC'
    const layout = { d: 'col' as const, k: [a, b] }
    const result = insertInto(layout, c, { where: 'rowBefore', ref: b })
    expect(result).toEqual({ d: 'col', k: [a, c, b] })
  })

  it('moving out to Canvas sets pos, moving back clears pos', () => {
    const p = demo()
    const home = bid(p, 'Home')
    const heroId = p.blocks[home].children.find(id => p.blocks[id]?.type === 'hero')!
    expect(heroId).toBeTruthy()

    // Move hero out to canvas
    dropItem(p, { kind: 'block', id: heroId }, { id: 'canvas', pos: { x: 100, y: 200 } })
    expect(p.blocks['canvas'].children).toContain(heroId)
    expect(p.blocks[heroId].pos).toEqual({ x: 100, y: 200 })

    // Move back into the page
    dropItem(p, { kind: 'block', id: heroId }, { id: home })
    expect(p.blocks[home].children).toContain(heroId)
    expect(p.blocks[heroId].pos).toBeUndefined()
  })

  it('Traits at an index', () => {
    const p = demo()
    const home = bid(p, 'Home')
    // drop two traits and check indexing
    const beforeCount = p.blocks[home].traits.length
    dropItem(p, { kind: 'newTrait', type: 'text' }, { id: home, tIdx: 0 })
    expect(p.blocks[home].traits.length).toBe(beforeCount + 1)
    const firstId = p.blocks[home].traits[0]
    expect(p.traits[firstId]?.type).toBe('text')
  })

  it('Traits between Blocks (tIdx at position 1)', () => {
    const p = demo()
    const home = bid(p, 'Home')
    // first add a trait to ensure there's something at index 0
    dropItem(p, { kind: 'newTrait', type: 'color' }, { id: home })
    const traitsBefore = p.blocks[home].traits.slice()
    dropItem(p, { kind: 'newTrait', type: 'vibe' }, { id: home, tIdx: 1 })
    const traits = p.blocks[home].traits
    // the vibe trait should be at position 1
    expect(p.traits[traits[1]]?.type).toBe('vibe')
    expect(traits.length).toBe(traitsBefore.length + 1)
  })

  describe('canDrop rules', () => {
    it('Page cannot drop into leaf block (text)', () => {
      const p = demo()
      const textId = Object.values(p.blocks).find(b => b.type === 'text')!.id
      const result = canDrop(p, { kind: 'newBlock', type: 'page' }, textId)
      expect(result).toBe(false)
    })

    it('leaf block (text) cannot accept another block', () => {
      const p = demo()
      const textId = Object.values(p.blocks).find(b => b.type === 'text')!.id
      const result = canDrop(p, { kind: 'newBlock', type: 'text' }, textId)
      expect(result).toBe(false)
    })

    it('cannot drop block into itself', () => {
      const p = demo()
      const heroId = Object.values(p.blocks).find(b => b.type === 'hero')!.id
      const result = canDrop(p, { kind: 'block', id: heroId }, heroId)
      expect(result).toBe(false)
    })

    it('Instance in Instance is forbidden', () => {
      const p = demo()
      const instId = Object.values(p.blocks).find(b => b.inst === 'd1')!.id
      const result = canDrop(p, { kind: 'newInstance', defId: 'd1' }, instId)
      expect(result).toBe(false)
    })

    it('Trait items can always drop', () => {
      const p = demo()
      const heroId = Object.values(p.blocks).find(b => b.type === 'hero')!.id
      const result = canDrop(p, { kind: 'newTrait', type: 'color' }, heroId)
      expect(result).toBe(true)
    })
  })

  it('the Checkpoint Block moves only on the Canvas', () => {
    const { project: p } = builtSite()
    const cp = Object.values(p.blocks).find(b => b.type === 'checkpoint')!
    const parents = parentMap(p)
    expect(parents.get(cp.id)).toBe('canvas')
    const builtPage = Object.values(p.blocks).find(b => b.type === 'page' && b.locked)!
    const pageParent = parents.get(builtPage.id)!
    // Moving locked page to its current parent is allowed
    expect(canDrop(p, { kind: 'block', id: builtPage.id }, pageParent)).toBe(true)
    // Moving locked page to canvas (not its parent) is not allowed
    expect(canDrop(p, { kind: 'block', id: builtPage.id }, 'canvas')).toBe(false)
  })

  it('a Built page reorders only inside its Checkpoint Block and stays locked', () => {
    const { project: p } = builtSite()
    const cp = Object.values(p.blocks).find(b => b.type === 'checkpoint')!
    const builtPage = p.blocks[cp.children[0]]
    expect(builtPage.locked).toBe(true)
    expect(canDrop(p, { kind: 'block', id: builtPage.id }, 'canvas')).toBe(false)
    expect(canDrop(p, { kind: 'block', id: builtPage.id }, cp.id)).toBe(true)
  })

  describe('canTrash', () => {
    it('never on Site', () => {
      const p = demo()
      const site = p.blocks['canvas'].children[0]
      expect(canTrash(p, { kind: 'block', id: site })).toBe(false)
    })

    it('never on Checkpoint', () => {
      const { project: p } = builtSite()
      const cp = Object.values(p.blocks).find(b => b.type === 'checkpoint')!
      expect(canTrash(p, { kind: 'block', id: cp.id })).toBe(false)
    })

    it('never on Built page', () => {
      const { project: p } = builtSite()
      const builtPage = Object.values(p.blocks).find(b => b.type === 'page' && b.locked)!
      expect(canTrash(p, { kind: 'block', id: builtPage.id })).toBe(false)
    })

    it('never on a definition block', () => {
      const p = demo()
      const def = Object.values(p.blocks).find(b => !!b.defines)!
      expect(canTrash(p, { kind: 'block', id: def.id })).toBe(false)
    })

    it('true for a trait', () => {
      const p = demo()
      const site = p.blocks['canvas'].children[0]
      const t = p.blocks[site].traits[0]
      expect(canTrash(p, { kind: 'trait', id: t })).toBe(true)
    })
  })

  it('removeItem deletes everything inside', () => {
    const p = demo()
    const home = bid(p, 'Home')
    const heroId = p.blocks[home].children.find(id => p.blocks[id]?.type === 'hero')!
    const heroChildren = [...p.blocks[heroId].children]
    const heroTraits = [...p.blocks[heroId].traits]
    removeItem(p, heroId)
    expect(p.blocks[heroId]).toBeUndefined()
    for (const cid of heroChildren) expect(p.blocks[cid]).toBeUndefined()
    for (const t of heroTraits) expect(p.traits[t]).toBeUndefined()
    expect(p.blocks[home].children).not.toContain(heroId)
  })

  it('onClickOptions for the demo Order button (exact list)', () => {
    const p = demo()
    // Find the Order button: the button named 'Order' with onclick trait pointing to popup
    const orderBtn = Object.values(p.blocks).find(
      b => b.name === 'Order' && b.type === 'button' && b.traits.some(tid => p.traits[tid]?.value?.startsWith('popup:'))
    )!
    const onclickTraitId = orderBtn.traits.find(tid => p.traits[tid]?.type === 'onclick')!
    const options = onClickOptions(p, onclickTraitId)
    const labels = options.map(o => o.label)
    expect(labels[0]).toBe('pick one')
    expect(labels[1]).toBe('go to page › Home')
    expect(labels[2]).toBe('go to page › Menu')
    expect(labels[3]).toBe('go to page › Quiz')
    expect(labels[4]).toBe('open popup › Order')
    expect(labels[5]).toBe('submits (fake)')
    expect(labels[6]).toBe('adds to cart (fake)')
    expect(labels[7]).toBe("shows / hides what's inside")
    expect(labels[8]).toBe('adds to a list')
    expect(labels[9]).toBe('checks an answer')
    expect(labels[10]).toBe('counts clicks')
    expect(labels[11]).toBe('remembers on this device')
    expect(labels.length).toBe(12)
    expect(labels).not.toContain('plays a sound')
  })

  it('loose Pages never listed in onClickOptions', () => {
    const p = demo()
    const loosePage = addBlock(p, 'page', 'Loose')
    p.blocks['canvas'].children.push(loosePage)
    const orderBtn = Object.values(p.blocks).find(
      b => b.name === 'Order' && b.type === 'button' && b.traits.some(tid => p.traits[tid]?.value?.startsWith('popup:'))
    )!
    const onclickTraitId = orderBtn.traits.find(tid => p.traits[tid]?.type === 'onclick')!
    const options = onClickOptions(p, onclickTraitId)
    const labels = options.map(o => o.label)
    expect(labels).not.toContain('go to page › Loose')
  })

  it('a deleted target shows missing', () => {
    const p = demo()
    const orderBtn = Object.values(p.blocks).find(
      b => b.name === 'Order' && b.type === 'button' && b.traits.some(tid => p.traits[tid]?.value?.startsWith('popup:'))
    )!
    const onclickTraitId = orderBtn.traits.find(tid => p.traits[tid]?.type === 'onclick')!
    const val = p.traits[onclickTraitId].value
    const popupId = val.replace('popup:', '')
    removeItem(p, popupId)
    const options = onClickOptions(p, onclickTraitId)
    const missing = options.find(o => o.missing)
    expect(missing).toBeTruthy()
    expect(missing?.label).toBe('open missing popup')
  })

  it('newInstance drop names "Top bar 4"', () => {
    const p = demo()
    const instances = Object.values(p.blocks).filter(b => b.inst === 'd1')
    expect(instances.length).toBe(3)
    const home = bid(p, 'Home')
    dropItem(p, { kind: 'newInstance', defId: 'd1' }, { id: home })
    const newInst = Object.values(p.blocks).find(
      b => b.inst === 'd1' && !instances.find(i => i.id === b.id)
    )!
    expect(newInst.name).toBe('Top bar 4')
  })

  it('Custom Blocks never inside Custom Blocks', () => {
    const p = demo()
    const inst = Object.values(p.blocks).find(b => b.inst === 'd1')!
    expect(canDrop(p, { kind: 'newInstance', defId: 'd2' }, inst.id)).toBe(false)
    const defBlock = p.blocks[Object.values(p.defs)[0].blockId]
    expect(canDrop(p, { kind: 'newInstance', defId: 'd2' }, defBlock.id)).toBe(false)
  })
})
