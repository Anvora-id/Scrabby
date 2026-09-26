import { ON_CLICK_CHOICES, PLAYS_A_SOUND, acceptsBlock } from '../model/catalogue.ts'
import { addBlock, addTrait, makeInstance } from '../model/project.ts'
import { popupsIn } from '../instructions/warnings.ts'
import type { Block, Layout, Pos, Project } from '../model/types.ts'
import type { BlockType, TraitType } from '../model/types.ts'

// ── Types ─────────────────────────────────────────────────────────────────────

export type NewBlockType = Exclude<BlockType, 'canvas' | 'site' | 'checkpoint'>
export type DragItem =
  | { kind: 'newBlock'; type: NewBlockType }
  | { kind: 'newTrait'; type: TraitType }
  | { kind: 'block'; id: string }
  | { kind: 'trait'; id: string }
  | { kind: 'newInstance'; defId: string }

export function isTraitItem(item: DragItem): boolean {
  return item.kind === 'newTrait' || item.kind === 'trait'
}

export type Slot = { where: 'left' | 'right' | 'above' | 'below' | 'rowBefore'; ref: string }
export type Drop = { id: string; slot?: Slot | null; tIdx?: number; pos?: Pos }
export type Option = { value: string; label: string; missing?: true; font?: string }

// ── Layout tree ───────────────────────────────────────────────────────────────

export function leafList(n: Layout | string): string[] {
  if (typeof n === 'string') return [n]
  const result: string[] = []
  for (const k of n.k) {
    result.push(...leafList(k))
  }
  return result
}

function norm(n: Layout | string, root = false): Layout | string {
  if (typeof n === 'string') return n
  // normalize children first
  const kids: (Layout | string)[] = n.k.map(k => norm(k, false))
  // drop empty groups
  const noEmpty = kids.filter(k => typeof k === 'string' || k.k.length > 0)
  // flatten children with the same direction into the parent
  const flattened: (Layout | string)[] = []
  for (const k of noEmpty) {
    if (typeof k !== 'string' && k.d === n.d) {
      flattened.push(...k.k)
    } else {
      flattened.push(k)
    }
  }
  // a non-root group with one item becomes that item
  if (!root && flattened.length === 1) return flattened[0]
  return { d: n.d, k: flattened }
}

function keepLeaves(n: Layout | string, keep: (id: string) => boolean): Layout | string {
  if (typeof n === 'string') return keep(n) ? n : { d: 'col', k: [] }
  return {
    d: n.d,
    k: n.k.map(k => keepLeaves(k, keep)).filter(k => typeof k === 'string' || k.k.length > 0),
  }
}

export function repairLayout(b: Block): Layout {
  const childSet = new Set(b.children)
  const filtered = keepLeaves(b.layout ?? { d: 'col', k: [] }, id => childSet.has(id))
  const l = norm(filtered, true)
  const layout: Layout = typeof l === 'string' ? { d: 'col', k: [l] } : l
  // append any child not already in the layout
  const inLayout = new Set(leafList(layout))
  for (const id of b.children) {
    if (!inLayout.has(id)) layout.k.push(id)
  }
  return { d: layout.d, k: layout.k }
}

export function insertInto(l: Layout, id: string, slot: Slot | null | undefined): Layout {
  const root: Layout = structuredClone(l)
  if (!slot || !slot.ref || !leafList(root).includes(slot.ref)) {
    root.k.push(id)
  } else if (slot.where === 'rowBefore') {
    root.k.splice(root.k.findIndex(item => leafList(item).includes(slot.ref)), 0, id)
  } else {
    const dir: 'row' | 'col' = (slot.where === 'left' || slot.where === 'right') ? 'row' : 'col'
    insertBeside(root, slot.ref, id, dir, slot.where === 'right' || slot.where === 'below')
  }
  return norm(root, true) as Layout
}

function insertBeside(node: Layout | string, ref: string, id: string, dir: 'row' | 'col', after: boolean): boolean {
  if (typeof node === 'string') return false
  for (let i = 0; i < node.k.length; i++) {
    const child = node.k[i]
    const isLeaf = typeof child === 'string'
    if (isLeaf && child === ref) {
      if (node.d === dir) {
        node.k.splice(after ? i + 1 : i, 0, id)
      } else {
        node.k[i] = after ? { d: dir, k: [ref, id] } : { d: dir, k: [id, ref] }
      }
      return true
    }
    if (!isLeaf && insertBeside(child, ref, id, dir, after)) return true
  }
  return false
}

// ── parentMap ─────────────────────────────────────────────────────────────────

export function parentMap(p: Project): Map<string, string> {
  const map = new Map<string, string>()
  function walk(id: string): void {
    const b = p.blocks[id]
    if (!b) return
    for (const tid of b.traits) map.set(tid, id)
    for (const cid of b.children) { map.set(cid, id); walk(cid) }
  }
  walk('canvas')
  for (const def of Object.values(p.defs)) walk(def.blockId)
  return map
}

// Blocks 4 levels deep start folded. The Checkpoint Block never folds.
export function isFolded(b: Block, depth: number): boolean {
  return b.type !== 'checkpoint' && (b.folded ?? depth >= 4)
}

// A Block on the Canvas is depth 1, like BlockView counts it.
function depthOf(parents: Map<string, string>, id: string): number {
  let d = 0
  for (let a: string | undefined = id; a && a !== 'canvas'; a = parents.get(a)) d++
  return d
}

// ── canDrop ───────────────────────────────────────────────────────────────────

export function canDrop(p: Project, item: DragItem, targetId: string, parents = parentMap(p)): boolean {
  if (isTraitItem(item)) return true

  let type: BlockType
  if (item.kind === 'newBlock') type = item.type
  else if (item.kind === 'newInstance') {
    const def = p.defs[item.defId]
    if (!def) return false
    type = p.blocks[def.blockId]?.type ?? 'box'
  } else if (item.kind === 'block') {
    type = p.blocks[item.id]?.type ?? 'box'
  } else {
    return true // newTrait / trait: already handled above but satisfies type narrowing
  }

  if (type === 'canvas') return false
  const targetBlock = p.blocks[targetId]
  if (!targetBlock) return false
  if (!acceptsBlock(targetBlock.type, type)) return false

  // build chain = target and its ancestors
  const chain: string[] = []
  let cur: string | undefined = targetId
  while (cur) { chain.push(cur); cur = parents.get(cur) }

  const inCustom = chain.some(cid => {
    const b = p.blocks[cid]
    return b && (!!b.inst || !!b.defines)
  })

  function hasInst(id: string): boolean {
    const b = p.blocks[id]
    if (!b) return false
    if (b.inst) return true
    for (const cid of b.children) if (hasInst(cid)) return true
    return false
  }

  if (item.kind === 'newInstance') return !inCustom

  if (item.kind === 'block') {
    const id = item.id
    // cannot drop into itself
    if (chain.includes(id)) return false
    const block = p.blocks[id]
    if (!block) return false
    // a locked Page only reorders inside its current parent
    if (block.type === 'page' && block.locked && targetId !== parents.get(id)) return false
    if (inCustom && hasInst(id)) return false
  }

  return true
}

// ── canTrash ──────────────────────────────────────────────────────────────────

export function canTrash(p: Project, item: DragItem): boolean {
  if (item.kind === 'trait') return true
  if (item.kind === 'block') {
    const b = p.blocks[item.id]
    if (!b) return false
    if (b.type === 'site' || b.type === 'checkpoint') return false
    if (b.locked) return false
    if (b.defines) return false
    return true
  }
  return false
}

// ── detach (private) ──────────────────────────────────────────────────────────

function detach(p: Project, id: string): void {
  for (const b of Object.values(p.blocks)) {
    const ti = b.traits.indexOf(id)
    if (ti !== -1) { b.traits.splice(ti, 1); return }
    const ci = b.children.indexOf(id)
    if (ci !== -1) {
      b.children.splice(ci, 1)
      b.layout = repairLayout(b)
      return
    }
  }
}

// ── dropItem ──────────────────────────────────────────────────────────────────

export function dropItem(p: Project, item: DragItem, at: Drop): string {
  let id: string
  if (item.kind === 'newBlock') {
    id = addBlock(p, item.type)
  } else if (item.kind === 'newTrait') {
    id = addTrait(p, item.type)
  } else if (item.kind === 'newInstance') {
    id = makeInstance(p, item.defId)
  } else {
    id = item.id
    // A Block shown folded, or as a chip in a folded parent, stays folded where it lands.
    if (item.kind === 'block') {
      const parents = parentMap(p), up = parents.get(id)
      const parent = up && up !== 'canvas' ? p.blocks[up] : undefined
      if (isFolded(p.blocks[id], depthOf(parents, id)) || (parent && isFolded(parent, depthOf(parents, up!)))) {
        p.blocks[id].folded = true
      }
    }
    detach(p, id)
  }

  const c = p.blocks[at.id]
  if (!c) return id

  if (isTraitItem(item)) {
    c.traits.splice(at.tIdx ?? c.traits.length, 0, id)
  } else {
    c.layout = insertInto(repairLayout(c), id, at.slot ?? null)
    c.children = leafList(c.layout)
  }
  // loose Traits keep a pos on the Canvas too
  const placed = p.blocks[id] ?? p.traits[id]
  if (at.id === 'canvas' && at.pos) placed.pos = at.pos
  else delete placed.pos

  return id
}

// ── removeItem ────────────────────────────────────────────────────────────────

export function removeItem(p: Project, id: string): void {
  detach(p, id)
  drop(p, id)
}

function drop(p: Project, id: string): void {
  const b = p.blocks[id]
  if (b) {
    for (const tid of b.traits) drop(p, tid)
    for (const cid of b.children) drop(p, cid)
    delete p.blocks[id]
  } else {
    delete p.traits[id]
  }
}

// ── onClickOptions ────────────────────────────────────────────────────────────

export function onClickOptions(p: Project, traitId: string): Option[] {
  const options: Option[] = [{ value: '', label: 'pick one' }]

  // find the Page this trait belongs to (walk up to nearest Page)
  const pMap = parentMap(p)
  let cur: string | undefined = pMap.get(traitId)
  let ownPage: string | undefined
  while (cur && cur !== 'canvas') {
    const b = p.blocks[cur]
    if (b?.type === 'page') { ownPage = cur; break }
    cur = pMap.get(cur)
  }

  // Pages directly in the Site or Checkpoint Block (never loose Pages)
  const canvas = p.blocks['canvas']
  for (const topId of canvas.children) {
    const top = p.blocks[topId]
    if (!top) continue
    const isContainer = top.type === 'site' || top.type === 'checkpoint'
    if (!isContainer) continue
    for (const pageId of top.children) {
      const page = p.blocks[pageId]
      if (!page) continue
      options.push({ value: `page:${pageId}`, label: `go to page › ${page.name}` })
    }
  }

  // Popups inside this Trait's own Page, nested ones included
  if (ownPage) {
    for (const id of popupsIn(p, p.blocks[ownPage])) {
      options.push({ value: `popup:${id}`, label: `open popup › ${p.blocks[id].name}` })
    }
  }

  // ON_CLICK_CHOICES items except "plays a sound"
  for (const choice of ON_CLICK_CHOICES) {
    if (choice === PLAYS_A_SOUND) continue
    options.push({ value: choice, label: choice })
  }

  // check existing value for page:/popup: not listed
  const trait = p.traits[traitId]
  if (trait) {
    const val = trait.value
    if (val.startsWith('page:') || val.startsWith('popup:')) {
      const already = options.some(o => o.value === val)
      if (!already) {
        const isPage = val.startsWith('page:')
        options.push({
          value: val,
          label: isPage ? 'go to missing page' : 'open missing popup',
          missing: true,
        })
      }
    }
  }

  return options
}
