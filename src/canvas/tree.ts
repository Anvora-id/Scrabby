import { ON_CLICK_CHOICES, PLAYS_A_SOUND, acceptsBlock } from '../model/catalogue.ts'
import { addBlock, addTrait, makeInstance } from '../model/project.ts'
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
  if (!slot || !slot.ref) {
    root.k.push(id)
    const r = norm(root, true)
    return typeof r === 'string' ? { d: 'col', k: [r] } : r
  }

  if (slot.where === 'rowBefore') {
    // find the root item containing ref, insert id before it
    const idx = rootItemContaining(root, slot.ref)
    if (idx === -1) {
      root.k.push(id)
    } else {
      root.k.splice(idx, 0, id)
    }
    const r = norm(root, true)
    return typeof r === 'string' ? { d: 'col', k: [r] } : r
  }

  const dir: 'row' | 'col' = (slot.where === 'left' || slot.where === 'right') ? 'row' : 'col'
  const after = slot.where === 'right' || slot.where === 'below'

  insertBeside(root, slot.ref, id, dir, after)
  const r = norm(root, true)
  return typeof r === 'string' ? { d: 'col', k: [r] } : r
}

function rootItemContaining(root: Layout, ref: string): number {
  for (let i = 0; i < root.k.length; i++) {
    const item = root.k[i]
    if (typeof item === 'string' ? item === ref : leafList(item).includes(ref)) return i
  }
  return -1
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
    // locked Page only moves on Canvas to its current parent
    if (block.type === 'page' && block.locked) {
      const currentParent = parents.get(id)
      return targetId === currentParent
    }
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
    detach(p, id)
  }

  const c = p.blocks[at.id]
  if (!c) return id

  if (item.kind === 'newTrait' || item.kind === 'trait') {
    const tIdx = at.tIdx ?? c.traits.length
    c.traits.splice(tIdx, 0, id)
  } else {
    c.layout = insertInto(repairLayout(c), id, at.slot ?? null)
    c.children = leafList(c.layout)
    if (at.id === 'canvas' && at.pos) {
      p.blocks[id].pos = at.pos
    } else {
      delete p.blocks[id].pos
    }
  }

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

  // Popups inside this Trait's own Page
  if (ownPage) {
    function findPopups(blockId: string): void {
      const b = p.blocks[blockId]
      if (!b) return
      if (blockId !== ownPage && b.type === 'popup') {
        options.push({ value: `popup:${blockId}`, label: `open popup › ${b.name}` })
        return
      }
      for (const cid of b.children) findPopups(cid)
    }
    findPopups(ownPage)
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
