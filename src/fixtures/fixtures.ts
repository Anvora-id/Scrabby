import {
  addBlock,
  addTrait,
  emptyProject,
  makeInstance,
} from '../model/project.ts'
import type { Asset, BuiltBlocks, Checkpoint, Files, Project } from '../model/types.ts'

// Served from public/demo/ (credits in public/demo/CREDITS.md); all 1200×800 JPEGs.
export const DEMO_PHOTOS = ['cupcakes.jpg', 'layer-cake.jpg', 'cookies.jpg', 'bake-stall.jpg', 'lemon-drizzle.jpg', 'brownie.jpg']

// ── demoProject ───────────────────────────────────────────────────────────────

export function demoProject(): Project {
  const p = emptyProject()
  p.name = "Maya's bake sale"

  // Assets (6 photos)
  p.assets = DEMO_PHOTOS.map((file, i) => ({
    id: `a${i + 1}` as string,
    file,
    kind: 'image' as const,
    mime: 'image/jpeg',
    bytes: 0,
    width: 1200,
    height: 800,
  } satisfies Asset))
  p.next.a = 7

  // Helpers: arguments evaluated before B/T calls, so inner ids come first
  function T(type: Parameters<typeof addTrait>[1], value?: string, extra?: Record<string, unknown>): string {
    const id = addTrait(p, type, value)
    if (extra) Object.assign(p.traits[id], extra)
    return id
  }
  function B(
    type: Parameters<typeof addBlock>[1],
    name: string | undefined,
    traits: string[] = [],
    children: string[] = [],
  ): string {
    const id = addBlock(p, type, name)
    p.blocks[id].traits = traits
    p.blocks[id].children = children
    return id
  }

  // Step 2: Site traits
  const site = p.blocks['canvas'].children[0]!
  p.blocks[site].name = "Maya's bake sale"
  p.blocks[site].traits = [
    T('color', '#F8BBD0'),
    T('vibe', 'playful'),
    T('font', 'friendly'),
  ]

  // Step 3: Pages
  const home = B('page', 'Home')
  const menu = B('page', 'Menu')
  const quiz = B('page', 'Quiz')
  p.blocks[site].children = [home, menu, quiz]

  // Step 4: Definitions (off canvas — do not push to canvas.children)
  const menuButton = B('button', 'Menu', [T('onclick', 'page:' + menu)])
  const quizButton = B('button', 'Quiz', [T('onclick', 'page:' + quiz)])
  const topBar = B('navbar', 'Top bar', [], [menuButton, quizButton])
  p.blocks[topBar].layout = { d: 'col', k: [{ d: 'row', k: [menuButton, quizButton] }] }
  const bottom = B('footer', 'Bottom', [], [B('text', undefined)])
  p.defs['d1'] = { id: 'd1', blockId: topBar, color: { h: 345, s: 90, l: 82 } }
  p.defs['d2'] = { id: 'd2', blockId: bottom, color: { h: 15, s: 90, l: 82 } }
  p.blocks[topBar].defines = 'd1'
  p.blocks[bottom].defines = 'd2'
  p.next.d = 3

  function withBarAndBottom(content: string[]): string[] {
    return [makeInstance(p, 'd1'), ...content, makeInstance(p, 'd2')]
  }

  // Step 6: Home page contents
  const order = B('popup', 'Order', [], [
    B('form', 'Order form', [], [
      B('button', undefined, [T('onclick', 'submits (fake)')]),
    ]),
  ])
  const orderButton = B('button', 'Order', [T('onclick', 'popup:' + order)])
  const photo = B('image', undefined, [T('image', 'a1')])
  const hero = B('hero', 'Big welcome', [], [
    B('text', undefined, [T('text', 'Fresh cakes every Saturday')]),
    photo,
    orderButton,
  ])
  p.blocks[home].children = withBarAndBottom([hero, order])

  // Step 7: Menu page contents
  const card = B('card', undefined, [T('image', '', { bobPicks: true })])
  const cakes = B('cardgrid', 'Cakes', [T('fakedata', '6 cakes with prices')], [card])
  p.blocks[cakes].layout = { d: 'col', k: [{ d: 'row', k: [card] }] }
  p.blocks[menu].children = withBarAndBottom([cakes])

  // Step 8: Quiz page contents
  const answer = B('button', undefined, [T('onclick', 'checks an answer')])
  const cupcake = B('section', 'Which cupcake are you?', [T('tellbob', '3 questions, then show which cupcake you are')], [answer])
  p.blocks[quiz].children = withBarAndBottom([cupcake])

  return p
}

// ── builtBlocks helper ────────────────────────────────────────────────────────

export function builtBlocks(p: Project, topIds: string[]): BuiltBlocks {
  const blocks: BuiltBlocks['blocks'] = {}
  const traits: BuiltBlocks['traits'] = {}

  function walkBlock(id: string): void {
    const b = p.blocks[id]
    if (!b) return
    blocks[id] = structuredClone(b)
    for (const tid of b.traits) {
      if (p.traits[tid]) traits[tid] = structuredClone(p.traits[tid])
    }
    for (const cid of b.children) walkBlock(cid)
  }

  for (const topId of topIds) walkBlock(topId)

  // also walk every definition Block
  for (const def of Object.values(p.defs)) {
    walkBlock(def.blockId)
  }

  return { top: topIds, blocks, traits, defs: structuredClone(p.defs) }
}

// ── builtSite ─────────────────────────────────────────────────────────────────

export function builtSite(): { project: Project; checkpoints: Checkpoint[] } {
  const p = demoProject()

  // Record the ids from demoProject step 1
  const site = p.blocks['canvas'].children[0]!
  const [home, menu, quiz] = p.blocks[site].children
  const homeChildren = p.blocks[home].children
  // homeBar = first child of home, homeBottom = last child of home
  const homeBar = homeChildren[0]
  const homeBottom = homeChildren[homeChildren.length - 1]

  // Find named blocks
  let hero = '', photo = '', orderButton = '', order = '', cakes = '', card = '', cupcake = '', answer = ''
  for (const [id, b] of Object.entries(p.blocks)) {
    if (b.type === 'hero') hero = id
    if (b.type === 'image' && b.traits.length > 0 && p.traits[b.traits[0]]?.type === 'image' && p.traits[b.traits[0]]?.value === 'a1') photo = id
    if (b.type === 'button' && b.traits.length > 0 && p.traits[b.traits[0]]?.value?.startsWith('popup:')) orderButton = id
    if (b.type === 'popup') order = id
    if (b.type === 'cardgrid') cakes = id
    if (b.type === 'card') card = id
    if (b.type === 'section') cupcake = id
    if (b.type === 'button' && p.traits[b.traits[0]]?.value === 'checks an answer') answer = id
  }

  // Step 2: Add an opening hours section
  const hours = addBlock(p, 'section', 'Opening hours')
  const textTrait = addTrait(p, 'text', 'Saturdays 9 till 1, at the school gate')
  p.blocks[hours].traits = [textTrait]

  // Helper: get children of a block by id
  const ids = (blockId: string): string[] => p.blocks[blockId]?.children ?? []

  // Step 3: Build the HTML/CSS/JS
  const d = { site, home, menu, quiz, hero, photo, orderButton, order, cakes, card, cupcake, answer, homeBar, homeBottom }

  // Get instances of d1 in each page
  const homeBarInst = homeBar
  const menuBarInst = p.blocks[menu].children[0]
  const quizBarInst = p.blocks[quiz].children[0]
  const homeBottomInst = homeBottom
  const menuBottomInst = p.blocks[menu].children[p.blocks[menu].children.length - 1]
  const quizBottomInst = p.blocks[quiz].children[p.blocks[quiz].children.length - 1]

  function pageHtml(title: string, pageId: string, barInst: string, bottomInst: string, body: string): string {
    const barChildren = ids(barInst)
    const bottomChildren = ids(bottomInst)
    const menuBtn = barChildren[0] ?? ''
    const quizBtn = barChildren[1] ?? ''
    const textbox = bottomChildren[0] ?? ''
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} · Maya's bake sale</title>
  <link rel="stylesheet" href="style.css">
</head>
<body data-block="${pageId}">
  <nav class="top-bar" data-block="${barInst}">
    <a href="index.html" class="logo">Maya's bake sale</a>
    <a href="menu.html" data-block="${menuBtn}">Menu</a>
    <a href="quiz.html" data-block="${quizBtn}">Quiz</a>
  </nav>
${body}
  <footer class="bottom" data-block="${bottomInst}">
    <p data-block="${textbox}">Made with love by Maya. Every Saturday, 9 till 1.</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>
`
  }

  const homeBody = (withHours: boolean) => `  <main>
    <section class="hero" data-block="${d.hero}">
      <h1 data-block="${ids(d.hero)[0]}">Fresh cakes every Saturday</h1>
      <img data-block="${d.photo}" src="assets/cupcakes.jpg" alt="A tray of pink cupcakes">
      <button class="big" data-block="${d.orderButton}" data-open="order">Order</button>
    </section>${withHours ? `
    <section class="hours" data-block="${hours}">
      <h2>Opening hours</h2>
      <p>Saturdays 9 till 1, at the school gate</p>
    </section>` : ''}
    <div class="popup" id="order" data-block="${d.order}" hidden>
      <form data-block="${ids(d.order)[0]}">
        <button type="button" class="close" data-close>×</button>
        <h2>Order a cake</h2>
        <label>Your name <input name="name" required></label>
        <label>Which cake? <input name="cake" required></label>
        <button data-block="${ids(ids(d.order)[0])[0]}">Send order</button>
        <p class="thanks" hidden>Thanks! Your order is in.</p>
      </form>
    </div>
  </main>`
  const cakes2 = [['Pink cupcake', '£1.50', 'cupcakes'], ['Lemon drizzle', '£2.00', 'lemon-drizzle'], ['Chocolate slice', '£2.50', 'brownie'], ['Carrot cake', '£2.00', 'layer-cake'], ['Victoria sponge', '£3.00', 'layer-cake'], ['Brownie', '£1.80', 'brownie']]
  const menuBody = `  <main>
    <h1>Our cakes</h1>
    <div class="grid" data-block="${d.cakes}">
${cakes2.map(([n, price, photo]) => `      <article class="card" data-block="${d.card}">
        <img src="assets/${photo}.jpg" alt="${n}">
        <h3>${n}</h3><p>${price}</p>
      </article>`).join('\n')}
    </div>
  </main>`
  const quizBody = `  <main>
    <section class="quiz" data-block="${d.cupcake}">
      <h1>Which cupcake are you?</h1>
      <p id="question"></p>
      <div id="answers"></div>
      <p id="result" hidden></p>
      <button data-block="${d.answer}" id="again" hidden>Try again</button>
    </section>
  </main>`
  const css = (withHours: boolean) => `/* Pictures and videos never grow wider than their box */
img, video { max-width: 100%; height: auto; }

/* block ${d.site} */
body { margin: 0; font-family: "Nunito", sans-serif; background: #FFF5F8; color: #3A2A30; }
main { max-width: 960px; margin: 0 auto; padding: 24px; }
button { font: inherit; background: #E91E63; color: white; border: 0; border-radius: 999px; padding: 10px 20px; cursor: pointer; }

/* block ${d.homeBar} */
.top-bar { display: flex; gap: 20px; align-items: center; padding: 14px 24px; background: #F8BBD0; }
.top-bar a { color: #3A2A30; font-weight: bold; text-decoration: none; }
.top-bar .logo { margin-right: auto; font-size: 20px; }

/* block ${d.hero} */
.hero { text-align: center; padding: 32px; background: white; border-radius: 24px; }
.hero img { width: 100%; max-width: 480px; border-radius: 16px; display: block; margin: 16px auto; }

/* block ${d.order} */
.popup { position: fixed; inset: 0; background: #0006; display: grid; place-items: center; }
.popup[hidden] { display: none; }
.popup form { background: white; padding: 24px; border-radius: 16px; display: grid; gap: 12px; min-width: 280px; position: relative; }
.popup .close { position: absolute; top: 8px; right: 8px; padding: 4px 10px; }

/* block ${d.cakes} */
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.card { background: white; border-radius: 16px; padding: 12px; text-align: center; }
.card img { width: 100%; border-radius: 12px; }

/* block ${d.cupcake} */
.quiz { text-align: center; }
#answers { display: flex; gap: 12px; justify-content: center; }
${withHours ? `
/* block ${hours} */
.hours { margin-top: 24px; padding: 16px; background: #FFE066; border-radius: 16px; text-align: center; }
` : ''}
/* block ${d.homeBottom} */
.bottom { text-align: center; padding: 24px; color: #8A6A75; }
`
  const js = `/* block ${d.order} */
document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
  document.getElementById(b.dataset.open).hidden = false
}))
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
  b.closest('.popup').hidden = true
}))
document.querySelectorAll('.popup form').forEach(f => f.addEventListener('submit', e => {
  e.preventDefault()
  f.querySelector('.thanks').hidden = false
}))

/* block ${d.cupcake} */
const questions = [
  ['Pick a color', ['Pink', 'Brown', 'Yellow']],
  ['Pick a topping', ['Sprinkles', 'Chocolate', 'Lemon']],
  ['Pick a time', ['Morning', 'Night', 'Afternoon']],
]
const cupcakes = ['Strawberry swirl', 'Double chocolate', 'Lemon sunshine']
const quiz = document.getElementById('question')
if (quiz) {
  let step = 0
  const score = [0, 0, 0]
  const show = () => {
    const answers = document.getElementById('answers')
    answers.innerHTML = ''
    if (step === questions.length) {
      const result = document.getElementById('result')
      result.textContent = 'You are a ' + cupcakes[score.indexOf(Math.max(...score))] + ' cupcake!'
      result.hidden = false
      quiz.textContent = ''
      document.getElementById('again').hidden = false
      return
    }
    quiz.textContent = questions[step][0]
    questions[step][1].forEach((a, i) => {
      const b = document.createElement('button')
      b.textContent = a
      b.onclick = () => { score[i]++; step++; show() }
      answers.append(b)
    })
  }
  document.getElementById('again').onclick = () => location.reload()
  show()
}
`
  const files = (withHours: boolean): Files => ({
    'index.html': pageHtml('Home', d.home, homeBarInst, homeBottomInst, homeBody(withHours)),
    'menu.html': pageHtml('Menu', d.menu, menuBarInst, menuBottomInst, menuBody),
    'quiz.html': pageHtml('Quiz', d.quiz, quizBarInst, quizBottomInst, quizBody),
    'style.css': css(withHours),
    'script.js': js,
  })

  const v1 = files(false)
  const v2 = files(true)

  // Step 4: cp1Blocks = builtBlocks(p, [site])
  const cp1Blocks = builtBlocks(p, [site])

  // Step 5: Consume by hand
  // Delete site and the three Page Blocks, replace with locked Built pages
  delete p.blocks[site]
  delete p.blocks[home]
  delete p.blocks[menu]
  delete p.blocks[quiz]

  // Add locked Built pages with the same ids
  p.blocks[home] = { id: home, type: 'page', name: 'Home', note: '', traits: [], children: [], file: 'index.html', locked: true }
  p.blocks[menu] = { id: menu, type: 'page', name: 'Menu', note: '', traits: [], children: [], file: 'menu.html', locked: true }
  p.blocks[quiz] = { id: quiz, type: 'page', name: 'Quiz', note: '', traits: [], children: [], file: 'quiz.html', locked: true }
  // The site becomes the Checkpoint Block
  p.blocks[site] = { id: site, type: 'checkpoint', name: "Maya's bake sale", note: '', traits: [], children: [home, menu, quiz], locked: true, pos: { x: 40, y: 40 } }

  // Step 6: home.children = [hours]; cp2Blocks; then cleanup
  p.blocks[home].children = [hours]
  const cp2Blocks = builtBlocks(p, [site])
  p.blocks[home].children = []

  // Remove every Block and Trait not reachable from the Canvas or a definition
  const reachable = new Set<string>()
  const reachableTraits = new Set<string>()

  function walkReachable(id: string): void {
    if (reachable.has(id)) return
    reachable.add(id)
    const b = p.blocks[id]
    if (!b) return
    for (const tid of b.traits) reachableTraits.add(tid)
    for (const cid of b.children) walkReachable(cid)
  }

  // Canvas and all its children
  walkReachable('canvas')
  // Definitions
  for (const def of Object.values(p.defs)) {
    walkReachable(def.blockId)
  }

  for (const id of Object.keys(p.blocks)) {
    if (!reachable.has(id)) delete p.blocks[id]
  }
  for (const id of Object.keys(p.traits)) {
    if (!reachableTraits.has(id)) delete p.traits[id]
  }

  // Step 7: Assemble the final project
  p.files = v2
  p.checkpoint = 2

  const time = Date.UTC(2026, 8, 25, 10)
  const checkpoints: Checkpoint[] = [
    {
      projectId: p.id,
      number: 1,
      label: 'Checkpoint 1',
      from: null,
      before: {},
      after: v1,
      blocks: cp1Blocks,
      time,
    },
    {
      projectId: p.id,
      number: 2,
      label: 'Checkpoint 2',
      from: 1,
      before: v1,
      after: v2,
      blocks: cp2Blocks,
      time: time + 600_000,
    },
  ]

  return { project: p, checkpoints }
}
