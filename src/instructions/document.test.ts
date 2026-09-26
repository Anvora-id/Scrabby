import { describe, expect, it } from 'vitest'
import headerFile from '../../skills/instruction-header.md?raw'
import { builtSite, demoProject } from '../fixtures/fixtures.ts'
import { addBlock, addTrait, emptyProject } from '../model/project.ts'
import type { Project, TraitType } from '../model/types.ts'
import { removeItem } from '../canvas/tree.ts'
import { instructionDocument } from './document.ts'

const [HEADER, EXTRA_LINE] = [...headerFile.replace(/\r\n/g, '\n').matchAll(/```markdown\n([\s\S]*?)```/g)].map(m => m[1].trimEnd())

const APPENDIX_A = `## Block types used

- Site: The whole website; its Traits describe every page.
- Page: One page of the website, in its own \`.html\` file.
- Navbar: The bar of links for getting around the site.
- Hero: The big eye-catching banner at the top of a page, usually with a headline, an image and a button.
- Section: One band of a page that groups content with one purpose.
- Card grid: A grid of similar Cards. Repeat the Cards to a full grid with varied content only if a "fake data" Trait asks for it; otherwise show the Cards placed.
- Card: A small box that shows one thing, usually an image, a title and a short text.
- Form: Fields a visitor fills in and sends; sending is fake and shows a success message.
- Popup: A box that opens over the page and has a way to close it. It stays closed unless an "on click" opens it, a Note or "tell Bob" says when it opens, or a "let Bob pick" covers it.
- Footer: The strip at the bottom with small print, contact details and links.
- Textbox: Words: a heading, paragraph or label, whichever fits.
- Frame: One picture. With no image Trait, a plain placeholder box labelled with the Block's name; a Library Asset only under "let Bob pick".
- Button: Something a visitor clicks.

## Site "Maya's bake sale" #b1

- color (main color of this Block; decide where it shows, keep text readable): pink (#F8BBD0)
- vibe (overall feel: wording, shapes, spacing, motion): playful
- font (typeface for this Block's text): friendly

### Page "Home" (index.html) #b2

- Navbar "Top bar 1" (Instance of "Top bar") #b17
  - Button "Menu" #b18
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b19
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Hero "Big welcome" #b16
  - Textbox "Textbox" #b15
    - text (exact words to show, as written): "Fresh cakes every Saturday"
  - Frame "Frame" #b14
    - image (show this picture): assets/cupcakes.png
  - Button "Order" #b13
    - on click (when a visitor clicks this Block): open "Order" popup #b12
- Popup "Order" #b12
  - Form "Order form" #b11
    - Button "Button" #b10
      - on click (when a visitor clicks this Block): submits (fake)
- Footer "Bottom 1" (Instance of "Bottom") #b20
  - Textbox "Textbox" #b21

### Page "Menu" (menu.html) #b3

- Navbar "Top bar 2" (Instance of "Top bar") #b24
  - Button "Menu" #b25
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b26
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Card grid "Cakes" #b23
  - fake data (fill with made-up content as described): "6 cakes with prices"
  - Card "Card" #b22
    - image (show this picture): you choose
- Footer "Bottom 2" (Instance of "Bottom") #b27
  - Textbox "Textbox" #b28

### Page "Quiz" (quiz.html) #b4

- Navbar "Top bar 3" (Instance of "Top bar") #b31
  - Button "Menu" #b32
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b33
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Section "Which cupcake are you?" #b30
  - The user says: "3 questions, then show which cupcake you are"
  - Button "Button" #b29
    - on click (when a visitor clicks this Block): checks an answer
- Footer "Bottom 3" (Instance of "Bottom") #b34
  - Textbox "Textbox" #b35

## Custom Blocks

- Navbar "Top bar"
  - Button "Menu"
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz"
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Footer "Bottom"
  - Textbox "Textbox"

## Library

- assets/cupcakes.png: image, 1200×800 px, used by a Trait
- assets/layer-cake.png: image, 1200×800 px
- assets/cookies.png: image, 1200×800 px
- assets/bake-stall.png: image, 1200×800 px
`

const find = (p: Project, name: string, type?: string) =>
  Object.values(p.blocks).find(b => b.name === name && (!type || b.type === type))!.id
const trait = (p: Project, block: string, type: TraitType, value?: string) => {
  const t = addTrait(p, type, value)
  p.blocks[block].traits.push(t)
  return t
}
function doc(p: Project) {
  const r = instructionDocument(p)
  if ('error' in r) throw new Error(r.error)
  return r
}

describe('instructionDocument', () => {
  it("equals Appendix A for the demo's Build 1", () => {
    expect(doc(demoProject()).document).toBe(`${HEADER}\n\n${APPENDIX_A}`)
    expect(doc(demoProject()).skipped).toEqual([])
    const d = doc(demoProject()).document
    expect(d).toContain('- on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3')
    expect(d).toContain('- on click (when a visitor clicks this Block): open "Order" popup #b12')
    expect(d).toContain('- on click (when a visitor clicks this Block): submits (fake)')
  })

  it('stops with no Site or no Page', () => {
    const p = emptyProject()
    expect(instructionDocument(p)).toEqual({ error: 'Add a Page inside your Site first.' })
    p.blocks.canvas.children = []
    expect(instructionDocument(p)).toEqual({ error: 'Add a Page inside your Site first.' })
  })

  it('adds the extra header line from Build 2 on', () => {
    expect(doc(demoProject()).document.startsWith(`${HEADER}\n\n## Block types used\n`)).toBe(true)
    expect(doc(builtSite().project).document.startsWith(`${HEADER}\n${EXTRA_LINE}\n\n## Block types used\n`)).toBe(true)
  })

  it('names preset colors, case-insensitively, and keeps other colors', () => {
    const p = demoProject()
    const hero = find(p, 'Big welcome')
    trait(p, hero, 'color', '#1e3a5f')
    trait(p, hero, 'color', '#123456')
    const d = doc(p).document
    expect(d).toContain('  - color (main color of this Block; decide where it shows, keep text readable): navy (#1E3A5F)\n')
    expect(d).toContain('  - color (main color of this Block; decide where it shows, keep text readable): #123456\n')
  })

  it('writes a deleted page as "go to missing page" with one Skipped line per key', () => {
    const p = demoProject()
    removeItem(p, find(p, 'Quiz', 'page'))
    const r = doc(p)
    expect(r.document.split('): go to missing page\n').length - 1).toBe(3) // two Instances and the definition
    expect(r.skipped).toEqual(['Skipped: the "Quiz" button goes to a page that no longer exists.'])
  })

  it('leaves skipped items out, and lists two problems on two lines', () => {
    const p = demoProject()
    p.assets = p.assets.filter(a => a.id !== 'a1')
    const click = p.blocks[find(p, 'Order', 'button')].traits[0]
    p.traits[click].value = 'popup:b999'
    const r = doc(p)
    expect(r.document).toContain('  - Frame "Frame" #b14\n  - Button "Order" #b13\n- Popup "Order" #b12\n')
    expect(r.document).not.toContain('cupcakes.png, used by a Trait')
    expect(r.skipped).toEqual([
      'Skipped: the picture for the "Frame" frame was deleted from the Library.',
      'Skipped: the "Order" button opens a popup that no longer exists.',
    ])
  })

  it('writes "you choose" for Bob picks and empty values, with the Note', () => {
    const p = demoProject()
    const hero = find(p, 'Big welcome')
    const vibe = trait(p, hero, 'vibe', '')
    p.traits[vibe].note = 'something warm'
    const color = trait(p, hero, 'color')
    p.traits[color].bobPicks = true
    const d = doc(p).document
    expect(d).toContain('- Hero "Big welcome" #b16\n'
      + '  - vibe (overall feel: wording, shapes, spacing, motion): you choose\n'
      + '    - Note: "something warm"\n'
      + '  - color (main color of this Block; decide where it shows, keep text readable): you choose\n'
      + '  - Textbox')
  })

  it('writes Notes, tell Bob and let Bob pick', () => {
    const p = demoProject()
    const hero = find(p, 'Big welcome')
    p.blocks[hero].note = '  The first thing people see '
    trait(p, hero, 'tellbob', '')
    trait(p, hero, 'letbobpick', ' the colors ')
    trait(p, hero, 'letbobpick', '')
    const home = find(p, 'Home', 'page')
    p.blocks[home].note = 'Keep it short'
    const d = doc(p).document
    expect(d).toContain('### Page "Home" (index.html) #b2\n\n- Note: "Keep it short"\n- Navbar')
    expect(d).toContain('- Hero "Big welcome" #b16\n'
      + '  - Note: "The first thing people see"\n'
      + '  - You choose: the colors\n'
      + '  - You choose: anything in this Block\n'
      + '  - Textbox')
  })

  it('tags Instances and lists each definition once', () => {
    const d = doc(demoProject()).document
    expect(d.split('(Instance of "Top bar")').length - 1).toBe(3)
    expect(d.split('\n- Navbar "Top bar"\n').length - 1).toBe(1)
    expect(d.split('\n- Footer "Bottom"\n').length - 1).toBe(1)
  })

  it('describes Library Assets', () => {
    const p = demoProject()
    p.assets.push({ id: 'a9', file: 'intro.mp4', kind: 'video', mime: 'video/mp4', bytes: 1, width: 640, height: 360, seconds: 12.4 })
    p.assets.push({ id: 'a10', file: 'ding.mp3', kind: 'sound', mime: 'audio/mpeg', bytes: 1, seconds: 2.6 })
    trait(p, find(p, 'Big welcome'), 'video', 'a9')
    const d = doc(p).document
    expect(d).toContain('- assets/intro.mp4: video, 640×360 px, 12 s, used by a Trait\n- assets/ding.mp3: sound, 3 s\n')
  })

  it('keeps the file of a renamed Page', () => {
    const p = demoProject()
    p.blocks[find(p, 'Menu', 'page')].name = 'Our cakes'
    const d = doc(p).document
    expect(d).toContain('### Page "Our cakes" (menu.html) #b3\n')
    expect(d).toContain('go to "Our cakes" page (menu.html) #b3\n')
  })

  it('never sends loose ideas', () => {
    const p = demoProject()
    const loose = addBlock(p, 'section', 'Loose idea')
    p.blocks.canvas.children.push(loose)
    p.blocks.canvas.traits.push(addTrait(p, 'tellbob', 'secret plan'))
    const d = doc(p).document
    expect(d).not.toContain('Loose idea')
    expect(d).not.toContain('secret plan')
  })

  it('writes the Build 2 shape', () => {
    const p = builtSite().project
    const top = p.blocks.canvas.children.find(id => p.blocks[id].type === 'checkpoint')!
    const hours = addBlock(p, 'section', 'Opening hours')
    p.blocks.b2.children.push(hours)
    trait(p, hours, 'text', 'Saturdays 9 till 1, at the school gate')
    const contact = addBlock(p, 'page', 'Contact')
    p.blocks[top].children.push(contact)
    trait(p, contact, 'tellbob', 'a contact form')
    const d = doc(p).document
    const at = d.indexOf('## Block types used')
    expect(d.slice(at, d.indexOf('## Library'))).toBe(`## Block types used

- Page: One page of the website, in its own \`.html\` file.
- Checkpoint: The website as already built; its Traits ask for changes across the whole site, and new Pages in it are new pages.
- Built page: A page already built; Blocks and Traits in it ask for changes or additions to that page.
- Section: One band of a page that groups content with one purpose.

## Already built

- Built page "Home" (index.html) #b2
- Built page "Menu" (menu.html) #b3
- Built page "Quiz" (quiz.html) #b4

## Checkpoint "Maya's bake sale" #b1

### Built page "Home" (index.html) #b2

- Section "Opening hours" #${hours}
  - text (exact words to show, as written): "Saturdays 9 till 1, at the school gate"

### Page "Contact" (contact.html) #${contact}

- The user says: "a contact form"

`)
  })
})
