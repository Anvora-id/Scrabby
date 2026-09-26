import { addBlock, addTrait, hasOverride, makeCustomBlock, unfollow } from '../model/project.ts'
import type { Project } from '../model/types.ts'
import { canTrash, parentMap, removeItem, repairLayout } from './tree.ts'
import { insertInto, leafList } from './tree.ts'
import { mapLayout } from '../model/project.ts'

export interface MenuItem {
  label: string
  change?: (p: Project) => void
  act?: () => void
  edit?: string
}

export function deleteNote(p: Project, id: string): void {
  const b = p.blocks[id]
  if (b) { b.note = ''; b.noteOn = false }
  else if (p.traits[id]) { p.traits[id].note = ''; p.traits[id].noteOn = false }
}

export function copyOf(p: Project, id: string): string {
  const isBlock = !!p.blocks[id]
  if (isBlock) {
    const newId = duplicateBlock(p, id)
    return newId
  } else {
    const t = p.traits[id]
    const newId = addTrait(p, t.type, t.value)
    const nt = p.traits[newId]
    nt.note = t.note
    if (t.bobPicks) nt.bobPicks = true
    return newId
  }
}

function duplicateBlock(p: Project, id: string): string {
  const src = p.blocks[id]
  const newId = addBlock(p, src.type as Exclude<typeof src.type, 'canvas'>, src.name)
  const nb = p.blocks[newId]
  nb.note = src.note
  if (src.noteOn) nb.noteOn = src.noteOn
  if (src.folded !== undefined) nb.folded = src.folded
  nb.traits = src.traits.map(tid => {
    const t = p.traits[tid]
    const nid = addTrait(p, t.type, t.value)
    const nt = p.traits[nid]
    nt.note = t.note
    if (t.bobPicks) nt.bobPicks = true
    return nid
  })
  nb.children = src.children.map(cid => {
    const childNewId = duplicateBlock(p, cid)
    return childNewId
  })
  if (src.layout) {
    const childMap: Record<string, string> = {}
    src.children.forEach((cid, i) => { childMap[cid] = nb.children[i] })
    nb.layout = mapLayout(src.layout, x => childMap[x] ?? x)
  }
  return newId
}

export function duplicate(p: Project, id: string): void {
  const parents = parentMap(p)
  const parentId = parents.get(id)
  const isBlock = !!p.blocks[id]
  const newId = copyOf(p, id)

  if (isBlock) {
    const src = p.blocks[id]
    const newBlock = p.blocks[newId]
    // if not an Instance, unfollow the copy
    if (!src.inst) unfollow(p, newId)
    if (!parentId || parentId === 'canvas') {
      // loose Block: +30/+30
      if (src.pos) newBlock.pos = { x: src.pos.x + 30, y: src.pos.y + 30 }
      else newBlock.pos = { x: 30, y: 30 }
      p.blocks['canvas'].children.push(newId)
    } else {
      // drop into same parent, slot 'below' the original
      const parent = p.blocks[parentId]
      const layout = repairLayout(parent)
      parent.layout = insertInto(layout, newId, { where: 'below', ref: id })
      parent.children = leafList(parent.layout)
    }
    // a duplicate page gets its own file (already set by addBlock since it calls pageFile)
  } else {
    // Trait: drop at index + 1 in the same block
    if (parentId) {
      const parent = p.blocks[parentId]
      const idx = parent.traits.indexOf(id)
      parent.traits.splice(idx + 1, 0, newId)
    } else {
      // loose Trait on Canvas
      const t = p.traits[id]
      const nt = p.traits[newId]
      if (t.pos) nt.pos = { x: t.pos.x + 30, y: t.pos.y + 30 }
      p.blocks['canvas'].traits.push(newId)
    }
  }
}

export function canMakeCustom(p: Project, id: string): boolean {
  const b = p.blocks[id]
  if (!b) return false
  if (b.type === 'site' || b.type === 'page' || b.type === 'checkpoint') return false
  if (b.locked) return false
  if (b.inst || b.defines) return false
  // must not hold an Instance or definition inside
  function hasCustom(bid: string): boolean {
    const bl = p.blocks[bid]
    if (!bl) return false
    if (bl.inst || bl.defines) return true
    return bl.children.some(hasCustom)
  }
  if (hasCustom(id)) return false
  // no ancestor is an Instance or definition
  const parents = parentMap(p)
  let cur = parents.get(id)
  while (cur && cur !== 'canvas') {
    const anc = p.blocks[cur]
    if (anc && (anc.inst || anc.defines)) return false
    cur = parents.get(cur)
  }
  return true
}

export function menuItems(p: Project, id: string): MenuItem[] {
  const items: MenuItem[] = []
  const b = p.blocks[id]
  const t = p.traits[id]
  const hasNote = b ? (!!b.note || !!b.noteOn) : (!!t?.note || !!t?.noteOn)

  if (!hasNote) {
    items.push({ label: 'Add Note', change: q => {
      const tb = q.blocks[id]; const tt = q.traits[id]
      if (tb) tb.noteOn = true; else if (tt) tt.noteOn = true
    }})
  } else {
    items.push({ label: 'Delete Note', change: q => deleteNote(q, id) })
  }

  if (b) {
    // Edit Custom Block (an Instance)
    if (b.inst) {
      items.push({ label: 'Edit Custom Block', edit: b.inst ? (p.defs[b.inst]?.blockId ?? b.inst) : '' })
    }

    // Duplicate (when canTrash allows it)
    if (canTrash(p, { kind: 'block', id })) {
      items.push({ label: 'Duplicate', change: q => duplicate(q, id) })
    }

    // Bring back removed parts (N)
    if (b.inst && b.removed && b.removed.length > 0) {
      const n = b.removed.length
      items.push({ label: `Bring back removed parts (${n})`, change: q => { q.blocks[id].removed = [] } })
    }

    // Use the Custom Block's version
    if (b.from && hasOverride(b)) {
      items.push({ label: "Use the Custom Block's version", change: q => { delete q.blocks[id].ov } })
    }

    // Make Custom Block
    if (canMakeCustom(p, id)) {
      items.push({ label: 'Make Custom Block', change: q => makeCustomBlock(q, id) })
    }

    // Delete Block (when canTrash)
    if (canTrash(p, { kind: 'block', id })) {
      items.push({ label: 'Delete Block', change: q => removeItem(q, id) })
    }
  } else if (t) {
    // Trait: Duplicate
    items.push({ label: 'Duplicate', change: q => duplicate(q, id) })

    // Use the Custom Block's version (for copied Trait parts)
    if (t.from && hasOverride(t)) {
      items.push({ label: "Use the Custom Block's version", change: q => { delete q.traits[id].ov } })
    }

    // Delete Trait
    items.push({ label: 'Delete Trait', change: q => removeItem(q, id) })
  }

  return items
}
