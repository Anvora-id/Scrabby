import { describe, expect, it } from 'vitest'
import { demoProject } from '../fixtures/fixtures.ts'
import { addBlock } from '../model/project.ts'
import type { Project } from '../model/types.ts'
import { tipFor } from './tooltip.ts'

function demo(): Project {
  return demoProject()
}

describe('tooltip', () => {
  it('palette block text (nb:<type>)', () => {
    const p = demo()
    const tip = tipFor(p, 'nb:hero')
    expect(tip).not.toBeNull()
    expect(tip!.title).toBe('Hero')
    expect(tip!.text).toContain('big first thing')
    expect(tip!.cat).toBe('ui')
  })

  it('palette trait text (nt:<type>)', () => {
    const p = demo()
    const tip = tipFor(p, 'nt:color')
    expect(tip).not.toBeNull()
    expect(tip!.title).toBe('color')
    expect(tip!.cat).toBe('design')
  })

  it('"the Site" when no Checkpoint Block on canvas', () => {
    const p = demo()
    // No checkpoint block on canvas in demo; add a loose page to check
    const pageId = addBlock(p, 'page', 'Loose page')
    p.blocks['canvas'].children.push(pageId)
    const tip = tipFor(p, `b:${pageId}`)
    expect(tip!.text).toContain('the Site')
  })

  it('"the Checkpoint" when Checkpoint Block is on Canvas', () => {
    const p = demo()
    const cpId = addBlock(p, 'checkpoint' as any, 'Checkpoint')
    p.blocks['canvas'].children.push(cpId)
    // loose page
    const pageId = addBlock(p, 'page', 'Loose')
    p.blocks['canvas'].children.push(pageId)
    const tip = tipFor(p, `b:${pageId}`)
    expect(tip!.text).toContain('the Checkpoint')
  })

  it('loose line for a loose block', () => {
    const p = demo()
    const looseId = addBlock(p, 'section', 'Floating')
    p.blocks['canvas'].children.push(looseId)
    const tip = tipFor(p, `b:${looseId}`)
    expect(tip!.loose).toBeDefined()
    expect(tip!.loose).toContain('Loose idea')
  })

  it('no loose line for a block inside the site', () => {
    const p = demo()
    const hero = Object.values(p.blocks).find(b => b.type === 'hero')!
    const tip = tipFor(p, `b:${hero.id}`)
    expect(tip!.loose).toBeUndefined()
  })

  it('Checkpoint Block tip (cat: null)', () => {
    const p = demo()
    const cpId = addBlock(p, 'checkpoint' as any, 'Checkpoint')
    p.blocks['canvas'].children.push(cpId)
    const tip = tipFor(p, `b:${cpId}`)
    expect(tip!.title).toBe('Checkpoint')
    expect(tip!.cat).toBeNull()
  })

  it('Built page tip (cat: null)', () => {
    const p = demo()
    const pageId = addBlock(p, 'page', 'Home')
    p.blocks[pageId].locked = true
    p.blocks['canvas'].children.push(pageId)
    const tip = tipFor(p, `b:${pageId}`)
    expect(tip!.title).toBe('Built page')
    expect(tip!.cat).toBeNull()
  })

  it('gone id → null', () => {
    const p = demo()
    expect(tipFor(p, 'b:gone999')).toBeNull()
    expect(tipFor(p, 't:gone999')).toBeNull()
  })

  it('trait tip', () => {
    const p = demo()
    const site = p.blocks['canvas'].children[0]
    const tid = p.blocks[site].traits[0]
    const tip = tipFor(p, `t:${tid}`)
    expect(tip).not.toBeNull()
    expect(tip!.cat).not.toBeNull()
  })

  it('palette Page text fills {where}', () => {
    expect(tipFor(demo(), 'nb:page')!.text).toBe('One page of your website. Put it inside the Site.')
  })
})
