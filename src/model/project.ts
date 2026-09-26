import { BLOCK_TYPES, TRAIT_TYPES } from './catalogue.ts'
import type { Block, Layout, Project, Trait } from './types.ts'
import type { BlockType, TraitType } from './types.ts'

// ── id helpers ───────────────────────────────────────────────────────────────

export function emptyProject(): Project {
  const p: Project = {
    id: crypto.randomUUID(),
    name: 'My website',
    next: { b: 1, t: 1, d: 1, a: 1 },
    blocks: {
      canvas: { id: 'canvas', type: 'canvas', name: 'Canvas', note: '', traits: [], children: [] },
    },
    traits: {},
    defs: {},
    assets: [],
    files: {},
    chat: [],
    updated: Date.now(),
  }
  const siteId = addBlock(p, 'site', 'My website')
  p.blocks[siteId].pos = { x: 40, y: 40 }
  p.blocks['canvas'].children.push(siteId)
  return p
}

export function addBlock(p: Project, type: Exclude<BlockType, 'canvas'>, name = BLOCK_TYPES[type].label): string {
  const id = `b${p.next.b++}`
  const block: Block = { id, type, name, note: '', traits: [], children: [] }
  if (type === 'page') block.file = pageFile(p, name)
  p.blocks[id] = block
  return id
}

export function addTrait(p: Project, type: TraitType, value = TRAIT_TYPES[type].default): string {
  const id = `t${p.next.t++}`
  p.traits[id] = { id, type, value, note: '' }
  return id
}

// ── private helpers ───────────────────────────────────────────────────────────

function pageFile(p: Project, name: string): string {
  const taken = new Set(Object.values(p.blocks).map(b => b.file).filter(Boolean))
  if (!taken.has('index.html')) return 'index.html'
  let base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'page'
  if (!taken.has(`${base}.html`)) return `${base}.html`
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}.html`
    if (!taken.has(candidate)) return candidate
  }
}

export function mapLayout(l: Layout, f: (id: string) => string): Layout {
  return {
    d: l.d,
    k: l.k.map(item => (typeof item === 'string' ? f(item) : mapLayout(item, f))),
  }
}

function copyTrait(p: Project, sid: string): string {
  const s = p.traits[sid]
  const id = addTrait(p, s.type, s.value)
  const t = p.traits[id]
  t.note = s.note
  if (s.bobPicks) t.bobPicks = s.bobPicks
  t.from = sid
  return id
}

function copyBlock(p: Project, sid: string): string {
  const s = p.blocks[sid]
  const id = `b${p.next.b++}` // id taken FIRST
  const map: Record<string, string> = {}
  const block: Block = {
    id,
    type: s.type,
    name: s.name,
    note: s.note,
    from: sid,
    traits: s.traits.map(tid => copyTrait(p, tid)),
    children: s.children.map(k => { const nk = copyBlock(p, k); map[k] = nk; return nk }),
    ...(s.layout ? { layout: mapLayout(s.layout, x => map[x] ?? x) } : {}),
  }
  p.blocks[id] = block
  return id
}

export function makeInstance(p: Project, defId: string): string {
  const def = Object.values(p.defs).find(d => d.id === defId)!
  const defBlock = p.blocks[def.blockId]
  const n = canvasBlocks(p).filter(b => b.inst === defId).length + 1
  const instId = copyBlock(p, def.blockId)
  const inst = p.blocks[instId]
  inst.inst = defId
  inst.removed = []
  inst.name = `${defBlock.name} ${n}`
  delete inst.from
  return instId
}

// ponytail: freshColor scans all defs on every call; fine for ≤10 defs
const PRESET_HUES = [345, 15, 40, 90, 140, 180, 205, 235, 275, 310]

function freshColor(p: Project): { h: number; s: number; l: number } {
  const usedHues = Object.values(p.defs).map(d => d.color.h)
  for (const h of PRESET_HUES) {
    if (!usedHues.includes(h)) return { h, s: 90, l: 71 }
  }
  // all presets used: find hue with largest circular distance
  let bestH = 0
  let bestDist = -1
  for (let h = 1; h <= 359; h++) {
    const dist = Math.min(...usedHues.map(u => {
      const d = Math.abs(h - u)
      return Math.min(d, 360 - d)
    }))
    if (dist > bestDist) { bestDist = dist; bestH = h }
  }
  return { h: bestH, s: 85, l: 71 }
}

function addDef(p: Project, blockId: string): string {
  const id = `d${p.next.d++}`
  p.defs[id] = { id, blockId, color: freshColor(p) }
  p.blocks[blockId].defines = id
  return id
}

export function makeCustomBlock(p: Project, id: string): string {
  const d = addDef(p, id)
  const instId = makeInstance(p, d)
  // replace id with instId in the parent
  const parentId = parentOf(p, id)
  if (parentId) {
    const parent = p.blocks[parentId]
    parent.children = parent.children.map(c => (c === id ? instId : c))
    if (parent.layout) {
      parent.layout = mapLayout(parent.layout, x => (x === id ? instId : x))
    }
  }
  const block = p.blocks[id]
  if (block.pos) {
    p.blocks[instId].pos = block.pos
    delete block.pos
  }
  return d
}

export function newCustomBlock(p: Project): string {
  return addDef(p, addBlock(p, 'box', 'My block'))
}

function parentOf(p: Project, id: string): string | undefined {
  for (const b of Object.values(p.blocks)) {
    if (b.children.includes(id)) return b.id
    if (b.traits.includes(id)) return b.id
  }
  return undefined
}

export function hasOverride(x: { ov?: { name?: true; note?: true } | { value?: true; note?: true } }): boolean {
  return !!x.ov && Object.values(x.ov).some(Boolean)
}

export function applyChange(before: Project, recipe: (p: Project) => void): Project {
  const p = structuredClone(before)
  recipe(p)
  recordInstanceEdits(before, p)
  resolveAll(p)
  return p
}

function instanceParts(p: Project): Map<string, string> {
  const map = new Map<string, string>()
  for (const b of canvasBlocks(p)) {
    if (!b.inst) continue
    // walk everything inside this instance
    walkBlock(p, b.id, id => map.set(id, b.id))
    // also walk traits of this instance itself
    for (const tid of b.traits) map.set(tid, b.id)
  }
  return map
}

function walkBlock(p: Project, id: string, visit: (id: string) => void): void {
  visit(id)
  const b = p.blocks[id]
  if (!b) return
  for (const tid of b.traits) visit(tid)
  for (const cid of b.children) walkBlock(p, cid, visit)
}

function recordInstanceEdits(before: Project, after: Project): void {
  const now = instanceParts(after)

  // build up: part id → the Block that held it in before
  const up = new Map<string, string>()
  for (const b of Object.values(before.blocks)) {
    for (const cid of b.children) up.set(cid, b.id)
    for (const tid of b.traits) up.set(tid, b.id)
  }

  for (const [id, instId] of instanceParts(before)) {
    // 1. skip if the whole Instance went
    if (!after.blocks[instId]?.inst) continue

    // 2. deleted / dragged out
    if (now.get(id) !== instId) {
      const part = before.blocks[id] ?? before.traits[id]
      const from = part?.from
      const parentId = up.get(id)
      const outermost = parentId === instId || now.get(parentId!) === instId
      const inst = after.blocks[instId]
      if (from && outermost && inst && !inst.removed?.includes(from)) {
        inst.removed = inst.removed ?? []
        inst.removed.push(from)
      }
      if (after.blocks[id] ?? after.traits[id]) {
        unfollow(after, id)
      }
      continue
    }

    // 3. Block part changes
    if (after.blocks[id]) {
      const bBefore = before.blocks[id]
      const bAfter = after.blocks[id]
      if (id !== instId && bBefore.name !== bAfter.name) {
        bAfter.ov = { ...bAfter.ov, name: true }
      }
      if (bBefore.note !== bAfter.note) {
        bAfter.ov = { ...bAfter.ov, note: true }
      }
    }

    // 4. Trait part changes
    if (after.traits[id]) {
      const tBefore = before.traits[id]
      const tAfter = after.traits[id]
      if (tBefore.value !== tAfter.value || !!tBefore.bobPicks !== !!tAfter.bobPicks) {
        tAfter.ov = { ...tAfter.ov, value: true }
      }
      if (tBefore.note !== tAfter.note) {
        tAfter.ov = { ...tAfter.ov, note: true }
      }
    }
  }
}

export function unfollow(p: Project, id: string): void {
  if (p.blocks[id]) {
    const b = p.blocks[id]
    delete b.from
    delete b.ov
    for (const tid of b.traits) unfollow(p, tid)
    for (const cid of b.children) if (!p.blocks[cid]?.inst) unfollow(p, cid) // a nested Instance keeps its links
  } else if (p.traits[id]) {
    const t = p.traits[id]
    delete t.from
    delete t.ov
  }
}

export function resolveInstance(p: Project, instId: string): void {
  const inst = p.blocks[instId]
  if (!inst?.inst) return
  const def = p.defs[inst.inst]
  if (!def) return
  const defBlock = p.blocks[def.blockId]
  if (!defBlock) return
  syncBlock(p, defBlock, inst, inst)
}

export function resolveAll(p: Project): void {
  for (const b of canvasBlocks(p)) {
    if (b.inst) resolveInstance(p, b.id)
  }
}

function syncBlock(p: Project, src: Block, dst: Block, root: Block): void {
  if (dst !== root) {
    if (!hasOverride({ ov: dst.ov as { name?: true; note?: true } | undefined }) || !dst.ov?.name) {
      dst.name = src.name
    }
  }
  if (!dst.ov?.note) {
    dst.note = src.note
  }

  syncList(
    p, src, dst, root,
    (list, i) => list.traits[i],
    (sid: string) => copyTrait(p, sid),
    (srcTrait: Trait, dstTrait: Trait) => {
      if (!dstTrait.ov?.value) {
        dstTrait.value = srcTrait.value
        if (srcTrait.bobPicks) dstTrait.bobPicks = srcTrait.bobPicks
        else delete dstTrait.bobPicks
      }
      if (!dstTrait.ov?.note) {
        dstTrait.note = srcTrait.note
      }
    },
    'traits',
  )

  syncList(
    p, src, dst, root,
    (list, i) => list.children[i],
    (sid: string) => copyBlock(p, sid),
    (srcBlock: Block, dstBlock: Block) => {
      syncBlock(p, srcBlock, dstBlock, root)
    },
    'children',
  )
}

function syncList<T extends Block | Trait>(
  p: Project,
  src: Block,
  dst: Block,
  root: Block,
  _get: (list: Block, i: number) => string,
  copy: (sid: string) => string,
  update: (srcItem: T, dstItem: T) => void,
  key: 'traits' | 'children',
): void {
  const srcList = src[key] as string[]
  const dstList = dst[key] as string[]
  const srcSet = new Set(srcList)

  // 1) from the end of dst, remove every item whose from is set and not in src
  for (let i = dstList.length - 1; i >= 0; i--) {
    const id = dstList[i]
    const part = (p.blocks[id] ?? p.traits[id]) as { from?: string } | undefined
    if (part?.from && !srcSet.has(part.from)) {
      dstList.splice(i, 1)
      drop(p, id)
    }
  }

  // 2) sync in src order
  let at = 0
  for (const sid of srcList) {
    const srcItem = (p.blocks[sid] ?? p.traits[sid]) as T
    const idx = dstList.findIndex(id => {
      const part = (p.blocks[id] ?? p.traits[id]) as { from?: string } | undefined
      return part?.from === sid
    })
    if (idx === -1) {
      if (root.removed?.includes(sid)) {
        // skip — was intentionally removed from this instance
      } else {
        const newId = copy(sid)
        dstList.splice(at, 0, newId)
        const dstItem = (p.blocks[newId] ?? p.traits[newId]) as T
        update(srcItem, dstItem)
        at++
      }
    } else {
      const dstItem = (p.blocks[dstList[idx]] ?? p.traits[dstList[idx]]) as T
      update(srcItem, dstItem)
      at = idx + 1
    }
  }

  if (key === 'children') {
    dst.layout = dst.layout
  }
}

function drop(p: Project, id: string): void {
  if (p.blocks[id]) {
    const b = p.blocks[id]
    for (const tid of b.traits) drop(p, tid)
    for (const cid of b.children) drop(p, cid)
    delete p.blocks[id]
  } else {
    delete p.traits[id]
  }
}

export function canvasBlocks(p: Project): Block[] {
  const result: Block[] = []
  function visit(id: string): void {
    const b = p.blocks[id]
    if (!b) return
    if (id !== 'canvas') result.push(b)
    for (const cid of b.children) visit(cid)
  }
  for (const cid of p.blocks['canvas'].children) visit(cid)
  return result
}
