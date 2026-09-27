import { BLOCK_TYPES, BUILT_PAGE, TRAIT_TYPES } from '../model/catalogue.ts'
import { hasOverride } from '../model/project.ts'
import type { Block, Project, Trait } from '../model/types.ts'

export type WarningRule = 'nosite' | 'nopage' | 'deadpage' | 'deadpopup' | 'noaction' | 'noasset' | 'deletedasset'
  | 'lonepopup' | 'lonepage' | 'emptypage' | 'emptyvalue' | 'emptytellbob'
export interface Warning {
  kind: 'stop' | 'skip' | 'look'; rule: WarningRule
  target: string | null  // the Block or Trait it marks; null only for nosite
  where: string          // "Home › Big welcome › Order"
  text: string; todo: string
  key: string            // `${rule}:${source ?? part.id}`: shared by Instances of one definition problem
  def?: string; source?: string
}

export function topBlock(p: Pick<Project, 'blocks'>): Block | undefined {
  return p.blocks.canvas.children.map(id => p.blocks[id]).find(b => b?.type === 'site' || b?.type === 'checkpoint')
}

export function pagesOf(p: Project, top: Block): Block[] {
  return top.children.map(id => p.blocks[id]).filter(b => b?.type === 'page')
}

export function popupsIn(p: Project, b: Block): string[] {
  return [...(b.type === 'popup' ? [b.id] : []), ...b.children.flatMap(c => p.blocks[c] ? popupsIn(p, p.blocks[c]) : [])]
}

export function parseAction(v: string): { kind: 'page' | 'popup'; id: string } | { kind: 'action' } {
  const m = /^(page|popup):(.*)$/.exec(v)
  return m ? { kind: m[1] as 'page' | 'popup', id: m[2] } : { kind: 'action' }
}

export function blockLabel(b: Block): string {
  return b.type === 'page' && b.locked ? BUILT_PAGE.label : BLOCK_TYPES[b.type as Exclude<Block['type'], 'canvas'>].label
}

const blockName = (b: Block) => `the "${b.name}" ${blockLabel(b).toLowerCase()}`
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const talks = (p: Project, b: Block) => b.traits.some(t => p.traits[t]?.type === 'tellbob' || p.traits[t]?.type === 'letbobpick')
const told = (p: Project, b: Block) => !!b.note.trim() || talks(p, b)
const isEmpty = (t: Trait) => !t.value.trim() && !t.bobPicks

interface Visit { b: Block; page?: Block; above: Block[]; inst?: Block }

export function warnings(p: Project): Warning[] {
  const top = topBlock(p)
  if (!top) return [{ kind: 'stop', rule: 'nosite', target: null, where: '', text: 'There is no Site Block.', todo: 'Add a Page inside your Site first.', key: 'nosite' }]
  const pages = pagesOf(p, top)
  if (!pages.length) return [{ kind: 'stop', rule: 'nopage', target: top.id, where: '', text: 'Your Site has no Page.', todo: 'Add a Page inside your Site first.', key: 'nopage' }]
  const pageIds = new Set(pages.map(b => b.id))

  const visits: Visit[] = []
  const walk = (b: Block, page: Block | undefined, above: Block[], inst: Block | undefined) => {
    const v: Visit = { b, page: b.type === 'page' ? b : page, above, inst: b.inst ? b : inst }
    visits.push(v)
    for (const c of b.children) if (p.blocks[c]) walk(p.blocks[c], v.page, [...above, b], v.inst)
  }
  walk(top, undefined, [], undefined)

  const linked = new Set<string>()
  for (const { b, page } of visits) {
    for (const tid of b.traits) {
      const t = p.traits[tid]
      if (t?.type !== 'onclick' || t.bobPicks) continue
      const a = parseAction(t.value)
      if (a.kind === 'page' && pageIds.has(a.id)) linked.add(a.id)
      if (a.kind === 'popup' && page && popupsIn(p, page).includes(a.id)) linked.add(a.id)
    }
  }

  const out: Warning[] = []
  for (const { b, page, above, inst } of visits) {
    const where = [...above, b].filter(x => x !== top).map(x => x.name).join(' › ')
    const add = (kind: 'skip' | 'look', rule: WarningRule, part: Block | Trait, text: string, todo: string) => {
      const source = !inst ? undefined : part === inst ? p.defs[inst.inst!]?.blockId : hasOverride(part) ? undefined : part.from
      out.push({ kind, rule, target: part.id, where, text, todo, key: `${rule}:${source ?? part.id}`, ...(source && { def: inst!.inst, source }) })
    }

    const coveredByBob = above.some(a => a.traits.some(t => p.traits[t]?.type === 'letbobpick' && isEmpty(p.traits[t])))
    if (b.type === 'popup' && !linked.has(b.id) && !told(p, b) && !coveredByBob)
      add('look', 'lonepopup', b, `Nothing opens the "${b.name}" popup, so visitors never see it.`, 'Give a button "on click › open popup", or tell Bob when it opens.')
    if (b.type === 'page' && !b.locked) {
      if (b.file !== 'index.html' && !linked.has(b.id) && !told(p, b))
        add('look', 'lonepage', b, `Nothing links to the "${b.name}" page.`, 'Visitors can only reach it by typing its address. Link to it from a button or the menu.')
      if (!b.children.length && !told(p, b))
        add('look', 'emptypage', b, `The "${b.name}" page is empty.`, 'Bob will guess what goes on it. Add Blocks, or say what it is for.')
    }

    for (const tid of b.traits) {
      const t = p.traits[tid]
      if (!t) continue
      const type = TRAIT_TYPES[t.type]
      if (type.valueKind === 'asset' && !t.bobPicks) {
        const what = t.type === 'image' ? 'picture' : t.type
        if (!t.value) add('skip', 'noasset', t, `The ${type.label} Trait on ${blockName(b)} has no ${what} picked.`, 'Pick one from the Library, or remove the Trait.')
        else if (!p.assets.some(a => a.id === t.value)) add('skip', 'deletedasset', t, `The ${what} for ${blockName(b)} was deleted from the Library.`, 'Pick another one from the Library, or remove the Trait.')
      }
      if (t.type === 'tellbob' && isEmpty(t))
        add('look', 'emptytellbob', t, `The "tell Bob" on ${blockName(b)} is empty.`, 'Type what Bob should know, or remove it.')
      if (isEmpty(t) && (t.type === 'text' || t.type === 'fakedata' || type.valueKind === 'choice') && !t.note.trim() && !talks(p, b))
        add('look', 'emptyvalue', t, `The ${type.label} Trait on ${blockName(b)} is empty, so Bob will ${type.valueKind === 'choice' ? 'choose one' : 'write the words'}.`, 'Fill it in, or hand it to Bob.')
      if (t.type === 'onclick' && !t.bobPicks) {
        const a = parseAction(t.value)
        if (a.kind === 'page' && !pageIds.has(a.id))
          add('skip', 'deadpage', t, `${cap(blockName(b))} goes to a page that no longer exists.`, 'Pick another page, or remove the link. If you build now, Bob makes it do nothing.')
        else if (a.kind === 'popup' && !(page && popupsIn(p, page).includes(a.id)))
          add('skip', 'deadpopup', t, `${cap(blockName(b))} opens a popup that no longer exists.`, 'Pick another action, or remove it.')
        else if (!t.value.trim())
          add('skip', 'noaction', t, `${cap(blockName(b))} has an "on click" with nothing picked.`, 'Pick what happens on click, or remove it.')
      }
    }
  }
  return out
}
