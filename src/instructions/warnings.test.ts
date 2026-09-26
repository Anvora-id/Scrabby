import { describe, expect, it } from 'vitest'
import { builtSite, demoProject } from '../fixtures/fixtures.ts'
import { addBlock, addTrait, emptyProject } from '../model/project.ts'
import type { Project, TraitType } from '../model/types.ts'
import { removeItem } from '../canvas/tree.ts'
import { warnings } from './warnings.ts'

const find = (p: Project, name: string, type?: string) =>
  Object.values(p.blocks).find(b => b.name === name && (!type || b.type === type))!.id
const trait = (p: Project, block: string, type: TraitType, value?: string) => {
  const t = addTrait(p, type, value)
  p.blocks[block].traits.push(t)
  return t
}
const rules = (p: Project) => warnings(p).map(w => w.rule)

function demo() {
  const p = demoProject()
  const site = p.blocks.canvas.children[0]
  const [home, menu, quiz] = p.blocks[site].children
  const order = find(p, 'Order', 'popup')
  const orderButton = find(p, 'Order', 'button')
  return { p, site, home, menu, quiz, order, orderButton, hero: find(p, 'Big welcome'), click: p.blocks[orderButton].traits[0] }
}

describe('warnings', () => {
  it('finds nothing in the demo or the built site', () => {
    expect(warnings(demoProject())).toEqual([])
    expect(warnings(builtSite().project)).toEqual([])
  })

  it('stops with no Site', () => {
    const p = emptyProject()
    p.blocks.canvas.children = []
    expect(warnings(p)).toEqual([{ kind: 'stop', rule: 'nosite', target: null, where: '', text: 'There is no Site Block.', todo: 'Add a Page inside your Site first.', key: 'nosite' }])
  })

  it('stops with no Page', () => {
    const p = emptyProject()
    const site = p.blocks.canvas.children[0]
    expect(warnings(p)).toEqual([{ kind: 'stop', rule: 'nopage', target: site, where: '', text: 'Your Site has no Page.', todo: 'Add a Page inside your Site first.', key: 'nopage' }])
  })

  it('marks both Top bar Quiz links with one key after deleting Quiz', () => {
    const { p, quiz } = demo()
    removeItem(p, quiz)
    const ws = warnings(p)
    expect(ws.map(w => w.rule)).toEqual(['deadpage', 'deadpage'])
    expect(ws[0].key).toBe(ws[1].key)
    expect(ws.map(w => w.def)).toEqual(['d1', 'd1'])
    expect(ws.map(w => w.where)).toEqual(['Home › Top bar 1 › Quiz', 'Menu › Top bar 2 › Quiz'])
    expect(ws[0]).toMatchObject({
      kind: 'skip',
      text: 'The "Quiz" button goes to a page that no longer exists.',
      todo: 'Pick another page, or remove the link. If you build now, Bob makes it do nothing.',
      source: p.traits[ws[0].target!].from,
      key: `deadpage:${p.traits[ws[0].target!].from}`,
    })
  })

  it('counts an overridden part alone', () => {
    const { p, quiz } = demo()
    removeItem(p, quiz)
    const first = warnings(p)[0].target!
    p.traits[first].ov = { value: true }
    const ws = warnings(p)
    expect(ws[0].key).toBe(`deadpage:${first}`)
    expect(ws[0].def).toBeUndefined()
    expect(ws[1].def).toBe('d1')
  })

  it('finds a deleted popup', () => {
    const { p, click } = demo()
    p.traits[click].value = 'popup:b999'
    const ws = warnings(p)
    expect(ws.map(w => w.rule)).toEqual(['deadpopup', 'lonepopup'])
    expect(ws[0]).toMatchObject({ kind: 'skip', target: click, text: 'The "Order" button opens a popup that no longer exists.', todo: 'Pick another action, or remove it.' })
  })

  it('treats a popup on another Page as deleted and alone', () => {
    const { p, home, menu, order, click } = demo()
    p.blocks[home].children = p.blocks[home].children.filter(c => c !== order)
    p.blocks[menu].children.push(order)
    const ws = warnings(p)
    expect(ws.map(w => [w.rule, w.target, w.where])).toEqual([
      ['deadpopup', click, 'Home › Big welcome › Order'],
      ['lonepopup', order, 'Menu › Order'],
    ])
    expect(ws[1]).toMatchObject({ kind: 'look', text: 'Nothing opens the "Order" popup, so visitors never see it.', todo: 'Give a button "on click › open popup", or tell Bob when it opens.' })
  })

  it('finds an on click with nothing picked, unless Bob picks', () => {
    const { p, click } = demo()
    p.traits[click].value = ''
    const ws = warnings(p)
    expect(ws.map(w => [w.rule, w.where])).toEqual([['noaction', 'Home › Big welcome › Order'], ['lonepopup', 'Home › Order']])
    expect(ws[0]).toMatchObject({ kind: 'skip', text: 'The "Order" button has an "on click" with nothing picked.', todo: 'Pick what happens on click, or remove it.' })
    p.traits[click].bobPicks = true
    expect(rules(p)).toEqual(['lonepopup'])
  })

  it('finds image, video and sound Traits with nothing picked', () => {
    const { p, hero } = demo()
    for (const type of ['image', 'video', 'sound'] as const) trait(p, hero, type)
    const ws = warnings(p)
    expect(ws.map(w => w.rule)).toEqual(['noasset', 'noasset', 'noasset'])
    expect(ws.map(w => w.text)).toEqual([
      'The image Trait on the "Big welcome" hero has no picture picked.',
      'The video Trait on the "Big welcome" hero has no video picked.',
      'The sound Trait on the "Big welcome" hero has no sound picked.',
    ])
    expect(ws[0]).toMatchObject({ kind: 'skip', todo: 'Pick one from the Library, or remove the Trait.' })
  })

  it('finds a deleted Asset', () => {
    const { p } = demo()
    p.assets = p.assets.filter(a => a.id !== 'a1')
    expect(warnings(p)).toMatchObject([{
      kind: 'skip', rule: 'deletedasset', where: 'Home › Big welcome › Frame',
      text: 'The picture for the "Frame" frame was deleted from the Library.',
      todo: 'Pick another one from the Library, or remove the Trait.',
    }])
  })

  it('finds a Page nothing links to and an empty Page', () => {
    const { p, site } = demo()
    const about = addBlock(p, 'page', 'About')
    p.blocks[site].children.push(about)
    expect(warnings(p)).toEqual([
      { kind: 'look', rule: 'lonepage', target: about, where: 'About', key: `lonepage:${about}`, text: 'Nothing links to the "About" page.', todo: 'Visitors can only reach it by typing its address. Link to it from a button or the menu.' },
      { kind: 'look', rule: 'emptypage', target: about, where: 'About', key: `emptypage:${about}`, text: 'The "About" page is empty.', todo: 'Bob will guess what goes on it. Add Blocks, or say what it is for.' },
    ])
    trait(p, about, 'letbobpick', '')
    expect(warnings(p)).toEqual([])
    p.blocks[about].traits = []
    p.blocks[about].note = 'For the story of the bakery'
    expect(warnings(p)).toEqual([])
  })

  it('finds empty values and lets a Trait Note or a tell Bob clear them', () => {
    const { p, hero } = demo()
    const text = trait(p, hero, 'text', '')
    const vibe = trait(p, hero, 'vibe', '')
    const ws = warnings(p)
    expect(ws.map(w => [w.kind, w.rule, w.text])).toEqual([
      ['look', 'emptyvalue', 'The text Trait on the "Big welcome" hero is empty, so Bob will write the words.'],
      ['look', 'emptyvalue', 'The vibe Trait on the "Big welcome" hero is empty, so Bob will choose one.'],
    ])
    expect(ws[0].todo).toBe('Fill it in, or hand it to Bob.')
    p.traits[text].note = 'a warm hello'
    expect(warnings(p).map(w => w.target)).toEqual([vibe])
    trait(p, hero, 'tellbob', 'make it cozy')
    expect(warnings(p)).toEqual([])
  })

  it('never clears a "Bob skips it" Warning with a Note or a tell Bob', () => {
    const { p, hero } = demo()
    const img = trait(p, hero, 'image')
    p.traits[img].note = 'a cake'
    trait(p, hero, 'tellbob', 'make it cozy')
    p.blocks[hero].note = 'The first thing people see'
    expect(rules(p)).toEqual(['noasset'])
  })

  it('always marks an empty tell Bob and never an empty let Bob pick', () => {
    const { p, hero } = demo()
    trait(p, hero, 'letbobpick', '')
    expect(warnings(p)).toEqual([])
    trait(p, hero, 'tellbob', '')
    p.blocks[hero].note = 'The first thing people see'
    expect(warnings(p)).toMatchObject([{ kind: 'look', rule: 'emptytellbob', text: 'The "tell Bob" on the "Big welcome" hero is empty.', todo: 'Type what Bob should know, or remove it.' }])
  })

  it('lets only an empty let Bob pick above cover a Popup', () => {
    const { p, home, click } = demo()
    p.traits[click].bobPicks = true
    const lbp = trait(p, home, 'letbobpick', 'the colors')
    expect(rules(p)).toEqual(['lonepopup'])
    p.traits[lbp].value = ''
    expect(rules(p)).toEqual([])
  })

  it('never marks loose ideas', () => {
    const { p } = demo()
    const loose = addBlock(p, 'page', 'Loose')
    p.blocks.canvas.children.push(loose)
    p.blocks.canvas.traits.push(addTrait(p, 'tellbob', ''))
    expect(warnings(p)).toEqual([])
  })

  it("checks the Checkpoint Block's new items, never its Built pages", () => {
    const p = builtSite().project
    const top = p.blocks.canvas.children.find(id => p.blocks[id].type === 'checkpoint')!
    trait(p, top, 'text', '')
    const page = addBlock(p, 'page', 'Contact')
    p.blocks[top].children.push(page)
    const ws = warnings(p)
    expect(ws.map(w => [w.rule, w.where])).toEqual([['emptyvalue', ''], ['lonepage', 'Contact'], ['emptypage', 'Contact']])
    expect(ws[0].text).toBe('The text Trait on the "Maya\'s bake sale" checkpoint is empty, so Bob will write the words.')
  })
})
